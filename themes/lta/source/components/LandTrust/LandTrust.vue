<template>
  <div class="land-trust">
    <Blocks :root="true">
      <Banner
        :title="name"
        :background-image="{ filename: imageOrDefaultUrl, name: imageCredit }"
        label="Land Trust"
        size="large"
        :root="true"
        :order="0"
      >
        {{ name }}
        <font-awesome-icon v-if="gem" class="gem" :icon="['fas', 'gem']" />
      </Banner>
      <Breadcrumbs
        :breadcrumbs="[
          {
            name: 'Find a Land Trust',
            link: '/land-trusts'
          },
          {
            name: 'Explore Land Trusts',
            link: getSettingLinkUrl('rootLandTrust')
          },
          {
            name: name,
            link: $route.fullPath
          }
        ]"
        :description="description"
      />
      <div class="main">
        <div class="content">
          <nuxt-img
            v-if="logoUrl"
            class="logo"
            :src="logoUrl"
            height="192"
            loading="lazy"
          />
          <ul class="icon-list">
            <li>
              <font-awesome-icon :icon="['fal', 'alliance']" class="icon" />
              <span>Alliance Member</span>
            </li>
            <li
              v-if="accredited"
              v-tooltip="getAttribute('accredited', 'description')"
            >
              <font-awesome-icon
                :icon="['fal', getAttribute('accredited', 'icon')]"
                class="icon"
              />
              <span>{{ getAttribute('accredited', 'name') }}</span>
            </li>
            <li
              v-if="terrafirmaInsured"
              v-tooltip="getAttribute('terrafirmaInsured', 'description')"
            >
              <font-awesome-icon
                :icon="['fal', getAttribute('terrafirmaInsured', 'icon')]"
                class="icon"
              />
              <span>{{ getAttribute('terrafirmaInsured', 'name') }}</span>
            </li>
            <li v-if="nrcs" v-tooltip="getAttribute('nrcs', 'description')">
              <font-awesome-icon
                :icon="['fal', getAttribute('nrcs', 'icon')]"
                class="icon"
              />
              <span>{{ getAttribute('nrcs', 'name') }}</span>
            </li>
          </ul>
          <RichText v-if="description" size="large"
            ><p>{{ decode(description) }}</p></RichText
          >
          <div v-if="area && area.length" class="mt-12">
            <HeadingSimple title="Land Protected" />
            <AreaRow
              v-if="isNational"
              class="mt-8"
              state-name="United States"
              state-code="US"
              :acres="acresProtected"
            />
            <AreaRow
              v-for="location in area"
              v-else
              :key="location.name"
              class="mt-8"
              :state-name="location.name"
              :state-code="location.abbrev"
              :acres="location.acresProtected"
              :acres-details="location.acresProtectedDetails"
              :counties="location.counties"
            />
          </div>
          <div v-if="demographics" class="mt-12">
            <HeadingSimple title="Demographics" />
            <List class="mt-3">
              <ListItem v-if="demographics.yearFounded && Number(demographics.yearFounded) > 0" label="Year founded"
                ><p>{{ demographics.yearFounded }}</p></ListItem
              >
              <ListItem
                v-if="demographics.yearFirstJoined && Number(demographics.yearFirstJoined) > 0"
                label="Year first joined"
                ><p>{{ demographics.yearFirstJoined }}</p></ListItem
              >
              <ListItem
                v-if="demographics.adopted2017Standards"
                label="Adopted 2017 Standards & Practices"
                ><p>
                  {{ demographics.adopted2017Standards ? 'Yes' : 'No' }}
                </p></ListItem
              >
              <ListItem
                v-if="demographics.fullTimeStaff"
                label="Number of full-time staff"
                ><p>
                  {{ $filters.number(demographics.fullTimeStaff, '0,0') }}
                </p></ListItem
              >
              <ListItem
                v-if="demographics.supporters"
                label="Number of supporters"
                ><p>{{ $filters.number(demographics.supporters, '0,0') }}</p></ListItem
              >
              <ListItem
                v-if="demographics.activeVolunteers"
                label="Number of volunteers"
                ><p>
                  {{ $filters.number(demographics.activeVolunteers, '0,0') }}
                </p></ListItem
              >
              <ListItem
                v-if="demographics.boardMembers"
                label="Number of board members"
                ><p>
                  {{ $filters.number(demographics.boardMembers, '0,0') }}
                </p></ListItem
              >
            </List>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-12 mt-12">
            <div v-if="hasFeatures">
              <HeadingSimple title="Features" title-tag="h5" />
              <Item
                v-for="(feature, index) in featuresTrueOnly"
                :key="index"
                class="item-attribute mt-6"
                :icon="
                  getAttribute(`features.${feature.key}`, 'icon') || 'empty-set'
                "
                :title="getAttribute(`features.${feature.key}`, 'name')"
                orientation="horizontal"
                size="small"
                :accent-color="getAttribute(`features.${feature.key}`, 'color')"
                title-size="small"
                body-size="xsmall"
              >
                <p>
                  {{ getAttribute(`features.${feature.key}`, 'description') }}
                </p>
              </Item>
            </div>
            <div v-if="hasProtects">
              <HeadingSimple title="Conservation Priorities" title-tag="h5" />
              <Item
                v-for="(protect, index) in protectsTrueOnly"
                :key="index"
                class="item-attribute mt-6"
                :icon="
                  getAttribute(`protects.${protect.key}`, 'icon') || 'empty-set'
                "
                :title="getAttribute(`protects.${protect.key}`, 'name')"
                orientation="horizontal"
                size="small"
                :accent-color="getAttribute(`protects.${protect.key}`, 'color')"
                title-size="small"
                body-size="xsmall"
              >
                <p>
                  {{ getAttribute(`protects.${protect.key}`, 'description') }}
                </p>
              </Item>
            </div>
          </div>
        </div>

        <div class="sidebar">
          <div class="sticky top-12">
            <Aside title="Contact">
              <address v-if="address" class="h-card text-sm leading-normal">
                <div class="p-name">{{ name }}</div>
                <div v-if="address.street" class="p-street-address">
                  {{ address.street }}<br />
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
              <template v-if="contact">
                <div class="flex flex-wrap gap-x-4 gap-y-2 mt-6">
                  <ButtonComponent
                    v-if="contact.websiteUrl"
                    :link="contact.websiteUrl"
                    name="Website"
                    color="green"
                    icon="browser"
                  />
                  <ButtonComponent
                    v-if="contact.donate_url"
                    :link="contact.donate_url"
                    name="Donate"
                    color="green"
                    variation="outline"
                  />
                </div>
              </template>
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
                <AsideItem v-if="contactSocial.length" icon="comment">
                  <Socials
                    class="text-lg"
                    :social-links="Object.values(contact.social)"
                  />
                </AsideItem>
              </template>
            </Aside>
            <div
              v-if="getSettingLinkUrl('rootLandTrustUpdate')"
              class="mt-6 px-12"
            >
              <ButtonComponent
                :link="getSettingLinkUrl('rootLandTrustUpdate')"
                name="Log in to update your land trust profile"
                :icon="null"
                variation="solid-transparent"
                size="small"
              />
            </div>
          </div>
        </div>
      </div>
      <slot />
    </Blocks>
  </div>
