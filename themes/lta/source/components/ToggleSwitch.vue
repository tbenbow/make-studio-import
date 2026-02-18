<template>
  <div
    class="toggle-switch"
    :class="{ 'is-active': active, 'is-disabled': disabled }"
    @click="!disabled && $emit('update:active', !active)"
  >
    <input
      :id="inputId"
      class="invisible"
      type="checkbox"
      :name="inputName"
      :value="inputValue"
      :checked="active"
      :disabled="disabled"
    />
    <span class="handle">
      <font-awesome-icon class="icon" :icon="['fal', 'check']" />
    </span>
  </div>
</template>

<script>
export default {
  props: {
    active: Boolean,
    inputValue: {
      type: [Boolean, String],
      default: true
    },
    inputName: String,
    inputId: String,
    disabled: Boolean
  }
}
</script>

<style lang="postcss" scoped>
.toggle-switch {
  --toggle-switch-height: theme('width.8');
  --toggle-switch-width: theme('width.12');
  --toggle-switch-margin: theme('margin.1');
  --toggle-switch-handle: calc(
    var(--toggle-switch-height) - var(--toggle-switch-margin) * 2
  );
  @apply relative h-[var(--toggle-switch-height)] w-[var(--toggle-switch-width)] bg-black-200 rounded-full;

  &,
  .handle,
  .icon {
    @apply transition duration-200 ease-in-out;
  }

  .handle {
    @apply absolute left-0 top-0 bottom-0 flex items-center justify-center w-[var(--toggle-switch-handle)] m-[var(--toggle-switch-margin)] bg-white rounded-full content-[''];

    .icon {
      @apply opacity-0 text-green text-2xs;
    }
  }

  &:active:not(.is-disabled) {
    @apply bg-black-400;
  }
}

.toggle-switch.is-active {
  @apply bg-green;

  .handle {
    @apply transform;
    transform: translateX(
      calc(
        var(--toggle-switch-width) - var(--toggle-switch-handle) -
          var(--toggle-switch-margin) * 2
      )
    );

    .icon {
      @apply opacity-100;
    }
  }
}

.toggle-switch.is-disabled {
  @apply cursor-not-allowed;
}
</style>
