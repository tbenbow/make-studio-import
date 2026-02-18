<template>
  <li
    v-editable="$props"
    class="site-header-menu-item"
    :class="{ 'has-mega-menu': hasMegaMenu, 'show-mega-menu': showMegaMenu }"
  >
    <LinkComponent
      class="root-link"
      :link="link"
      :name="name"
      @click.prevent="handleRootLinkClick"
      @mouseover="handleRootLinkMouseover"
      @focus="handleRootLinkMouseover"
    />
    <template v-if="hasMegaMenu">
      <transition
        :name="mobileMode ? 'appear-left' : 'appear-down'"
        :leave-to-class="mobileMode ? 'appear-right-leave-to' : 'fade-leave-to'"
      >
        <div v-show="showMegaMenu" class="mega-menu">
          <div class="mega-menu-container">
            <ButtonComponent
              v-if="mobileMode"
              class="mb-4"
              name="Back"
              icon="angle-left"
              size="small"
              variation="link"
              :icon-position-reverse="true"
              @click.prevent="$emit('update:showMegaMenu', false)"
            />
            <div class="grid gap-12 lg:grid-cols-12">
              <div class="lg:col-span-8">
                <h4 class="name">
                  <LinkComponent
                    v-slot="{ displayName }"
                    class="hover:text-accent"
                    :link="link"
                    :name="name"
                  >
                    {{ displayName }}
                    <font-awesome-icon
                      class="text-accent"
                      :icon="['fal', 'chevron-right']"
                    />
                  </LinkComponent>
                </h4>
                <div v-if="subtitle" class="subtitle">{{ subtitle }}</div>
                <Divider />
                <template v-if="search && search.length">
                  <template v-for="(s, index) in search" :key="index">
                    <component
                      :is="s.component"
                      v-bind="s"
                      class="mt-6"
                    />
                  </template>
                </template>
                <div class="grid gap-x-12 gap-y-6 mt-6 lg:grid-cols-2">
                  <Menu
                    v-for="_menu in menu"
                    :key="_menu._uid"
                    v-bind="_menu"
                    :tight="true"
                  />
                </div>
              </div>
              <div v-if="featuredItem && featuredItem.length" class="lg:col-span-4">
                <Item v-bind="featuredItem[0]" size="small" />
              </div>
            </div>
          </div>
        </div>
      </transition>
    </template>
  </li>
</template>

<script>
export default {
  props: {
    link: [Object, String],
    name: String,
    subtitle: String,
    search: Array,
    menu: Array,
    featuredItem: Array,
    showMegaMenu: Boolean,
    mobileMode: Boolean,
    _editable: String
  },
  computed: {
    hasMegaMenu() {
      return (this.menu && this.menu.length) || this.featuredItem
    }
  },
  methods: {
    handleRootLinkClick(event, defaultHandler) {
      if (this.mobileMode && this.hasMegaMenu) {
        this.$emit('update:showMegaMenu', true)
      } else {
        defaultHandler()
      }
    },
    handleRootLinkMouseover(_event) {
      if (!this.mobileMode) {
        this.$emit('update:showMegaMenu', this.hasMegaMenu || false)
      }
    }
  }
}
</script>

<style lang="postcss" scoped>
.site-header-menu-item {
}

:deep(.root-link) {
  @apply block text-body text-lg leading-normal lg:text-sm;
  @apply transition-colors duration-200;
  text-underline-offset: theme('spacing.1');

  &:hover,
  &.nuxt-link-active {
    @apply underline;
    text-decoration-color: theme('colors.accent');
    text-decoration-thickness: 0.125rem;
  }
}

.mega-menu {
  @apply absolute left-0 top-0 right-0 z-10 bg-white lg:top-full;

  &:after {
    @apply hidden absolute top-full left-0 right-0 h-6 bg-gradient-to-b from-black-200 pointer-events-none content-[''] md:block;
  }

  &-container {
    @apply container md:px-12 md:w-full md:max-w-none pb-12;
  }

  .name {
  }

  .subtitle {
    @apply mt-2 text-body-3;
  }

  :deep(.divider) {
    @apply mt-6;
  }

  :deep(.search-land-trusts) {
    @apply xl:flex-row;
  }
}

/* Show Mega Menu */

.site-header-menu-item.show-mega-menu {
  :deep(.root-link) {
    @apply underline;
    text-decoration-color: theme('colors.accent');
    text-decoration-thickness: 0.125rem;
  }
}
</style>
