<template>
  <NuxtLink
    v-editable="$props"
    v-color="accentColor"
    class="item item-gaining-ground"
    :to="`/${source.full_slug}`"
  >
    <State v-if="source.content.state" :code="source.content.state" />
    <font-awesome-icon
      v-else
      class="state state-placeholder"
      :icon="['fal', 'location-dot']"
    />
    <div class="name">{{ title || source.name }}</div>
  </NuxtLink>
</template>

<script>
import ItemMixin from '@/mixins/Item.mixin'

export default {
  mixins: [ItemMixin],
  props: {
    source: Object
  }
}
</script>

<style lang="postcss" scoped>
.item-gaining-ground {
  @apply block text-center;

  :deep(.state) {
    @apply inline-block text-green-dark transition duration-200;

    + .name {
      @apply mt-2;
    }
  }

  :deep(.state-placeholder) {
    @apply text-4xl leading-none scale-50;
  }

  &:hover {
    :deep(.state) {
      @apply text-accent scale-110;
    }
  }
}
</style>
