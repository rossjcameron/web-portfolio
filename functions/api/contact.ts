import { handleContact, type ContactEnv, type RateLimitStore } from '../../src/server/contact'

interface Env extends Omit<ContactEnv, 'CONTACT_RATE_LIMIT'> {
  /** Optional KV namespace binding used for rate limiting */
  CONTACT_RATE_LIMIT?: KVNamespace
}

export const onRequestPost: PagesFunction<Env> = ({ request, env }) =>
  handleContact(request, {
    ...env,
    CONTACT_RATE_LIMIT: env.CONTACT_RATE_LIMIT as unknown as RateLimitStore | undefined,
  })
