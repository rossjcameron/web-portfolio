import MockHartley from './MockHartley.astro'
import MockLustre from './MockLustre.astro'
import MockCalder from './MockCalder.astro'

export const mockups = {
  'hartley-and-stone': { component: MockHartley, tone: 'light' },
  'lustre-auto-care': { component: MockLustre, tone: 'dark' },
  'calder-and-finch': { component: MockCalder, tone: 'light' },
} as const

export type MockSlug = keyof typeof mockups
