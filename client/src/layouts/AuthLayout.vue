<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <main class="auth-layout">
    <RouterLink class="auth-brand" to="/" aria-label="Kenpo Porto Alto — voltar ao início">
      <img src="/images/logos/dojo-kenpo-porto-alto.jpeg" alt="" />
      <span><strong>KENPO</strong><small>PORTO ALTO</small></span>
    </RouterLink>
    <RouterView />
  </main>
</template>
