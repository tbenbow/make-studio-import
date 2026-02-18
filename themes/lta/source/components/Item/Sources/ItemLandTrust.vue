<template>
  <component
    :is="componentForType"
    class="item-land-trust"
    v-bind="computedProps"
    :title="title || landTrustName"
    :subtitle="subtitle || landTrustLocation"
    :image="image || landTrustImage"
    :link="link || landTrustSlug"
    :title-size="titleSize || 'small'"
  >
    <div v-if="computedAcresProtected" class="acres-protected">
      <span class="icon">
        <font-awesome-icon :icon="['fal', 'shield-plus']" fixed-width />
      </span>
      <span
        ><strong>
          <template v-if="computedAcresProtected < 1">{{
            $filters.number(computedAcresProtected, '0.00')
          }}</template>
          <template v-else>{{
            $filters.number(computedAcresProtected, '0,0')
          }}</template></strong
        >
        <template v-if="displayAcresProtectedInArea"
          > acres protected in {{ displayAcresProtectedInArea }}</template
        >
        <template v-else> total acres protected</template>
      </span>
    </div>
    <template
      v-if="
        displayAttributes &&
        (landTrustHasFeatures ||
          landTrustHasProtects ||
          landTrustHasContacts)
      "
      #footer
    >
      <div class="footer-main">
        <ul v-if="landTrustHasFeatures" class="attributes">
          <li
            v-for="(feature, index) in landTrustFeaturesTrueOnly"
            :key="index"
            v-tooltip="getAttribute(`features.${feature.key}`, 'name')"
            class="attribute"
          >
            <span class="icon">
              <font-awesome-icon
                :class="`text-${getAttribute(
                  `features.${feature.key}`,
                  'color'
                )}`"
                :icon="[
                  'fal',
                  getAttribute(`features.${feature.key}`, 'icon') || 'empty-set'
                ]"
                fixed-width
              />
            </span>
          </li>
        </ul>
        <ul v-if="landTrustHasProtects" class="attributes">
          <li
            v-for="(protect, index) in landTrustProtectsTrueOnly"
            :key="index"
            v-tooltip="getAttribute(`protects.${protect.key}`, 'name')"
            class="attribute"
          >
            <span class="icon">
              <font-awesome-icon
                :class="`text-${getAttribute(
                  `protects.${protect.key}`,
                  'color'
                )}`"
                :icon="[
                  'fal',
                  getAttribute(`protects.${protect.key}`, 'icon') || 'empty-set'
                ]"
                fixed-width
              />
            </span>
          </li>
        </ul>
      </div>
      <ul v-if="landTrustHasContacts" class="contacts">
        <li v-if="landTrustContact?.websiteUrl" class="contact">
          <a
            :href="`http://${landTrustContact.websiteUrl}`"
            target="_blank"
            title="Visit website"
            ><font-awesome-icon :icon="['fal', 'browser']"
          /></a>
        </li>
      </ul>
    </template>
  </component>
</template>

<script>
import { mapState } from 'pinia'
import { useSettingsStore } from '@/stores/settings'
import ItemMixin from '@/mixins/Item.mixin'
import SourceInstanceMixin from '@/mixins/SourceInstance.mixin'

export default {
  mixins: [ItemMixin, SourceInstanceMixin],
  props: {
    displayAcresProtectedInArea: String,
    displayAttributes: {
      type: Boolean,
      default: true
    }
  },
  setup(props) {
    const landTrust = useLandTrust(transform.storyblokToComponentProps(props.source))

    return {
      landTrust: landTrust,
      landTrustName: landTrust.name,
      landTrustLocation: landTrust.location,
      landTrustHasFeatures: landTrust.hasFeatures,
      landTrustFeaturesTrueOnly: landTrust.featuresTrueOnly,
      landTrustHasProtects: landTrust.hasProtects,
      landTrustProtectsTrueOnly: landTrust.protectsTrueOnly,
      landTrustHasContacts: landTrust.hasContacts,
      landTrustContact: landTrust.contact,
      landTrustImage: landTrust.imageOrDefaultUrl.value
        ? { filename: landTrust.imageOrDefaultUrl.value, alt: landTrust.name.value }
        : undefined,
      landTrustSlug: landTrust.sys?.full_slug
        ? `/${landTrust.sys.full_slug}`
        : undefined
    }
  },
  computed: {
    ...mapState(useSettingsStore, ['getAttribute']),
    acresProtectedInArea() {
      return this.landTrust.area?.length &&
        this.landTrust.area.find(
          (area) => area.abbrev === this.displayAcresProtectedInArea
        )
        ? this.landTrust.area.find(
            (area) => area.abbrev === this.displayAcresProtectedInArea
          ).acresProtected
        : 0
    },
    computedAcresProtected() {
      return this.displayAcresProtectedInArea
        ? this.acresProtectedInArea
        : this.landTrust.acresProtected
    }
  }
}
</script>

<style lang="postcss" scoped>
.item-land-trust {
}

.icon {
  @apply flex items-center h-8 text-lg;
}

.acres-protected {
  @apply flex items-center text-sm md:text-base text-green;

  .icon {
    @apply mr-2;
  }
}

:deep(.footer) {
  @apply flex flex-wrap;

  &-main {
    @apply flex-1 flex flex-wrap;

    .attributes + .attributes {
      @apply ml-3 pl-3 border-l border-l-line;
    }
  }
}

.attributes {
  @apply flex gap-2;

  .attribute {
    .icon {
      @apply text-lg;
    }
  }
}

.contacts {
  @apply flex gap-2;

  .contact {
    @apply text-sm;

    a {
      @apply flex items-center justify-center h-8 w-8 text-body bg-line rounded-full hover:bg-green hover:text-white;
    }
  }
}

/* Card */

.item-land-trust.item-card,
.item-land-trust.item-card.orientation-horizontal {
  /**
   * When land trust cards are in a grid, this allows the headers to assume the
   * same height, allowing the bottom part of the card (acres protected,
   * features, contact) to remain aligned across the row.
   */
  :deep(.main) {
    .header {
      @apply flex-1;
    }
  }
}
</style>
