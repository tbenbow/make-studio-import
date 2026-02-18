<template>
  <div v-editable="$props" class="newsroom">
    <Blocks :root="true">
      <Heading title="Newsroom" title-tag="h1" />
      <div class="main">
        <div class="content">
          <Blocks v-if="blocks && blocks.length" :blocks="blocks" />
        </div>
        <aside class="sidebar">
          <Aside v-if="hasContact" title="Media Contact">
            <RichText
              v-if="contactDescription"
              :document="contactDescription"
              size="small"
            />
            <template #items>
              <AsideItem
                v-if="contact.content.phone"
                icon="phone"
                :link="telLink(contact.content.phone)"
                >{{ contact.content.phone }}</AsideItem
              >
              <AsideItem
                v-if="contact.content.email"
                icon="envelope"
                :link="`mailto:${contact.content.email}`"
                :title="contact.content.email"
                >{{ contact.content.email }}</AsideItem
              >
            </template>
          </Aside>
          <Aside v-if="hasKit" class="mt-6" title="Media Kit">
            <RichText
              v-if="kitDescription"
              :document="kitDescription"
              size="small"
            />
            <template #items>
              <AsideItem icon="file-arrow-down" :link="kit.filename"
                >Download Media Kit</AsideItem
              >
            </template>
          </Aside>
        </aside>
      </div>
    </Blocks>
  </div>
</template>

<script>
import { parsePhoneNumberWithError } from 'libphonenumber-js'

export default {
  props: {
    blocks: Array,
    contact: Object,
    contactDescription: [Object, String],
    kit: Object,
    kitDescription: [Object, String],
    _editable: String
  },
  computed: {
    hasContact() {
      return this.contact?.content
    },
    hasKit() {
      return this.kit?.filename
    }
  },
  methods: {
    telLink(phoneNumber) {
      try {
        return parsePhoneNumberWithError(phoneNumber, 'US').getURI()
      } catch (err) {}
    }
  }
}
</script>

<style lang="postcss" scoped>
.newsroom {
}

.main {
  @apply grid gap-12 grid-cols-1 lg:grid-cols-12;

  .content {
    @apply lg:col-span-8;
  }

  .sidebar {
    @apply lg:col-span-4;
  }
}
</style>
