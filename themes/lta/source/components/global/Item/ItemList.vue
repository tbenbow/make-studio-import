<template>
  <ul
    v-editable="$props"
    class="item-list"
    :class="{
      'show-dividers': showDividers,
      [`page-${sourceStoriesPage}`]: showSourcePagination,
      grid: grid,
      [`grid-columns-${gridColumns}`]: grid && gridColumns
    }"
  >
    <slot />
    <template v-if="items && items.length">
      <li v-for="(item, index) in items" :key="index" class="item-list-item">
        <slot name="before-item" v-bind="{ item }" />
        <Item v-bind="lodash.merge({}, item, sourceItemTemplateProps)" />
        <slot name="after-item" v-bind="{ item }" />
      </li>
    </template>
    <template v-if="hasSource">
      <template v-if="fetchingSource">
        <template v-if="grid && gridColumns">
          <li
            v-for="index in parseInt(gridColumns)"
            :key="`placeholder-${index}`"
          >
            <Item
              v-bind="sourceItemTemplateProps"
              :show-loader="true"
              :show-loader-error="fetchingSourceError"
            />
          </li>
        </template>
        <li v-else>
          <Item
            v-bind="sourceItemTemplateProps"
            :show-loader="true"
            :show-loader-error="fetchingSourceError"
          />
        </li>
      </template>
      <template v-else-if="sourceStories && sourceStories.length">
        <li
          v-for="story in sourceStories"
          :key="story.id"
          class="item-list-source-item"
        >
          <slot name="before-source-item" v-bind="{ story }" />
          <Item v-bind="sourceItemTemplateProps" :source="story" />
          <slot name="after-source-item" v-bind="{ story }" />
        </li>
      </template>
      <li v-else>
        <slot name="empty-source">
          <Notice :panel="true">No sources found.</Notice>
        </slot>
      </li>
      <li
        v-if="showSourcePagination && sourceStoriesPages > 1"
        class="item-list-pagination"
      >
        <font-awesome-icon
          v-show="fetchingSource"
          class="absolute left-0 text-accent text-xl"
          :icon="['fal', 'spinner-third']"
          spin
        />
        <Pagination
          v-model:current-page="sourceStoriesPage"
          :total-pages="sourceStoriesPages"
          @update:currentPage="(toPage) => $el.scrollIntoView()"
        />
      </li>
    </template>
    <li v-if="$slots.footer || footer" class="item-list-footer">
      <slot name="footer">
        <RichText :document="footer" />
      </slot>
    </li>
  </ul>
</template>

<script>
import SourceMixin from '@/mixins/Source.mixin'

export default {
  mixins: [SourceMixin],
  props: {
    items: Array,
    footer: Object,
    showDividers: Boolean,
    showSourcePagination: Boolean,
    grid: Boolean,
    gridColumns: {
      type: String,
      default: '2',
      validator: (value) => ['', '2', '3', '4', '6'].includes(value)
    },
    _editable: String
  },
  watch: {
    async source() {
      await this.fetchSource()
    }
  },
  async mounted() {
    await this.fetchSource()
  }
}
</script>

<style lang="postcss" scoped>
.item-list {
  @apply space-y-12;

  &-pagination {
    @apply relative;

    :deep(.pagination) {
      @apply pt-6;
    }
  }

  &-footer {
    @apply relative text-center;

    :deep(.rich-text) {
      @apply pt-6;
    }
  }
}

/* Show Dividers */

.item-list.show-dividers {
  @apply space-y-0 divide-y divide-line;

  > li {
    @apply py-6 first:pt-0 last:pb-0;
  }
}

/* Grid */

.item-list.grid {
  @apply gap-12 space-y-0;

  &.show-dividers {
    @apply divide-y-0;

    > li {
      @apply py-0;
    }
  }
}

/* Grid Columns */

.item-list.grid-columns {
  &-2 {
    @apply md:grid-cols-2;
  }

  &-3 {
    @apply md:grid-cols-2 xl:grid-cols-3;
  }

  &-4 {
    @apply md:grid-cols-2 xl:grid-cols-4;
  }

  &-6 {
    @apply grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6;
  }
}
</style>
