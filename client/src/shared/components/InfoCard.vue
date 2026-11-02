<script setup>
defineProps({
  number: { type: String, required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
})
</script>

<template>
  <article class="info-card">
    <span class="info-card__number">{{ number }}</span>
    <h3>{{ title }}</h3>
    <p>{{ body }}</p>
  </article>
</template>
