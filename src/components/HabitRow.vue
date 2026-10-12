<template>
  <div class="habit-row" :class="{ 'habit-row--reversed': buttonOnRight, 'overflow-negative': habit.overflowType === 'negative' }" :style="{ '--accent': habit.accentColor, '--overflow-color': overflowColor, '--overflow-color-2': overflowColor2 }">
    <!-- Habit name button on the side -->
    <button
      class="neu-habit-btn habit-label"
      :class="{ 'is-cheating': isCheating, pressed }"
      @click="onPress"
      @contextmenu.prevent="$emit('manage', habit.id)"
    >
      <span class="habit-label-text">{{ displayName }}</span>
      <svg v-if="isComplete" class="complete-indicator" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      <span v-if="isCheating" class="cheat-indicator">!</span>
    </button>

    <!-- Pegboard (peg mode) -->
    <div v-if="habit.trackingMode === 'peg'" class="holes-container neu-carved-sm">
      <div class="holes-scroll no-scrollbar">
        <NeumorphicHole
          v-for="i in totalHoles"
          :key="i"
          :filled="(i <= pegboardCount) || (habit.type === 'positive' && i > positiveJokerStart)"
          :accent-color="habit.accentColor"
          :joker="habit.type === 'positive' && i > positiveJokerStart"
          :dropped-at="pegDroppedAt(i)"
          :note="pegNoteAt(i)"
        />
        <span v-if="overflowCount > 0" class="overflow-count">+{{ overflowCount }}</span>
      </div>

      <!-- Overflow bucket: past-objective pegs drop here (temporarily hidden) -->
      <!-- <PegBucket :overflow-count="overflowCount" :accent-color="overflowColor" /> -->
      <!-- Counter stack: all counters in one container, stacked, same width -->
      <div class="counter-stack">
        <div class="counter-badge">
          <AnimatedCounter :value="displayCount" /> / {{ totalHoles }}
        </div>
        <div v-if="habit.type === 'negative' && habit.jokers > 0" class="joker-gauge" :title="'Joker gauge'" :style="{ '--joker-fill': jokerFillPercent + '%' }">
          <AnimatedCounter :value="jokerGaugeCount" /> / {{ habit.jokers }}
        </div>
        <div v-else-if="habit.jokers > 0" class="joker-badge" :title="'Skippable days'">
          {{ habit.jokers }} Jokers
        </div>
      </div>
    </div>

    <!-- Gauge bar (gauge mode) -->
    <div v-else class="gauge-container neu-carved-sm">
      <div
        class="gauge-bar"
        :style="{ '--gauge-fill': gaugeFillPercent + '%', '--gauge-overflow': overflowFillPercent + '%', '--gauge-overflow-2': overflowFillPercent2 + '%', anchorName: gaugeAnchor }"
        @mouseenter="gaugeTipVisible = true"
        @mouseleave="gaugeTipVisible = false"
        @touchstart.passive="gaugeTipVisible = true"
        @touchend="gaugeTipVisible = false"
        @touchcancel="gaugeTipVisible = false"
      >
        <div class="gauge-fill"></div>
        <div class="gauge-fill-overflow"></div>
        <div class="gauge-fill-overflow-2"></div>
      </div>
      <div class="counter-stack">
        <div class="counter-badge counter-badge-stacked">
          <span class="counter-current"><AnimatedCounter :value="gaugeDisplayCount" /></span>
          <span class="counter-separator"></span>
          <span class="counter-goal">{{ habit.goal }}</span>
        </div>
        <div v-if="habit.jokers > 0" class="joker-gauge" :title="'Joker gauge'" :style="{ '--joker-fill': gaugeJokerFillPercent + '%' }">
          <AnimatedCounter :value="gaugeJokerCount" /> / {{ habit.jokers }}
        </div>
      </div>
    </div>

    <!-- Gauge justifications balloon, teleported like the peg tooltip so
         overflow-x on the row can't clip it -->
    <Teleport to="body">
      <template v-if="gaugeTipVisible && gaugeNotes.length">
        <div class="gauge-tip-arrow" :style="{ positionAnchor: gaugeAnchor }"></div>
        <div class="gauge-tip" :style="{ positionAnchor: gaugeAnchor }">
          <div v-for="(entry, i) in gaugeNotes" :key="i" class="gauge-tip-entry">
            <span class="gauge-tip-note">{{ entry.note }}</span>
            <span v-if="entry.at" class="gauge-tip-date">{{ formatTipDate(entry.at) }}</span>
          </div>
          <span v-if="extraNoteCount > 0" class="gauge-tip-more">+{{ extraNoteCount }} earlier</span>
        </div>
      </template>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import type { Habit } from '@/types/habit'
