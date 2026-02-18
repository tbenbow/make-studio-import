<template>
  <VeeField
    v-model="valueModel"
    v-slot="{ field, meta }"
    :name="name"
    :rules="validationRules"
    :value="value"
  >
    <select
      v-bind="field"
      v-editable="$props"
      :id="id"
      class="form-select"
      :class="{ 'invalid': meta.validated && meta.errors?.length }"
      :name="name"
      :required="required"
      :disabled="disabled"
    >
      <option v-if="!hideEmptyOption" value="" disabled selected>
        {{ placeholder }}
      </option>
      <template v-if="options && options.length">
        <option
          v-for="(option, index) in options"
          :key="index"
          :value="option.value"
        >
          {{ option.label || option.value }}
        </option>
      </template>
      <template
        v-if="optionsDatasourceEntries && optionsDatasourceEntries.length"
      >
        <option
          v-for="(option, index) in optionsDatasourceEntries"
          :key="`datasource-${index}`"
          :value="option.value"
        >
          {{ option.name || option.value }}
        </option>
      </template>
    </select>
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
    options: Array,
    optionsDatasource: String,
    hideEmptyOption: Boolean,
    required: Boolean,
    disabled: Boolean,
    _editable: String
  },
  data() {
    return {
      valueModel: undefined
    }
  },
  async setup(props) {
    const { data: optionsDatasourceEntries, execute: fetchOptionsDatasourceEntries } = await useLazyFetch('/api/datasource-entries', {
      immediate: false,
      server: false,
      query: {
        params: {
          datasource: props.optionsDatasource,
          per_page: 1000
        }
      }
    })

    return {
      fetchOptionsDatasourceEntries,
      optionsDatasourceEntries
    }
  },
  computed: {
    validationRules() {
      return withoutEmptyValues({
        required: this.required
      })
    }
  },
  mounted() {
    if (this.optionsDatasource) {
      this.fetchOptionsDatasourceEntries()
    }
  },
  watch: {
    value: {
      immediate: true,
      handler(value) {
        this.valueModel = value || ''
      }
    }
  }
}
</script>
