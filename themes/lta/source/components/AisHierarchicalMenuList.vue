<template>
  <ul class="ais-HierarchicalMenuList">
    <li v-for="item in items" :key="item.value">
      <a
        :class="{ 'font-bold': item.isRefined }"
        :href="createURL(item.value)"
        @click.prevent="refine(item.value)"
      >
        {{ item.label }}&nbsp;<Pill>{{ item.count }}</Pill>
      </a>
      <ais-hierarchical-menu-list
        v-if="item.data"
        :items="item.data"
        :refine="refine"
        :create-u-r-l="createURL"
      />
    </li>
  </ul>
</template>

<script>
export default {
  name: 'AisHierarchicalMenuList',
  props: {
    items: {
      type: Array,
      required: true
    },
    refine: {
      type: Function,
      required: true
    },
    createURL: {
      type: Function,
      required: true
    }
  }
}
</script>
