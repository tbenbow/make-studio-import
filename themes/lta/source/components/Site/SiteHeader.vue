<template>
  <header
    v-editable="$props"
    class="site-header"
    :class="{
      'invert-color': siteHeaderInvert,
      'mobile-menu-is-active': mobileMenuIsActive,
      'mega-menu-is-active': megaMenuIsActive
    }"
    @mouseenter="onMouseenter"
    @mouseleave="onMouseleave"
  >
    <div class="brand">
      <NuxtLink
        class="logo-link"
        :to="isResourceCenter ? getSettingLinkUrl('rootResourceCenter') : '/'"
        aria-label="Go to home page"
      >
        <LogoMark class="logo-mark" :alt="title" />
        <FullLogo class="logo" :alt="title" />
      </NuxtLink>
      <NuxtLink
        v-if="!isResourceCenter"
        class="gg-logo-link"
        :to="getSettingLinkUrl('rootGainingGround')"
        aria-label="Go to Gaining Ground home page"
      >
        <GainingGroundLogo class="gg-logo" alt="Gaining Ground" />
      </NuxtLink>
    </div>
    <div class="main">
      <div class="main-actions">
        <button class="search-button" @click.prevent="toggleSearchIsActive">
          <font-awesome-icon
            :icon="['fal', 'magnifying-glass']"
            :fixed-width="true"
          />
        </button>
        <MenuButton v-model:active="mobileMenuIsActive" />
      </div>
      <transition name="fade">
        <nav v-show="mobileMenuIsActive" ref="menu" class="menu">
          <ul
            v-if="menuPrimaryComputed && menuPrimaryComputed.length"
            class="menu-primary"
          >
            <SiteHeaderMenuItem
              v-for="(siteHeaderMenuItem, index) in menuPrimaryComputed"
              :key="siteHeaderMenuItem._uid"
              v-bind="siteHeaderMenuItem"
              :show-mega-menu="index === megaMenuActiveIndex"
              :mobile-mode="mobileMenuIsActive"
              @update:showMegaMenu="
                ($event) => ($event ? showMegaMenu(index) : hideMegaMenu())
              "
            />
          </ul>
          <ul
            v-if="navButtonsComputed && navButtonsComputed.length"
            class="menu-actions"
          >
            <li v-for="button in navButtonsComputed" :key="button._uid">
              <ButtonComponent v-bind="button" size="small" />
            </li>
          </ul>
          <ul
            v-if="menuSecondary && menuSecondary.length"
            class="menu-secondary"
          >
            <li
              v-for="(secondaryMenuItem, index) in menuSecondary"
              :key="index"
            >
              <LinkComponent
                :link="secondaryMenuItem.link"
                :name="secondaryMenuItem.name"
              />
            </li>
            <li>
              <button @click.prevent="toggleSearchIsActive">
                <font-awesome-icon
                  class="mr-1"
                  :icon="['fal', 'magnifying-glass']"
                />Search
              </button>
            </li>
            <template v-if="menuSecondaryAccountLink">
              <li v-if="loggedIn" class="relative">
                <NuxtLink
                  :class="{ 'is-active': showAccountMenu }"
                  :to="{ name: 'account' }"
                >
                  <span class="lg:hidden">
                    <font-awesome-icon
                      class="mr-1"
                      :icon="['fal', 'circle-user']"
                    /><strong>My Account</strong>
                  </span>
                  <span
                    class="hidden lg:inline"
                    @click.prevent="showAccountMenu = true"
                    ><font-awesome-icon
                      class="mr-1"
                      :icon="['fal', 'circle-user']" /><strong
                      >My Account</strong
                    ><font-awesome-icon
                      class="ml-1"
                      :icon="[
                        'fal',
                        showAccountMenu ? 'angle-up' : 'angle-down'
                      ]" /></span
                ></NuxtLink>
                <transition
                  name="appear-down"
                  leave-to-class="appear-up-leave-to"
                >
                  <Popover
                    v-show="showAccountMenu"
                    class="account-menu"
                    :active="showAccountMenu"
                    @close="showAccountMenu = false"
                  >
                    <div class="account-menu-header">
                      <div v-if="user?.profile?.name" class="text-sm font-bold">
                        {{ user.profile.name }}
                      </div>
                      <div
                        v-if="user?.profile?.email"
                        class="text-body-3 line-clamp-1"
                      >
                        {{ user.profile.email }}
                      </div>
                    </div>
                    <ul class="account-menu-section">
                      <li>
                        <NuxtLink :to="{ name: 'account' }">Profile</NuxtLink>
                      </li>
                      <li>
                        <NuxtLink :to="{ name: 'account-bookmarks' }"
                          >Bookmarks</NuxtLink
                        >
                      </li>
                      <li>
                        <NuxtLink :to="{ name: 'account-purchases' }"
                          >Purchases</NuxtLink
                        >
                      </li>
                      <li>
                        <NuxtLink :to="{ name: 'account-registrations' }"
                          >Registrations</NuxtLink
                        >
                      </li>
                    </ul>
                    <template v-if="user?.organization && user.organization.userIsAdmin" >
                      <div class="account-menu-section">
                        <div class="account-menu-section-header">
                          <strong>{{ user.organization.name }}</strong>
                        </div>
                        <ul>
                          <li v-if="user.organization.url">
                            <a :href="user.organization.url" target="_blank"
                              >Manage Organization
                              <font-awesome-icon
                                class="ml-1"
                                :icon="['fal', 'arrow-up-right-from-square']"
                            /></a>
                          </li>
                          <li v-if="user.organization.membershipUrl">
                            <a :href="user.organization.membershipUrl" target="_blank"
                              >Manage Membership
                              <font-awesome-icon
                                class="ml-1"
                                :icon="['fal', 'arrow-up-right-from-square']"
                            /></a>
                          </li>
                        </ul>
                      </div>
                    </template>
                    <ul class="account-menu-footer">
                      <li>
                        <button @click="signOut({ callbackUrl: '/' })"
                          >Log Out</button
                        >
                      </li>
                    </ul>
                  </Popover>
                </transition>
              </li>
              <li v-else>
                <button @click="signIn()"
                  ><font-awesome-icon
                    class="mr-1"
                    :icon="['fal', 'circle-user']"
                  /><strong>Log In</strong></button
                >
              </li>
            </template>
          </ul>
        </nav>
      </transition>
    </div>
  </header>
