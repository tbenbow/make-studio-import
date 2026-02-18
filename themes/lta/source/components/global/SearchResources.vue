<template>
  <Form class="search-resources" :page="getSettingLinkUrl('rootResource')">
    <template #default="{ isSubmitting }">
      <FormField>
        <font-awesome-icon
          class="search-icon"
          :icon="['fal', 'magnifying-glass']"
        />
        <FormText
          name="query"
          placeholder="Search documents, events, courses and more…"
          @input="currentQuery = $event.target.value"
        />
        <FormSubmit
          icon="arrow-right"
          size="large"
          :submitting="isSubmitting"
          :disabled="!currentQuery || isSubmitting"
        />
      </FormField>
    </template>
  </Form>
</template>

<script>
import { mapState } from 'pinia'
import { useSettingsStore } from '@/stores/settings'

export default {
  data() {
    return {
      currentQuery: ''
    }
  },
  computed: mapState(useSettingsStore, ['getSettingLinkUrl'])
}
</script>

<style lang="postcss" scoped>
.search-resources {
  :deep(.form-field) {
    .field {
      @apply relative;
    }

    .search-icon {
      @apply absolute text-black-400 top-1/2 -translate-y-1/2 left-4;
    }

    input {
      @apply h-12 pl-12 pr-18 text-base rounded-full;
    }

    .form-submit {
      @apply absolute top-0 right-0 h-full w-18 rounded-r-full rounded-l-none disabled:opacity-100 disabled:text-black-400 disabled:bg-transparent;

      .name {
        @apply hidden;
      }
    }
  }

  :deep(.form-footer) {
    @apply hidden;
  }
}
</style>
