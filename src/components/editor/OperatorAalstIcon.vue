<script setup>
import { computed } from 'vue'
import { getOperatorGlyphs, chevronGeometry } from '@/utils/operatorGlyph'

const props = defineProps({
  type: {
    type: String,
    required: true,
  },
})

const W = 22
const H = 16
const BORDER = 1
const box = { width: W, height: H, border: BORDER }

// Default left-to-right flow: inputs enter from the west, outputs leave to the east.
const orientation = { joinPosition: 'west', splitPosition: 'east' }

const glyphs = computed(() =>
  getOperatorGlyphs(props.type, orientation).map((g) =>
    chevronGeometry(box, g.position, g.direction)
  )
)

const polygonPoints = (poly) => {
  const pts = []
  for (let i = 0; i < poly.length; i += 2) {
    pts.push(`${poly[i]},${poly[i + 1]}`)
  }
  return pts.join(' ')
}
</script>

<template>
  <svg
    class="op-aalst-icon"
    :viewBox="`0 0 ${W} ${H}`"
    :width="W"
    :height="H"
    aria-hidden="true"
  >
    <rect
      x="0.5"
      y="0.5"
      :width="W - 1"
      :height="H - 1"
      fill="none"
      stroke="currentColor"
      stroke-width="1"
    />
    <template v-for="(geo, i) in glyphs" :key="i">
      <polygon
        :points="polygonPoints(geo.polygon)"
        fill="currentColor"
        fill-opacity="0.15"
        stroke="currentColor"
        stroke-width="1"
        stroke-linejoin="round"
      />
      <line
        v-if="geo.line"
        :x1="geo.line[0]"
        :y1="geo.line[1]"
        :x2="geo.line[2]"
        :y2="geo.line[3]"
        stroke="currentColor"
        stroke-width="1"
      />
    </template>
  </svg>
</template>

<style scoped>
.op-aalst-icon {
  display: block;
}
</style>