</template>

<script>
import { mapState, mapWritableState, mapActions } from 'pinia'
import { useSettingsStore } from '../stores/settings'
import { useSiteStore } from '../stores/site'
import FullLogo from '@/assets/img/lta-logo-optimized.svg?component'
import LogoMark from '@/assets/img/lta-logo-mark-optimized.svg?component'
import GainingGroundLogo from '@/assets/img/gg-logo.svg?component'

export default {
  components: { FullLogo, LogoMark, GainingGroundLogo },
  props: {
    title: String,
    menuPrimary: Array,
    menuSecondary: Array,
    menuSecondaryAccountLink: Boolean,
    navButtons: Array,
    menuPrimaryResources: Array,
    navButtonsResources: Array,
    _editable: String
  },
  setup() {
    const { loggedIn, user, signIn, signOut } = useLtaAuth()

    return {
      loggedIn,
      user,
      signIn,
      signOut
    }
  },
  data() {
    return {
      mobileMenuIsActive: false,
      megaMenuIsActive: false,
      megaMenuActiveIndex: null,
      showAccountMenu: false
    }
  },
  computed: {
    ...mapState(useSiteStore, ['isResourceCenter']),
    ...mapWritableState(useSiteStore, ['siteHeaderInvert']),
    ...mapState(useSettingsStore, ['getSettingLinkUrl']),
    menuPrimaryComputed() {
      return this.isResourceCenter
        ? this.menuPrimaryResources
        : this.menuPrimary
    },
    navButtonsComputed() {
      const navButtons = this.isResourceCenter
        ? this.navButtonsResources
        : this.navButtons

      // As requested by LTA, on land trust detail pages, filter out buttons
      // that appear to be a donation button
      return (navButtons || []).filter((button) => {
        return !(
          this.routeIsLandTrust && button.name.toLowerCase().includes('donate')
        )
      })
    },
    routeIsLandTrust() {
      const routeIsLandTrust = new RegExp(
        `^${this.getSettingLinkUrl('rootLandTrust')}/.+`,
        'i'
      )

      return routeIsLandTrust.test(this.$route.path)
    }
  },
  watch: {
    $route(newVal, oldVal) {
      // Only when path actually changes, ignore hash changes (anchor links)
      if (newVal.path !== oldVal.path) {
        this.siteHeaderInvert = false
        this.hideMobileMenu()
        this.hideMegaMenu()
        this.showAccountMenu = false
      }
    },
    mobileMenuIsActive(isActive) {
      if (isActive) {
        this.$bodyScroll.lock(this.$refs.menu)
      } else {
        this.$bodyScroll.unlock(this.$refs.menu)
        this.hideMobileMenu()
        this.hideMegaMenu()
      }
    }
  },
  methods: {
    ...mapActions(useSiteStore, ['toggleSearchIsActive']),
    hideMobileMenu() {
      this.mobileMenuIsActive = false
    },
    showMegaMenu(index) {
      this.megaMenuIsActive = true
      this.megaMenuActiveIndex = index
    },
    hideMegaMenu() {
      this.megaMenuIsActive = false
      this.megaMenuActiveIndex = null
    },

    /**
     * Allow briefly mousing out of the header and returning before closing
     * the mega menu. Allow certain situations to cancel hiding mega menu.
     */
    onMouseleave() {
      const cancelHideMegaMenu =
        this.$el.querySelectorAll(':scope input:focus').length > 0

      if (!cancelHideMegaMenu) {
        this.mouseleaveTimeout = setTimeout(this.hideMegaMenu, 750)
      }
    },
    onMouseenter() {
      clearTimeout(this.mouseleaveTimeout)
    }
  }
}
</script>

