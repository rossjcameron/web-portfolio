/* Subtle, purposeful motion: hero entrance, the mock-up stack settling as you scroll, and section reveals. */
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function initMotion() {
  const mm = gsap.matchMedia()

  mm.add('(prefers-reduced-motion: reduce)', () => {
    gsap.set('[data-intro]', { opacity: 1 })
  })

  mm.add(
    {
      motion: '(prefers-reduced-motion: no-preference)',
      wide: '(min-width: 561px)',
    },
    (context) => {
      const { motion, wide } = context.conditions
      if (!motion) return

      heroIntro()
      if (wide) heroScroll()
      reveals()
    },
  )
}

function heroIntro() {
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
  tl.fromTo('[data-intro]', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.08 })
  tl.from(
    '.stack__item',
    { opacity: 0, y: 40, duration: 1, stagger: 0.12, clearProps: 'opacity' },
    0.2,
  )
  // Gentle float on the notification card
  gsap.to('.toast', { y: -8, duration: 2.4, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.4 })
}

// The tilted mock-ups straighten and drift apart slightly as the hero scrolls away
function heroScroll() {
  const trigger = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 }
  gsap.to('.stack', { '--rx': '0deg', '--ry': '-4deg', '--rz': '0deg', ease: 'none', scrollTrigger: trigger })
  gsap.to('.stack__back', { yPercent: -10, ease: 'none', scrollTrigger: trigger })
  gsap.to('.stack__phone', { yPercent: -18, ease: 'none', scrollTrigger: trigger })
  gsap.to('.stack__toast', { yPercent: -60, ease: 'none', scrollTrigger: trigger })
}

function reveals() {
  const items = gsap.utils.toArray('[data-reveal]')
  gsap.set(items, { opacity: 0, y: 28 })
  ScrollTrigger.batch(items, {
    start: 'top 90%',
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.08, overwrite: true }),
  })
}
