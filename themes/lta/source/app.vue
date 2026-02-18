<template>
  <NuxtPwaAssets />
  <NuxtLoadingIndicator :color="accent" />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { _accent as accent } from '#tailwind-config/theme/colors'
</script>
