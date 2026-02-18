<template>
  <div v-editable="$props" class="glossary-term-item">
    <h6 class="title-text" aria-hidden="true">
      {{ term }}
    </h6>
    <RichText class="definition" :document="definition" size="small" />
  </div>
</template>

<script>
export default {
  props: {
    glossaryTerm: [Object, String],
    _editable: String
  },
  computed: {
    term() {
      return this.glossaryTerm?.content?.term
    },
    definition() {
      return this.glossaryTerm?.content?.definition
    }
  }
}
</script>
<style lang="postcss" scoped>
.glossary-term-item {
  @apply border border-line border-blue rounded flex p-6;
  .title-text {
    @apply w-1/4 text-blue flex-none;
  }
  .definition {
    @apply pr-4 w-3/4;
  }
}
</style>
