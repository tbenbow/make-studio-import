<template>
  <div class="table-cell" :class="{ [`align-${align}`]: align }" role="cell">
    <template v-if="tooltip || icon">
      <span v-tooltip="tooltip" class="tooltip">
        <font-awesome-icon
          v-if="icon"
          class="icon"
          :icon="['fal', icon]"
          fixed-width
        />
        {{ value }}
        <font-awesome-icon
          v-if="tooltip"
          class="tooltip-icon"
          :icon="['fal', 'circle-question']"
        />
      </span>
    </template>
    <template v-else>{{ value }}</template>
  </div>
</template>

<script>
export default {
  props: {
    value: String,
    icon: String,
    tooltip: String,
    align: {
      type: String,
      validator: (value) => ['', 'left', 'center', 'right'].includes(value)
    }
  }
}
</script>
