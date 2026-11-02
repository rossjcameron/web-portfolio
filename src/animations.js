import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, SplitText)

/*
 * Where the 3D orb sits for each section (matched by data-pose="…").
 * x / y: −1 … 1 across half the viewport (0 = centre)
 * scale: orb diameter as a fraction of the viewport's shorter side
 */
const POSES = {
  desktop: {
    hero: { x: 0.5, y: -0.02, scale: 0.6, distortion: 0.22, opacity: 1 },
    services: { x: 0.72, y: 0.42, scale: 0.38, distortion: 0.16, opacity: 0.75 },
    work: { x: 0.62, y: 0.72, scale: 0.2, distortion: 0.24, opacity: 0.7 },
    process: { x: -0.62, y: -0.62, scale: 0.36, distortion: 0.18, opacity: 0.65 },
    pricing: { x: 0.7, y: 0.5, scale: 0.34, distortion: 0.2, opacity: 0.7 },
    about: { x: -0.62, y: -0.58, scale: 0.36, distortion: 0.2, opacity: 0.65 },
    contact: { x: 0, y: 0.04, scale: 0.74, distortion: 0.28, opacity: 0.32 },
  },
  mobile: {
    hero: { x: 0, y: 0.56, scale: 0.62, distortion: 0.22, opacity: 1 },
    services: { x: 0.8, y: 0.74, scale: 0.45, distortion: 0.16, opacity: 0.5 },
    work: { x: -0.82, y: 0.78, scale: 0.38, distortion: 0.22, opacity: 0.45 },
    process: { x: 0.84, y: 0.62, scale: 0.45, distortion: 0.18, opacity: 0.45 },
    pricing: { x: -0.84, y: 0.74, scale: 0.42, distortion: 0.2, opacity: 0.45 },
    about: { x: 0.84, y: 0.68, scale: 0.45, distortion: 0.2, opacity: 0.45 },
    contact: { x: 0.78, y: 0.78, scale: 0.5, distortion: 0.26, opacity: 0.5 },
  },
}

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function initAnimations(orbState) {
  heroIntro(prefersReducedMotion())
  smoothAnchors()
  navBehaviour()
  spotlightCards()
  footerYear()

  const mm = gsap.matchMedia()
  mm.add(
    {
      isDesktop: '(min-width: 900px)',
      isMobile: '(max-width: 899px)',
      reduceMotion: '(prefers-reduced-motion: reduce)',
    },
    (context) => {
      const { isDesktop, reduceMotion } = context.conditions
      const cleanups = []

      // Order matters: create the pinned section first so every trigger
      // after it accounts for the extra scroll distance the pin adds.
      if (isDesktop && !reduceMotion) cleanups.push(horizontalWork())
      if (!reduceMotion) cleanups.push(processSteps())
      orbChoreography(orbState, isDesktop ? POSES.desktop : POSES.mobile, reduceMotion)
      if (!reduceMotion) {
        headingReveals()
        contentReveals()
        cleanups.push(magneticButtons())
      }

      return () => cleanups.forEach((cleanup) => cleanup?.())
    },
  )
}

/* ---------------------------------------------------------------- Hero */
function heroIntro(reduceMotion) {
  const items = gsap.utils.toArray('[data-hero]')
  gsap.set(items, { visibility: 'visible' })
  if (reduceMotion) return

  SplitText.create('.hero__title', {
    type: 'lines',
    mask: 'lines',
    autoSplit: true,
    onSplit: (self) =>
      gsap.from(self.lines, { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.09, delay: 0.2 }),
  })

  gsap.from(
    items.filter((el) => !el.classList.contains('hero__title')),
    { y: 24, autoAlpha: 0, duration: 1, ease: 'power3.out', stagger: 0.08, delay: 0.55 },
  )
  gsap.from('.nav', { y: -20, autoAlpha: 0, duration: 1, ease: 'power3.out', delay: 0.3 })
}

/* ------------------------------------------------- 3D orb follows scroll */
function orbChoreography(state, poses, reduceMotion) {
  const goTo = (pose) =>
    gsap.to(state, { ...pose, duration: reduceMotion ? 0 : 1.6, ease: 'power3.inOut', overwrite: 'auto' })

  gsap.utils.toArray('[data-pose]').forEach((section) => {
    const pose = poses[section.dataset.pose]
    if (!pose) return
    // A pinned section is wrapped in a pin-spacer that spans the whole pin
    // duration; measure that, otherwise the pose ends as soon as pinning starts
    const spacer = section.parentElement
    ScrollTrigger.create({
      trigger: spacer?.classList.contains('pin-spacer') ? spacer : section,
      start: 'top 55%',
      end: 'bottom 55%',
      onToggle: (self) => self.isActive && goTo(pose),
    })
  })

  // Scrolling fast makes the orb wobble; it settles in the render loop
  if (!reduceMotion) {
    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        const velocity = Math.min(Math.abs(self.getVelocity()) / 2500, 1)
        if (velocity > state.boost) state.boost = velocity
      },
    })
  }
}

