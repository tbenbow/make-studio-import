<template>
  <FAIcon v-bind="props" :title-id="titleId || uniqueId" />
</template>

<script setup lang="ts">
import { FontAwesomeIcon as FAIcon, type FontAwesomeIconProps } from '@fortawesome/vue-fontawesome'

const props = defineProps<FontAwesomeIconProps>()

const uniqueId = useId()
</script>
