<template>
  <div v-editable="$props" class="press-release">
    <Blocks :root="true">
      <Breadcrumbs />
      <Heading
        label="Press Release"
        :title="sys.name"
        title-tag="h1"
        :subtitle="subtitle"
        width="large"
      />
      <div class="main">
        <aside class="aside">
          <div class="date">
            {{ publishDateFormatted }}
          </div>
          <Field
            v-if="contacts && contacts.length"
            class="mt-6"
            label="Contact"
            icon="user"
          >
            <ul class="space-y-3">
              <li
                v-for="(contact, index) in contacts"
                :key="index"
                class="text-xs"
              >
                <template v-if="contact.content">
                  <div>
                    <strong>{{ contact.name }}</strong>
                  </div>
                  <div v-if="contact.content.title">
                    <em>{{ contact.content.title }}</em>
                  </div>
                  <div v-if="contact.content.phone">
                    {{ contact.content.phone }}
                  </div>
                  <div v-if="contact.content.email" class="truncate">
                    <a :href="`mailto:${contact.content.email}`">{{
                      contact.content.email
                    }}</a>
                  </div>
                </template>
              </li>
            </ul>
          </Field>
        </aside>
        <div class="content">
          <Asset
            v-if="hasImage"
            class="image"
            v-bind="image as object"
            :image-options="{ width: 1032 }"
          />
          <div class="body">
            <RichText :document="body" :loose="true" />
          </div>
        </div>
      </div>
    </Blocks>
  </div>
</template>

<script setup lang="ts">
import type { PressReleaseProps } from '~/composables/content-types/usePressRelease'

const props = defineProps<PressReleaseProps>()

const {
  publishDateFormatted,
  hasImage
} = usePressRelease(props)
</script>

<style lang="postcss" scoped>
.press-release {
}

.main {
  @apply grid gap-12 grid-cols-1 lg:grid-cols-12;

  .content {
    @apply lg:col-span-10;

    .body {
      @apply lg:grid lg:grid-cols-10 lg:gap-12;

      :deep(> .rich-text) {
        @apply lg:col-span-8;
      }
    }
  }

  .aside {
    @apply lg:col-span-2;
  }
}

.content {
  :deep(.image) {
    @apply mb-12 rounded-lg;
  }
}

.date {
  @apply py-2 text-sm font-bold uppercase tracking-wide;
}
</style>
