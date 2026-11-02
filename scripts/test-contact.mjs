// Unit tests for the contact form handler. Run with: npm test
import { build } from 'esbuild'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const dir = mkdtempSync(join(tmpdir(), 'contact-test-'))
const outfile = join(dir, 'contact.mjs')
await build({ entryPoints: ['src/server/contact.ts'], bundle: true, format: 'esm', platform: 'neutral', outfile, logLevel: 'error' })
const { handleContact } = await import(pathToFileURL(outfile).href)

const NOW = 1_800_000_000_000
const fullEnv = {
  RESEND_API_KEY: 're_test',
  CONTACT_TO_EMAIL: 'owner@example.com',
  CONTACT_FROM_EMAIL: 'Website <enquiries@example.com>',
  TURNSTILE_SECRET_KEY: 'turnstile-secret',
}

function kvStore() {
  const map = new Map()
  return { get: async (k) => map.get(k) ?? null, put: async (k, v) => void map.set(k, v), map }
}

function makeDeps({ turnstile = true, resendStatus = 200 } = {}) {
  const calls = []
  return {
    calls,
    deps: {
      now: () => NOW,
      log: () => {},
      fetch: async (url, init) => {
        calls.push({ url: String(url), init })
        if (String(url).includes('turnstile')) return new Response(JSON.stringify({ success: turnstile }))
        if (String(url).includes('resend')) return new Response(resendStatus === 200 ? '{"id":"1"}' : 'bad', { status: resendStatus })
        throw new Error('unexpected fetch ' + url)
      },
    },
  }
}

function makeRequest(fields = {}, { json = true, ip = '203.0.113.7' } = {}) {
  const body = new FormData()
  const values = {
    name: 'Sam Taylor',
    business: 'Taylor Plumbing',
    email: 'sam@example.co.uk',
    website: 'taylorplumbing.co.uk',
    service: 'starter',
    message: 'We need a one-page site with a contact form.',
    started_at: String(NOW - 20_000),
    company_website: '',
    'cf-turnstile-response': 'token',
    ...fields,
  }
  for (const [k, v] of Object.entries(values)) if (v !== undefined) body.append(k, v)
  return new Request('https://example.pages.dev/api/contact', {
    method: 'POST',
    body,
    headers: { ...(json ? { Accept: 'application/json' } : {}), 'cf-connecting-ip': ip },
  })
}

const results = []
async function test(name, fn) {
  try {
    await fn()
    results.push(['✓', name])
  } catch (error) {
    results.push(['✗', name, error])
  }
}

await test('valid enquiry is emailed via Resend with reply-to set', async () => {
  const { deps, calls } = makeDeps()
  const res = await handleContact(makeRequest({}, { ip: '1.1.1.1' }), { ...fullEnv, CONTACT_RATE_LIMIT: kvStore() }, deps)
  assert.equal(res.status, 200)
  assert.deepEqual(await res.json(), { ok: true, message: 'Thanks, your enquiry has been sent.' })
  const resend = calls.find((c) => c.url.includes('resend'))
  assert.ok(resend, 'Resend was called')
  const payload = JSON.parse(resend.init.body)
  assert.equal(payload.reply_to, 'sam@example.co.uk')
  assert.deepEqual(payload.to, ['owner@example.com'])
  assert.match(payload.text, /Taylor Plumbing/)
  assert.match(payload.text, /Starter Website/)
  assert.equal(resend.init.headers.Authorization, 'Bearer re_test')
})

await test('missing and invalid fields return 400 with field errors and send nothing', async () => {
  const { deps, calls } = makeDeps()
  const res = await handleContact(makeRequest({ name: '', email: 'not-an-email', service: 'free-website', message: 'hi' }, { ip: '1.1.1.2' }), fullEnv, deps)
  assert.equal(res.status, 400)
  const body = await res.json()
  assert.deepEqual(Object.keys(body.errors).sort(), ['email', 'message', 'name', 'service'])
  assert.equal(calls.length, 0)
})

