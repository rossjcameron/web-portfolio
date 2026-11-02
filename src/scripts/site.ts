// Site-wide behaviour: header state, mobile menu and scroll reveals. Loaded on every page.

declare global {
  interface Window {
    __nwReady?: boolean
  }
}

function headerState() {
  const header = document.querySelector<HTMLElement>('[data-header]')
  if (!header) return
  const update = () => header.classList.toggle('is-scrolled', window.scrollY > 8)
  update()
  window.addEventListener('scroll', update, { passive: true })
}

function mobileMenu() {
  const openButton = document.querySelector<HTMLButtonElement>('[data-menu-open]')
  const closeButton = document.querySelector<HTMLButtonElement>('[data-menu-close]')
  const panel = document.querySelector<HTMLElement>('[data-menu-panel]')
  if (!openButton || !closeButton || !panel) return

  const focusables = () =>
    Array.from(panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')).filter((el) => el.offsetParent !== null)

  const open = () => {
    panel.hidden = false
    openButton.setAttribute('aria-expanded', 'true')
    document.documentElement.style.overflow = 'hidden'
    focusables()[0]?.focus()
  }

  const close = (returnFocus = true) => {
    panel.hidden = true
    openButton.setAttribute('aria-expanded', 'false')
    document.documentElement.style.overflow = ''
    if (returnFocus) openButton.focus()
  }

  openButton.addEventListener('click', open)
  closeButton.addEventListener('click', () => close())
  panel.addEventListener('click', (event) => {
    if ((event.target as HTMLElement).closest('a')) close(false)
  })
  panel.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close()
    if (event.key !== 'Tab') return
    const items = focusables()
    const first = items[0]
    const last = items[items.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last?.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first?.focus()
    }
  })
  window.matchMedia('(min-width: 1024px)').addEventListener('change', (event) => {
    if (event.matches && !panel.hidden) close(false)
  })
}

function reveals() {
  const items = document.querySelectorAll<HTMLElement>('[data-reveal]')
  if (!items.length) return
  if (!('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-revealed'))
    return
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('is-revealed')
        observer.unobserve(entry.target)
      })
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  )
  items.forEach((el) => observer.observe(el))
}

headerState()
mobileMenu()
reveals()
window.__nwReady = true

export {}