import { getHabitName } from '@/types/habit'
import { useHabits } from '@/composables/useHabits'
import { useSettings } from '@/composables/useSettings'
import NeumorphicHole from './NeumorphicHole.vue'
import AnimatedCounter from './AnimatedCounter.vue'
// import PegBucket from './PegBucket.vue' // temporarily hidden

const props = defineProps<{
  habit: Habit
}>()

const emit = defineEmits<{
  press: [id: string]
  gaugePress: [id: string]
  manage: [id: string]
}>()

const { isInCheatPeriod } = useHabits()
const { settings } = useSettings()

const buttonOnRight = computed(() => settings.value.accessibility.buttonPosition === 'right')

const displayName = computed(() => getHabitName(props.habit))
const isCheating = computed(() => isInCheatPeriod(props.habit))
const isComplete = computed(() =>
  props.habit.goalKind === 'singular' && props.habit.completedAt !== null,
)

const pressed = ref(false)
let pressTimer: ReturnType<typeof setTimeout> | undefined

function onPress() {
  pressed.value = true
  clearTimeout(pressTimer)
  pressTimer = setTimeout(() => { pressed.value = false }, 200)
  if (props.habit.trackingMode === 'gauge') {
    emit('gaugePress', props.habit.id)
  } else {
    emit('press', props.habit.id)
  }
}

// Pegboard always shows exactly `goal` holes
const totalHoles = computed(() => props.habit.goal)

// For positive habits: jokers pre-fill the last N holes (backward from the end)
// Returns the index after which joker-filled holes begin (0 = no joker holes)
const positiveJokerStart = computed(() =>
  props.habit.type === 'positive' && props.habit.jokers > 0
    ? totalHoles.value - props.habit.jokers
    : totalHoles.value
)

// How many pegs are visible in the pegboard
// Negative: first `jokers` pegs go to the joker gauge, rest fill the board
// Positive: pegs fill up to the joker boundary
const pegboardCount = computed(() =>
  props.habit.type === 'negative'
    ? Math.max(0, props.habit.currentCount - props.habit.jokers)
    : Math.min(props.habit.currentCount, positiveJokerStart.value)
)

// Value shown in the counter badge
const displayCount = computed(() =>
  props.habit.type === 'negative' ? pegboardCount.value : props.habit.currentCount
)

// ISO timestamp of the drop occupying hole i (1-based).
// Negative habits: the first `jokers` drops fill the joker gauge, not the board.
function pegDroppedAt(i: number): string | null | undefined {
  const idx = props.habit.type === 'negative' ? props.habit.jokers + i - 1 : i - 1
  return props.habit.pegTimestamps[idx]
}

// Justification attached to the same drop record, if justify was on.
function pegNoteAt(i: number): string | null | undefined {
  const idx = props.habit.type === 'negative' ? props.habit.jokers + i - 1 : i - 1
  return props.habit.pegNotes[idx]
}

// Gauge tooltip: notes paired with their drop timestamps, newest first.
const gaugeAnchor = `--gauge-${useId()}`
const gaugeTipVisible = ref(false)
const MAX_TIP_NOTES = 5

const gaugeNotes = computed(() => {
  const notes = props.habit.pegNotes
  const ts = props.habit.pegTimestamps
  const out: { note: string; at: string | null }[] = []
  for (let i = notes.length - 1; i >= 0 && out.length < MAX_TIP_NOTES; i--) {
    const note = notes[i]
    if (note) out.push({ note, at: ts[i] ?? null })
  }
  return out
})

const extraNoteCount = computed(() =>
  Math.max(0, props.habit.pegNotes.filter(n => n).length - gaugeNotes.value.length)
)

