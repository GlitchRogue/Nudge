import { addDays, setHours, setMinutes, startOfWeek, format } from 'date-fns'

export type EventSource = 'Eventbrite' | 'Campus Portal' | 'Career Center' | 'Newsletter'

export interface UserProfile {
  id: string
  name: string
  interests: string[]
  constraints: {
    preferredTimes: string[]
    maxEventsPerDay: number
    avoidWeekends: boolean
  }
  major: string
  year: string
}

export interface CalendarEvent {
  id: string
  title: string
  location: string
  startTime: Date
  endTime: Date
  type: 'class' | 'personal' | 'club' | 'work' | 'suggested'
  priority: 'high' | 'medium' | 'low'
  color?: string
}

export interface AvailableEvent {
  id: string
  title: string
  description: string
  location: string
  startTime: Date
  endTime: Date
  source: EventSource
  category: string
  tags: string[]
  capacity?: number
  spotsLeft?: number
}

export interface EventSuggestion {
  event: AvailableEvent
  matchScore: number
  matchReason: string
  reasoning: string[]
  conflict?: {
    existingEvent: CalendarEvent
    proposedRearrangement: string
  }
}

// Use a fixed reference date to avoid hydration mismatches between server and client
// This creates consistent dates regardless of when/where the code runs
const FIXED_REFERENCE_DATE = new Date('2026-04-20T00:00:00')
const weekStart = startOfWeek(FIXED_REFERENCE_DATE, { weekStartsOn: 0 })

// Helper to create a date at a specific day and time this week
function createDate(dayOffset: number, hour: number, minute: number = 0): Date {
  return setMinutes(setHours(addDays(weekStart, dayOffset), hour), minute)
}

export const userProfile: UserProfile = {
  id: 'user-1',
  name: 'Alex Chen',
  interests: ['AI/ML', 'entrepreneurship', 'basketball', 'photography', 'hackathons'],
  constraints: {
    preferredTimes: ['evening', 'afternoon'],
    maxEventsPerDay: 2,
    avoidWeekends: false,
  },
  major: 'Computer Science',
  year: 'Junior',
}

export const calendarEvents: CalendarEvent[] = [
  // Monday
  {
    id: 'cal-1',
    title: 'CS 229: Machine Learning',
    location: 'Gates B01',
    startTime: createDate(1, 10, 0),
    endTime: createDate(1, 11, 30),
    type: 'class',
    priority: 'high',
  },
  {
    id: 'cal-2',
    title: 'Gym Session',
    location: 'DAPER Gym',
    startTime: createDate(1, 17, 0),
    endTime: createDate(1, 18, 30),
    type: 'personal',
    priority: 'medium',
  },
  // Tuesday
  {
    id: 'cal-3',
    title: 'CS 161: Algorithms',
    location: 'Hewlett 200',
    startTime: createDate(2, 9, 0),
    endTime: createDate(2, 10, 30),
    type: 'class',
    priority: 'high',
  },
  {
    id: 'cal-4',
    title: 'Study Group',
    location: 'Green Library',
    startTime: createDate(2, 14, 0),
    endTime: createDate(2, 16, 0),
    type: 'personal',
    priority: 'medium',
  },
  // Wednesday
  {
    id: 'cal-5',
    title: 'CS 229: Machine Learning',
    location: 'Gates B01',
    startTime: createDate(3, 10, 0),
    endTime: createDate(3, 11, 30),
    type: 'class',
    priority: 'high',
  },
  {
    id: 'cal-6',
    title: 'Startup Club Meeting',
    location: 'Huang 018',
    startTime: createDate(3, 18, 0),
    endTime: createDate(3, 19, 30),
    type: 'club',
    priority: 'medium',
  },
  // Thursday
  {
    id: 'cal-7',
    title: 'CS 161: Algorithms',
    location: 'Hewlett 200',
    startTime: createDate(4, 9, 0),
    endTime: createDate(4, 10, 30),
    type: 'class',
    priority: 'high',
  },
  {
    id: 'cal-8',
    title: 'Basketball Practice',
    location: 'Maples Pavilion',
    startTime: createDate(4, 16, 0),
    endTime: createDate(4, 17, 30),
    type: 'club',
    priority: 'medium',
  },
  {
    id: 'cal-9',
    title: 'Dinner with Friends',
    location: 'Arrillaga Dining',
    startTime: createDate(4, 18, 30),
    endTime: createDate(4, 20, 0),
    type: 'personal',
    priority: 'low',
  },
  // Friday
  {
    id: 'cal-10',
    title: 'CS 229: Machine Learning',
    location: 'Gates B01',
    startTime: createDate(5, 10, 0),
    endTime: createDate(5, 11, 30),
    type: 'class',
    priority: 'high',
  },
  {
    id: 'cal-11',
    title: 'Office Hours - Prof. Ng',
    location: 'Gates 156',
    startTime: createDate(5, 14, 0),
    endTime: createDate(5, 15, 0),
    type: 'work',
    priority: 'high',
  },
  // Saturday
  {
    id: 'cal-12',
    title: 'Gym Session',
    location: 'DAPER Gym',
    startTime: createDate(6, 10, 0),
    endTime: createDate(6, 11, 30),
    type: 'personal',
    priority: 'low',
  },
]

