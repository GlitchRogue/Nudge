export type Tag = 'food' | 'popup' | 'networking' | 'fun'

export type Interest =
  | 'Computer Science' | 'Finance' | 'Design' | 'Biology'
  | 'Law' | 'Medicine' | 'Business' | 'Arts & Media'

export type Source = 'Engage' | 'Handshake' | 'Wasserman' | 'NYU Health'

export interface NudgeEvent {
  id: string
  tag: Tag
  day: number       // 0 = today, 1 = tomorrow ...
  time: string
  startMin?: number // minutes from midnight, used for slot matching
  title: string
  desc: string
  source: Source
  location: string
  interests: Interest[]
}

export interface FreeSlot {
  startMin: number
  endMin: number
  label: string
}