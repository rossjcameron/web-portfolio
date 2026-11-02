// @ts-check
import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'

// Set SITE_URL in Cloudflare Pages (Settings → Environment variables) once the domain is live.
const site = process.env.SITE_URL || 'https://new-window-web-design.pages.dev'

export default defineConfig({
  site,
  trailingSlash: 'always',
  integrations: [
    sitemap({
      filter: (page) => !['/contact/sent/', '/contact/problem/', '/404'].some((path) => page.includes(path)),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
})
