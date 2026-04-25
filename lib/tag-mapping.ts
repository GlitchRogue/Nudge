import type { AvailableEvent } from './mock'

export type VisualTag = 'food' | 'popup' | 'networking' | 'fun'

export const TAG_META: Record<VisualTag, { label: string; color: string }> = {
  food:       { label: 'FOOD',       color: '#EF9F27' },
  popup:      { label: 'POPUP',      color: '#7F77DD' },
  networking: { label: 'NETWORKING', color: '#378ADD' },
  fun:        { label: 'FUN',        color: '#D85A30' },
}

export function getVisualTag(event: AvailableEvent): VisualTag {
  const cat = event.category.toLowerCase()
  const tags = event.tags.map(t => t.toLowerCase())

  if (tags.some(t => /food|cooking|pizza|breakfast|lunch|coffee|dining|farmers/.test(t))) return 'food'

  if (cat === 'workshop' || tags.some(t => /workshop|drop-in|demo|hands-on|exhibition|open mic|pickup/.test(t))) return 'popup'

  if (cat === 'career' || cat === 'entrepreneurship') return 'networking'

  if (['sports','arts','entertainment','wellness','social','lifestyle','languages','competition','literature','volunteering'].includes(cat))
    return 'fun'

  return 'networking'
}