<template>
  <div class="tabs-tab" :class="{ 'is-active': active }" role="tabpanel">
    <div class="tabs-tab-main">
      <slot />
      <Blocks v-if="blocks && blocks.length" :blocks="blocks" />
    </div>
  </div>
</template>

<script>
export default {
  name: 'TabsTab',
  props: {
    title: String,
    blocks: Array,
    active: Boolean
  }
}
</script>
