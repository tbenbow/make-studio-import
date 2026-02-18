<template>
  <div
    :id="id"
    v-editable="$props"
    v-color="'yellow'"
    :id-name="idName"
    class="banner"
    :class="{
      'is-root-first-child': isRootFirstChild,
      'has-items': hasItems,
      'has-explore-the-land': hasBackgroundImageInfo,
      [`align-${align}`]: align,
      [`size-${size}`]: size,
      'dark-text': darkText,
      'dark-header-text': darkHeaderText
    }"
  >
    <client-only>
      <div
        v-if="hasBackgroundImage"
        class="background"
        :class="{
          'is-loaded': backgroundImageIsLoaded
        }"
      >
        <div class="overlay">
          <div class="gradient gradient-left" />
          <div class="gradient gradient-top" />
          <div class="gradient gradient-right-bottom" />
        </div>
        <video
          v-if="backgroundImageIsVideo"
          :src="backgroundImage.filename"
          autoplay
          loop
          muted
          playsinline
          @canplay="backgroundImageIsLoaded = true"
        />
        <nuxt-img
          v-else
          :src="backgroundImage.filename"
          :alt="backgroundImage.alt"
          :loading="backgroundImageLoadingMethod"
          v-bind="computedBackgroundImageOptions"
          @load="backgroundImageIsLoaded = true"
        />
      </div>
    </client-only>
    <font-awesome-icon
      v-if="hasBackgroundImage && !backgroundImageIsLoaded"
      class="background-loading"
      :icon="['fal', 'spinner-third']"
      spin
    />
    <div class="banner-container">
      <div class="main">
        <div class="content">
          <slot name="before" />
          <Heading
            :label="label"
            :title="title"
            :subtitle="subtitle || ''"
            :title-tag="titleTagComputed"
            :title-class="titleClass"
            :description="body"
            :align="align"
            :width="headingWidth || (align === 'center' ? undefined : 'small')"
            @id="headingId = $event"
          >
            <slot />
            <template #before-description>
              <slot name="before-body" />
            </template>
            <template #description>
              <slot name="body" />
            </template>
            <template #after-description>
              <slot name="after-body" />
            </template>
          </Heading>
          <slot name="after" />
        </div>
        <aside v-if="hasAside" class="aside">
          <RichText :document="aside" size="small" />
        </aside>
        <div v-if="items && items.length" class="items">
          <template v-for="block in items" :key="block._uid">
            <ItemCard
              v-bind="block"
              orientation="horizontal"
              align="left"
              size="small"
              title-size="small"
              body-size="xsmall"
            />
          </template>
        </div>
      </div>
    </div>
    <ExploreTheLand
      v-if="hasBackgroundImageInfo"
      :title="backgroundImage.title"
      :description="backgroundImage.name"
      :footnote="backgroundImage.copyright"
      :land-trust-id="landTrust && landTrust.id"
      :show-label="true"
      :show-trail="true"
    />
  </div>
</template>

<script>
import { mapWritableState } from 'pinia'
import { documentIsValid } from '@/components/RichText.vue'
import { useSiteStore } from '../stores/site'

