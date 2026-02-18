<template>
  <ButtonComponent
    tag="button"
    class="form-submit"
    type="submit"
    :name="name || 'Submit'"
    :aria-label="name || 'Submit'"
    :icon="submitting ? 'spinner-third' : icon"
    :icon-props="{ spin: submitting, fixedWidth: true }"
    :size="size"
    :disabled="disabled"
  />
</template>

<script>
export default {
  props: {
    name: String,
    icon: String,
    size: {
      type: String,
      validator: (value) => ['small', 'large'].includes(value)
    },
    submitting: Boolean,
    disabled: Boolean
  }
}
</script>
