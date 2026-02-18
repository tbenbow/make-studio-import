<template>
  <div
    v-editable="$props"
    :id="id"
    class="form-radio"
    :class="{ 'display-inline': displayInline }"
  >
    <template v-if="valueArray && valueArray.length">
      <div
        v-for="(itemValue, index) in valueArray"
        :key="index"
        class="form-radio-item"
      >
        <VeeField
          v-model="valueModel"
          v-slot="{ field, meta }"
          type="radio"
          :name="name"
          :rules="validationRules"
          :value="itemValue"
        >
          <input
            v-bind="field"
            :id="itemValue"
            :class="{ 'invalid': meta.validated && meta.errors?.length }"
            :name="name"
            :value="itemValue"
            type="radio"
            :required="required"
            :disabled="disabled"
          />
        </VeeField>
        <label v-if="itemValue" class="value" :for="itemValue">{{
          itemValue
        }}</label>
      </div>
    </template>
  </div>
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
      type: [String, Array],
      required: true
    },
    displayInline: Boolean,
    checked: [Boolean, String],
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
    valueArray() {
      return typeof this.value === 'string'
        ? this.value.split(/\r?\n/)
        : this.value
    },
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
        if (checked && this.valueArray && this.valueArray.length) {
          this.valueModel =
            typeof this.checked === 'boolean' ? this.valueArray[0] : checked
        } else {
          this.valueModel = undefined
        }
      }
    }
  }
  /* created() {
    if (this.checked && this.valueArray && this.valueArray.length) {
      this.valueModel =
        typeof this.checked === 'boolean' ? this.valueArray[0] : this.checked
    }
  } */
}
</script>

<style lang="postcss" scoped>
.form-radio {
  @apply flex flex-col gap-y-2;

  &-item {
    @apply flex gap-2;

    input {
      @apply flex-shrink-0;
    }

    .value {
      @apply pt-[0.1875rem] text-body text-sm leading-tight font-normal;
    }
  }
}

/* Display Inline */

.form-radio.display-inline {
  @apply sm:flex-row sm:flex-wrap sm:gap-x-8;
}
</style>