<style lang="postcss" scoped>
.site-header {
  @apply absolute top-0 left-0 right-0 z-50 flex items-center gap-6 lg:gap-12 px-container-padding lg:px-12 h-site-header-height;
  @apply transition-colors duration-200;

  .main {
    @apply flex-1;
  }
}

.brand {
  @apply flex gap-6 items-center;

  .logo-link {
    @apply block relative top-[-2px];
  }

  .logo-mark {
    @apply block sm:hidden lg:block xl:hidden;
  }

  .logo {
    @apply hidden sm:block lg:hidden xl:block relative h-[38px] xl:h-[44px] w-auto text-body;
    @apply transition-colors duration-200;
  }
}

.main {
  @apply flex items-center;

  .menu {
    @apply flex-1;

    li {
      @apply leading-tight;
    }
  }
}

.main-actions {
  @apply flex flex-wrap gap-x-3 gap-y-1 items-center justify-center ml-auto lg:hidden;

  .search-button {
    @apply text-body text-lg;

    svg[data-icon] {
      @apply block;
    }
  }
}

.menu {
  @apply absolute left-0 top-full right-0 overflow-x-hidden overflow-y-auto flex flex-col gap-6 p-container-padding bg-background lg:overflow-hidden;
  height: calc(theme('height.screen') - theme('height.site-header-height'));
  @apply lg:flex !important;
  @apply lg:static lg:left-auto lg:top-auto lg:right-auto lg:items-center lg:flex-row lg:gap-12 lg:h-auto lg:p-0 lg:bg-transparent;

  &-primary {
    @apply flex flex-col gap-4 lg:flex-1 lg:flex-row;

    :deep(.site-header-menu-item) {
      @apply lg:text-center;

      .mega-menu {
        @apply lg:text-left;
      }
    }
  }

  &-actions {
    @apply flex flex-col flex-wrap gap-6 lg:items-center lg:flex-row;
  }

  &-secondary {
    @apply flex flex-col gap-3 lg:absolute lg:top-3 lg:right-0 lg:flex-row lg:gap-0 lg:pr-12;

    > li {
      @apply relative lg:last:-mr-2;

      > :deep(a),
      > button {
        @apply inline-block text-body text-sm lg:border lg:border-transparent lg:rounded lg:hover:border-accent lg:text-2xs lg:px-2 lg:mx-0;

        &.is-active {
          @apply lg:border-accent;
        }
      }
    }

    :deep(.popover) {
      @apply lg:right-0 top-8 w-64 p-0 text-xs;

      a {
        @apply text-accent;
      }
    }
  }

  &-actions,
  &-secondary {
    @apply pt-6 border-t border-t-line lg:pt-0 lg:border-t-0;
  }
}

.account-menu {
  &-header {
    @apply p-4;
  }

  &-section,
  &-footer {
    @apply border-t border-line;

    a, button {
      @apply block w-full px-4 py-2 text-accent text-left hover:bg-line;
    }
  }

  &-section {
    @apply py-3;

    &-header {
      @apply px-4 py-1;
    }
  }

  &-footer {
    @apply py-2;
  }
}

/* Invert Color */

.site-header.invert-color:not(.mobile-menu-is-active):not(
    .mega-menu-is-active
  ) {
  --color-body: theme('colors.white.DEFAULT');
}

/* Mobile Menu is Active */
/* Mega Menu is Active */

.site-header.mobile-menu-is-active,
.site-header.mega-menu-is-active {
  @apply bg-background;
}
</style>

<style lang="postcss">
.site.is-resource-center {
  .site-header {
    .brand {
      .logo-link {
        &:after {
          @apply block absolute font-serif font-bold text-accent text-[14.75px] right-[0.5%] top-[66%] lg:text-[17.25px];
          content: 'Resource Center';
        }
      }

      .logo-mark {
        @apply hidden;
      }

      .logo {
        @apply block;

        #logo-wordmark-tagline {
          @apply hidden;
        }
      }
    }
  }
}
</style>
