# New Window Web Design

The website for **New Window Web Design**, an independent UK web design and development studio.

Built with **Astro** (static output), **TypeScript** and **Tailwind CSS v4**, with **GSAP** for the hero entrance and scroll effects. Hosted on **Cloudflare Pages**, with a **Pages Function** handling the contact form.

## Pages

| Route | Purpose |
| --- | --- |
| `/` | Hero, introduction, selected work, services, aperture section, pricing, process, FAQ, final call to action |
| `/services/` | Website Design, Website Development and Website Care in detail, including what isn’t included |
| `/work/` and `/work/<slug>/` | Portfolio index and project pages (currently three clearly labelled concept projects) |
| `/pricing/` | Packages, Website Care, exclusions and FAQ |
| `/about/` | Studio philosophy and how we work |
| `/contact/` | Enquiry form (plus `/contact/sent/` and `/contact/problem/` for visitors without JavaScript) |
| `/privacy/`, `/terms/` | Legal pages (**review before launch**, see below) |

## Commands

```bash
npm install
```

```bash
npm run dev           # local development at http://localhost:4321
```

```bash
npm run build         # type-check and build to dist/
```

```bash
npm test              # contact form handler tests
```

```bash
npm run check:functions   # type-check the Cloudflare Pages Function
```

```bash
npm run dev:cf        # build, then run the site and the contact function locally with Wrangler
```

For `dev:cf`, put local secrets in a `.dev.vars` file (see `.env.example`). It is git-ignored.

## Going live on Cloudflare Pages

1. **Create the project.** Cloudflare dashboard → *Workers & Pages* → *Create* → *Pages* → *Connect to Git* → choose `rossjcameron/web-portfolio`.
   - Production branch: `main`
   - Framework preset: Astro
   - Build command: `npm run build`
   - Build output directory: `dist`
   - The Node version comes from `.node-version`.
2. **Email delivery (Resend).** Create a free account at [resend.com](https://resend.com), verify your domain, and create an API key.
3. **Spam protection (Turnstile).** Cloudflare dashboard → *Turnstile* → add a widget for your domain to get a site key and secret key.
4. **Rate limiting (KV).** *Workers & Pages* → *KV* → create a namespace, then in the Pages project go to *Settings* → *Bindings* → add a KV binding named `CONTACT_RATE_LIMIT`.
5. **Environment variables.** Pages project → *Settings* → *Variables and Secrets* (Production):

   | Name | Type | Example |
   | --- | --- | --- |
   | `PUBLIC_CONTACT_EMAIL` | Text | `hello@yourdomain.co.uk` (shown on the site) |
   | `PUBLIC_TURNSTILE_SITE_KEY` | Text | from step 3 |
   | `SITE_URL` | Text | `https://www.yourdomain.co.uk` (canonical URLs and sitemap) |
   | `TURNSTILE_SECRET_KEY` | Secret | from step 3 |
   | `RESEND_API_KEY` | Secret | from step 2 |
   | `CONTACT_TO_EMAIL` | Secret | the inbox that receives enquiries |
   | `CONTACT_FROM_EMAIL` | Secret | e.g. `New Window website <enquiries@yourdomain.co.uk>` (a verified Resend domain) |

   `PUBLIC_*` values and `SITE_URL` are used at build time, so **redeploy** after changing them.
6. **Custom domain.** Pages project → *Custom domains*.
7. **Test the form** on the live site. Until the email variables are set, the form shows an honest “isn’t available right now” message; it never pretends to succeed.

## How the contact form works

`functions/api/contact.ts` → `src/server/contact.ts`

- Server-side validation of every field (the browser validates too, for faster feedback)
- Spam protection: hidden honeypot field, minimum fill time, and Cloudflare Turnstile when configured
- Rate limiting: five enquiries per hour per visitor, keyed by a SHA-256 hash of the IP address (KV, with an in-memory fallback)
- Delivery through the Resend API, with `reply_to` set to the enquirer
- JSON responses for the enhanced form; redirects to `/contact/sent/` or `/contact/problem/` without JavaScript
- No secrets reach the browser

## Before launch: owner review

- [ ] **Business email**: set `PUBLIC_CONTACT_EMAIL` (the site hides email links until it is set)
- [ ] **Pricing** (`src/data/pricing.ts`) is provisional. Confirm the packages, inclusions and exclusions.
- [ ] **FAQ answers** (`src/data/faq.ts`) must match your actual service agreement, especially timelines, hosting, post-launch support and **website ownership**.
- [ ] **Privacy Policy and Terms** (`src/pages/privacy.astro`, `src/pages/terms.astro`) are written to match how this site actually handles data, but have not been reviewed by a lawyer. Check them, add a governing law clause if you want one, and add any company or ICO registration details that apply to you.
- [ ] **Social links**: add real profiles to `site.socials` in `src/data/site.ts` (none are shown until you do)
- [ ] **Location wording**: the site says “United Kingdom” only. No address is shown.

## Content guidelines

- **Concept projects** are fictional and labelled as such everywhere they appear. Never present them as client work.
- **Real projects**: add them to `src/data/projects.ts` with screenshots, set `concept: false` (and update the labels), and link to the live site.
- **No fabricated credibility**: no invented testimonials, client counts, awards, team members or performance claims.
- **Analytics**: none are installed, so no cookie banner is needed. If you add analytics, prefer Cloudflare Web Analytics (cookieless), and update the Privacy Policy. Anything that sets non-essential cookies needs consent before it loads.

## Design system

- **Colours** and **type scale**: `src/styles/global.css` (`@theme`). Supporting slate text automatically darkens on stone surfaces (`.surface-stone`) to keep 4.5:1 contrast.
- **Typefaces**: Instrument Sans (variable, with width axis) and IBM Plex Mono, both self-hosted via Fontsource, so no requests go to Google.
- **Motion**: GSAP for the hero entrance, the aperture reveal and the process line. Everything else (hover states, reveals, the mobile menu) uses CSS and small vanilla scripts, so no Motion/React runtime is shipped. Everything respects `prefers-reduced-motion`, and all content is visible without JavaScript.
- **Mock-ups**: `src/components/mockups/` are fully responsive HTML/CSS concept sites. The same component renders as desktop inside `BrowserWindow` and as mobile inside `PhoneFrame` (container queries).

## Claude Code

`.claude/settings.json` registers the `claude-design-skillstack` marketplace and enables its design and animation plugins for Claude Code sessions on this repo.
