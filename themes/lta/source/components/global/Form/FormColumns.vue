<template>
  <div class="form-columns">
    <component
      :is="block.component"
      v-for="(block, index) in content"
      :key="index"
      v-bind="block"
      :disabled="disabled"
      :submitting="submitting"
      :errors="errors"
    />
  </div>
</template>

<script>
export default {
  props: {
    content: Array,
    disabled: Boolean,
    submitting: Boolean,
    errors: Object
  }
}
</script>

<style lang="postcss" scoped>
.form-columns {
  @apply flex flex-col gap-8 md:flex-row;

  > * {
    @apply flex-1;
  }
}
</style>
