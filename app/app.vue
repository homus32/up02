<script setup lang="ts">
onMounted(() => {
  document.documentElement.classList.add('dark-mode')
})
</script>

<template>
  <div class="layout">
    <Header />
    <main class="main">
      <NuxtPage />
    </main>
    <Footer />
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main {
  flex: 1;
}
</style>
