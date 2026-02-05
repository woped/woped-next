<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useTokenGameStore } from '@/stores/tokenGame'
import { VISUAL } from '@/types/petri-net'

// Get token game store
const tokenGameStore = useTokenGameStore()
const { activeAnimations } = storeToRefs(tokenGameStore)

// Interpolate between two values with easing already applied
const interpolate = (from, to, progress) => from + (to - from) * progress

// Animation circle config
const animationConfigs = computed(() => {
  return activeAnimations.value.map((anim) => ({
    id: anim.id,
    x: interpolate(anim.startPos.x, anim.endPos.x, anim.progress),
    y: interpolate(anim.startPos.y, anim.endPos.y, anim.progress),
    radius: VISUAL.place.tokenRadius + 1,
    fill: '#ef4444', // Red color for animated tokens
    shadowColor: '#ef4444',
    shadowBlur: 5,
    shadowOpacity: 0.5,
  }))
})
</script>

<template>
  <v-group>
    <v-circle
      v-for="config in animationConfigs"
      :key="config.id"
      :config="config"
    />
  </v-group>
</template>
