<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHelpStore } from '@/stores/help'

const { t } = useI18n()
const helpStore = useHelpStore()

const DISCORD_INVITE_URL = 'https://discord.gg/2jFAj5hYnz'

const highlightRect = ref({ top: 0, left: 0, width: 0, height: 0 })
const popoverStyle = ref({})
const visible = ref(false)
const popoverRef = ref(null)

const tour = computed(() => helpStore.activeTour)
const step = computed(() => helpStore.activeTourCurrentStep)
const stepIndex = computed(() => helpStore.activeTourStep)
const totalSteps = computed(() => tour.value?.steps.length ?? 0)
const isLastStep = computed(() => stepIndex.value >= totalSteps.value - 1)
const isSplashStep = computed(() => step.value?.variant === 'splash')

async function positionHighlight() {
  if (!step.value) {
    visible.value = false
    return
  }

  visible.value = true

  const el = step.value.variant === 'splash' ? null : document.querySelector(step.value.targetSelector)

  if (!el) {
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

  // Measure the popover so its placement can be clamped to the viewport.
  // Width/height are independent of the (possibly stale) position, so the
  // measurement is valid even before the final coordinates are applied.
  await nextTick()
  const popEl = popoverRef.value
  const popWidth = popEl?.offsetWidth ?? 340
  const popHeight = popEl?.offsetHeight ?? 220

  const gap = 16
  const margin = 12
  const vw = window.innerWidth
  const vh = window.innerHeight
  const placement = step.value.placement

  let left
  let top

  if (placement === 'top') {
    top = rect.top - gap - popHeight
    left = rect.left + rect.width / 2 - popWidth / 2
  } else if (placement === 'left') {
    left = rect.left - gap - popWidth
    top = rect.top + rect.height / 2 - popHeight / 2
  } else if (placement === 'right') {
    left = rect.right + gap
    top = rect.top + rect.height / 2 - popHeight / 2
  } else {
    // default: bottom
    top = rect.bottom + gap
    left = rect.left + rect.width / 2 - popWidth / 2
  }

  // Keep the popover fully inside the viewport.
  left = Math.max(margin, Math.min(left, vw - popWidth - margin))
  top = Math.max(margin, Math.min(top, vh - popHeight - margin))

  popoverStyle.value = { top: `${top}px`, left: `${left}px` }
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
      <div
        ref="popoverRef"
        class="tour-popover"
        :class="{ 'tour-popover-splash': isSplashStep }"
        :style="popoverStyle"
      >
        <img
          v-if="isSplashStep"
          class="tour-splash"
          src="/woped-splash.jpg"
          alt="WoPeD"
        />
        <div class="tour-popover-header">
          <h4>{{ step ? $t(step.titleKey) : '' }}</h4>
          <span class="tour-step-count">
            {{ $t('help.tourStep', { current: stepIndex + 1, total: totalSteps }) }}
          </span>
        </div>
        <p class="tour-popover-content">{{ step ? $t(step.contentKey) : '' }}</p>
        <div v-if="isSplashStep" class="tour-discord">
          <p class="tour-discord-text">{{ $t('help.welcomeDiscordHint') }}</p>
          <a
            class="tour-discord-link"
            :href="DISCORD_INVITE_URL"
            target="_blank"
            rel="noopener noreferrer"
            :title="t('toolbar.discord')"
          >
            <svg class="tour-discord-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"
              />
            </svg>
            {{ $t('toolbar.discord') }}
          </a>
        </div>
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
  max-width: calc(100vw - 32px);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
  padding: 20px;
  pointer-events: auto;
  z-index: 2001;
  transition: all 0.3s ease;
}

.tour-popover-splash {
  width: min(420px, calc(100vw - 32px));
  padding: 24px;
}

.tour-splash {
  display: block;
  width: 100%;
  height: auto;
  margin-bottom: 16px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.tour-discord {
  margin: 0 0 16px;
  padding: 12px 14px;
  border-radius: 8px;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
}

.tour-discord-text {
  margin: 0 0 10px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--color-text-secondary);
}

.tour-discord-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 8px;
  background: #5865f2;
  color: #ffffff;
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.15s ease;
}

.tour-discord-link:hover {
  background: #4752c4;
}

.tour-discord-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
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