export default {
  props: {
    label: String,
    title: String,
    subtitle: String,
    titleTag: String,
    body: [Object, String],
    aside: [Object, String],
    headingWidth: String,
    items: Array,
    backgroundImage: Object,
    backgroundImageOptions: Object,
    landTrust: Object,
    align: String,
    size: {
      type: String,
      validator: (value) => ['', 'large', 'small'].includes(value)
    },
    darkText: Boolean,
    darkHeaderText: Boolean,
    _editable: String
  },
  data() {
    return {
      headingId: undefined,
      backgroundImageIsLoaded: false
    }
  },
  computed: {
    ...mapWritableState(useSiteStore, ['siteHeaderInvert']),
    isRootFirstChild() {
      return (
        this.$attrs.root &&
        (this.$attrs.order === 0 || this.$attrs.order === '0') &&
        this.$route.meta.layout !== 'sidebar' // sidebar layout contains Breadcrumbs, so Banner cannot be pulled up under SiteHeader
      )
    },
    id() {
      return this.headingId?.id ? `${this.headingId.id}-banner` : undefined
    },
    idName() {
      return this.headingId?.name
    },
    titleTagComputed() {
      return this.titleTag ? this.titleTag : this.isRootFirstChild ? 'h1' : 'h2'
    },
    titleClass() {
      return this.isRootFirstChild || this.size === 'large'
        ? 'h0'
        : !this.size
        ? 'h1'
        : undefined
    },
    hasAside() {
      return documentIsValid(this.aside)
    },
    hasItems() {
      return !!(this.items && this.items.length)
    },
    hasBackgroundImage() {
      return !!(
        typeof this.backgroundImage === 'object' &&
        this.backgroundImage.filename
      )
    },
    hasBackgroundImageInfo() {
      return (
        this.hasBackgroundImage &&
        (this.backgroundImage.title ||
          this.backgroundImage.name ||
          this.backgroundImage.copyright ||
          this.landTrust?.id)
      )
    },
    backgroundImageIsVideo() {
      const fileExt =
        this.hasBackgroundImage &&
        this.backgroundImage.filename.split(/[#?]/)[0].split('.').pop().trim()

      return ['mp4'].includes(fileExt)
    },
    defaultBackgroundImageOptions() {
      const options = {
        format: 'webp',
        quality: 60,
        width: 1600,
        sizes: '2xl:100vw 2x:3200px',
        fit: 'cover',
        modifiers: { gravity: 'subject' }
      }

      if (this.size === 'large' || this.isRootFirstChild) {
        options.height = this.hasItems ? 800 : 720
      } else if (this.size === 'small') {
        options.height = this.hasItems ? 640 : 560
      } else {
        options.height = this.hasItems ? 720 : 640
      }

      return options
    },
    computedBackgroundImageOptions() {
      return lodash.merge(
        this.defaultBackgroundImageOptions,
        this.backgroundImageOptions
      )
    },
    backgroundImageLoadingMethod() {
      return this.isRootFirstChild ? 'eager' : 'lazy'
    }
  },
  beforeMount() {
    if (this.isRootFirstChild) {
      this.siteHeaderInvert = !this.darkHeaderText
    }
  },
  updated() {
    // Repeated in the `updated` hook for Storyblok preview
    if (this.isRootFirstChild) {
      this.siteHeaderInvert = !this.darkHeaderText
    }
  },
  mounted() {
    // Native `load` event doesn't fire for lazy-loaded image
    if (
      this.hasBackgroundImage &&
      this.backgroundImageLoadingMethod === 'lazy'
    ) {
      this.backgroundImageIsLoaded = true
    }
  }
}
</script>

<style lang="postcss" scoped>
.banner {
  @apply bleed-container relative bg-green-dark;

  &-container {
    @apply container;
  }

  .main {
    @apply relative flex flex-wrap gap-x-12 items-center w-full h-full py-24 lg:min-h-[640px];

    .content,
    .aside,
    .items {
      @apply w-full lg:flex-1;
    }
  }

  .content {
    --color-heading: theme('colors.stone');
    --color-body: theme('colors.white.DEFAULT');
    --color-body-2: var(--color-body);
    --color-body-3: theme('colors.white.700');
    --color-body-4: theme('colors.white.300');
    @apply py-12;

    :deep(.heading) {
      .main {
        input {
          @apply border-0;
        }
      }
    }

    :deep(.form-field) {
      .description,
      .note {
        @apply text-body;
      }
    }
  }

  .aside {
    @apply max-w-cols-5 p-8 bg-white rounded shadow-darker lg:-mb-12;
  }

  .items {
    @apply relative z-[41] grid gap-6 grid-cols-1 -mb-6 lg:grid-cols-3 lg:gap-12 lg:absolute lg:bottom-0 lg:left-0 lg:right-0;

    :deep(.item-card) {
      @apply shadow-dark;

      .main {
        @apply border-0;
      }

      .body {
        @apply mt-2;
      }
    }
  }

  .background {
    @apply hidden absolute inset-0 overflow-hidden;

    &.is-loaded {
      @apply block;
    }

    &-loading {
      @apply absolute bottom-[1rem] left-[1rem] text-lg;
    }

    img,
    video {
      @apply object-cover object-center w-full h-full;
    }

    img {
      @apply object-[60%] sm:object-center;
    }

    .overlay {
      @apply absolute inset-0 bg-black-600 lg:bg-transparent;

      .gradient {
        @apply absolute mix-blend-darken;

        &-top {
          @apply invisible h-60 w-full bg-gradient-to-b from-black opacity-87;
        }

        &-left {
          @apply invisible lg:visible h-full w-full 2xl:w-3/4 bg-gradient-to-r from-black opacity-60;
        }

        &-right-bottom {
          @apply invisible h-full w-full bg-gradient-to-280deg from-black opacity-38;
          --tw-gradient-to: rgba(theme('colors.black.DEFAULT'), 0) 11%;
        }
      }
    }
  }

  :deep(.explore-the-land) {
    @apply absolute right-0 bottom-0 z-[41];

    .label {
      --color-heading: theme('colors.stone');
    }
  }
}

/* First Element on Page */

.banner.is-root-first-child {
  .main {
    @apply pt-site-header-height lg:pb-site-header-height;
  }

  .background .overlay .gradient-top {
    @apply visible;
  }

  &.dark-header-text {
    .background .overlay .gradient-top {
      @apply opacity-100 from-white mix-blend-lighten;
    }
  }
}

/* Has Items */

.banner.has-items {
  .main {
    @apply pb-0 lg:pb-24 lg:min-h-[720px];
  }
}

/* Has Explore the Land */

.banner.has-explore-the-land {
  .main {
    @apply pr-12 md:pr-0;
  }

  .background .overlay .gradient-right-bottom {
    @apply visible;
  }

  &.has-items .main {
    @apply pr-0;

    .items {
      @apply pr-12 md:pr-0;
    }
  }
}

/* Align */

.banner.align {
  &-left {
  }

  &-center {
    .background .overlay {
      @apply bg-black-600;

      .gradient-left {
        @apply hidden;
      }
    }
  }
}

/* Size */

.banner.size-large,
.banner.banner.is-root-first-child:not(.size-small) {
  .main {
    @apply lg:min-h-[720px];
  }

  &.has-items .main {
    @apply lg:min-h-[800px];
  }
}

.banner.size-small {
  .main {
    @apply lg:min-h-[560px];
  }

  &.has-items .main {
    @apply lg:min-h-[640px];
  }
}

/* Dark Text */

.banner.dark-text {
  @apply bg-black-100;

  .content {
    --color-heading: theme('colors.green.dark');
    --color-body: theme('colors.black.DEFAULT');
    --color-body-2: var(--color-body);
  }

  :deep(.explore-the-land) {
    .label {
      --color-heading: inherit;
    }
  }
}

/* Multiple Buttons */
.banner {
  .content :deep(a.button) {
    &.variation-solid {
      @apply border-2 border-accent;
    }
    + a.button {
      @apply ml-6 mb-2;
    }
  }
}
</style>