await test('honeypot submissions are accepted silently and not emailed', async () => {
  const { deps, calls } = makeDeps()
  const res = await handleContact(makeRequest({ company_website: 'http://spam.example' }, { ip: '1.1.1.3' }), fullEnv, deps)
  assert.equal(res.status, 200)
  assert.equal(calls.length, 0)
})

await test('forms submitted faster than a human could are not emailed', async () => {
  const { deps, calls } = makeDeps()
  const res = await handleContact(makeRequest({ started_at: String(NOW - 500) }, { ip: '1.1.1.4' }), fullEnv, deps)
  assert.equal(res.status, 200)
  assert.equal(calls.length, 0)
})

await test('failed Turnstile check is rejected', async () => {
  const { deps, calls } = makeDeps({ turnstile: false })
  const res = await handleContact(makeRequest({}, { ip: '1.1.1.5' }), fullEnv, deps)
  assert.equal(res.status, 400)
  assert.equal(calls.filter((c) => c.url.includes('resend')).length, 0)
})

await test('rate limit allows 5 enquiries per hour then returns 429 (KV store)', async () => {
  const { deps } = makeDeps()
  const store = kvStore()
  const statuses = []
  for (let i = 0; i < 6; i++) statuses.push((await handleContact(makeRequest({}, { ip: '1.1.1.6' }), { ...fullEnv, CONTACT_RATE_LIMIT: store }, deps)).status)
  assert.deepEqual(statuses, [200, 200, 200, 200, 200, 429])
  assert.ok([...store.map.keys()].every((k) => !k.includes('1.1.1.6')), 'raw IP is not stored')
})

await test('rate limit also works without KV (in-memory fallback)', async () => {
  const { deps } = makeDeps()
  const statuses = []
  for (let i = 0; i < 6; i++) statuses.push((await handleContact(makeRequest({}, { ip: '1.1.1.7' }), fullEnv, deps)).status)
  assert.equal(statuses.at(-1), 429)
})

await test('missing email configuration returns 503 instead of pretending to succeed', async () => {
  const { deps, calls } = makeDeps()
  const res = await handleContact(makeRequest({}, { ip: '1.1.1.8' }), { TURNSTILE_SECRET_KEY: 'x' }, deps)
  assert.equal(res.status, 503)
  assert.equal((await res.json()).ok, false)
  assert.equal(calls.filter((c) => c.url.includes('resend')).length, 0)
})

await test('Resend failure returns 502', async () => {
  const { deps } = makeDeps({ resendStatus: 500 })
  const res = await handleContact(makeRequest({}, { ip: '1.1.1.9' }), fullEnv, deps)
  assert.equal(res.status, 502)
})

await test('without JavaScript, success redirects to /contact/sent/ and errors to /contact/problem/', async () => {
  const { deps } = makeDeps()
  const ok = await handleContact(makeRequest({}, { json: false, ip: '1.1.2.1' }), fullEnv, deps)
  assert.equal(ok.status, 303)
  assert.equal(new URL(ok.headers.get('location')).pathname, '/contact/sent/')
  const bad = await handleContact(makeRequest({ email: '' }, { json: false, ip: '1.1.2.2' }), fullEnv, deps)
  assert.equal(new URL(bad.headers.get('location')).pathname, '/contact/problem/')
})

await test('non-form content types are rejected', async () => {
  const { deps } = makeDeps()
  const req = new Request('https://example.pages.dev/api/contact', { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json', Accept: 'application/json' } })
  const res = await handleContact(req, fullEnv, deps)
  assert.equal(res.status, 415)
})

rmSync(dir, { recursive: true, force: true })
for (const [mark, name, error] of results) console.log(`${mark} ${name}${error ? `\n    ${error.message}` : ''}`)
const failed = results.filter((r) => r[0] === '✗').length
console.log(`\n${results.length - failed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
