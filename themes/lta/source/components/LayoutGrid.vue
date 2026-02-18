<template>
  <div
    :id="idComputed"
    v-editable="$props"
    :id-name="idNameComputed"
    class="layout-grid"
    :class="[`num-columns-${numColumns || '2'}`]"
  >
    <Heading
      v-if="heading && heading.length"
      v-bind="heading[0]"
      @id="headingId = $event"
    />
    <div class="columns" :class="columnsClasses">
      <slot>
        <component
          v-once
          v-for="block in columns"
          :key="block._uid"
          :is="resolveAsyncComponent(block.component)"
          v-bind="block"
        />
      </slot>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    heading: Array,
    columns: Array,
    columnsClass: String,
    numColumns: {
      type: String,
      default: '2',
      validator: (value) => ['', '2', '3', '4'].includes(value)
    },
    id: String,
    idName: String,
    _editable: String
  },
  data() {
    return {
      headingId: undefined,
      columnsClassDefault: 'gap-12'
    }
  },
  computed: {
    idComputed() {
      return (
        this.id ||
        (this.headingId?.id ? `${this.headingId.id}-grid` : undefined)
      )
    },
    idNameComputed() {
      return this.idName || this.headingId?.name
    },
    columnsClasses() {
      return `${this.columnsClassDefault} ${this.columnsClass || ''}`.trim()
    }
  }
}
</script>

<style lang="postcss" scoped>
.layout-grid {
  :deep(.heading) {
    @apply mb-12 last:mb-0;
  }

  .columns {
    @apply grid grid-cols-1;

    :deep( > .item) {
      @apply max-w-none;
    }

    :deep( > .content) {
      @apply block; /* Instead of .grid */
    }
  }
}

/* Number of Columns */

.layout-grid.num-columns {
  &-2 .columns {
    @apply md:grid-cols-2;
  }

  &-3 .columns {
    @apply md:grid-cols-2 xl:grid-cols-3;
  }

  &-4 .columns {
    @apply md:grid-cols-2 xl:grid-cols-4;
  }
}
</style>
