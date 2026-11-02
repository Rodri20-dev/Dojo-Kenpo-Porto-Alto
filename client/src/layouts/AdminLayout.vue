<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="admin-layout">
    <aside class="admin-sidebar" aria-label="Navegação administrativa">
      <RouterLink class="admin-brand" to="/backoffice">
        <img src="/images/logos/dojo-kenpo-porto-alto.jpeg" alt="" />
        <span><strong>KENPO</strong><small>PORTO ALTO</small></span>
      </RouterLink>
      <p class="admin-sidebar__label">ÁREA ADMINISTRATIVA</p>
      <nav class="admin-sidebar__nav">
        <RouterLink to="/backoffice" exact-active-class="is-active">Visão geral</RouterLink>
      </nav>
      <RouterLink class="admin-sidebar__back" to="/">Voltar ao site público</RouterLink>
    </aside>
    <main class="admin-main"><RouterView /></main>
  </div>
</template>
