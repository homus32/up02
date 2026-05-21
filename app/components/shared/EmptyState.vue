<script setup lang="ts">
defineProps<{
  icon?: string
  title: string
  message: string
  actionLabel?: string
}>()

defineEmits<{
  action: []
}>()
</script>

<template>
  <div class="empty-state">
    <i :class="icon" class="empty-state__icon" />
    <h2 class="empty-state__title">{{ title }}</h2>
    <p class="empty-state__message">{{ message }}</p>
    <Button
      v-if="actionLabel"
      :label="actionLabel"
      @click="$emit('action')"
    />
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-12, 3rem) var(--space-6, 1.5rem);
  text-align: center;
}

.empty-state__icon {
  font-size: 3rem;
  color: var(--text-secondary, #9898b8);
  margin-bottom: var(--space-4, 1rem);
}

.empty-state__title {
  font-size: var(--text-xl, 1.25rem);
  font-weight: 700;
  margin: 0 0 var(--space-2, 0.5rem);
  color: var(--text-primary, #e8e8f0);
}

.empty-state__message {
  font-size: var(--text-sm, 0.875rem);
  color: var(--text-secondary, #9898b8);
  margin: 0 0 var(--space-6, 1.5rem);
  max-width: 400px;
  line-height: 1.5;
}
</style>
