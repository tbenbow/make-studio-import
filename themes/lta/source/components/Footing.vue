<template>
  <footer v-editable="$props" class="footing">
    <template v-if="links && links.length">
      <ButtonComponent
        v-for="(link, index) in links"
        :key="index"
        v-bind="link"
        variation="link"
      />
    </template>
  </footer>
</template>

<script>
export default {
  props: {
    links: Array,
    _editable: String
  }
}
</script>

<style lang="postcss" scoped>
.footing {
  @apply flex flex-wrap gap-x-8 gap-y-4 border-t border-line;

  :deep(.button) {
    @apply -mt-px pt-4 border-t border-accent;
  }
}
</style>
