<script setup>
defineProps({
  eyebrow: { type: String, required: true },
  title: { type: String, required: true },
  light: { type: Boolean, default: false },
})
</script>

<template>
  <div class="section-heading" :class="{ 'section-heading--light': light }">
    <p class="eyebrow">{{ eyebrow }}</p>
    <h2>{{ title }}</h2>
  </div>
</template>
