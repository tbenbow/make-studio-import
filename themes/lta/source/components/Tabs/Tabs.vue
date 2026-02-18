<template>
  <div class="tabs" :class="{ 'alternate-style': alternateStyle }">
    <div class="tabs-nav">
      <div v-if="hasTabs" class="nav" role="tablist">
        <template v-for="(tab, index) in tabsComputed" :key="index">
          <NuxtLink
            v-if="tab.link"
            class="nav-link"
            :to="tab.link"
            role="tab"
            :tabindex="index === activeTab ? undefined : -1"
            ><slot name="nav" v-bind="{ title: tab.title, id: tab.id }">
              {{ tab.title }}
            </slot></NuxtLink
          >
          <button
            v-else
            :href="tab.hash"
            class="nav-link"
            :class="{ 'is-active': index === activeTab }"
            role="tab"
            :tabindex="index === activeTab ? undefined : -1"
            :aria-selected="index === activeTab"
            :aria-controls="tab.id"
            @click.prevent="() => setActiveTab(index)"
          >
            <slot name="nav" v-bind="{ title: tab.title, id: tab.id }">
              {{ tab.title }}
            </slot>
          </button>
        </template>
      </div>
    </div>
    <template v-if="hasTabs">
      <TabsTab
        v-for="(tab, index) in tabsComputed"
        v-show="index === activeTab"
        :id="tab.id"
        :key="index"
        :id-name="tab.title"
        v-bind="tab"
        :active="index === activeTab"
      >
        <slot
          name="tab"
          v-bind="{ ...tab, index, isActive: index === activeTab }"
        />
      </TabsTab>
    </template>
  </div>
</template>

<script>
export default {
  props: {
    tabs: Array,
    activeTabChangesUrl: Boolean,
    alternateStyle: Boolean
  },
  data() {
    return {
      activeTab: 0
    }
  },
  computed: {
    hasTabs() {
      return this.tabs && this.tabs.length
    },
    tabsComputed() {
      return this.hasTabs
        ? this.tabs.map((tab, index) => {
            const id =
              tab.id ||
              (tab.title ? changeCase.kebabCase(tab.title) : `tab-${index}`)

            return {
              ...tab,
              id,
              hash: tab.hash || `#${id}`,
              link: tab.link
            }
          })
        : undefined
    }
  },
  watch: {
    '$route.hash'(newHash) {
      // If new hash is a tab hash, set the corresponding tab as active
      const index = this.getTabIndex(newHash)

      if (index > -1) {
        this.activeTab = index
      }
    }
  },
  created() {
    // If route has a hash and is a tab hash, set the corresponding tab as active
    const index = this.getTabIndex(this.$route.hash)

    if (index > -1) {
      this.activeTab = index
    }
  },
  methods: {
    getTabIndex(hash) {
      return this.tabsComputed.find((tab) => tab.hash === hash)
        ? this.tabsComputed.findIndex((tab) => tab.hash === hash)
        : undefined
    },
    setActiveTab(index) {
      this.activeTab = index
      this.$nuxt.$emit('change-tab')

      if (
        this.activeTabChangesUrl &&
        this.$route.hash !== this.tabsComputed[index].hash
      ) {
        this.$router.replace({ hash: this.tabsComputed[index].hash })
      }

      this.$nextTick(this.triggerReflow)
    },
    triggerReflow() {
      if (process.client) {
        window.dispatchEvent(new Event('resize'))
      }
    }
  }
}
</script>

<style lang="postcss" scoped>
.tabs {
}

.tabs-nav {
  @apply relative flex;

  &:before {
    @apply absolute bottom-0 left-0 w-full h-px bg-black-200 content-[''];
  }
}

.nav {
  @apply relative overflow-auto flex gap-4 sm:gap-6 pb-3 -mb-3;

  &-link {
    @apply flex items-center h-12 text-sm text-body-3 font-bold border-b-2 border-b-transparent whitespace-nowrap cursor-pointer;

    &.is-active,
    &.router-link-exact-active {
      @apply text-accent border-b-accent;
    }
  }
}

:deep(.tabs-tab) {
  @apply -mt-12 pt-12;

  &-main {
    @apply pt-12;
  }
}

/* Alternate Style */

.tabs.alternate-style {
  .tabs-nav {
    &:before {
      @apply hidden;
    }
  }

  .nav {
    @apply inline-flex gap-0 mb-0 p-1 bg-black-200-solid rounded-full shadow-inset;

    &-link {
      @apply px-8 h-8 text-2xs leading-none uppercase tracking-wide border-b-0 rounded-full;
      @apply transition-colors duration-200;

      &.is-active,
      &.router-link-exact-active {
        @apply text-body bg-white;
      }
    }
  }

  :deep(.tabs-tab) {
    @apply -mt-10 pt-10;
  }
}
</style>
