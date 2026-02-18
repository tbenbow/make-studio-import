<template>
  <div
    ref="root"
    v-editable="$props"
    class="breadcrumbs"
    :class="{ 'is-toggled': isToggled }"
  >
    <div class="main">
      <div class="crumbs">
        <button class="crumbs-button" @click="isToggled = !isToggled">
          <font-awesome-icon
            :icon="['fal', isToggled ? 'arrows-to-line' : 'arrows-from-line']"
            class="icon"
            :fixed-width="true"
          />
        </button>
        <transition-group name="fade" class="crumbs-list" tag="ul">
          <li
            v-for="(crumb, index) in crumbsFiltered"
            :key="`crumb-${index}`"
            :class="{ 'is-current': index === crumbsFiltered.length - 1 }"
          >
            <span v-if="index > 0" class="divider">
              <font-awesome-icon
                :icon="['fal', 'chevron-right']"
                class="divider-icon"
                :fixed-width="true"
              />
            </span>
            <NuxtLink :to="`${crumb.link}`">
              {{ crumb.name }}
            </NuxtLink>
          </li>
        </transition-group>
      </div>

      <div class="socials">
        <span class="label">Share</span>
        <ShareNetworks
          :url="shareUrl"
          :title="shareTitle"
          :description="description"
        />
      </div>

      <div v-if="linksFiltered && linksFiltered.length" class="links">
        <button class="links-button" @click="showLinks = true">
          <span v-if="activeLink">{{ activeLink.name }}</span>
          <span v-else>Jump to…</span>
          <font-awesome-icon
            class="links-button-icon"
            :icon="['fal', 'angle-down']"
          />
        </button>
        <transition name="appear-down" leave-to-class="appear-up-leave-to">
          <Popover
            v-show="showLinks"
            :active="showLinks"
            @close="showLinks = false"
          >
            <nav>
              <ul>
                <li v-for="(link, index) in linksFiltered" :key="index">
                  <LinkComponent
                    :class="{ 'is-active': link.id === activeId }"
                    :link="link.link"
                    :name="link.name"
                    @click="(_event, defaultHandler) => {
                      setActive(link.id)
                      showLinks = false
                      defaultHandler()
                    }"
                  />
                </li>
              </ul>
            </nav>
          </Popover>
        </transition>
      </div>

      <aside v-if="$slots.default" class="aside">
        <slot />
      </aside>
    </div>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { useSiteStore } from '@/stores/site'
import { useActiveScroll } from 'vue-use-active-scroll'

export default {
  props: {
    description: String,
    breadcrumbs: Array,
    links: Array,
    autoGenerateLinks: {
      type: Boolean,
      default: true
    },
    _editable: String
  },
  setup(props) {
    const rootEl = useTemplateRef('root')
    const linksGenerated = ref()
    const linksGeneratedDisplayThreshold = 4

    const linksComputed = computed(() => {
      return props.links && props.links.length
        ? props.links
        : linksGenerated.value &&
          linksGenerated.value.length &&
          linksGenerated.value.length >= linksGeneratedDisplayThreshold
        ? linksGenerated.value
        : undefined
    })

    const linksFiltered = computed(() => {
      return linksComputed.value?.length
        ? linksComputed.value.filter(
            (link) =>
              (typeof link.link === 'string' && link.link.startsWith('#')) ||
              (link.link?.url && link.link.url.startsWith('#'))
          )
        : undefined
    })

    function generateLinks() {
      const elementWithId = '[id]:not([id=""])'
      const selectors = [
        `:scope > ${elementWithId}:not(.banner.is-root-first-child)`,
        `:scope > .layout-section > .blocks > ${elementWithId}`,
        `:scope .tabs-tab.is-active .blocks > ${elementWithId}`
      ]
      const els = rootEl.value.parentElement.querySelectorAll(selectors.join(', '))

      const links = Array.from(els).map((el) => ({
        id: el.id,
        link: `#${el.id}`,
        name: el.getAttribute('id-name') || el.id
      }))

      return links
    }

    function generateAndSetLinks() {
      if (props.autoGenerateLinks) {
        linksGenerated.value = generateLinks()
      }
    }

    const targets = computed(() =>
      linksFiltered.value?.map((link) => link.id) || []
    )

    const { setActive, activeId } = useActiveScroll(targets)

    const activeLink = computed(() =>
      linksFiltered.value?.find((link) => link.id === activeId.value)
    )

    return {
      linksFiltered,
      generateAndSetLinks,
      setActive,
      activeId,
      activeLink
    }
  },
  data() {
    return {
      crumbs: [],
      isToggled: false,
      showLinks: false
    }
  },
  computed: {
    ...mapState(useSiteStore, ['isResourceCenter', 'currentStory']),
    crumbsFiltered() {
      return this.crumbs && this.crumbs.length
        ? this.crumbs.filter((crumb) => crumb.link)
        : undefined
    },
    shareUrl() {
      return `${this.$config.public.baseUrl}${this.$route.fullPath}`
    },
    shareTitle() {
      return this.crumbs?.[this.crumbs.length - 1]?.name || ''
    }
  },
  watch: {
    '$route.path'() {
      this.setOrFetchBreadcrumbs()
    }
  },
  beforeMount() {
    this.$nuxt.$on('change-tab', this.onChangeTab)
  },
  mounted() {
    this.setOrFetchBreadcrumbs()

    if (document.readyState !== 'complete') {
      window.addEventListener('load', this.generateAndSetLinks)
    } else {
      this.$nextTick(this.generateAndSetLinks)
      setTimeout(this.generateAndSetLinks, 500)
    }
  },
  beforeDestroy() {
    this.$nuxt.$off('change-tab', this.onChangeTab)
  },
  methods: {
    async setOrFetchBreadcrumbs() {
      this.crumbs =
        this.breadcrumbs && this.breadcrumbs.length
          ? this.breadcrumbs
          : await this.fetchBreadcrumbs()
    },
    async fetchBreadcrumbs() {
      try {
        const breadcrumbs = await $fetch(`/api/breadcrumbs/${this.currentStory?.full_slug}`)
        // const breadcrumbsMapi = await $fetch(`/api/breadcrumbs-mapi/${this.currentStory?.id}`)
        // Compare:
        // console.log(breadcrumbs, breadcrumbsMapi)
        // console.log(JSON.stringify(breadcrumbs.map((bc) => bc.link)) === JSON.stringify(breadcrumbsMapi.map((bc) => bc.link)))
        return this.isResourceCenter ? breadcrumbs?.slice(1) : breadcrumbs
      } catch (err) {}

      return []
    },
    onChangeTab() {
      this.$nextTick(this.generateAndSetLinks)
    }
  }
}
</script>

