<template>
  <VeeField
    v-model="valueModel"
    v-slot="{ field, meta }"
    :name="name"
    :rules="validationRules"
    :value="value"
  >
    <textarea
      v-bind="field"
      v-editable="$props"
      :id="id"
      class="form-textarea"
      :class="{ 'invalid': meta.validated && meta.errors?.length }"
      :name="name"
      :placeholder="placeholder || undefined"
      :required="required"
      :disabled="disabled"
      :rows="rows || 4"
      :maxlength="maxLength || undefined"
    />
  </VeeField>
</template>

<script>
export default {
  props: {
    id: String,
    name: {
      type: String,
      required: true
    },
    value: String,
    placeholder: String,
    required: Boolean,
    disabled: Boolean,
    rows: String,
    maxLength: String,
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
        max: this.maxLength,
        required: this.required
      })
    }
  },
  watch: {
    value: {
      immediate: true,
      handler(value) {
        this.valueModel = value
      }
    }
  }
}
</script>
