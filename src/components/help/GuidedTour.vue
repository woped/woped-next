<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHelpStore } from '@/stores/help'

const { t } = useI18n()
const helpStore = useHelpStore()

const highlightRect = ref({ top: 0, left: 0, width: 0, height: 0 })
const popoverStyle = ref({})
const visible = ref(false)

const tour = computed(() => helpStore.activeTour)
const step = computed(() => helpStore.activeTourCurrentStep)
const stepIndex = computed(() => helpStore.activeTourStep)
const totalSteps = computed(() => tour.value?.steps.length ?? 0)
const isLastStep = computed(() => stepIndex.value >= totalSteps.value - 1)
const isWelcomeStart = computed(() => tour.value?.id === 'welcome' && stepIndex.value === 0)

function positionHighlight() {
  if (!step.value) {
    visible.value = false
    return
  }

  const el = document.querySelector(step.value.targetSelector)
  if (!el) {
    visible.value = true
    highlightRect.value = { top: 0, left: 0, width: 0, height: 0 }
    popoverStyle.value = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
    return
  }

  const rect = el.getBoundingClientRect()
  const pad = step.value.highlightPadding ?? 8

  highlightRect.value = {
    top: rect.top - pad,
    left: rect.left - pad,
    width: rect.width + pad * 2,
    height: rect.height + pad * 2,
  }

  const popover = {}
  const gap = 16
  const placement = step.value.placement

  if (placement === 'bottom') {
    popover.top = `${rect.bottom + gap}px`
    popover.left = `${rect.left + rect.width / 2}px`
    popover.transform = 'translateX(-50%)'
  } else if (placement === 'top') {
    popover.bottom = `${window.innerHeight - rect.top + gap}px`
    popover.left = `${rect.left + rect.width / 2}px`
    popover.transform = 'translateX(-50%)'
  } else if (placement === 'left') {
    popover.top = `${rect.top + rect.height / 2}px`
    popover.right = `${window.innerWidth - rect.left + gap}px`
    popover.transform = 'translateY(-50%)'
  } else if (placement === 'right') {
    popover.top = `${rect.top + rect.height / 2}px`
    popover.left = `${rect.right + gap}px`
    popover.transform = 'translateY(-50%)'
  }

  popoverStyle.value = popover
  visible.value = true
}

function handleNext() {
  helpStore.nextTourStep()
}

function handlePrev() {
  helpStore.prevTourStep()
}

function handleSkip() {
  helpStore.endTour()
}

function handleKeydown(e) {
  if (!helpStore.isTourActive) return
  if (e.key === 'Escape') {
    handleSkip()
  } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
    handleNext()
  } else if (e.key === 'ArrowLeft') {
    handlePrev()
  }
}

watch(
  [() => helpStore.activeTourId, () => helpStore.activeTourStep],
  async () => {
    await nextTick()
    positionHighlight()
  }
)

let resizeObserver = null

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('resize', positionHighlight)
  resizeObserver = new ResizeObserver(positionHighlight)
  resizeObserver.observe(document.body)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('resize', positionHighlight)
  resizeObserver?.disconnect()
})
</script>

<template>
  <Teleport to="body">
    <div v-if="helpStore.isTourActive && visible" class="tour-overlay">
      <!-- SVG mask to darken everything except target -->
      <svg class="tour-mask" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <mask id="tour-spotlight">
            <rect width="100%" height="100%" fill="white" />
            <rect
              :x="highlightRect.left"
              :y="highlightRect.top"
              :width="highlightRect.width"
              :height="highlightRect.height"
              rx="8"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          width="100%" height="100%"
          fill="rgba(0,0,0,0.55)"
          mask="url(#tour-spotlight)"
        />
      </svg>

      <!-- Highlight border -->
      <div
        v-if="highlightRect.width > 0"
        class="tour-highlight"
        :style="{
          top: highlightRect.top + 'px',
          left: highlightRect.left + 'px',
          width: highlightRect.width + 'px',
          height: highlightRect.height + 'px',
        }"
      ></div>

      <!-- Popover -->
      <div class="tour-popover" :style="popoverStyle">
        <img
          v-if="isWelcomeStart"
          class="tour-logo"
          src="/woped-logo.svg"
          alt="WoPeD"
        />
        <div class="tour-popover-header">
          <h4>{{ step ? $t(step.titleKey) : '' }}</h4>
          <span class="tour-step-count">
            {{ $t('help.tourStep', { current: stepIndex + 1, total: totalSteps }) }}
          </span>
        </div>
        <p class="tour-popover-content">{{ step ? $t(step.contentKey) : '' }}</p>
        <div class="tour-popover-footer">
          <button class="tour-skip-btn" @click="handleSkip">
            {{ $t('help.tourSkip') }}
          </button>
          <div class="tour-nav-btns">
            <button
              v-if="stepIndex > 0"
              class="tour-prev-btn"
              @click="handlePrev"
            >
              {{ $t('help.tourPrev') }}
            </button>
            <button
              class="tour-next-btn"
              @click="handleNext"
            >
              {{ isLastStep ? $t('help.tourFinish') : $t('help.tourNext') }}
            </button>
          </div>
        </div>

        <!-- Progress dots -->
        <div class="tour-progress">
          <span
            v-for="(_, i) in totalSteps"
            :key="i"
            :class="['progress-dot', { active: i === stepIndex, completed: i < stepIndex }]"
          ></span>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.tour-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  pointer-events: none;
}

.tour-mask {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: auto;
}

.tour-highlight {
  position: absolute;
  border: 2px solid var(--color-primary);
  border-radius: 8px;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.25);
  pointer-events: none;
  transition: all 0.3s ease;
}

.tour-popover {
  position: fixed;
  width: 340px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
  padding: 20px;
  pointer-events: auto;
  z-index: 2001;
  transition: all 0.3s ease;
}

.tour-logo {
  display: block;
  height: 40px;
  width: auto;
  margin: 0 auto 14px;
  border-radius: 6px;
}

.tour-popover-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.tour-popover-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
}

.tour-step-count {
  font-size: 12px;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.tour-popover-content {
  margin: 0 0 16px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--color-text-secondary);
}

.tour-popover-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tour-skip-btn {
  padding: 6px 12px;
  border: none;
  background: none;
  color: var(--color-text-muted);
  font-size: 13px;
  cursor: pointer;
  border-radius: 6px;
}

.tour-skip-btn:hover {
  color: var(--color-text);
  background: var(--color-bg-tertiary);
}

.tour-nav-btns {
  display: flex;
  gap: 8px;
}

.tour-prev-btn {
  padding: 8px 16px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
  color: var(--color-text);
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.tour-prev-btn:hover {
  background: var(--color-bg-tertiary);
}

.tour-next-btn {
  padding: 8px 20px;
  border: none;
  background: var(--color-primary);
  color: #ffffff;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.tour-next-btn:hover {
  background: var(--color-primary-hover);
}

/* Progress dots */
.tour-progress {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 14px;
}

.progress-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-border);
  transition: all 0.2s;
}

.progress-dot.active {
  background: var(--color-primary);
  width: 18px;
  border-radius: 3px;
}

.progress-dot.completed {
  background: var(--color-primary);
  opacity: 0.5;
}
</style>
