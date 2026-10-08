<template>
  <div class="peg-bucket-wrap" :style="{ '--accent': accentColor }">
    <div ref="overlayRef" class="physics-overlay">
      <div
        v-for="id in pegIds"
        :key="id"
        :ref="(el) => setPegEl(id, el as Element | null)"
        class="bucket-peg"
      />
    </div>
    <div ref="bucketRef" class="peg-bucket"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import Matter from 'matter-js'

const PEG_RADIUS = 5
const OVERLAY_WIDTH = 60
const DROP_ZONE = 50 // px above the bucket where pegs spawn
const MAX_PREFILL = 6
const PREFILL_DELAY_MS = 150 // delay between each prefilled peg drop

const props = withDefaults(defineProps<{
  overflowCount: number
  accentColor?: string
  fullPrefill?: boolean
}>(), {
  accentColor: '#4ECDC4',
  fullPrefill: false,
})

const overlayRef = ref<HTMLElement | null>(null)
const bucketRef = ref<HTMLElement | null>(null)
const pegIds = ref<number[]>([])

let engine: Matter.Engine | null = null
const bodies = new Map<number, Matter.Body>()
const pegEls = new Map<number, HTMLElement>()
// True number of pegs synced with overflowCount (incl. pegs that spilled away)
let accounted = 0
let pegId = 0
let rafId = 0
let lastTime = 0
let killY = 0
let worldReady = false
let resizeObserver: ResizeObserver | null = null
let scrollAncestor: HTMLElement | null = null
// Bucket geometry in overlay-local coordinates
let bucketX = 0
let bucketY = 0
let bucketW = 26

