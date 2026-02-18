<template>
  <div v-editable="$props" ref="el" class="page">
    <slot />
    <Blocks
      v-if="
        (blocks && blocks.length) || $slots.default || $slots['after-blocks']
      "
      :blocks="blocks"
      :root="true"
    >
      <template #before>
        <slot name="before-blocks" />
      </template>
      <template #block="block">
        <slot name="block" v-bind="block" />
      </template>
      <template #after>
        <slot name="after-blocks" />
      </template>
    </Blocks>
  </div>
</template>

<script setup lang="ts">
import type { PageProps } from '~/composables/content-types/usePage'

const props = defineProps<PageProps>()

const { initializeMarkGlossary, destroyMarkGlossary } = usePage(props)

const el = ref()

onMounted(() => {
  initializeMarkGlossary(el.value, getCurrentInstance())
})

onBeforeUnmount(() => {
  destroyMarkGlossary()
})
</script>
