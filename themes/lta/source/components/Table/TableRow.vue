<template>
  <div class="table-row tr" :class="{ highlight }" role="row">
    <slot v-if="cells && cells.length" v-bind="{ cells }">
      <TableCell
        v-for="(cell, index) in cells"
        :key="index"
        v-bind="typeof cell === 'string' ? { value: cell } : cell"
        class="td"
      />
    </slot>
  </div>
</template>

<script>
export default {
  props: {
    cells: Array,
    highlight: Boolean
  }
}
</script>
