<template>
  <div
    class="form-field"
    v-editable="$props"
    :class="{
      [`width-${width}`]: width,
      'is-disabled': disabled,
      'is-inline': inline,
      'is-inline-flip': inlineFlip,
      'is-inputs-inline': inputsInline
    }"
  >
    <label
      v-if="label || $slots.label || description || $slots.description"
      class="label"
      :class="labelClass"
      :for="inputId"
    >
      <div v-if="label || $slots.label" class="label-text">
        <slot name="label" v-bind="{ label, inputsRequired }">
          <span
            >{{ label }}
            <strong
              v-if="inputsRequired"
              class="label-text-required"
              title="Required"
              >*</strong
            >
          </span>
        </slot>
      </div>
      <div v-if="description || $slots.description" class="label-description">
        <slot name="description" v-bind="{ description }">
          {{ description }}
        </slot>
      </div>
    </label>
    <div class="field" :class="fieldClass">
      <slot v-bind="{ disabled, inputId }">
        <div v-if="inputs && inputs.length" class="inputs">
          <template v-for="(input, index) in inputs" :key="index">
            <component
              :is="input.component || 'FormText'"
              v-bind="input"
              :id="input.id || inputId"
              :submitting="submitting"
              :disabled="input.disabled || disabled"
            />
          </template>
        </div>
      </slot>
      <slot name="after" />
    </div>
    <div v-if="note" class="note">
      {{ note }}
    </div>
    <ul
      v-if="errorsArray && errorsArray.length"
      class="errors"
    >
      <li v-for="(error, index) in errorsArray" :key="index">
        <font-awesome-icon class="mr-1" :icon="['fal', 'circle-exclamation']" />
        {{ error }}
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  props: {
    label: String,
    labelClass: String,
    fieldClass: String,
    description: String,
    id: String,
    submitting: Boolean,
    disabled: Boolean,
    note: String,
    inline: Boolean,
    inlineFlip: Boolean,
    inputs: Array,
    inputsInline: Boolean,
    anyInputsInline: Boolean,
    width: {
      type: String,
      validator: (value) =>
        !value || ['xsmall', 'small', 'medium', 'large'].includes(value)
    },
    errors: {
      type: Object,
      default: () => ({})
    },
    _editable: String
  },
  setup(props) {
    const id = useId().replace('_', '-')
    const inputId = props.id || `form-field-${id}`

    return {
      inputId
    }
  },
  computed: {
    inputsRequired() {
      return (
        this.inputs &&
        this.inputs.length &&
        this.inputs.some((input) => input.required === true)
      )
    },
    inputsNames() {
      return Array.isArray(this.inputs)
        ? this.inputs.map((input) => input.name)
        : []
    },
    errorsArray() {
      return Object.entries(this.errors)
        .filter(([key, _value]) => this.inputsNames.includes(key))
        .map(([_key, value]) => value)
    }
  }
}
</script>

<style lang="postcss" scoped>
.form-field {
  @apply flex flex-col;
}

.label {
  @apply mb-3;

  &-text {
    @apply flex items-center gap-x-2;

    &-required {
      @apply text-accent text-lg leading-[0] align-middle;
    }

    :deep(.pill) {
      @apply -mt-px;
    }
  }

  &-description {
    @apply text-body-3 text-xs font-normal;
  }

  &-text + &-description {
    @apply mt-2;
  }
}

.inputs {
  @apply flex flex-col gap-x-8 gap-y-2;
}

.note {
  @apply mt-2 text-2xs text-body-3;
}

.errors {
  @apply mt-2 text-xs text-extra-1;
}

/* Width */

.form-field.width {
  &-xsmall {
    @apply max-w-cols-2;
  }

  &-small {
    @apply max-w-cols-4;
  }

  &-medium {
    @apply max-w-cols-6;
  }

  &-large {
    @apply max-w-cols-9;
  }
}

/* Is Disabled */

.form-field.is-disabled {
  .label {
    @apply cursor-not-allowed;

    &,
    svg,
    &-description {
      @apply text-black-400;
    }
  }
}

/* Is Inline */

.form-field.is-inline,
.form-field.is-inline-flip {
  @apply flex-row items-center;

  .label {
    @apply flex-1 mb-0 mr-3 font-normal;
  }

  .field {
    @apply flex-shrink-0;
  }
}

/* Is Inline (Flip) */

.form-field.is-inline-flip {
  .label {
    @apply order-2 ml-3 mr-0;
  }

  .field {
    @apply order-1 self-start;
  }
}

/* Is Inputs Inline */

.form-field.is-inputs-inline {
  .inputs {
    @apply sm:flex-row sm:flex-wrap;

    > * {
      @apply sm:flex-1;
    }
  }
}
</style>
