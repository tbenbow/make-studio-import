<template>
  <div
    v-editable="$props"
    class="menu"
    :class="{ tight: tight, panel: panel, 'is-loading': isLoading }"
  >
    <ButtonComponent
      v-if="computedTitleLink"
      class="title"
      variation="link"
      :link="computedTitleLink"
      :name="computedTitle"
    />
    <h6 v-else-if="computedTitle" class="title">{{ computedTitle }}</h6>
    <font-awesome-icon
      v-if="isLoading"
      class="loading-icon"
      :icon="['fal', 'spinner-third']"
      :spin="true"
    />
    <nav v-if="computedItems && computedItems.length" class="items">
      <MenuItem
        v-for="(item, index) in computedItems"
        :key="index"
        v-bind="item"
        :menu="showActiveSubMenus && item.menu ? item.menu : undefined"
      />
    </nav>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { useSiteStore } from '../stores/site'

export default {
  props: {
    root: [Object, String],
    title: String,
    titleLink: [Object, String],
    items: Array,
    showActiveSubMenus: Boolean,
    tight: Boolean,
    panel: Boolean,
    _editable: String
  },
  setup(props) {
    const { isValid } = useLinkHelper(props.titleLink)

    return {
      titleLinkIsValid: isValid.value
    }
  },
  data() {
    return {
      isLoading: false,
      rootStory: undefined,
      rootItems: undefined
    }
  },
  computed: {
    ...mapState(useSiteStore, ['currentStory']),
    computedTitle() {
      return this.title || this.rootStory?.name
    },
    computedTitleLink() {
      const routePath = this.$route.path.replace(/^\/*/, '').replace(/\/*$/, '')

      const rootSlug = this.rootStory?.full_slug
        ? this.rootStory.full_slug.replace(/^\/*/, '').replace(/\/*$/, '')
        : undefined

      return (
        (this.titleLinkIsValid && this.titleLink) ||
        (rootSlug && rootSlug !== routePath
          ? `/${this.rootStory?.full_slug}`
          : undefined)
      )
    },
    hasItems() {
      return this.items && this.items.length
    },
    hasRootItems() {
      return this.rootItems && this.rootItems.length
    },
    computedItems() {
      const items = []

      if (this.hasItems) {
        items.push(...this.items)
      }

      if (this.hasRootItems) {
        items.push(...this.rootItems)
      }

      return items
    }
  },
  async mounted() {
    this.isLoading = true
    this.rootStory = await this.fetchRoot()
    this.rootItems = await this.fetchRootItems()
    this.isLoading = false
  },
  methods: {
    async fetchRoot() {
      // object: assume full story object
      if (typeof this.root === 'object') {
        return this.root
      }
      // string: assume UUID
      else if (typeof this.root === 'string' && this.root) {
        try {
          const response = await this.$fetch('/api/stories', {
            query: {
              params: {
                by_uuids: this.root,
                per_page: 1,
                resolve_relations: false,
                excluding_fields:
                  'blocks,content,contentAssets,contentLink,description,excerpt,image,link,meta,products,registrations,relatedResources,sponsors,topics'
              }
            }
          })

          if (response && response.length) {
            return response[0]
          }
        } catch (err) {}
      }
      // no root: try to fetch based on current story
      else if (!this.root && !this.hasItems) {
        // if current story is a startpage, it's the root
        if (this.currentStory?.is_startpage) {
          return this.currentStory
        }

        // otherwise, infer parent slug from current story slug
        const parentSlug = this.currentStory?.full_slug?.replace(
          /([\w-]*)$/,
          ''
        )

        if (!parentSlug) {
          return
        }

        // fetch parent by slug
        try {
          const response = await $fetch('/api/stories', {
            query: {
              params: {
                per_page: 1,
                by_slugs: parentSlug,
                is_startpage: true,
                resolve_relations: false,
                excluding_fields:
                  'blocks,content,contentAssets,contentLink,description,excerpt,image,link,meta,products,registrations,relatedResources,sponsors,topics'
              }
            }
          })

          if (response && response.length) {
            return response[0]
          }
        } catch (err) {}
      }
    },
    async fetchRootItems() {
      if (!this.rootStory) {
        return
      }

      // Get all stories that start with the slug of the root story
      const links = await $fetch(`/api/links/${this.rootStory?.full_slug}`)

      // Filter out root story and stories that aren't direct children
      // of the root story. If the direct child is a folder, make sure
      // the folder has a startpage.
      const rootItems = links
        .filter(
          (link) =>
            link.id !== this.rootStory?.id &&
            link.parent_id === this.rootStory?.parent_id &&
            (!link.is_folder ||
              (link.is_folder &&
                links.find(
                  (_link) => _link.is_startpage && _link.parent_id === link.id
                )))
        )
        .map((link) => ({
          ...link,
          link: `/${link.slug}`,
          menu: undefined
        }))

      if (this.showActiveSubMenus) {
        // Add sub-menus to items
        links.forEach((link) => {
          const itemIndex = rootItems.findIndex(
            (item) => item.id === link.parent_id
          )

          if (itemIndex > -1) {
            if (!rootItems[itemIndex].menu) {
              // Mimic data structure for when sub-menus are provided by
              // Storyblok
              rootItems[itemIndex].menu = [{ items: [] }]
            }

            rootItems[itemIndex].menu[0].items.push({
              ...link,
              link: `/${link.slug}`
            })
          }
        })
      }

      return rootItems
    }
  }
}
</script>

<style lang="postcss" scoped>
.menu {
  @apply max-w-cols-4;
}

:deep(.title),
.title {
  @apply mb-4 font-sans text-body text-xs uppercase tracking-wide;
}
h6.title {
  @apply inline-block;
}

.loading-icon {
  @apply m-[0.1875rem] align-top text-body;
}

/* Tight */

.menu.tight {
  :deep(.menu-item) {
    .link {
      @apply py-[5px];
    }
  }
}

/* Panel */

.menu.panel {
  --color-accent: theme('colors.white.DEFAULT');
  --color-body: theme('colors.white.DEFAULT');
  --color-body-2: theme('colors.white.DEFAULT');
  @apply p-6 bg-blue rounded;
  @apply bg-gradient-to-b from-black-200 bg-no-repeat;
  background-size: 100% theme('height.36');

  .items {
    @apply -mb-3;
  }

  :deep(.menu-item) {
    .link {
      &.nuxt-link-active {
        @apply shadow-inset;
      }
    }
  }
}
</style>
