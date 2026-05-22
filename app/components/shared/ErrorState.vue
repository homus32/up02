<script setup lang="ts">
defineProps<{
  title?: string
  message: string
  actionLabel?: string
}>()

defineEmits<{
  action: []
}>()
</script>

<template>
  <div class="error-state">
    <i class="pi pi-exclamation-triangle error-state__icon" />
    <h2 class="error-state__title">{{ title }}</h2>
    <p class="error-state__message">{{ message }}</p>
    <PButton
      v-if="actionLabel"
      :label="actionLabel"
      icon="pi pi-refresh"
      @click="$emit('action')"
    />
  </div>
</template>

<style scoped>
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-12, 3rem) var(--space-6, 1.5rem);
  text-align: center;
}

.error-state__icon {
  font-size: 3rem;
  color: var(--p-red-400, #f87171);
  margin-bottom: var(--space-4, 1rem);
}

.error-state__title {
  font-size: var(--text-xl, 1.25rem);
  font-weight: 700;
  margin: 0 0 var(--space-2, 0.5rem);
  color: var(--text-primary, #e8e8f0);
}

.error-state__message {
  font-size: var(--text-sm, 0.875rem);
  color: var(--text-secondary, #9898b8);
  margin: 0 0 var(--space-6, 1.5rem);
  max-width: 400px;
  line-height: 1.5;
}
</style>
