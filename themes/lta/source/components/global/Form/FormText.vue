<template>
  <VeeField
    v-model="valueModel"
    v-slot="{ field, meta }"
    :name="name"
    :rules="validationRules"
    :value="value"
  >
    <input
      v-bind="field"
      v-editable="$props"
      :id="id"
      class="form-text"
      :class="{ 'invalid': meta.validated && meta.errors?.length }"
      :name="name"
      :placeholder="placeholder || undefined"
      :type="type"
      :required="required"
      :disabled="disabled"
      :minlength="minLength || undefined"
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
    type: String,
    disabled: Boolean,
    required: Boolean,
    minLength: String,
    maxLength: String,
    _editable: String
  },
  data() {
    return {
      valueModel: undefined
    }
  },
  computed: {
    valueFromQuery() {
      return this.name in this.$route.query
        ? this.$route.query[this.name]
        : undefined
    },
    validationRules() {
      return withoutEmptyValues({
        email: this.type === 'email',
        min: this.minLength,
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
  },
  created() {
    if (this.valueFromQuery) {
      this.valueModel = this.valueFromQuery
    }
  }
}
</script>
