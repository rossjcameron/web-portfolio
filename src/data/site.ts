export const site = {
  name: 'New Window Web Design',
  wordmark: 'new window',
  descriptor: 'Web design & development',
  tagline: 'Modern, thoughtfully designed websites for UK businesses.',
  description:
    'New Window Web Design is an independent UK studio creating modern, fast and professionally designed websites for small businesses, tradespeople and growing companies. Websites from £299.',
  /** Shown on the Contact page and in the footer when set (PUBLIC_CONTACT_EMAIL). */
  email: (import.meta.env.PUBLIC_CONTACT_EMAIL ?? '').trim(),
  /** Add real profiles only, e.g. { label: 'LinkedIn', href: 'https://www.linkedin.com/company/…' } */
  socials: [] as { label: string; href: string }[],
  priceFrom: 299,
} as const

export const nav = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/services/' },
  { label: 'Our Work', href: '/work/' },
  { label: 'Pricing', href: '/pricing/' },
  { label: 'About', href: '/about/' },
  { label: 'Contact', href: '/contact/' },
] as const
