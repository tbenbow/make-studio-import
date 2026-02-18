<template>
  <Asset v-editable="$props" class="asset-course">
    <Notice class="lg:hidden">Courses can only be used on larger screens</Notice>
    <Notice v-if="error" icon="exclamation-circle">{{ error.data?.statusMessage }}</Notice>
    <iframe v-else-if="scormApiInitialized && iframeSrc" :src="iframeSrc"></iframe>
  </Asset>
</template>

<script setup lang="ts">
import { AICC } from 'scorm-again'

const props = defineProps({
  asset: String,
  _editable: String
})

const scormApiInitialized = ref(false)

const { data: iframeSrc, error } = await useFetch('/api/course', {
  method: 'POST',
  body: {
    course: props.asset
  }
})

declare global {
  interface Window {
    API: AICC
  }
}

onMounted(() => {
  window.API = new AICC()
  scormApiInitialized.value = true
})
</script>

<style lang="postcss" scoped>
.asset-course {
  :deep(.notice) {
    @apply mb-6;
  }

  iframe {
    @apply w-full h-[640px] hidden lg:block;
  }
}
</style>
