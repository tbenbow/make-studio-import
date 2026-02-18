<template>
  <button
    class="menu-button"
    :class="{ 'is-active': active }"
    @click="$emit('update:active', !active)"
  >
    <span class="icon">
      <span class="icon-line" />
      <span class="icon-line" />
      <span class="icon-line" />
    </span>
  </button>
</template>

<script>
export default {
  props: {
    active: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style lang="postcss" scoped>
.menu-button {
  --menu-button-icon-height: theme('height.8');
  --menu-button-icon-width: theme('width.8');
  --menu-button-icon-line-height: 3px;
  --menu-button-icon-line-width: theme('width.full');
  --menu-button-icon-line-separation: calc(var(--menu-button-icon-height) / 2);
}

.icon {
  @apply relative block;
  height: var(--menu-button-icon-height);
  width: var(--menu-button-icon-width);

  &-line {
    @apply absolute block bg-body rounded-full transition duration-100 ease-out;
    top: calc(50% - (var(--menu-button-icon-line-height) / 2));
    height: var(--menu-button-icon-line-height);
    width: var(--menu-button-icon-line-width);

    &:first-child {
      transform: translateY(calc(var(--menu-button-icon-line-separation) / -2));
    }

    &:last-child {
      transform: translateY(calc(var(--menu-button-icon-line-separation) / 2));
    }
  }
}

.menu-button.is-active {
  .icon {
    &-line {
      @apply bg-accent transform translate-y-0;

      &:first-child {
        @apply rotate-45;
      }

      &:nth-child(2) {
        @apply scale-0 opacity-0;
      }

      &:last-child {
        @apply -rotate-45;
      }
    }
  }
}
</style>
