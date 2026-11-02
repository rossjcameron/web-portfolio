# Web design portfolio

A conversion-focused one-page site for selling websites to small businesses. Built with **Vite** and **GSAP**, no framework.

**What's on the page:** outcome-led hero with a quote button and trust points, benefits, project showcase, services, a four-step process, fixed-price packages (each "Choose" button pre-selects that package in the form), an about section, an FAQ that answers the usual objections, and a quote form.

**Performance:** about 46 kB of JavaScript (gzipped), one variable font (Mona Sans), no images required. Motion respects `prefers-reduced-motion`, and all content is readable without JavaScript.

## Run it

```bash
npm install
```

```bash
npm run dev
```

Build for production (outputs to `dist/`):

```bash
npm run build
```

## Before you launch

Everything below is in `index.html` unless noted.

- [ ] **Name**: replace `Your Name` and the `YN` initials (title, meta tags, header, about, footer, `public/favicon.svg`)
- [ ] **Email**: replace `hello@yourdomain.co.uk` (contact section and the form's `data-email`)
- [ ] **Photo**: add `public/me.jpg` and swap the placeholder in the about section for the `<img>` shown in the comment. A real photo makes a big difference to trust
- [ ] **Form**: set up a free form at [Formspree](https://formspree.io) or [Web3Forms](https://web3forms.com) and paste the endpoint URL into `data-endpoint` on `#quote-form`. Until then the form opens the visitor's email app with their message filled in
- [ ] **Prices and package contents** in the pricing section and FAQ
- [ ] **Promises**: quote within 48 hours, reply within one working day, two rounds of changes, 30 days of free fixes. Keep only what you'll stick to
- [ ] **Projects**: the three projects are concepts and labelled as such. Replace them with real client work (screenshots in `.project__media`) as you finish projects
- [ ] **Testimonials**: add a short testimonials section once you have real ones (never invent them)
- [ ] **Social links** in the footer

## Structure

| File | What it does |
| --- | --- |
| `index.html` | All content and the CSS-drawn website mock-ups |
| `src/styles.css` | Design tokens (top of file), layout and components |
| `src/ui.js` | Sticky header, mobile menu, package pre-select, quote form handling |
| `src/motion.js` | GSAP: hero entrance, mock-ups straightening on scroll, section reveals |

To change the brand colour, edit `--accent` (and `--accent-hover`, `--accent-soft`) at the top of `src/styles.css`.

## Deploy

**GitHub Pages (included):** in the repo go to *Settings → Pages* and set *Source* to **GitHub Actions**. `.github/workflows/deploy.yml` builds and publishes on every push to `main`.

**Netlify / Vercel:** import the repo; build command `npm run build`, output directory `dist`. Netlify Forms also works for the quote form.

## Claude Code plugins

`.claude/settings.json` registers the `claude-design-skillstack` marketplace and enables the design and animation plugins for Claude Code sessions on this repo.
