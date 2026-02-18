<template>
  <div class="affiliate">
    <Blocks :root="true">
      <slot />
      <div class="heading flex flex-col lg:flex-row gap-8">
        <Heading class="flex-1" label="Affiliate Member" :title="sys?.name" title-tag="h1">
          <template #label>
            <div class="label flex items-center gap-6">
              <Label name="Affiliate Member" />
              <span v-if="type" class="type">{{ type }}</span>
            </div>
          </template>
        </Heading>
        <div v-if="imageUrl" class="w-56 lg:self-center">
          <Logo :image="{ filename: imageUrl }" :name="sys?.name" />
        </div>
      </div>
      <div class="main">
        <div class="content">
          <Field
            v-if="(location && location.length) || locationRemote"
            icon="location-dot"
            label="Location"
            :display-inline="true"
          >
            {{ locationOrRemote }}
          </Field>
          <Field
            v-if="expertise && expertise.length"
            class="mt-8 first:mt-0"
            icon="star"
            label="Expertise"
            :display-inline="true"
          >
            <ul v-if="expertise && expertise.length" class="expertises">
              <li
                v-for="(expertise, index) in expertise"
                :key="index"
                class="expertise"
              >
                {{ expertise }}
              </li>
            </ul>
          </Field>
          <Field
            v-if="description"
            class="mt-12 first:mt-0"
            label="Description"
          >
            <RichText :document="descriptionAsRichText" />
          </Field>
        </div>
        <aside class="sidebar">
          <Aside title="Affiliate Details">
            <address v-if="address" class="h-card text-sm leading-normal">
              <div class="p-name">{{ sys?.name }}</div>
              <div v-if="address.street" class="p-street-address">
                {{ address.street }}<br />
                <template v-if="address.street2">
                  {{ address.street2 }}<br />
                </template>
              </div>
              <template v-if="address.city">
                <span class="p-locality">{{ address.city }}</span
                >,
              </template>
              <span v-if="address.state" class="p-region">
                {{ address.state }}
              </span>
              <span v-if="address.zip" class="p-postal-code">
                {{ address.zip }}
              </span>
            </address>
            <template v-if="contact" #items>
              <AsideItem
                v-if="contact.phone"
                icon="phone"
                :link="telLink(contact.phone)"
                >{{ contact.phone }}</AsideItem
              >
              <AsideItem
                v-if="contact.email"
                icon="envelope"
                :link="`mailto:${contact.email}`"
                :title="contact.email"
                >Email</AsideItem
              >
              <AsideItem
                v-if="contact.websiteUrl"
                icon="browser"
                :link="contact.websiteUrl"
                >Website</AsideItem
              >
              <AsideItem v-if="contactSocial.length" icon="comment">
                <Socials
                  class="text-lg"
                  :social-links="Object.values(contactSocial)"
                />
              </AsideItem>
            </template>
          </Aside>
        </aside>
      </div>
      <slot name="after" />
    </Blocks>
  </div>
</template>

<script setup lang="ts">
import type { AffiliateProps } from '~/composables/content-types/useAffiliate'

const props = defineProps<AffiliateProps>()

const {
  locationOrRemote,
  descriptionAsRichText,
  contactSocial,
  telLink
} = useAffiliate(props)
</script>

<style lang="postcss" scoped>
.affiliate {
}

:deep(.heading) {
  .type {
    @apply relative top-px text-accent text-xs font-bold uppercase tracking-wide;
  }
}

.main {
  @apply grid gap-12 grid-cols-1 lg:grid-cols-12 pt-8 border-t border-black-200;

  .content {
    @apply lg:col-span-8;
  }

  .sidebar {
    @apply lg:col-span-4 lg:-mt-14;
  }
}

.expertises {
  @apply flex flex-wrap items-center gap-x-3 gap-y-2;
}

.expertise {
  @apply px-3 py-1 text-white text-xs font-bold bg-blue rounded-full;
}
</style>
