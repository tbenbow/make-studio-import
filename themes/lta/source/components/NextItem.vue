<template>
  <Heading
    v-editable="$props"
    class="next-item"
    :label="label"
    :title="title"
    :title-tag="small ? 'h3' : undefined"
  >
    <template #description>
      <ButtonComponent v-if="link" :link="link" :name="buttonName" icon="arrow-right" />
    </template>
  </Heading>
</template>

<script>
export default {
  props: {
    label: String,
    title: String,
    link: [Object, String],
    buttonName: String,
    small: Boolean,
    _editable: String
  }
}
</script>

<style lang="postcss" scoped>
.next-item {
  :deep(.button) {
    @apply mt-2;
  }
}
</style>
