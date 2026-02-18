<template>
  <VeeField
    v-slot="{ handleChange, handleBlur, meta }"
    :name="name"
    :rules="validationRules"
  >
    <input
      v-editable="$props"
      :id="id"
      class="form-file"
      :class="{ 'invalid': meta.validated && meta.errors?.length }"
      :name="name"
      type="file"
      :required="required"
      :disabled="disabled"
      @change="handleChange"
      @blur="handleBlur"
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
    required: Boolean,
    disabled: Boolean,
    _editable: String
  },
  computed: {
    validationRules() {
      return withoutEmptyValues({
        required: this.required
      })
    }
  }
}
</script>
