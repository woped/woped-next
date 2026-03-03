<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { usePetriNetStore } from '@/stores/petriNet'

const { t } = useI18n()
const store = usePetriNetStore()
const { breadcrumb, nets, activeNetId } = storeToRefs(store)

const currentNet = computed(() => nets.value[activeNetId.value])

const breadcrumbItems = computed(() =>
  breadcrumb.value.map((netId) => ({
    id: netId,
    name: nets.value[netId]?.name || netId,
    isCurrent: netId === activeNetId.value,
  }))
)

const isInSubprocess = computed(() => breadcrumb.value.length > 1)

const navigateTo = (netId) => {
  const idx = breadcrumb.value.indexOf(netId)
  if (idx >= 0 && idx < breadcrumb.value.length - 1) {
    for (let i = breadcrumb.value.length - 1; i > idx; i--) {
      store.goBack()
    }
  }
}
</script>

<template>
  <div v-if="isInSubprocess" class="subprocess-view">
    <div class="sv-header">
      <span class="sv-title">{{ $t('subprocess.title') }}</span>
      <span class="sv-depth">{{ breadcrumb.length - 1 }}</span>
    </div>
    <nav class="sv-breadcrumb">
      <span
        v-for="(item, idx) in breadcrumbItems"
        :key="item.id"
        :class="['sv-crumb', { active: item.isCurrent }]"
        @click="navigateTo(item.id)"
      >
        <span v-if="idx > 0" class="sv-sep">/</span>
        {{ item.name }}
      </span>
    </nav>
    <div class="sv-info">
      <span>{{ currentNet?.places?.length || 0 }} {{ $t('properties.places') }}</span>
      <span>{{ currentNet?.transitions?.length || 0 }} {{ $t('properties.transitions') }}</span>
      <span>{{ currentNet?.arcs?.length || 0 }} {{ $t('properties.arcs') }}</span>
    </div>
    <button class="sv-back-btn" @click="store.goBack()">
      ↩ {{ $t('subprocess.goBack') }}
    </button>
  </div>
</template>

<style scoped>
.subprocess-view {
  padding: 10px 12px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 12px;
}

.sv-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.sv-title {
  font-weight: 600;
  color: var(--color-text);
}

.sv-depth {
  background: var(--color-primary);
  color: #fff;
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 8px;
}

.sv-breadcrumb {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  margin-bottom: 8px;
}

.sv-crumb {
  color: var(--color-primary);
  cursor: pointer;
  font-size: 11px;
}

.sv-crumb:hover {
  text-decoration: underline;
}

.sv-crumb.active {
  color: var(--color-text);
  font-weight: 600;
  cursor: default;
}

.sv-crumb.active:hover {
  text-decoration: none;
}

.sv-sep {
  margin: 0 2px;
  color: var(--color-text-muted);
}

.sv-info {
  display: flex;
  gap: 12px;
  color: var(--color-text-muted);
  font-size: 11px;
  margin-bottom: 8px;
}

.sv-back-btn {
  width: 100%;
  padding: 6px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
}

.sv-back-btn:hover {
  opacity: 0.9;
}
</style>
