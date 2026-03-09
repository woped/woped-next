<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHelpStore } from '@/stores/help'

const props = defineProps({
  titleKey: { type: String, required: true },
  contentKey: { type: String, required: true },
  articleId: { type: String, default: null },
  placement: { type: String, default: 'top' },
})

const { t } = useI18n()
const helpStore = useHelpStore()
const showTooltip = ref(false)
const triggerRef = ref(null)

const tooltipTitle = computed(() => t(props.titleKey))
const tooltipContent = computed(() => t(props.contentKey))

function openArticle() {
  if (props.articleId) {
    helpStore.openDialog(props.articleId)
    showTooltip.value = false
  }
}

function onMouseEnter() {
  showTooltip.value = true
}

function onMouseLeave() {
  showTooltip.value = false
}

function onClickIcon() {
  showTooltip.value = !showTooltip.value
}
</script>

<template>
  <span
    ref="triggerRef"
    class="help-tooltip-trigger"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
    @click.stop="onClickIcon"
  >
    <span class="help-icon">ⓘ</span>

    <Transition name="tooltip-fade">
      <div
        v-if="showTooltip"
        :class="['help-tooltip-popup', `placement-${placement}`]"
        @mouseenter="showTooltip = true"
        @mouseleave="showTooltip = false"
      >
        <div class="tooltip-title">{{ tooltipTitle }}</div>
        <div class="tooltip-content">{{ tooltipContent }}</div>
        <button
          v-if="articleId"
          class="tooltip-link"
          @click="openArticle"
        >
          {{ $t('help.learnMore') }} →
        </button>
      </div>
    </Transition>
  </span>
</template>

<style scoped>
.help-tooltip-trigger {
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: help;
}

.help-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  font-size: 14px;
  color: var(--color-text-muted);
  opacity: 0.7;
  transition: all 0.15s;
}

.help-icon:hover {
  opacity: 1;
  color: var(--color-primary);
}

.help-tooltip-popup {
  position: absolute;
  width: 260px;
  padding: 12px 14px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
  z-index: 500;
  pointer-events: auto;
}

.placement-top {
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
}

.placement-bottom {
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
}

.placement-left {
  right: calc(100% + 8px);
  top: 50%;
  transform: translateY(-50%);
}

.placement-right {
  left: calc(100% + 8px);
  top: 50%;
  transform: translateY(-50%);
}

.tooltip-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 6px;
}

.tooltip-content {
  font-size: 12px;
  line-height: 1.5;
  color: var(--color-text-secondary);
  margin-bottom: 4px;
}

.tooltip-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  padding: 0;
  border: none;
  background: none;
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s;
}

.tooltip-link:hover {
  opacity: 0.8;
}

/* Tooltip fade transition */
.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(4px);
}

.placement-bottom .tooltip-fade-enter-from,
.placement-bottom .tooltip-fade-leave-to {
  transform: translateX(-50%) translateY(-4px);
}
</style>
