/**
 * Contact form handler, run as a Cloudflare Pages Function (see functions/api/contact.ts).
 *
 * - Server-side validation of every field
 * - Spam protection: honeypot field, minimum fill time and Cloudflare Turnstile (when configured)
 * - Rate limiting per visitor (hashed IP) using a KV namespace, with an in-memory fallback
 * - Email delivery through the Resend API; secrets stay on the server
 *
 * Responds with JSON when the browser asks for it (the enhanced form), otherwise redirects
 * to a confirmation or problem page so the form also works without JavaScript.
 */

export interface RateLimitStore {
  get(key: string): Promise<string | null>
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>
}

export interface ContactEnv {
  RESEND_API_KEY?: string
  CONTACT_TO_EMAIL?: string
  CONTACT_FROM_EMAIL?: string
  TURNSTILE_SECRET_KEY?: string
  CONTACT_RATE_LIMIT?: RateLimitStore
}

export interface ContactDeps {
  fetch: typeof fetch
  now: () => number
  log: (message: string) => void
}

export const SERVICES: Record<string, string> = {
  starter: 'Starter Website',
  business: 'Business Website',
  care: 'Website Care',
  unsure: 'Not sure yet',
}

const LIMITS = { name: 100, business: 120, email: 200, website: 200, messageMin: 10, messageMax: 3000 }
const RATE_LIMIT = { max: 5, windowSeconds: 60 * 60 }
const MIN_FILL_MS = 3000
const MAX_BODY_BYTES = 20_000

type Fields = 'name' | 'business' | 'email' | 'website' | 'service' | 'message'
type FieldErrors = Partial<Record<Fields, string>>

interface Result {
  status: number
  ok: boolean
  message?: string
  errors?: FieldErrors
}

const memoryHits = new Map<string, { count: number; resetAt: number }>()

export async function handleContact(
  request: Request,
  env: ContactEnv,
  deps: ContactDeps = { fetch: (...args) => fetch(...args), now: () => Date.now(), log: (m) => console.error(m) },
): Promise<Response> {
  const wantsJson = (request.headers.get('accept') ?? '').includes('application/json')
  const result = await processEnquiry(request, env, deps)
  return wantsJson ? jsonResponse(result) : redirectResponse(request, result)
}

async function processEnquiry(request: Request, env: ContactEnv, deps: ContactDeps): Promise<Result> {
  const type = request.headers.get('content-type') ?? ''
  if (!type.includes('multipart/form-data') && !type.includes('application/x-www-form-urlencoded')) {
    return { status: 415, ok: false, message: 'Please submit the form from our contact page.' }
  }

  const length = Number(request.headers.get('content-length') ?? 0)
  if (length > MAX_BODY_BYTES) {
    return { status: 413, ok: false, message: 'Your message is too long. Please shorten it and try again.' }
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return { status: 400, ok: false, message: 'We couldn’t read your enquiry. Please try again.' }
  }

  const get = (key: string) => String(form.get(key) ?? '').trim()

  // Bots fill in hidden fields and submit instantly. Accept quietly so they learn nothing, but send nothing.
  const startedAt = Number(get('started_at'))
  const tooFast = Number.isFinite(startedAt) && startedAt > 0 && deps.now() - startedAt < MIN_FILL_MS
  if (get('company_website') || tooFast) {
    return { status: 200, ok: true }
  }

  const data = {
    name: get('name'),
    business: get('business'),
    email: get('email'),
    website: get('website'),
    service: get('service'),
    message: get('message'),
  }

  const errors = validate(data)
  if (Object.keys(errors).length) {
    return { status: 400, ok: false, message: 'Please check the highlighted fields.', errors }
  }

  const ip = request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for') ?? 'unknown'
  if (await isRateLimited(ip, env.CONTACT_RATE_LIMIT, deps)) {
    return {
      status: 429,
      ok: false,
      message: 'You’ve sent several enquiries in a short time. Please try again later.',
    }
  }

  if (env.TURNSTILE_SECRET_KEY) {
    const token = get('cf-turnstile-response')
    const verified = token ? await verifyTurnstile(token, ip, env.TURNSTILE_SECRET_KEY, deps) : false
    if (!verified) {
      return { status: 400, ok: false, message: 'Please complete the spam check and try again.' }
    }
  } else {
    deps.log('[contact] TURNSTILE_SECRET_KEY is not set; relying on honeypot, timing and rate limiting only.')
  }

  if (!env.RESEND_API_KEY || !env.CONTACT_TO_EMAIL || !env.CONTACT_FROM_EMAIL) {
    deps.log('[contact] Email delivery is not configured (RESEND_API_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL).')
    return { status: 503, ok: false, message: 'Our contact form isn’t available right now. Please try again later.' }
  }

  const sent = await sendEmail(data, env, deps)
  if (!sent) {
    return { status: 502, ok: false, message: 'Sorry, we couldn’t send your enquiry. Please try again in a few minutes.' }
  }

  return { status: 200, ok: true, message: 'Thanks, your enquiry has been sent.' }
}