export const availableEvents: AvailableEvent[] = [
  // AI/ML Events (should match profile)
  {
    id: 'ev-1',
    title: 'Stanford AI Lab Open House',
    description: 'Tour the AI research labs and meet researchers working on cutting-edge projects.',
    location: 'Gates Building',
    startTime: createDate(2, 17, 0),
    endTime: createDate(2, 19, 0),
    source: 'Campus Portal',
    category: 'Academic',
    tags: ['AI', 'research', 'networking'],
  },
  {
    id: 'ev-2',
    title: 'Intro to LLMs Workshop',
    description: 'Hands-on workshop covering transformer architectures and prompt engineering.',
    location: 'Huang Engineering Center',
    startTime: createDate(3, 14, 0),
    endTime: createDate(3, 16, 0),
    source: 'Newsletter',
    category: 'Workshop',
    tags: ['AI', 'ML', 'hands-on'],
    capacity: 40,
    spotsLeft: 8,
  },
  {
    id: 'ev-3',
    title: 'ML Paper Reading Group',
    description: 'Weekly discussion of influential ML papers. This week: Attention Is All You Need.',
    location: 'Gates 219',
    startTime: createDate(4, 12, 0),
    endTime: createDate(4, 13, 0),
    source: 'Campus Portal',
    category: 'Academic',
    tags: ['AI', 'ML', 'reading group'],
  },
  // Entrepreneurship Events (should match profile)
  {
    id: 'ev-4',
    title: 'Startup Pitch Night',
    description: 'Watch student founders pitch their ideas to VCs and get feedback.',
    location: 'Huang Auditorium',
    startTime: createDate(4, 19, 0),
    endTime: createDate(4, 21, 0),
    source: 'Eventbrite',
    category: 'Entrepreneurship',
    tags: ['startups', 'pitching', 'VC'],
  },
  {
    id: 'ev-5',
    title: 'How to Raise Your First Round',
    description: 'Panel with founders who recently raised seed funding.',
    location: 'GSB Knight Center',
    startTime: createDate(5, 16, 0),
    endTime: createDate(5, 17, 30),
    source: 'Career Center',
    category: 'Career',
    tags: ['entrepreneurship', 'fundraising'],
  },
  {
    id: 'ev-6',
    title: 'Weekend Hackathon',
    description: '48-hour hackathon with AI/ML track. $5000 in prizes.',
    location: 'Arrillaga Alumni Center',
    startTime: createDate(6, 12, 0),
    endTime: addDays(createDate(6, 12, 0), 2),
    source: 'Eventbrite',
    category: 'Competition',
    tags: ['hackathon', 'AI', 'coding'],
    capacity: 200,
    spotsLeft: 45,
  },
  // Basketball Events (should match profile)
  {
    id: 'ev-7',
    title: 'Intramural Basketball Tryouts',
    description: 'Open tryouts for the spring intramural basketball league.',
    location: 'Maples Pavilion',
    startTime: createDate(5, 18, 0),
    endTime: createDate(5, 20, 0),
    source: 'Campus Portal',
    category: 'Sports',
    tags: ['basketball', 'sports', 'intramural'],
  },
  // Photography Events (should match profile)
  {
    id: 'ev-8',
    title: 'Night Photography Workshop',
    description: 'Learn techniques for capturing stunning night shots on campus.',
    location: 'Memorial Church',
    startTime: createDate(5, 20, 0),
    endTime: createDate(5, 22, 0),
    source: 'Newsletter',
    category: 'Arts',
    tags: ['photography', 'workshop', 'creative'],
    capacity: 20,
    spotsLeft: 3,
  },
  // Neutral Events (moderate match)
  {
    id: 'ev-9',
    title: 'Resume Workshop',
    description: 'Get your resume reviewed by career advisors.',
    location: 'Career Development Center',
    startTime: createDate(2, 13, 0),
    endTime: createDate(2, 14, 0),
    source: 'Career Center',
    category: 'Career',
    tags: ['career', 'resume'],
  },
  {
    id: 'ev-10',
    title: 'Networking Mixer',
    description: 'Meet students from different departments over refreshments.',
    location: 'Tresidder Union',
    startTime: createDate(3, 17, 0),
    endTime: createDate(3, 18, 30),
    source: 'Campus Portal',
    category: 'Social',
    tags: ['networking', 'social'],
  },
  {
    id: 'ev-11',
    title: 'Tech Talk: Google',
    description: 'Engineers from Google discuss their work on search infrastructure.',
    location: 'NVIDIA Auditorium',
    startTime: createDate(4, 17, 0),
    endTime: createDate(4, 18, 30),
    source: 'Career Center',
    category: 'Career',
    tags: ['tech', 'Google', 'career'],
  },
  {
    id: 'ev-12',
    title: 'Movie Night: Oppenheimer',
    description: 'Free screening of Oppenheimer with popcorn.',
    location: 'Memorial Auditorium',
    startTime: createDate(5, 19, 0),
    endTime: createDate(5, 22, 0),
    source: 'Campus Portal',
    category: 'Entertainment',
    tags: ['movie', 'free', 'social'],
  },
  // Low Match Events (diverse options)
  {
    id: 'ev-13',
    title: 'Poetry Open Mic',
    description: 'Share your poetry or just listen to fellow students.',
    location: 'CoHo',
    startTime: createDate(2, 19, 0),
    endTime: createDate(2, 21, 0),
    source: 'Newsletter',
    category: 'Arts',
    tags: ['poetry', 'arts', 'open mic'],
  },
  {
    id: 'ev-14',
    title: 'Cooking Class: Italian',
    description: 'Learn to make fresh pasta from scratch.',
    location: 'FloMo Kitchen',
    startTime: createDate(3, 18, 0),
    endTime: createDate(3, 20, 0),
    source: 'Eventbrite',
    category: 'Lifestyle',
    tags: ['cooking', 'food', 'social'],
    capacity: 15,
    spotsLeft: 2,
  },
  {
    id: 'ev-15',
    title: 'Meditation & Mindfulness',
    description: 'Weekly meditation session for stress relief.',
    location: 'Vaden Health Center',
    startTime: createDate(4, 12, 0),
    endTime: createDate(4, 13, 0),
    source: 'Campus Portal',
    category: 'Wellness',
    tags: ['meditation', 'wellness', 'health'],
  },
  {
    id: 'ev-16',
    title: 'Book Club: Dune',
    description: 'Monthly book club meeting discussing Frank Herbert\'s Dune.',
    location: 'Green Library',
    startTime: createDate(2, 18, 0),
    endTime: createDate(2, 19, 30),
    source: 'Newsletter',
    category: 'Literature',
    tags: ['books', 'reading', 'social'],
  },
  {
    id: 'ev-17',
    title: 'Chess Tournament',
    description: 'Open chess tournament. All skill levels welcome.',
    location: 'Tresidder Union',
    startTime: createDate(6, 14, 0),
    endTime: createDate(6, 18, 0),
    source: 'Campus Portal',
    category: 'Competition',
    tags: ['chess', 'competition', 'games'],
  },
  {
    id: 'ev-18',
    title: 'Dance Workshop: Hip Hop',
    description: 'Learn basic hip hop moves. No experience needed.',
    location: 'Roble Dance Studio',
    startTime: createDate(3, 19, 0),
    endTime: createDate(3, 20, 30),
    source: 'Eventbrite',
    category: 'Arts',
    tags: ['dance', 'hip hop', 'fitness'],
  },
  {
    id: 'ev-19',
    title: 'Debate Club Meeting',
    description: 'Weekly debate practice. Topic: AI regulation.',
    location: 'Pigott Hall',
    startTime: createDate(4, 18, 0),
    endTime: createDate(4, 19, 30),
    source: 'Campus Portal',
    category: 'Academic',
    tags: ['debate', 'public speaking'],
  },
  {
    id: 'ev-20',
    title: 'Volunteer: Beach Cleanup',
    description: 'Help clean up Half Moon Bay beach.',
    location: 'Half Moon Bay',
    startTime: createDate(6, 9, 0),
    endTime: createDate(6, 13, 0),
    source: 'Newsletter',
    category: 'Volunteering',
    tags: ['volunteer', 'environment', 'community'],
  },
  // More Events for Variety
  {
    id: 'ev-21',
    title: 'Data Science Career Fair',
    description: 'Meet recruiters from top tech companies hiring data scientists.',
    location: 'Arrillaga Dining',
    startTime: createDate(3, 10, 0),
    endTime: createDate(3, 14, 0),
    source: 'Career Center',
    category: 'Career',
    tags: ['career fair', 'data science', 'recruiting'],
  },
  {
    id: 'ev-22',
    title: 'Robotics Demo Day',
    description: 'See the latest student robotics projects.',
    location: 'Packard Building',
    startTime: createDate(5, 13, 0),
    endTime: createDate(5, 15, 0),
    source: 'Campus Portal',
    category: 'Academic',
    tags: ['robotics', 'engineering', 'demo'],
  },
  {
    id: 'ev-23',
    title: 'Founder Stories: Dropbox',
    description: 'Drew Houston shares the story of building Dropbox.',
    location: 'NVIDIA Auditorium',
    startTime: createDate(2, 18, 0),
    endTime: createDate(2, 19, 30),
    source: 'Eventbrite',
    category: 'Entrepreneurship',
    tags: ['startups', 'founder', 'tech'],
  },
  {
    id: 'ev-24',
    title: 'Open Gym Basketball',
    description: 'Drop-in basketball. All skill levels.',
    location: 'Arrillaga Gym',
    startTime: createDate(6, 15, 0),
    endTime: createDate(6, 17, 0),
    source: 'Campus Portal',
    category: 'Sports',
    tags: ['basketball', 'sports', 'recreation'],
  },
  {
    id: 'ev-25',
    title: 'Photography Club Exhibition',
    description: 'Student photography exhibition opening night.',
    location: 'Cantor Arts Center',
    startTime: createDate(4, 17, 0),
    endTime: createDate(4, 19, 0),
    source: 'Newsletter',
    category: 'Arts',
    tags: ['photography', 'exhibition', 'arts'],
  },
  {
    id: 'ev-26',
    title: 'AI Ethics Seminar',
    description: 'Discuss the ethical implications of AI with philosophy and CS professors.',
    location: 'Building 420',
    startTime: createDate(3, 15, 0),
    endTime: createDate(3, 16, 30),
    source: 'Campus Portal',
    category: 'Academic',
    tags: ['AI', 'ethics', 'seminar'],
  },
  {
    id: 'ev-27',
    title: 'Late Night Coding Session',
    description: 'Collaborative coding with pizza. Work on side projects together.',
    location: 'Gates Basement',
    startTime: createDate(5, 21, 0),
    endTime: createDate(6, 2, 0),
    source: 'Newsletter',
    category: 'Academic',
    tags: ['coding', 'social', 'projects'],
  },
  {
    id: 'ev-28',
    title: 'Yoga on the Lawn',
    description: 'Outdoor yoga session. Bring your own mat.',
    location: 'Main Quad',
    startTime: createDate(4, 7, 0),
    endTime: createDate(4, 8, 0),
    source: 'Campus Portal',
    category: 'Wellness',
    tags: ['yoga', 'fitness', 'outdoor'],
  },
  {
    id: 'ev-29',
    title: 'Board Game Night',
    description: 'Play board games with fellow students. Snacks provided.',
    location: 'FloMo Lounge',
    startTime: createDate(6, 19, 0),
    endTime: createDate(6, 22, 0),
    source: 'Campus Portal',
    category: 'Social',
    tags: ['games', 'social', 'fun'],
  },
  {
    id: 'ev-30',
    title: 'Mock Interview Workshop',
    description: 'Practice technical interviews with industry professionals.',
    location: 'Career Development Center',
    startTime: createDate(3, 10, 0),
    endTime: createDate(3, 12, 0),
    source: 'Career Center',
    category: 'Career',
    tags: ['interview', 'career', 'practice'],
  },
  {
    id: 'ev-31',
    title: 'Astronomy Night',
    description: 'Stargazing with the astronomy club. Telescopes provided.',
    location: 'Dish Trail',
    startTime: createDate(5, 20, 30),
    endTime: createDate(5, 23, 0),
    source: 'Newsletter',
    category: 'Academic',
    tags: ['astronomy', 'science', 'outdoor'],
  },
  {
    id: 'ev-32',
    title: 'Language Exchange: Spanish',
    description: 'Practice Spanish with native speakers.',
    location: 'Encina Hall',
    startTime: createDate(2, 17, 0),
    endTime: createDate(2, 18, 30),
    source: 'Campus Portal',
    category: 'Languages',
    tags: ['Spanish', 'language', 'social'],
  },
  {
    id: 'ev-33',
    title: 'Film Club: Hitchcock Night',
    description: 'Double feature of Vertigo and Rear Window.',
    location: 'Cubberley Auditorium',
    startTime: createDate(6, 18, 0),
    endTime: createDate(6, 23, 0),
    source: 'Newsletter',
    category: 'Entertainment',
    tags: ['film', 'classic movies', 'social'],
  },
  {
    id: 'ev-34',
    title: 'Venture Capital 101',
    description: 'Learn the basics of venture capital from Sequoia partners.',
    location: 'GSB Class of 1968 Building',
    startTime: createDate(4, 15, 0),
    endTime: createDate(4, 16, 30),
    source: 'Career Center',
    category: 'Career',
    tags: ['VC', 'entrepreneurship', 'finance'],
  },
  {
    id: 'ev-35',
    title: 'Ultimate Frisbee Pickup',
    description: 'Casual ultimate frisbee game. All welcome.',
    location: 'Wilbur Field',
    startTime: createDate(6, 10, 0),
    endTime: createDate(6, 12, 0),
    source: 'Campus Portal',
    category: 'Sports',
    tags: ['frisbee', 'sports', 'outdoor'],
  },
  {
    id: 'ev-36',
    title: 'Science Communication Workshop',
    description: 'Learn to explain complex topics to general audiences.',
    location: 'Building 320',
    startTime: createDate(4, 14, 0),
    endTime: createDate(4, 15, 30),
    source: 'Newsletter',
    category: 'Academic',
    tags: ['communication', 'science', 'writing'],
  },
  {
    id: 'ev-37',
    title: 'Farmers Market Trip',
    description: 'Group trip to Palo Alto Farmers Market.',
    location: 'Downtown Palo Alto',
    startTime: createDate(6, 8, 0),
    endTime: createDate(6, 10, 0),
    source: 'Campus Portal',
    category: 'Social',
    tags: ['food', 'community', 'outdoor'],
  },
  {
    id: 'ev-38',
    title: 'A Cappella Concert',
    description: 'Stanford A Cappella groups perform.',
    location: 'Bing Concert Hall',
    startTime: createDate(6, 19, 0),
    endTime: createDate(6, 21, 0),
    source: 'Eventbrite',
    category: 'Entertainment',
    tags: ['music', 'concert', 'a cappella'],
    capacity: 800,
    spotsLeft: 150,
  },
  {
    id: 'ev-39',
    title: 'Startup Legal Basics',
    description: 'Learn about incorporation, IP, and contracts.',
    location: 'Law School Room 290',
    startTime: createDate(5, 12, 0),
    endTime: createDate(5, 13, 30),
    source: 'Career Center',
    category: 'Entrepreneurship',
    tags: ['startups', 'legal', 'business'],
  },
  {
    id: 'ev-40',
    title: 'ML Study Session',
    description: 'Collaborative study session for CS229 midterm prep.',
    location: 'Huang Basement',
    startTime: createDate(1, 19, 0),
    endTime: createDate(1, 22, 0),
    source: 'Campus Portal',
    category: 'Academic',
    tags: ['ML', 'study', 'CS229'],
  },
]