</template>

<script setup lang="ts">
import type { LandTrustProps } from '~/composables/content-types/useLandTrust'
import { useSettingsStore } from '~/stores/settings'

const props = defineProps<LandTrustProps>()

const {
  name,
  isNational,
  featuresTrueOnly,
  hasFeatures,
  protectsTrueOnly,
  hasProtects,
  imageOrDefaultUrl,
  contactSocial,
  decode,
  telLink
} = useLandTrust(props)

const settingsStore = useSettingsStore()
const { getAttribute, getSettingLinkUrl } = storeToRefs(settingsStore)
</script>

<style lang="postcss" scoped>
.land-trust {
}

:deep(.banner) {
  .title {
    .gem {
      @apply text-ruby text-[65%];
    }
  }
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

.logo {
  @apply max-h-[6rem] max-w-[12rem] mb-6;
}

.icon-list {
  @apply flex flex-wrap items-center gap-x-8 gap-y-4 mb-6;

  li {
    @apply uppercase font-bold tracking-wide text-accent text-xs;

    &.v-popper--has-tooltip {
      @apply cursor-help;
    }
  }

  .icon {
    @apply text-sm mr-1;
  }
}

:deep(.item-attribute) {
  .main > .body {
    --color-body-2: var(--color-body-3);
    @apply mt-1;
  }
}
</style>