function rand(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function setPegEl(id: number, el: Element | null) {
  if (el) pegEls.set(id, el as HTMLElement)
  else pegEls.delete(id)
}

function resizeOverlay() {
  const overlay = overlayRef.value
  const bucket = bucketRef.value
  const wrap = overlay?.parentElement
  if (!overlay || !bucket || !wrap) return

  const wrapRect = wrap.getBoundingClientRect()
  const bucketRect = bucket.getBoundingClientRect()
  const bucketCenterX = bucketRect.left - wrapRect.left + bucketRect.width / 2
  const overlayTop = bucketRect.top - wrapRect.top - DROP_ZONE
  // Cap the overlay at the bottom of the nearest clipping ancestor (e.g. the
  // scrollable board wrapper). Otherwise its absolute height creates
  // scrollable overflow and a permanent scrollbar on that container.
  let clipBottom = window.innerHeight
  let ancestor = wrap.parentElement
  while (ancestor) {
    if (getComputedStyle(ancestor).overflowY !== 'visible') {
      clipBottom = Math.min(clipBottom, ancestor.getBoundingClientRect().bottom)
      scrollAncestor = ancestor
      break
    }
    ancestor = ancestor.parentElement
  }
  const overlayHeight = Math.max(clipBottom - (wrapRect.top + overlayTop), DROP_ZONE + bucketRect.height + 20)

  overlay.style.left = bucketCenterX - OVERLAY_WIDTH / 2 + 'px'
  overlay.style.top = overlayTop + 'px'
  overlay.style.height = overlayHeight + 'px'

  killY = overlayHeight + 30
}

function setupWorld() {
  const overlay = overlayRef.value
  const bucket = bucketRef.value
  if (!overlay || !bucket) return

  resizeOverlay()

  const bucketRect = bucket.getBoundingClientRect()
  bucketX = OVERLAY_WIDTH / 2 - bucketRect.width / 2
  bucketY = DROP_ZONE
  bucketW = bucketRect.width

  engine = Matter.Engine.create({ enableSleeping: true })

  const wallOpts: Matter.IChamferableBodyDefinition = { isStatic: true, friction: 0.05 }
  const h = bucketRect.height
  const floor = Matter.Bodies.rectangle(bucketX + bucketW / 2, bucketY + h + 3, bucketW + 8, 6, wallOpts)
  const leftWall = Matter.Bodies.rectangle(bucketX + 1, bucketY + h / 2 + 2, 2, h - 4, wallOpts)
  const rightWall = Matter.Bodies.rectangle(bucketX + bucketW - 1, bucketY + h / 2 + 2, 2, h - 4, wallOpts)
  Matter.Composite.add(engine.world, [floor, leftWall, rightWall])

}

function addPeg(x: number, y: number) {
  if (!engine) return
  const id = ++pegId
  const body = Matter.Bodies.circle(x, y, PEG_RADIUS, {
    restitution: 0.25,
    friction: 0.4,
    frictionAir: 0.01,
  })
  Matter.Body.setVelocity(body, { x: 0, y: 0 })
  Matter.Body.setAngularVelocity(body, 0)
  bodies.set(id, body)
  Matter.Composite.add(engine.world, body)
  pegIds.value.push(id)
}

function removePeg(id: number) {
  const body = bodies.get(id)
  if (body && engine) Matter.Composite.remove(engine.world, body)
  bodies.delete(id)
  pegEls.delete(id)
  pegIds.value = pegIds.value.filter(p => p !== id)
}

function spawnPeg() {
  addPeg(bucketX + bucketW / 2, bucketY - rand(15, DROP_ZONE))
}

function prefill(count: number) {
  for (let i = 0; i < count; i++) {
    setTimeout(() => spawnPeg(), i * PREFILL_DELAY_MS)
  }
}

function tick(now: number) {
  if (!engine) return
  const delta = Math.min(now - lastTime, 33)
  lastTime = now
  Matter.Engine.update(engine, delta)
  for (const [id, body] of bodies) {
    if (body.position.y > killY) {
      // Fell past the bottom of the screen
      removePeg(id)
      continue
    }
    const el = pegEls.get(id)
    if (el) {
      el.style.transform = `translate(${body.position.x - PEG_RADIUS}px, ${body.position.y - PEG_RADIUS}px) rotate(${body.angle}rad)`
    }
  }
  rafId = requestAnimationFrame(tick)
}

onMounted(() => {
  // Defer to next animation frame to ensure DOM layout is fully settled.
  // On page reload (F5), all habit rows render simultaneously and
  // getBoundingClientRect() can return stale values if called too early.
  requestAnimationFrame(() => {
    setupWorld()
    if (!engine) return
    const count = props.fullPrefill ? props.overflowCount : Math.min(props.overflowCount, MAX_PREFILL)
    prefill(count)
    accounted = props.overflowCount
    worldReady = true
    lastTime = performance.now()
    rafId = requestAnimationFrame(tick)

    // Recalculate overlay height when the scrollable ancestor resizes
    // (e.g. when the create-habit form expands/collapses and the flex
    // board-wrapper shrinks/grows). Without this, the overlay keeps its
    // original height and creates phantom scrollable overflow.
    if (scrollAncestor && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => resizeOverlay())
      resizeObserver.observe(scrollAncestor)
    }
  })
})

watch(() => props.overflowCount, (newVal) => {
  if (!worldReady) return
  const diff = newVal - accounted
  if (diff > 0) {
    for (let i = 0; i < diff; i++) {
      setTimeout(() => spawnPeg(), i * 90)
    }
  } else if (diff < 0) {
    const ids = [...bodies.keys()].slice(diff)
    ids.forEach(removePeg)
  }
  accounted = newVal
})

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId)
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  if (engine) {
    Matter.Engine.clear(engine)
    engine = null
  }
  bodies.clear()
  pegEls.clear()
})
</script>

<style scoped>
.peg-bucket-wrap {
  position: relative;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

.peg-bucket {
  position: relative;
  width: 26px;
  height: 34px;
  z-index: 1;
  border-radius: 4px 4px 10px 10px;
  background: var(--neu-bg);
  box-shadow: inset 2px 3px 5px var(--neu-shadow-dark),
              inset -2px -2px 4px var(--neu-shadow-light);
  border-top: 2px solid var(--neu-shadow-dark);
}

.physics-overlay {
  position: absolute;
  width: 60px;
  pointer-events: none;
  z-index: 20;
}

.bucket-peg {
  position: absolute;
  left: 0;
  top: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: oklch(from var(--accent, #4ECDC4) calc(L - 0.2) C H);
  box-shadow: inset -1px -1px 2px rgba(0, 0, 0, 0.25),
              1px 1px 2px var(--neu-shadow-dark);
  pointer-events: none;
  animation: peg-fade-in 0.3s ease-out forwards;
}

@keyframes peg-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

</style>
