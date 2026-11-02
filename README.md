# Web design portfolio

A one-page portfolio for selling websites, built with **Vite**, **Three.js** and **GSAP (ScrollTrigger + SplitText)**.

- A real-time 3D orb (custom noise shader) that moves to a new position for each section as you scroll and wobbles when you scroll fast
- Pinned horizontal "work" gallery on desktop; native swipe with snap points on mobile
- Split-line headline reveals, a scroll-linked process timeline, magnetic buttons and spotlight cards
- Respects `prefers-reduced-motion`, works without WebGL (CSS fallback orb), and the content is readable without JavaScript
- Three.js is lazy-loaded, so the initial bundle is about 50 kB gzipped

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

## Make it yours

Everything you need to change is in `index.html` unless noted.

- [ ] **Name**: replace every `Your Name` (title, meta tags, nav wordmark, footer)
- [ ] **Email**: replace `hello@yourdomain.co.uk` (contact section, 3 places)
- [ ] **Social links** in the footer
- [ ] **Location line** in the hero (`Based in the UK · Working worldwide`)
- [ ] **Prices** in the pricing section, and the care-plan note
- [ ] **Promises** in the process section (quote within 48 hours, two revision rounds, timelines). Only keep what you will stick to
- [ ] **About** copy
- [ ] **Work**: the four cards are labelled *Concept*. Swap them for real projects as you finish them (screenshots can replace the CSS mock-ups), and keep the "Concept" tag on anything that isn't a real client
- [ ] **Colours and fonts**: tokens at the top of `src/styles.css`; orb colours in `src/scene.js` (`uColorA/B/C`)
- [ ] **Orb positions** per section: `POSES` in `src/animations.js`

## How it fits together

| File | What it does |
| --- | --- |
| `index.html` | All content. Sections carry `data-pose` (orb position), `data-split` (heading reveal) and `data-reveal` (fade-up) |
| `src/main.js` | Creates the shared orb state, starts the animations, lazy-loads the 3D scene |
| `src/scene.js` | Three.js renderer, the displaced-sphere shader, particles and the render loop (driven by GSAP's ticker) |
| `src/animations.js` | All GSAP: hero intro, orb choreography, pinned gallery, process timeline, reveals, nav, smooth anchor links |
| `src/styles.css` | Design tokens, layout and components |

## Deploy

**GitHub Pages (included):** push to `main`, then in the repo go to *Settings → Pages* and set *Source* to **GitHub Actions**. The workflow in `.github/workflows/deploy.yml` builds and publishes the site on every push.

**Netlify / Vercel:** import the repo; build command `npm run build`, output directory `dist`.

For a contact form instead of email links, Netlify Forms or Formspree work without a backend.

## Claude Code plugins

`.claude/settings.json` registers the `claude-design-skillstack` marketplace and enables the design and 3D plugins, so Claude Code sessions opened on this repo (including cloud sessions) load the Three.js, GSAP, motion and web design skills automatically.
