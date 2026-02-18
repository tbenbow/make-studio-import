<template>
  <component
    :is="componentForType"
    class="item-contact"
    v-bind="computedProps"
    :title="title || contactName"
    :subtitle="subtitle || contactTitle"
    :image="image || contactImage"
  >
    <template #after-body>
      <nav class="contact-buttons">
        <ButtonComponent
          v-if="contactPhone"
          :link="contactPhoneLink"
          name="Phone"
          icon="phone"
          :size="bodySize"
        />
        <ButtonComponent
          v-if="contactEmail"
          :link="`mailto:${contactEmail}`"
          name="Email"
          icon="envelope"
          :size="bodySize"
        />
      </nav>
    </template>
  </component>
</template>

<script>
import ItemMixin from '@/mixins/Item.mixin'
import SourceInstanceMixin from '@/mixins/SourceInstance.mixin'

export default {
  mixins: [ItemMixin, SourceInstanceMixin],
  setup(props) {
    const contact = useContact(transform.storyblokToComponentProps(props.source))

    return {
      contact,
      contactName: contact.sys?.name,
      contactTitle: contact.title,
      contactImage: contact.image,
      contactEmail: contact.email,
      contactPhone: contact.phone,
      contactPhoneLink: contact.phoneLink
    }
  }
}
</script>

<style lang="postcss" scoped>
.item-contact {
  :deep(.figure) {
    img {
      @apply rounded-full;
    }
  }
}

.contact-buttons {
  @apply flex flex-wrap gap-2;
}
</style>
