<template>
  <Overlay class="site-search" :active="searchIsActive" @close="close">
    <LazyAlgoliaSite v-if="loadSearch" :disable-history="true">
      <template #header>
        <button
          class="close-button"
          aria-label="Close Search"
          @click.prevent="close"
        >
          <font-awesome-icon :icon="['fal', 'circle-xmark']" />
        </button>
      </template>
    </LazyAlgoliaSite>
  </Overlay>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { useSiteStore } from '../stores/site'

export default {
  data() {
    return {
      // Used to prevent loading the search component until the search overlay
      // has been activated for the first time.
      loadSearch: false,
      scrollingEls: []
    }
  },
  computed: mapState(useSiteStore, ['searchIsActive']),
  watch: {
    $route() {
      if (this.searchIsActive) {
        this.close()
      }
    },
    searchIsActive(active) {
      if (active === true) {
        if (!this.loadSearch) {
          this.loadSearch = true
          setTimeout(this.onSearchIsActive, 500)
        } else {
          this.$nextTick(this.onSearchIsActive)
        }
      } else {
        this.onSearchIsInactive()
      }
    }
  },
  methods: {
    ...mapActions(useSiteStore, ['toggleSearchIsActive']),
    close() {
      this.toggleSearchIsActive(false)
    },
    focusSearchBox() {
      const searchBox = this.$el.querySelector(':scope .ais-SearchBox-input')

      if (searchBox) {
        searchBox.focus()
      }
    },
    onSearchIsActive() {
      this.focusSearchBox()

      this.scrollingEls = this.$el.querySelectorAll(
        ':scope .tabs-nav .nav, :scope .tabs-tab-main'
      )
      this.scrollingEls.forEach((el) => this.$bodyScroll.lock(el))
    },
    onSearchIsInactive() {
      if (this.scrollingEls && this.scrollingEls.length) {
        this.scrollingEls.forEach((el) => this.$bodyScroll.unlock(el))
      }
    }
  }
}
</script>

<style lang="postcss" scoped>
.site-search {
  :deep(.overlay-content) {
    @apply max-h-full mt-0;
  }
}

:deep(.algolia-site) {
  @apply relative w-cols-8 max-w-full bg-white rounded-lg shadow-dark;

  &,
  > .main,
  > .main .tabs,
  > .main .tabs .tabs-tab {
    @apply flex flex-col min-h-0;
  }

  > .header {
    @apply relative px-6 pt-6 pb-3;

    .close-button {
      @apply absolute top-0 right-0 p-2 text-black-400 text-base leading-none cursor-pointer transition-colors hover:text-accent;
    }
  }

  > .main {
    .tabs-nav .nav {
      @apply px-6;
    }

    .tabs-tab-main {
      @apply overflow-auto p-6;
    }
  }
}
</style>
