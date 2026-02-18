<template>
  <div class="field" :class="{ 'display-inline': displayInline, tight }">
    <font-awesome-icon
      v-if="icon"
      class="icon"
      :icon="['fal', icon]"
      :fixed-width="displayInline"
    />
    <div class="main">
      <h6 v-if="label" class="label">{{ label }}</h6>
      <div class="content">
        <slot />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    icon: String,
    label: String,
    displayInline: Boolean,
    tight: Boolean
  }
}
</script>

<style lang="postcss" scoped>
.field {
}

:deep(.icon) {
  @apply mb-2 text-lg text-accent;
}

.label {
  @apply mb-2 text-body text-xs font-sans font-normal uppercase tracking-wide;
}

/* Display Inline */

.field.display-inline {
  @apply flex gap-3;

  :deep(.icon) {
    @apply -mt-px mb-0;
  }
}

/* Tight */

.field.tight {
  .label {
    @apply mb-0;
  }
}
</style>
