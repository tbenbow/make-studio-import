<template>
  <div v-if="!isExpired" class="alert">
    <div v-color="alertType.color" class="main">
      <div class="type">
        <IconBlob :icon="alertType.icon" size="small" />
        {{ alertType.label }}
      </div>
      <p class="body">{{ body }}</p>
    </div>
    <aside class="aside">
      <ButtonComponent :name="buttonName" :link="buttonLink" icon="arrow-right" />
    </aside>
  </div>
</template>

<script>
export const types = {
  default: {
    label: 'Alert',
    icon: 'bullhorn',
    color: 'yellow'
  },
  notice: {
    label: 'Notice',
    icon: 'circle-exclamation',
    color: 'extra-1'
  },
  info: {
    label: 'Info',
    icon: 'circle-info',
    color: 'green'
  }
}

export default {
  props: {
    type: {
      type: String,
      validator: (value) => !value || Object.keys(types).includes(value)
    },
    body: String,
    buttonLink: [Object, String],
    buttonName: String,
    expirationDate: String,
    _editable: String
  },
  computed: {
    isExpired() {
      return new Date(this.expirationDate) < new Date()
    },
    alertType() {
      return Object.keys(types).includes(this.type)
        ? types[this.type]
        : types.default
    }
  }
}
</script>

<style lang="postcss" scoped>
.alert {
  @apply p-4 text-sm leading-normal rounded bg-green-dark text-white flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6;

  .main {
    @apply flex-1 flex flex-col md:flex-row md:items-center md:gap-6;

    .type {
      @apply self-stretch;
    }
  }

  .aside {
    @apply self-end lg:self-auto;
  }
}

.type {
  @apply relative flex items-center py-2 pl-12 md:pl-7 pr-6 uppercase tracking-wide flex-shrink-0 text-accent font-bold md:border-r md:border-accent;

  :deep(.icon-blob) {
    @apply absolute left-0 md:-left-7 top-1/2 -translate-y-1/2;
  }
}

.body {
  @apply pr-6 py-2;
}
</style>
