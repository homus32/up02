<template>
  <footer class="footer">
    <div class="footer__inner container">
      <p class="footer__text">
        AnimeBaza — учебный проект УП.02
      </p>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  border-top: 1px solid var(--border-color);
  padding: var(--space-6) 0;
  margin-top: auto;
}

.footer__inner {
  display: flex;
  justify-content: center;
}

.footer__text {
  color: var(--text-muted);
  font-size: var(--text-sm);
}
</style>
