interface ImportMetaEnv {
  /** Business email shown on the site. Set in Cloudflare Pages → Settings → Environment variables. */
  readonly PUBLIC_CONTACT_EMAIL?: string
  /** Cloudflare Turnstile site key (public). */
  readonly PUBLIC_TURNSTILE_SITE_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
