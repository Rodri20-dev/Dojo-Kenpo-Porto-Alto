<script setup>
import { ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'

const menuOpen = ref(false)
const navLinks = [
  { label: 'O Kenpo', href: '#kenpo' },
  { label: 'O Dojo', href: '#dojo' },
  { label: 'Aulas', href: '#aulas' },
  { label: 'Contactos', href: '#contactos' },
]

function closeMenu() {
  menuOpen.value = false
}
</script>

<template>
  <header class="site-header" @keydown.esc="closeMenu">
    <RouterLink class="brand" to="/" aria-label="Kenpo Porto Alto — início" @click="closeMenu">
      <img class="brand__logo" src="/images/logos/dojo-kenpo-porto-alto.jpeg" alt="" />
      <span class="brand__text"><strong>KENPO</strong><small>PORTO ALTO</small></span>
    </RouterLink>
    <button class="menu-toggle" type="button" :aria-expanded="menuOpen" :aria-label="menuOpen ? 'Fechar menu' : 'Abrir menu'" aria-controls="site-navigation" @click="menuOpen = !menuOpen">
      <span></span><span></span>
    </button>
    <nav id="site-navigation" class="site-nav" :class="{ 'site-nav--open': menuOpen }" aria-label="Navegação principal">
      <a v-for="link in navLinks" :key="link.href" :href="link.href" @click="closeMenu">{{ link.label }}</a>
      <a class="nav-cta" href="#contactos" @click="closeMenu">Falar connosco <span aria-hidden="true">↗</span></a>
      <RouterLink class="nav-login" to="/login" @click="closeMenu">Login</RouterLink>
    </nav>
  </header>

  <RouterView />

  <footer class="site-footer"><RouterLink class="brand brand--footer" to="/"><img class="brand__logo" src="/images/logos/dojo-kenpo-porto-alto.jpeg" alt="" /><span class="brand__text"><strong>KENPO</strong><small>PORTO ALTO</small></span></RouterLink><p>Website em preparação · Porto Alto</p><a href="#inicio" class="back-top">VOLTAR AO TOPO ↑</a></footer>
</template>