// Group members for the Group Tab
export interface GroupMember {
  id: string
  name: string
  avatar: string
  interests: string[]
}

export const groupMembers: GroupMember[] = [
  {
    id: 'friend-a',
    name: 'Friend A',
    avatar: 'JT',
    interests: ['AI/ML', 'music', 'hackathons'],
  },
  {
    id: 'friend-b',
    name: 'Friend B',
    avatar: 'SK',
    interests: ['entrepreneurship', 'basketball', 'photography'],
  },
]

// Helper function to format date for display
export function formatEventTime(date: Date): string {
  return format(date, 'h:mm a')
}

export function formatEventDate(date: Date): string {
  return format(date, 'EEE, MMM d')
}

export function formatEventDateShort(date: Date): string {
  return format(date, 'EEE')
}

// Get events for a specific day
// In your lib/mock.ts, replace getEventsForDay with this generic version:
export function getEventsForDay<T extends { startTime: Date }>(events: T[], dayOffset: number): T[] {
  const targetDate = addDays(weekStart, dayOffset)
  return events.filter(event => event.startTime.toDateString() === targetDate.toDateString())
}

// Source badge colors
export const sourceBadgeColors: Record<EventSource, string> = {
  'Eventbrite': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'Campus Portal': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Career Center': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'Newsletter': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}
