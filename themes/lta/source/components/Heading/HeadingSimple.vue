<template>
  <Heading
    :label="$props.label"
    :title="$props.title"
    :title-tag="$props.titleTag || 'h4'"
  />
</template>

<script>
export default {
  props: ['label', 'title', 'titleTag']
}
</script>

<style lang="postcss" scoped>
.heading {
  @apply border-b border-black-200;

  :deep(.title) {
    @apply -mb-px inline-block align-top pb-2 border-b border-heading;
  }
}
</style>
