<template>
  <div class="aside-item">
    <component
      :is="link ? 'LinkComponent' : 'div'"
      class="main"
      :link="link"
      :name="title"
      :title="title"
    >
      <div class="content">
        <div v-if="label" class="label">{{ label }}</div>
        <slot></slot>
      </div>
      <font-awesome-icon
        v-if="icon"
        class="icon"
        :icon="['fal', icon]"
        :fixed-width="true"
      />
    </component>
  </div>
</template>

<script>
export default {
  props: {
    label: String,
    icon: String,
    link: String,
    title: String
  }
}
</script>

<style lang="postcss" scoped>
.aside-item {
  @apply border-t border-line;
}

.main {
  @apply flex gap-3 py-4;
}

a.main {
  @apply hover:text-accent;
  @apply transition-colors duration-200;

  &:hover {
    .icon {
      @apply scale-110;
    }
  }
}

.content {
  @apply relative overflow-hidden grow pr-3;

  .label {
    @apply mb-2 text-xs uppercase tracking-wide;
  }

  &:after {
    @apply absolute right-0 top-0 bottom-0 w-3 bg-gradient-to-l from-stone content-[''];
  }
}

.icon {
  @apply text-lg text-accent;
  @apply transition-transform duration-200;
}
</style>
