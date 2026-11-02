// Provisional pricing: confirm final commercial terms before relying on it.
export interface Package {
  id: 'starter' | 'business'
  name: string
  price: number
  summary: string
  suitableFor: string
  includes: string[]
}

export const packages: Package[] = [
  {
    id: 'starter',
    name: 'Starter Website',
    price: 299,
    summary: 'A polished one-page website for small businesses wanting a professional online presence.',
    suitableFor: 'Sole traders, tradespeople and new businesses that need a focused, professional presence.',
    includes: [
      'One-page website',
      'Bespoke styling within a defined design system',
      'Mobile responsive layout',
      'Contact form',
      'Click-to-call button',
      'Basic on-page SEO',
      'Domain connection',
      'One revision round',
    ],
  },
  {
    id: 'business',
    name: 'Business Website',
    price: 499,
    summary: 'A three-to-five-page website for established businesses wanting something more comprehensive.',
    suitableFor: 'Established businesses that need room to explain their services and win more enquiries.',
    includes: [
      'Everything in Starter',
      'Three to five pages, including service pages',
      'Customised design',
      'A section for your customer testimonials',
      'Enquiry optimisation: clear calls to action and contact routes',
      'Analytics set-up',
      'Two revision rounds',
    ],
  },
]

export const care = {
  id: 'care' as const,
  name: 'Website Care',
  price: 29,
  summary: 'Managed hosting, monitoring, backups where applicable, and a small allowance of content updates.',
  includes: [
    'Managed hosting',
    'Basic monitoring',
    'Backups where applicable',
    'Routine maintenance',
    'A small agreed allowance of content updates',
  ],
}

export const exclusions = [
  'Domain registration and renewal fees',
  'Third-party subscriptions, such as email accounts or booking software',
  'Professional photography and copywriting',
  'Advanced SEO campaigns or paid advertising',
  'Custom functionality, such as online shops, booking systems or integrations',
  'Changes beyond the included revision rounds',
]
