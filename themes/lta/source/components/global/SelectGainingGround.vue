<template>
  <FormField
    class="select-gaining-ground"
    :inputs="[
      {
        component: 'FormSelect',
        name: 'GainingGround',
        options,
        placeholder: 'Select a state/territory'
      }
    ]"
    @change="selectedSlug = $event.target.value"
  >
    <template #after>
      <ButtonComponent
        v-show="selectedSlug"
        tag="button"
        icon="arrow-right"
        @click="goToSelectedSlug"
      />
    </template>
  </FormField>
</template>

<script setup lang="ts">
const selectedSlug = ref()

const { data: items } = await useLazyFetch('/api/stories', {
  server: false,
  query: {
    params: {
      filter_query: {
        component: {
          in: 'GainingGround'
        }
      },
      sort_by: 'name:asc'
    }
  }
})

const options = computed(() => {
  return items.value?.length
    ? items.value.map((item: any) => ({
        value: item.full_slug,
        label: item.name
      }))
    : []
})

function goToSelectedSlug() {
  if (selectedSlug.value) {
    navigateTo(`/${selectedSlug.value}`)
  }
}
</script>

<style lang="postcss" scoped>
.select-gaining-ground {
  :deep(.field) {
    @apply flex max-w-xs;

    .inputs {
      @apply flex-1 flex;
    }

    .button {
      @apply ml-2;
    }
  }
}
</style>
