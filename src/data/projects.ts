// Concept projects: designed by New Window as demonstrations. Not commissioned client work.
export interface Project {
  slug: string
  name: string
  industry: string
  type: string
  concept: true
  summary: string
  context: string
  brief: string
  approach: string[]
  features: string[]
}

export const projects: Project[] = [
  {
    slug: 'hartley-and-stone',
    name: 'Hartley & Stone',
    industry: 'Construction',
    type: 'Five-page company website',
    concept: true,
    summary: 'A premium website for a residential builder, designed to attract higher-value projects.',
    context:
      'Many established builders rely on word of mouth and a dated website. When a homeowner is about to spend six figures on an extension or new build, the website is often where trust is won or lost.',
    brief:
      'Present a residential construction firm as careful, capable and worth the investment. Lead with the quality of finished homes, explain the services clearly, and make requesting a consultation the obvious next step.',
    approach: [
      'A restrained stone and charcoal palette that lets the architecture lead.',
      'Wide, confident typography and generous spacing to signal a premium service.',
      'Large framed imagery of finished homes, with services and process kept short and scannable.',
    ],
    features: [
      'Project gallery organised by type of work',
      'Service pages for new builds, extensions and renovations',
      'Consultation request form with project type and budget range',
      'Click-to-call in the mobile header',
      'Accreditation and guarantee panel',
    ],
  },
  {
    slug: 'lustre-auto-care',
    name: 'Lustre Auto Care',
    industry: 'Automotive detailing',
    type: 'One-page website with booking enquiries',
    concept: true,
    summary: 'A dark, glossy one-page site for a mobile detailing business, built around booking enquiries.',
    context:
      'Detailing customers decide quickly, usually on a phone, and want to see prices and results before they get in touch.',
    brief:
      'Show off the finish, make the packages and prices easy to compare, and turn mobile visitors into booking enquiries with as few taps as possible.',
    approach: [
      'A deep graphite palette with reflective highlights that echo freshly polished paintwork.',
      'Packages presented side by side with clear prices, so customers can choose without calling.',
      'A sticky booking button on mobile that is always one tap away.',
    ],
    features: [
      'Package comparison with prices',
      'Booking enquiry form with vehicle size and preferred date',
      'Before-and-after gallery',
      'Service area and opening hours',
      'Click-to-call and WhatsApp buttons',
    ],
  },
  {
    slug: 'calder-and-finch',
    name: 'Calder & Finch',
    industry: 'Professional services',
    type: 'Business website for an accountancy practice',
    concept: true,
    summary: 'A calm, credible website for an accountancy practice, focused on booking first consultations.',
    context:
      'Small business owners choosing an accountant look for clarity, reassurance and a sense that the firm understands businesses like theirs.',
    brief:
      'Replace jargon with plain explanations of each service, show fixed monthly fees up front, and make booking a free first consultation simple.',
    approach: [
      'A deep green and white palette with classic serif headings for a sense of trust and continuity.',
      'Services described by the problems they solve rather than technical terms.',
      'Transparent monthly fee guides to remove the biggest barrier to getting in touch.',
    ],
    features: [
      'Service pages for bookkeeping, payroll, VAT and annual accounts',
      'Monthly fee guide by business type',
      'Free consultation booking form',
      'Resource articles for small business owners',
      'Clear regulatory and privacy information in the footer',
    ],
  },
]
