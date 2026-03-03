<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { usePetriNetStore } from '@/stores/petriNet'

const props = defineProps({
  subprocessId: {
    type: String,
    required: true,
  },
  width: {
    type: Number,
    default: 200,
  },
  height: {
    type: Number,
    default: 120,
  },
})

const store = usePetriNetStore()
const { nets } = storeToRefs(store)

// Get the subprocess net data
const subNet = computed(() => {
  if (!props.subprocessId) return null
  return nets.value[props.subprocessId] || null
})

// Calculate bounds of all elements
const bounds = computed(() => {
  const net = subNet.value
  if (!net) return { minX: 0, minY: 0, maxX: 100, maxY: 100, width: 100, height: 100 }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  const padding = 20

  // Process all elements
  const elements = [
    ...net.places,
    ...net.transitions,
    ...net.operators,
    ...(net.subProcesses || []),
  ]

  if (elements.length === 0) {
    return { minX: 0, minY: 0, maxX: 100, maxY: 100, width: 100, height: 100 }
  }

  for (const el of elements) {
    minX = Math.min(minX, el.position.x - padding)
    minY = Math.min(minY, el.position.y - padding)
    maxX = Math.max(maxX, el.position.x + padding)
    maxY = Math.max(maxY, el.position.y + padding)
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  }
})

// Calculate scale to fit elements
const scale = computed(() => {
  const b = bounds.value
  const scaleX = props.width / b.width
  const scaleY = props.height / b.height
  return Math.min(scaleX, scaleY, 1)
})

// Transform element position to preview coordinates
const transformPos = (x, y) => {
  const b = bounds.value
  const s = scale.value
  const offsetX = (props.width - b.width * s) / 2
  const offsetY = (props.height - b.height * s) / 2
  return {
    x: (x - b.minX) * s + offsetX,
    y: (y - b.minY) * s + offsetY,
  }
}

// Element sizes in preview
const placeRadius = computed(() => Math.max(8, 15 * scale.value))
const transitionSize = computed(() => Math.max(12, 25 * scale.value))
const subprocessSize = computed(() => Math.max(14, 28 * scale.value))
</script>

<template>
  <div class="subprocess-preview">
    <svg :width="width" :height="height" class="preview-canvas">
      <!-- Background -->
      <rect
        x="0"
        y="0"
        :width="width"
        :height="height"
        class="preview-bg"
      />
      
      <g v-if="subNet">
        <!-- Arcs -->
        <line
          v-for="arc in subNet.arcs"
          :key="arc.id"
          :x1="transformPos(
            subNet.places.find(p => p.id === arc.sourceId)?.position.x ||
            subNet.transitions.find(t => t.id === arc.sourceId)?.position.x ||
            subNet.operators.find(o => o.id === arc.sourceId)?.position.x ||
            (subNet.subProcesses || []).find(s => s.id === arc.sourceId)?.position.x || 0,
            0
          ).x"
          :y1="transformPos(
            0,
            subNet.places.find(p => p.id === arc.sourceId)?.position.y ||
            subNet.transitions.find(t => t.id === arc.sourceId)?.position.y ||
            subNet.operators.find(o => o.id === arc.sourceId)?.position.y ||
            (subNet.subProcesses || []).find(s => s.id === arc.sourceId)?.position.y || 0
          ).y"
          :x2="transformPos(
            subNet.places.find(p => p.id === arc.targetId)?.position.x ||
            subNet.transitions.find(t => t.id === arc.targetId)?.position.x ||
            subNet.operators.find(o => o.id === arc.targetId)?.position.x ||
            (subNet.subProcesses || []).find(s => s.id === arc.targetId)?.position.x || 0,
            0
          ).x"
          :y2="transformPos(
            0,
            subNet.places.find(p => p.id === arc.targetId)?.position.y ||
            subNet.transitions.find(t => t.id === arc.targetId)?.position.y ||
            subNet.operators.find(o => o.id === arc.targetId)?.position.y ||
            (subNet.subProcesses || []).find(s => s.id === arc.targetId)?.position.y || 0
          ).y"
          class="preview-arc"
        />

        <!-- Places -->
        <circle
          v-for="place in subNet.places"
          :key="place.id"
          :cx="transformPos(place.position.x, 0).x"
          :cy="transformPos(0, place.position.y).y"
          :r="placeRadius"
          class="preview-place"
        />

        <!-- Transitions -->
        <rect
          v-for="transition in subNet.transitions"
          :key="transition.id"
          :x="transformPos(transition.position.x, 0).x - transitionSize / 2"
          :y="transformPos(0, transition.position.y).y - transitionSize / 2"
          :width="transitionSize"
          :height="transitionSize"
          class="preview-transition"
        />

        <!-- Operators -->
        <g
          v-for="operator in subNet.operators"
          :key="operator.id"
        >
          <polygon
            :points="`
              ${transformPos(operator.position.x, 0).x},${transformPos(0, operator.position.y).y - transitionSize / 2}
              ${transformPos(operator.position.x, 0).x + transitionSize / 2},${transformPos(0, operator.position.y).y}
              ${transformPos(operator.position.x, 0).x},${transformPos(0, operator.position.y).y + transitionSize / 2}
              ${transformPos(operator.position.x, 0).x - transitionSize / 2},${transformPos(0, operator.position.y).y}
            `"
            class="preview-operator"
          />
        </g>

        <!-- Subprocesses -->
        <g
          v-for="subprocess in (subNet.subProcesses || [])"
          :key="subprocess.id"
        >
          <rect
            :x="transformPos(subprocess.position.x, 0).x - subprocessSize / 2"
            :y="transformPos(0, subprocess.position.y).y - subprocessSize / 2"
            :width="subprocessSize"
            :height="subprocessSize"
            class="preview-subprocess"
          />
          <rect
            :x="transformPos(subprocess.position.x, 0).x - subprocessSize / 3"
            :y="transformPos(0, subprocess.position.y).y - subprocessSize / 3"
            :width="subprocessSize * 0.4"
            :height="subprocessSize * 0.4"
            class="preview-subprocess-inner"
          />
        </g>
      </g>

      <!-- Empty state -->
      <g v-if="!subNet || (subNet.places.length === 0 && subNet.transitions.length === 0)">
        <text
          :x="width / 2"
          :y="height / 2"
          text-anchor="middle"
          class="preview-empty"
        >
          {{ $t('subprocess.empty') }}
        </text>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.subprocess-preview {
  border: 1px solid var(--color-border);
  border-radius: 6px;
  overflow: hidden;
  background: var(--color-bg);
}

.preview-canvas {
  display: block;
}

.preview-bg {
  fill: var(--color-bg);
}

.preview-arc {
  stroke: var(--color-text-muted);
  stroke-width: 1;
}

.preview-place {
  fill: white;
  stroke: var(--color-text);
  stroke-width: 1.5;
}

.preview-transition {
  fill: var(--color-text);
  stroke: var(--color-text);
  stroke-width: 1;
}

.preview-operator {
  fill: #f97316;
  stroke: #ea580c;
  stroke-width: 1;
}

.preview-subprocess {
  fill: #3b82f6;
  stroke: #2563eb;
  stroke-width: 1;
}

.preview-subprocess-inner {
  fill: white;
  stroke: none;
}

.preview-empty {
  fill: var(--color-text-muted);
  font-size: 11px;
}

:global(.dark) .preview-place {
  fill: var(--color-bg-secondary);
}

:global(.dark) .preview-subprocess-inner {
  fill: var(--color-bg-secondary);
}
</style>