function formatTipDate(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// How many joker slots are filled in the gauge (negative habits only)
const jokerGaugeCount = computed(() =>
  Math.min(props.habit.currentCount, props.habit.jokers)
)

// Percentage fill for the joker gauge visual bar
const jokerFillPercent = computed(() =>
  props.habit.jokers > 0 ? (jokerGaugeCount.value / props.habit.jokers) * 100 : 0
)

// Overflow colors: tritonic OKLCH derived from accent for positive (bonus), red shades for
// negative (overdoing it), plain accent for neutral (just extra, second wrap slightly darker)
// Using 'initial' lets the CSS var() fallback to the OKLCH tritonic derivation for positive habits
const overflowColor = computed(() => {
  if (props.habit.overflowType === 'negative') return '#e74c3c'
  if (props.habit.overflowType === 'neutral') return 'var(--accent)'
  return 'initial'
})

const overflowColor2 = computed(() => {
  if (props.habit.overflowType === 'negative') return '#a93226'
  if (props.habit.overflowType === 'neutral') return 'oklch(from var(--accent) calc(L - 0.15) C H)'
  return 'initial'
})

// Overflow: pegs past the pegboard capacity
const overflowCount = computed(() =>
  props.habit.type === 'negative'
    ? Math.max(0, props.habit.currentCount - props.habit.jokers - totalHoles.value)
    : Math.max(0, props.habit.currentCount - positiveJokerStart.value)
)

// Displayed count in gauge mode: while jokers absorb overflow, cap at goal
// Once jokers are full, extra past jokers counts toward the total again
const gaugeDisplayCount = computed(() => {
  if (props.habit.jokers <= 0) return props.habit.currentCount
  const overflow = props.habit.currentCount - props.habit.goal
  if (overflow <= 0) return props.habit.currentCount
  const pastJokers = overflow - props.habit.jokers
  return pastJokers > 0 ? props.habit.goal + pastJokers : props.habit.goal
})

// Gauge fill percentage (gauge mode)
const gaugeFillPercent = computed(() =>
  props.habit.goal > 0 ? Math.min(100, (props.habit.currentCount / props.habit.goal) * 100) : 0
)

// How many joker slots are filled from overflow (gauge mode)
// Overflow first fills the joker before spilling into the second-color gauge fill
const gaugeJokerCount = computed(() =>
  props.habit.jokers > 0 && props.habit.currentCount > props.habit.goal
    ? Math.min(props.habit.currentCount - props.habit.goal, props.habit.jokers)
    : 0
)

// Percentage fill for the joker gauge visual (gauge mode)
const gaugeJokerFillPercent = computed(() =>
  props.habit.jokers > 0 ? (gaugeJokerCount.value / props.habit.jokers) * 100 : 0
)

// Overflow fill: when currentCount exceeds goal + jokers, a second bar fills on top
// Jokers absorb the first `jokers` worth of overflow before the gauge overflow shows
const overflowFillPercent = computed(() =>
  props.habit.goal > 0 && props.habit.currentCount > props.habit.goal + props.habit.jokers
    ? Math.min(100, ((props.habit.currentCount - props.habit.goal - props.habit.jokers) / props.habit.goal) * 100)
    : 0
)

// Second overflow fill: when currentCount exceeds 2x goal + jokers, a third bar fills on top
const overflowFillPercent2 = computed(() =>
  props.habit.goal > 0 && props.habit.currentCount > 2 * props.habit.goal + props.habit.jokers
    ? Math.min(100, ((props.habit.currentCount - 2 * props.habit.goal - props.habit.jokers) / props.habit.goal) * 100)
    : 0
)
</script>

<style scoped>
.habit-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  --accent: #4ECDC4;
}

.habit-row--reversed {
  flex-direction: row-reverse;
}

.habit-label {
  flex-shrink: 0;
  align-self: stretch;
  width: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.habit-label-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-bottom: 4px;
  margin-bottom: -4px;
}

.habit-label:hover .habit-label-text {
  color: var(--accent);
  text-shadow: 0 0 8px color-mix(in srgb, var(--accent) 50%, transparent);
  overflow: visible;
}

.is-cheating {
  color: #e74c3c !important;
}

.cheat-indicator {
  color: #e74c3c;
  font-weight: 900;
  font-size: 14px;
}

.complete-indicator {
  color: var(--accent);
  flex-shrink: 0;
}

.holes-container {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  min-height: 42px;
}

.gauge-container {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  min-height: 42px;
}

.gauge-bar {
  flex: 1;
  height: 12px;
  border-radius: 6px;
  background: var(--neu-bg);
  box-shadow: inset 1px 1px 3px var(--neu-shadow-dark),
              inset -1px -1px 3px var(--neu-shadow-light);
  overflow: hidden;
  position: relative;
}

.gauge-fill {
  position: absolute;
  inset: 0;
  width: var(--gauge-fill, 0%);
  background: var(--accent);
  border-radius: 6px;
  opacity: 0.7;
  transition: width var(--anim-normal) var(--ease-smooth);
}

