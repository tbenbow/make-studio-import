<template>
  <Site
    class="layout-sidebar"
    :class="{ 'sidebar-is-active': sidebarIsActive }"
  >
    <Breadcrumbs />
    <div class="flex">
      <div class="sticky top-breadcrumbs-height z-30 float-left pb-10 w-0 h-0">
        <SiteSidebarButton
          :active="sidebarIsActive"
          :label="sidebarButtonLabel"
          title="Toggle menu"
          @click="toggleSidebarIsActive"
        />
      </div>
      <SiteSidebar v-show="sidebarIsActive" v-bind="sidebar" />
      <SiteContent>
        <slot />
      </SiteContent>
    </div>
  </Site>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { useSiteStore } from '@/stores/site'

export default {
  computed: {
    ...mapState(useSiteStore, ['sidebarIsActive', 'sidebar', 'toggleSidebarIsActive']),
    isScreenLg() {
      return this.$screens.lg
    },
    sidebarButtonLabel() {
      return this.sidebar?.collection?.label
        ? `${this.sidebar.collection.label} Menu`
        : undefined
    }
  },
  watch: {
    isScreenLg: {
      immediate: true,
      handler(newVal) {
        this.$nextTick(() => this.toggleSidebarIsActive(newVal))
      }
    }
  }
}
</script>

<style lang="postcss" scoped>
:deep(.site-sidebar-button) {
  @apply relative left-0 top-0;

  .label {
    @apply lg:hidden;
  }
}

:deep(.site-sidebar) {
  @apply flex-shrink-0 fixed lg:sticky top-0 lg:top-breadcrumbs-height z-50 lg:z-30 h-screen w-site-sidebar-width shadow lg:shadow-none;

  @screen lg {
    height: calc(theme('height.screen') - theme('height.breadcrumbs-height'));
  }
}

:deep(.site-content) {
  @apply flex-1;
}

/* Sidebar Is Active */

.site.sidebar-is-active {
  .site-sidebar-button {
    @apply left-site-sidebar-width;

    .label {
      @apply hidden lg:hover:inline;
    }
  }

  @screen lg {
    .site-content {
      --layout-offset-width: theme('spacing.site-sidebar-width');
    }
  }
}
</style>
