<template>
  <figure v-editable="$props" class="quote">
    <blockquote>
      <em>{{ quoteContent }}</em>
    </blockquote>
    <figcaption>
      &mdash; <em>{{ quoteCitation }}</em>
    </figcaption>
  </figure>
</template>

<script>
export default {
  props: {
    quoteContent: [Object, String],
    quoteCitation: String,
    _editable: String
  }
}
</script>

<style lang="postcss" scoped>
.quote {
  @apply relative max-w-cols-10 mx-auto pt-6 pb-0 text-center font-light text-heading;

  &:before {
    @apply absolute top-[-3rem] text-[16.5rem] font-serif text-center leading-none left-0 w-full opacity-12 z-0;
    content: '”';
  }
}

blockquote {
  @apply relative pb-6 text-2xl font-serif z-1;
}
</style>