<style lang="postcss" scoped>
.breadcrumbs {
  @apply sticky top-0 z-40;

  .main {
    @apply bleed-container px-3 sm:px-container-padding lg:px-12 flex gap-8 items-start md:items-center bg-background border-t border-line;
    min-height: theme('height.breadcrumbs-height');

    &:after {
      @apply absolute top-full left-0 right-0 opacity-87 h-4 bg-gradient-to-b from-[var(--color-line)] pointer-events-none content-[''];
    }
  }
}

.crumbs {
  @apply flex-1 flex items-start min-w-0;

  &-button {
    @apply flex-shrink-0 relative top-1 -ml-2 px-2 py-1 text-black-600;

    .icon {
      @apply block;
    }
  }

  &-list {
    @apply flex-1 flex flex-col min-w-0;

    li {
      @apply hidden items-center min-w-0 first:min-w-auto;

      a {
        @apply relative top-px px-1 py-2 text-body-3 text-2xs uppercase tracking-wide;

        &[href] {
          @apply hover:text-accent;
          @apply transition-colors duration-200;
        }
      }

      .divider {
        @apply hidden opacity-38 flex-shrink-0 p-2;

        &-icon {
          @apply block text-xs;
        }
      }

      a {
        @apply max-w-sm truncate;
      }

      &.is-current {
        @apply flex;

        a {
          @apply inline text-body-2 font-bold;
        }
      }
    }
  }

  @screen md {
    &-button {
      @apply hidden;
    }

    &-list {
      @apply flex-row items-center;

      li {
        @apply flex pl-0;

        .divider {
          @apply block;
        }

        &:nth-child(2) {
          @apply delay-[50ms];
        }
        &:nth-child(3) {
          @apply delay-100;
        }
        &:nth-child(4) {
          @apply delay-150;
        }
        &:nth-child(5) {
          @apply delay-200;
        }
        &:nth-child(6) {
          @apply delay-[250ms];
        }
      }
    }
  }
}

.links {
  @apply relative flex-shrink-0 self-stretch w-32 md:w-60;

  &-button {
    @apply absolute left-0 top-0 bottom-0 flex items-center w-full pl-2 pr-8 border-b-2 text-xs text-left border-black-200 bg-no-repeat cursor-pointer;
    
    &-icon {
      @apply absolute right-0 top-1/2 -translate-y-1/2 mr-2;
    }

    span {
      @apply line-clamp-1;
    }

    &:hover {
      @apply border-accent;
    }
  }

  :deep(.popover) {
    @apply right-0 top-full w-80 mt-2;

    ul {
      @apply space-y-2 text-xs;
    }

    a {
      @apply transition-colors hover:text-accent;

      &.is-active {
        @apply font-bold;
      }
    }
  }
}

.socials {
  @apply hidden xl:flex items-center flex-shrink-0 text-body-3;

  .label {
    @apply relative top-px mr-3 text-2xs tracking-wide uppercase;
  }

  :deep(.socials) {
    a {
      @apply text-body-3;
    }
  }
}

.aside {
  @apply ml-12;
}

/* Is Toggled */

.breadcrumbs.is-toggled {
  .crumbs {
    &-button {
      @apply text-accent;
    }

    &-list {
      li {
        @apply flex;

        .divider {
          @apply block;
        }

        &:nth-child(3) {
          @apply pl-2;
        }

        &:nth-child(4) {
          @apply pl-4;
        }

        &:nth-child(5) {
          @apply pl-6;
        }

        &:nth-child(6) {
          @apply pl-8;
        }
      }
    }
  }
}
</style>
