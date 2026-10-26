<script setup>
import { ref } from 'vue'
import InfoCard from './components/InfoCard.vue'
import SectionHeading from './components/SectionHeading.vue'

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
    <a class="brand" href="#inicio" aria-label="Kenpo Porto Alto — início" @click="closeMenu">
      <img class="brand__logo" src="/images/logos/dojo-kenpo-porto-alto.jpeg" alt="" />
      <span class="brand__text"><strong>KENPO</strong><small>PORTO ALTO</small></span>
    </a>
    <button class="menu-toggle" type="button" :aria-expanded="menuOpen" :aria-label="menuOpen ? 'Fechar menu' : 'Abrir menu'" aria-controls="site-navigation" @click="menuOpen = !menuOpen">
      <span></span><span></span>
    </button>
    <nav id="site-navigation" class="site-nav" :class="{ 'site-nav--open': menuOpen }" aria-label="Navegação principal">
      <a v-for="link in navLinks" :key="link.href" :href="link.href" @click="closeMenu">{{ link.label }}</a>
      <a class="nav-cta" href="#contactos" @click="closeMenu">Falar connosco <span aria-hidden="true">↗</span></a>
    </nav>
  </header>

  <main>
    <section id="inicio" class="hero">
      <div class="hero__grid" aria-hidden="true"></div>
      <div class="hero__content">
        <p class="eyebrow"><span class="eyebrow__line"></span> Um espaço em preparação · Porto Alto</p>
        <h1>Disciplina.<br /><em>Presença.</em><br />Caminho.</h1>
        <p class="hero__intro">Um novo dojo de Kenpo está a nascer em Porto Alto.<br class="desktop-break" /> Em breve, mais informações.</p>
        <a class="button button--gold" href="#dojo">Conhecer o projeto <span aria-hidden="true">↓</span></a>
      </div>
      <div class="hero__art">
        <img class="hero__logo" src="/images/logos/dojo-kenpo-porto-alto.jpeg" alt="Logótipo oficial do Dojo de Kenpo Porto Alto" />
        <span class="hero__index">01 <i></i> 04</span>
      </div>
      <div class="hero__footer"><span>ABERTURA A CONFIRMAR</span><span>PORTO ALTO, PORTUGAL</span><a href="#kenpo">DESCOBRIR <span aria-hidden="true">↓</span></a></div>
    </section>

    <section id="kenpo" class="intro-section section-pad">
      <SectionHeading eyebrow="01 / A ARTE" title="Um caminho de prática." />
      <div class="intro-copy">
        <p class="intro-copy__lead">O Kenpo é uma arte marcial. A história e a filosofia desta escola serão apresentadas aqui com rigor e contexto.</p>
        <p class="intro-copy__note">Conteúdo editorial por confirmar com o responsável do dojo.</p>
      </div>
    </section>

    <section id="dojo" class="values-section section-pad">
      <div class="values-section__top"><SectionHeading eyebrow="02 / O DOJO" title="Princípios em construção." light /><p class="section-note">A filosofia e a linhagem da escola serão acrescentadas após confirmação.</p></div>
      <div class="cards-grid">
        <InfoCard number="A" title="Filosofia" body="Texto a confirmar pelo responsável do dojo." />
        <InfoCard number="B" title="Linhagem" body="Escola, mestres e percurso a confirmar." />
        <InfoCard number="C" title="O espaço" body="Informações sobre o dojo a preencher." />
      </div>
    </section>

    <section id="aulas" class="classes-section section-pad">
      <div class="classes-section__heading"><SectionHeading eyebrow="03 / A PRÁTICA" title="As aulas." /><p>Programa, níveis e horários serão publicados quando estiverem confirmados.</p></div>
      <div class="schedule-placeholder"><span class="schedule-placeholder__icon" aria-hidden="true">✳</span><div><strong>Horários em preparação</strong><p>Informação a confirmar</p></div><span class="schedule-placeholder__tag">EM BREVE</span></div>
      <a class="text-link" href="#contactos">Receber novidades <span aria-hidden="true">↗</span></a>
    </section>

    <section class="gallery-section">
      <div class="gallery-copy"><p class="eyebrow">04 / MOMENTOS</p><h2>O treino,<br /><em>por dentro.</em></h2><p>A galeria será preenchida com imagens do dojo e da prática.</p></div>
      <div class="gallery-frame"><div class="gallery-empty"><span class="gallery-empty__icon" aria-hidden="true">＋</span><strong>Galeria em preparação</strong><p>As fotografias serão adicionadas futuramente.</p><span class="gallery-frame__label">SEM IMAGENS PUBLICADAS</span></div></div>
    </section>

    <section class="logos-section section-pad" aria-labelledby="logos-title">
      <p class="eyebrow">IDENTIDADES INSTITUCIONAIS</p>
      <h2 id="logos-title">Organizações e dojo</h2>
      <div class="logos-grid">
        <figure class="institution-logo"><img src="/images/logos/LogoChowHoonOhana.jpeg" alt="Logótipo da Ohana" /><figcaption>Ohana</figcaption></figure>
        <figure class="institution-logo"><img src="/images/logos/LogoUPKK.jpeg" alt="Logótipo da União Portuguesa de Karate Kenpo (UPKK)" /><figcaption>UPKK</figcaption></figure>
        <figure class="institution-logo"><img src="/images/logos/ArepaPortoAlto.png" alt="Logótipo da AREPA Porto Alto" /><figcaption>AREPA Porto Alto</figcaption></figure>
      </div>
    </section>

    <section id="contactos" class="contact-section section-pad">
      <SectionHeading eyebrow="05 / CONTACTO" title="Vamos conversar." />
      <div class="contact-content"><p>Os dados de contacto e a localização detalhada serão adicionados assim que estiverem confirmados.</p><span class="contact-placeholder">CONTACTOS A CONFIRMAR</span></div>
    </section>
  </main>

  <footer class="site-footer"><a class="brand brand--footer" href="#inicio"><img class="brand__logo" src="/images/logos/dojo-kenpo-porto-alto.jpeg" alt="" /><span class="brand__text"><strong>KENPO</strong><small>PORTO ALTO</small></span></a><p>Website em preparação · Porto Alto</p><a href="#inicio" class="back-top">VOLTAR AO TOPO ↑</a></footer>
</template>
