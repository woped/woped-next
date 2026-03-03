<script setup>
import { useI18n } from 'vue-i18n'
import MetricsSection from './MetricsSection.vue'

const { t } = useI18n()
</script>

<template>
  <div class="metrics-sidebar">
    <div class="ms-header">
      <h3>{{ $t('metrics.title') }}</h3>
    </div>
    <div class="ms-content">
      <MetricsSection />
    </div>
  </div>
</template>

<style scoped>
.metrics-sidebar {
  width: 280px;
  background: var(--color-bg-secondary);
  border-left: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ms-header {
  padding: 16px;
  border-bottom: 1px solid var(--color-border);
}

.ms-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}

.ms-content {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
}
</style>
