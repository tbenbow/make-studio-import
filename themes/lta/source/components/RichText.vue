<template>
  <div class="rich-text" :class="{ [`size-${size}`]: size, loose }">
    <slot name="before" />
    <slot>
      <RichTextRenderer v-if="documentIsValid" :document="document" />
    </slot>
    <slot name="after" />
  </div>
</template>

<script>
import { RichTextRenderer } from '@/mixins/storyblok-rich-text-renderer'

/**
 * Validates a document
 * A valid document has to have content. If the only content is a
 * paragraph, make sure it's not empty — this happens when a rich text
 * field had content that was later entirely removed.
 * @prop {object} The document
 * @return {boolean} True if document is valid
 */
export function documentIsValid(document = {}) {
  return (
    document &&
    typeof document === 'object' &&
    Array.isArray(document.content) &&
    (document.content.length === 1 && document.content[0].type === 'paragraph'
      ? !!document.content[0].content
      : true)
  )
}

export default {
  components: {RichTextRenderer},
  props: {
    document: [Object, String],
    size: {
      type: String,
      validator: (value) =>
        ['', 'xsmall', 'small', 'default', 'large'].includes(value)
    },
    loose: Boolean
  },
  computed: {
    documentIsValid() {
      return documentIsValid(this.document)
    }
  }
}
</script>

<style lang="postcss">
/* TODO: Removed `scoped` to fix styling — any side effect? */

.rich-text > {
  /* Spacing */

  h1 {
    @apply mt-12;
  }

  h2 {
    @apply mt-10;
  }

  h3 {
    @apply mt-9;
  }

  h4 {
    @apply mt-8;
  }

  h5 {
    @apply mt-7;
  }

  h6 {
    @apply mt-6;
  }

  h1,
  h2 {
    @apply mb-4;

    & + h2,
    & + h3 {
      @apply -mt-3;
    }
  }

  h3,
  h4 {
    @apply mb-3;

    & + h4,
    & + h5 {
      @apply -mt-2;
    }
  }

  h5,
  h6 {
    @apply mb-2;

    & + h5,
    & + h6 {
      @apply -mt-1;
    }
  }

  p,
  ol:not([class]),
  ul:not([class]) {
    @apply mb-4;
  }

  blockquote p,
  figure.quote {
    @apply mb-4 last:mb-0;
  }

  ol:not([class]) li,
  ul:not([class]) li {
    @apply mb-2 last:mb-0;
  }

  .banner,
  .slider {
    @apply my-18;
  }

  hr,
  .callout,
  .expandable-list,
  .gallery,
  .item,
  .layout-grid,
  .quote {
    @apply my-12;
  }

  .asset-image,
  .asset-video,
  .footing,
  .heading,
  .menu {
    @apply my-8;
  }

  blockquote,
  form,
  .expandable,
  .form-field,
  .list,
  .table,
  .glossary-term-item,
  .search-land-trusts,
  .search-resources {
    @apply my-6;
  }

  .label {
    @apply my-4;
  }

  .button {
    @apply my-3;
  }

  .label {
    & + h1,
    & + h2,
    & + h3,
    & + h4,
    & + h5,
    & + h6 {
      @apply mt-0;
    }
  }

  :first-child {
    @apply mt-0;
  }

  :last-child {
    @apply mb-0;
  }

  /* Styling */

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    & + h2,
    & + h3,
    & + h4,
    & + h5,
    & + h6 {
      @apply text-body-3;
    }
  }

  p,
  blockquote p,
  ol:not([class]),
  ul:not([class]) {
    @apply text-body-2;

    a:not(.button) {
      @apply font-bold underline;
      text-decoration-color: theme('colors.accent');

      &:hover {
        @apply text-accent;
      }
    }

    mark {
      color: inherit;
    }
  }
.
  p,
  li {
    img {
      @apply rounded-lg;
    }
  }

  ol:not([class]) {
    @apply pl-6 list-decimal list-outside;

    li {
      @apply pl-2;
    }
  }

  ul:not([class]) {
    @apply pl-6 list-disc list-outside;

    li {
      @apply pl-2;
    }
  }

  blockquote {
    @apply border-l-4 border-line pl-6;

    p {
      @apply italic;

      &:first-of-type:before {
        content: open-quote;
      }

      &:last-of-type:after {
        content: close-quote;
      }
    }
  }

  hr {
    @apply border-line;
  }
}

/* Size */

.rich-text.size-large > {
  p,
  blockquote p,
  ol:not([class]),
  ul:not([class]) {
    @apply text-lg;
  }
}

.rich-text.size-small > {
  p,
  blockquote p,
  ol:not([class]),
  ul:not([class]) {
    @apply text-sm;
  }
}

.rich-text.size-xsmall > {
  p,
  blockquote p,
  ol:not([class]),
  ul:not([class]) {
    @apply text-xs;
  }
}

/* Loose */

.rich-text.loose > {
  p,
  blockquote p,
  ol:not([class]),
  ul:not([class]) {
    @apply leading-loose;
  }
}
</style>