/* --------------------------------------- Work: pinned horizontal scroll */
function horizontalWork() {
  const section = document.querySelector('.work')
  if (!section) return
  const viewport = section.querySelector('.work__viewport')
  const track = section.querySelector('.work__track')
  const bar = section.querySelector('.work__bar span')

  section.classList.add('is-pinned')
  const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth)

  gsap
    .timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${distance()}`,
        pin: true,
        scrub: 0.8,
        invalidateOnRefresh: true,
        anticipatePin: 1,
      },
    })
    .to(track, { x: () => -distance(), ease: 'none' })
    .fromTo(bar, { scaleX: 0 }, { scaleX: 1, ease: 'none' }, 0)

  return () => section.classList.remove('is-pinned')
}

/* ------------------------------------------- Process: line + active steps */
function processSteps() {
  const process = document.querySelector('.process')
  if (!process) return
  process.classList.add('is-animated')

  gsap.fromTo(
    '.process__progress',
    { scaleY: 0 },
    {
      scaleY: 1,
      ease: 'none',
      scrollTrigger: { trigger: process, start: 'top 65%', end: 'bottom 65%', scrub: 0.6 },
    },
  )

  const steps = gsap.utils.toArray('.step', process)
  steps.forEach((step) => {
    ScrollTrigger.create({
      trigger: step,
      start: 'top 65%',
      onEnter: () => step.classList.add('is-active'),
      onLeaveBack: () => step.classList.remove('is-active'),
    })
  })

  return () => {
    process.classList.remove('is-animated')
    steps.forEach((step) => step.classList.remove('is-active'))
  }
}

/* ------------------------------------------------------------ Reveals */
function headingReveals() {
  gsap.utils.toArray('[data-split]').forEach((heading) => {
    SplitText.create(heading, {
      type: 'lines',
      mask: 'lines',
      autoSplit: true,
      onSplit: (self) =>
        gsap.from(self.lines, {
          yPercent: 110,
          duration: 1.1,
          ease: 'expo.out',
          stagger: 0.08,
          scrollTrigger: { trigger: heading, start: 'top 85%', once: true },
        }),
    })
  })
}

function contentReveals() {
  const items = gsap.utils.toArray('[data-reveal]')
  gsap.set(items, { autoAlpha: 0, y: 36 })
  ScrollTrigger.batch(items, {
    start: 'top 90%',
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08, overwrite: true }),
  })
}

/* ---------------------------------------------------- Micro-interactions */
function magneticButtons() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
  const removers = gsap.utils.toArray('.magnetic').map((button) => {
    const xTo = gsap.quickTo(button, 'x', { duration: 0.5, ease: 'power3.out' })
    const yTo = gsap.quickTo(button, 'y', { duration: 0.5, ease: 'power3.out' })
    const move = (event) => {
      const rect = button.getBoundingClientRect()
      xTo((event.clientX - (rect.left + rect.width / 2)) * 0.3)
      yTo((event.clientY - (rect.top + rect.height / 2)) * 0.4)
    }
    const leave = () => {
      xTo(0)
      yTo(0)
    }
    button.addEventListener('pointermove', move)
    button.addEventListener('pointerleave', leave)
    return () => {
      button.removeEventListener('pointermove', move)
      button.removeEventListener('pointerleave', leave)
      gsap.set(button, { x: 0, y: 0 })
    }
  })
  return () => removers.forEach((remove) => remove())
}

function spotlightCards() {
  document.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect()
      card.style.setProperty('--mx', `${event.clientX - rect.left}px`)
      card.style.setProperty('--my', `${event.clientY - rect.top}px`)
    })
  })
}

/* ------------------------------------------------------- Navigation */
function navBehaviour() {
  const nav = document.querySelector('.nav')
  if (!nav) return
  ScrollTrigger.create({
    start: 'top -80',
    end: 'max',
    toggleClass: { targets: nav, className: 'is-scrolled' },
    onUpdate: (self) => {
      const hide =
        self.direction === 1 && self.scroll() > window.innerHeight * 0.6 && !nav.contains(document.activeElement)
      nav.classList.toggle('is-hidden', hide)
    },
    onLeaveBack: () => nav.classList.remove('is-hidden'),
  })
}

function smoothAnchors() {
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]')
    if (!link) return
    const hash = link.getAttribute('href')
    const target = hash.length > 1 && document.querySelector(hash)
    if (!target) return

    event.preventDefault()
    gsap.to(window, {
      scrollTo: { y: target, autoKill: true },
      duration: prefersReducedMotion() ? 0 : 1.2,
      ease: 'power3.inOut',
      onComplete: () => target.focus({ preventScroll: true }),
    })
    history.pushState(null, '', hash)
  })
}

function footerYear() {
  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = new Date().getFullYear()
  })
}
