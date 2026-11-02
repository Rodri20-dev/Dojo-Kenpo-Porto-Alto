<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <main class="not-found-page">
    <p class="eyebrow">ERRO 404</p>
    <h1>Página não encontrada</h1>
    <p>O endereço pedido não corresponde a uma página deste site.</p>
    <RouterLink class="button button--gold" to="/">Voltar ao início <span aria-hidden="true">↗</span></RouterLink>
  </main>
</template>
