/* Navigation, pricing → form hand-off and the quote form. No dependencies. */

export function initUI() {
  headerShadow()
  mobileMenu()
  packageLinks()
  quoteForm()
  document.querySelectorAll('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()))
}

function headerShadow() {
  const header = document.querySelector('.header')
  if (!header) return
  const update = () => header.classList.toggle('is-scrolled', window.scrollY > 8)
  update()
  window.addEventListener('scroll', update, { passive: true })
}

function mobileMenu() {
  const toggle = document.querySelector('.nav-toggle')
  const menu = document.getElementById('mobile-menu')
  if (!toggle || !menu) return
  const icon = toggle.querySelector('use')

  const setOpen = (open) => {
    menu.hidden = !open
    toggle.setAttribute('aria-expanded', String(open))
    icon?.setAttribute('href', open ? '#i-close' : '#i-menu')
  }

  toggle.addEventListener('click', () => setOpen(menu.hidden))
  menu.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false)
  })
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !menu.hidden) {
      setOpen(false)
      toggle.focus()
    }
  })
  window.matchMedia('(min-width: 861px)').addEventListener('change', (event) => event.matches && setOpen(false))
}

// "Choose Business" etc. pre-select that package in the quote form
function packageLinks() {
  const select = document.getElementById('f-package')
  if (!select) return
  document.querySelectorAll('[data-package]').forEach((link) => {
    link.addEventListener('click', () => {
      select.value = link.dataset.package
    })
  })
}

function quoteForm() {
  const form = document.getElementById('quote-form')
  if (!form) return
  const status = form.querySelector('.form-status')
  const button = form.querySelector('button[type="submit"]')
  const email = form.dataset.email

  const show = (state, message) => {
    status.dataset.state = state
    status.textContent = message
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    const data = new FormData(form)
    if (data.get('_gotcha')) return // spam bot filled the hidden field

    const endpoint = (form.dataset.endpoint || '').trim()

    // No form service configured yet: hand the enquiry to the visitor's email app
    if (!endpoint) {
      const subject = `Website enquiry from ${data.get('name')}`
      const body = [
        `Name: ${data.get('name')}`,
        `Email: ${data.get('email')}`,
        `Business / website: ${data.get('business') || '-'}`,
        `Interested in: ${data.get('package')}`,
        '',
        data.get('message'),
      ].join('\n')
      window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      show('info', `Your email app should open with your message ready. Press send there to finish, or email ${email} directly.`)
      return
    }

    button.disabled = true
    show('info', 'Sending…')
    try {
      const response = await fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      form.reset()
      show('sent', 'Thanks, your enquiry has been sent. I’ll reply within one working day.')
    } catch {
      show('error', `Sorry, that didn’t send. Please try again or email ${email} directly.`)
    } finally {
      button.disabled = false
    }
  })
}
