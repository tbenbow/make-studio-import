<template>
  <VeeField
    v-model="valueModel"
    v-slot="{ field, meta }"
    type="checkbox"
    :name="name"
    :rules="validationRules"
    :value="value"
  >
    <div
      v-editable="$props"
      :id="id"
      class="form-checkbox"
    >
      <input
        v-bind="field"
        :id="value"
        :class="{ 'invalid': meta.validated && meta.errors?.length }"
        :name="name"
        :value="value"
        type="checkbox"
        :required="required"
        :disabled="disabled"
      />
      <label class="label" :for="value">
        <slot name="label" v-bind="{ label: label || value }">{{
          label || value
        }}</slot>
      </label>
    </div>
  </VeeField>
</template>

<script>
export default {
  model: {
    prop: 'checked'
  },
  props: {
    id: String,
    name: {
      type: String,
      required: true
    },
    value: {
      type: String,
      required: true
    },
    label: String,
    checked: Boolean,
    required: Boolean,
    disabled: Boolean,
    _editable: String
  },
  data() {
    return {
      valueModel: undefined
    }
  },
  computed: {
    validationRules() {
      return withoutEmptyValues({
        required: this.required
      })
    }
  },
  watch: {
    checked: {
      immediate: true,
      handler(checked) {
        this.valueModel = checked ? this.value : checked
      }
    }
  }
}
</script>

<style lang="postcss" scoped>
.form-checkbox {
  @apply flex gap-2;

  input {
    @apply flex-shrink-0;
  }

  .label {
    @apply flex items-center gap-x-2 pt-[0.1875rem] text-body text-sm leading-tight font-normal;
  }
}
</style>
