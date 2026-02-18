<template>
  <div
    v-editable="$props"
    :id="id"
    class="form-slider"
    :class="{ 'show-marks': marksParsed }"
  >
    <VeeField
      v-model="valueModel"
      v-slot="{ field, meta, validate }"
      :name="name"
      :rules="validationRules"
      :value="value"
    >
      <input
        v-bind="field"
        :name="name"
        type="hidden"
        :required="required"
        :disabled="disabled"
      />
      <vue-slider
        v-model="valueModel"
        :class="{ 'invalid': meta.validated && meta.errors?.length }"
        :dot-size="24"
        :height="8"
        :silent="true"
        :contained="true"
        :min="min ? parseInt(min) : undefined"
        :max="max ? parseInt(max) : undefined"
        :interval="interval ? parseInt(interval) : undefined"
        :data="dataParsed || undefined"
        :adsorb="adsorb"
        :marks="marksParsed || undefined"
        :disabled="disabled"
        :tooltip="tooltip || undefined"
        :tooltip-placement="tooltipPlacement || undefined"
        :tooltip-formatter="tooltipFormatter"
        @change="$emit('change', $event) && $emit('input', $event)"
      />
    </VeeField>
  </div>
</template>

<script>
import VueSlider from 'vue-3-slider-component'

export default {
  components: { VueSlider },
  props: {
    id: String,
    name: {
      type: String,
      required: true
    },
    value: [String, Number],
    min: [String, Number],
    max: [String, Number],
    interval: [String, Number],
    data: String,
    adsorb: Boolean,
    marks: String,
    tooltip: {
      type: String,
      validator: (value) => {
        return (
          !value ||
          ['none', 'always', 'hover', 'focus', 'active'].includes(value)
        )
      }
    },
    tooltipPlacement: {
      type: String,
      validator: (value) => {
        return !value || ['top', 'right', 'bottom', 'left'].includes(value)
      }
    },
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
    dataParsed() {
      // Return format:
      // [{ id: 1, name: 'A' }, { id: 2, name: 'B' }]

      const dataParsed =
        this.data &&
        this.data.split('\n').map((value) => {
          const valueSplit = value.split(':')

          return valueSplit.length > 1
            ? { value: valueSplit[0].trim(), label: valueSplit[1].trim() }
            : { value, label: value }
        })
      // console.log('dataParsed', dataParsed)

      return dataParsed
    },
    marksParsed() {
      // Return formats:
      // { 'A': 'Label A', 'B': 'Label B' }

      const marksParsed = {}

      if (this.marks) {
        this.marks.split(/\r?\n/).forEach((value) => {
          const valueSplit = value.split(':')

          return valueSplit.length > 1
            ? (marksParsed[valueSplit[0].trim()] = valueSplit[1].trim())
            : (marksParsed[value] = value)
        })
      }
      // console.log('marksParsed', marksParsed)

      return marksParsed
    },
    validationRules() {
      return withoutEmptyValues({
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
  methods: {
    tooltipFormatter(value) {
      return lodash.isNumber(value)
        ? this.$filters.number(value, '0,0')
        : typeof value === 'string' && value
        ? value
        : '—'
    }
  }
}
</script>

<style lang="postcss">
.form-slider {
}

/* Show Marks */

.form-slider.show-marks {
  @apply mb-7;
}
</style>