.gauge-fill-overflow {
  position: absolute;
  inset: 0;
  width: var(--gauge-overflow, 0%);
  background: var(--overflow-color, oklch(from var(--accent, #4ECDC4) L C calc(H + 120)));
  border-radius: 6px;
  opacity: 0.7;
  transition: width var(--anim-normal) var(--ease-smooth);
}

.gauge-fill-overflow-2 {
  position: absolute;
  inset: 0;
  width: var(--gauge-overflow-2, 0%);
  background: var(--overflow-color-2, oklch(from var(--accent, #4ECDC4) L C calc(H + 240)));
  border-radius: 6px;
  opacity: 0.7;
  transition: width var(--anim-normal) var(--ease-smooth);
}

.holes-scroll {
  display: flex;
  align-items: center;
  gap: var(--peg-gap);
  overflow-x: auto;
  flex: 1;
}

.overflow-count {
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 700;
  color: var(--overflow-color, oklch(from var(--accent, #4ECDC4) calc(L - 0.2) C calc(H + 120)));
  white-space: nowrap;
}

.counter-stack {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
  width: 50px;
}

.counter-badge {
  font-size: 10px;
  color: var(--neu-text-light);
  padding: 1px 6px;
  border-radius: var(--neu-radius-xs);
  background: var(--neu-bg);
  box-shadow: inset 1px 1px 2px var(--neu-shadow-dark),
              inset -1px -1px 2px var(--neu-shadow-light);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-height: 18px;
  white-space: nowrap;
}

.counter-badge-stacked {
  flex-direction: column;
  gap: 0;
  padding: 2px 6px;
}

.counter-current,
.counter-goal {
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1.1;
}

.counter-separator {
  width: 80%;
  height: 1px;
  background: var(--neu-shadow-dark);
  opacity: 0.5;
  margin: 1px 0;
}

.joker-badge,
.joker-gauge {
  font-size: 10px;
  font-weight: 700;
  color: var(--accent);
  padding: 1px 6px;
  border-radius: var(--neu-radius-xs);
  background: var(--neu-bg);
  box-shadow: inset 1px 1px 2px var(--neu-shadow-dark),
              inset -1px -1px 2px var(--neu-shadow-light);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-height: 18px;
  white-space: nowrap;
}

.joker-gauge {
  color: var(--neu-text-light);
  position: relative;
  overflow: hidden;
}

.joker-gauge::before {
  content: '';
  position: absolute;
  inset: 0;
  width: var(--joker-fill, 0%);
  background: var(--accent);
  opacity: 0.25;
  transition: width var(--anim-fast) var(--ease-smooth);
}

/* Gauge hover balloon listing justifications (teleported to body, anchored to
   the gauge bar via CSS anchor positioning). Hidden entirely when anchor
   positioning isn't supported. */
.gauge-tip,
.gauge-tip-arrow {
  display: none;
}

@supports (anchor-name: --a) {
  .gauge-tip {
    display: flex;
    flex-direction: column;
    gap: 6px;
    position: fixed;
    /* position-anchor comes from the inline style binding */
    position-area: top;
    align-self: end;
    justify-self: anchor-center;
    margin-bottom: 4px;
    position-try-fallbacks: flip-block;
    position-visibility: anchors-visible;
    padding: 6px 10px;
    border-radius: var(--neu-radius-xs);
    background: var(--neu-bg);
    color: var(--neu-text);
    font-size: 11px;
    max-width: 220px;
    box-shadow: inset 1px 1px 1px rgba(255, 255, 255, 0.7),
                3px 3px 6px var(--neu-shadow-dark),
                -3px -3px 6px var(--neu-shadow-light);
    pointer-events: none;
    z-index: 1000;
    animation: gauge-tip-in var(--anim-fast) var(--ease-smooth);
  }

  .gauge-tip-arrow {
    display: block;
    position: fixed;
    position-area: top;
    align-self: end;
    justify-self: anchor-center;
    position-try-fallbacks: flip-block;
    position-visibility: anchors-visible;
    width: 8px;
    height: 8px;
    transform: rotate(45deg);
    background: var(--neu-bg);
    box-shadow: 2px 2px 3px var(--neu-shadow-dark);
    pointer-events: none;
    z-index: 1001;
    animation: gauge-tip-in var(--anim-fast) var(--ease-smooth);
  }
}

.gauge-tip-entry {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.gauge-tip-note {
  font-weight: 600;
  white-space: normal;
  overflow-wrap: break-word;
}

.gauge-tip-date,
.gauge-tip-more {
  font-weight: 400;
  font-size: 10px;
  color: var(--neu-text-light);
}

@keyframes gauge-tip-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

</style>