export function validate(data: Record<Fields, string>): FieldErrors {
  const errors: FieldErrors = {}

  if (!data.name) errors.name = 'Please enter your name.'
  else if (data.name.length > LIMITS.name) errors.name = `Please keep your name under ${LIMITS.name} characters.`

  if (!data.business) errors.business = 'Please enter your business name.'
  else if (data.business.length > LIMITS.business) errors.business = `Please keep this under ${LIMITS.business} characters.`

  if (!data.email) errors.email = 'Please enter your email address.'
  else if (data.email.length > LIMITS.email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email))
    errors.email = 'Please enter a valid email address, like name@example.co.uk.'

  if (data.website) {
    const looksLikeUrl = /^(https?:\/\/)?[\w-]+(\.[\w-]+)+([/?#].*)?$/i.test(data.website)
    if (data.website.length > LIMITS.website || !looksLikeUrl) errors.website = 'Please enter a web address, like example.co.uk.'
  }

  if (!(data.service in SERVICES)) errors.service = 'Please choose an option.'

  if (!data.message) errors.message = 'Please tell us a little about your project.'
  else if (data.message.length < LIMITS.messageMin) errors.message = 'Please add a little more detail.'
  else if (data.message.length > LIMITS.messageMax) errors.message = `Please keep this under ${LIMITS.messageMax} characters.`

  return errors
}

async function isRateLimited(ip: string, store: RateLimitStore | undefined, deps: ContactDeps): Promise<boolean> {
  // Store a hash rather than the IP address itself
  const key = `contact:${await sha256(ip)}`
  const now = deps.now()

  if (store) {
    try {
      const raw = await store.get(key)
      const entry = raw ? (JSON.parse(raw) as { count: number; resetAt: number }) : null
      const active = entry && entry.resetAt > now ? entry : { count: 0, resetAt: now + RATE_LIMIT.windowSeconds * 1000 }
      if (active.count >= RATE_LIMIT.max) return true
      active.count += 1
      const ttl = Math.max(60, Math.ceil((active.resetAt - now) / 1000))
      await store.put(key, JSON.stringify(active), { expirationTtl: ttl })
      return false
    } catch (error) {
      deps.log(`[contact] Rate limit store error: ${String(error)}`)
      // Fall through to the in-memory limiter
    }
  }

  const entry = memoryHits.get(key)
  if (!entry || entry.resetAt <= now) {
    memoryHits.set(key, { count: 1, resetAt: now + RATE_LIMIT.windowSeconds * 1000 })
    return false
  }
  if (entry.count >= RATE_LIMIT.max) return true
  entry.count += 1
  return false
}

async function verifyTurnstile(token: string, ip: string, secret: string, deps: ContactDeps): Promise<boolean> {
  try {
    const body = new FormData()
    body.append('secret', secret)
    body.append('response', token)
    if (ip !== 'unknown') body.append('remoteip', ip)
    const response = await deps.fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body })
    const result = (await response.json()) as { success?: boolean }
    return result.success === true
  } catch (error) {
    deps.log(`[contact] Turnstile verification failed: ${String(error)}`)
    return false
  }
}

async function sendEmail(data: Record<Fields, string>, env: ContactEnv, deps: ContactDeps): Promise<boolean> {
  const clean = (value: string) => value.replace(/[\r\n]+/g, ' ').slice(0, 120)
  const text = [
    'New enquiry from the New Window website',
    '',
    `Name: ${data.name}`,
    `Business: ${data.business}`,
    `Email: ${data.email}`,
    `Website: ${data.website || 'None given'}`,
    `Interested in: ${SERVICES[data.service]}`,
    '',
    'Message:',
    data.message,
  ].join('\n')

  try {
    const response = await deps.fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.CONTACT_FROM_EMAIL,
        to: [env.CONTACT_TO_EMAIL],
        reply_to: data.email,
        subject: clean(`New enquiry: ${data.name}, ${data.business}`),
        text,
      }),
    })
    if (!response.ok) {
      deps.log(`[contact] Resend returned ${response.status}: ${(await response.text()).slice(0, 300)}`)
      return false
    }
    return true
  } catch (error) {
    deps.log(`[contact] Email request failed: ${String(error)}`)
    return false
  }
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

function jsonResponse(result: Result): Response {
  const { status, ...body } = result
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}

function redirectResponse(request: Request, result: Result): Response {
  const target = result.ok ? '/contact/sent/' : '/contact/problem/'
  return Response.redirect(new URL(target, request.url).toString(), 303)
}
