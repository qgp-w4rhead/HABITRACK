export type HabitType = 'positive' | 'negative'
export type OverflowType = 'positive' | 'negative' | 'neutral'
export type TrackingMode = 'peg' | 'gauge'
export type GoalKind = 'singular' | 'repetitive'
export type RepeatRate = 'daily' | 'weekly' | 'monthly'

export interface CheatPeriod {
  id: string
  start: string // ISO date
  end: string   // ISO date
}

export interface PeriodRecord {
  start: string      // ISO ; period start (inclusive)
  end: string        // ISO ; period end (exclusive, = next period's start)
  finalCount: number // peg count when the period closed
  metGoal: boolean   // frozen at close ; later goal/joker edits don't rewrite history
}

export interface Habit {
  id: string
  initial_name: string       // stored in DB, never changes
  renamed: string | null     // frontend display name override
  description: string        // habit description
  condition: string          // condition for success/fail
  goal: number               // habit counter goal (number of pegs/holes)
  jokers: number             // wildcard pegs (neg: extra fillable, pos: skippable days)
  currentCount: number       // how many pegs currently dropped
  pegTimestamps: (string | null)[] // ISO timestamp per dropped peg (index = peg order); null = unknown
  pegNotes: (string | null)[] // justification per drop record, index-aligned with pegTimestamps; null = none
  type: HabitType            // positive = maximize, negative = minimize
  overflowType: OverflowType // positive = bonus, negative = overdoing it, neutral = just extra
  trackingMode: TrackingMode // peg = pegboard, gauge = draggable wheel
  justify: boolean           // require a note/reason when dropping a peg or adding gauge value
  gaugeDecimals: boolean     // gauge mode only: wheel accepts decimal (tenths) values
  accentColor: string        // randomly assigned accent color
  active: boolean            // false = deactivated but kept in DB
  cheatPeriods: CheatPeriod[]
  createdAt: string          // ISO date
  updatedAt: string          // ISO date ; bumped on every mutation, drives sync
  startDate: string          // ISO date or '' ; optional habit active period start
  endDate: string            // ISO date or '' ; optional habit active period end
  goalKind: GoalKind         // singular = one-shot goal, repetitive = resets on a cadence
  repeatRate: RepeatRate | null // reset cadence when goalKind === 'repetitive'
  periodStart: string        // ISO ; start of the currently open period
  history: PeriodRecord[]    // archived closed periods (repetitive only)
  completedAt: string | null // ISO ; set when a singular goal is met
}

export interface HabitInput {
  name: string
  description: string
  condition: string
  goal: number
  jokers: number
  type: HabitType
  overflowType: OverflowType
  trackingMode: TrackingMode
  gaugeDecimals: boolean
  justify: boolean
  startDate: string
  endDate: string
  goalKind: GoalKind
  repeatRate: RepeatRate | null
}

export const ACCENT_COLORS = [
  '#FF6B6B', // red
  '#4ECDC4', // teal
  '#45B7D1', // blue
  '#FFA07A', // light salmon
  '#98D8C8', // mint
  '#F7DC6F', // yellow
  '#BB8FCE', // purple
  '#85C1E9', // sky blue
  '#F1948A', // pink
  '#82E0AA', // green
  '#F8C471', // orange
  '#AED6F1', // pale blue
]

export function randomAccentColor(): string {
  return ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)]
}

export function getHabitName(habit: Habit): string {
  return habit.renamed ?? habit.initial_name
}
