<template>
  <div class="blocks" :root="root || undefined">
    <slot name="before" />
    <slot>
      <template v-for="(block, index) in blocks">
        <slot name="block" v-bind="{ block, root, order: index }">
          <component
            :is="resolveAsyncComponent(block.component)"
            :key="block._uid || index"
            :root="root"
            :order="index"
            v-bind="block"
            v-on="listeners($attrs)"
          />
        </slot>
      </template>
    </slot>
    <slot name="after" />
  </div>
</template>

<script>
export default {
  props: {
    blocks: {
      type: Array,
      default: () => []
    },
    root: Boolean
  }
}
</script>

<style lang="postcss" scoped>
/**
 * @see /assets/css/components/blocks.css
 *
 * Block styles are imported at Tailwind's components layer to allow for
 * easier overriding using utility classes.
 */
</style>
