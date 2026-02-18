import { defineStore } from 'pinia'
import { useStoriesStore } from './stories'

const SITE_ALERT_COOKIE = 'site_alert'
const SITE_DIALOG_COOKIE = 'site_dialog'

export const useSiteStore = defineStore('site', {
  id: 'siteStore',
  state: () => ({
    isResourceCenter: false,
    alert: undefined,
    dialog: undefined,
    header: undefined,
    footer: undefined,
    searchIsActive: false,
    sidebarIsActive: false,
    siteHeaderInvert: false,
    sidebar: undefined,
    currentStory: {},
    inStoryblokVisualEditor: false
  }),
  getters: {
    alertIsActive: (state) => {
      return state.alert?.active
    },
    alertIsSuppressed: () => {
      const cookie = useCookie(SITE_ALERT_COOKIE)
      return cookie.value === true
    },
    dialogIsActive: (state) => {
      return state.dialog?.active
    },
    dialogIsSuppressed: () => {
      const cookie = useCookie(SITE_DIALOG_COOKIE)
      return cookie.value === true
    },
    hasSidebar: (state) => {
      return !lodash.isEmpty(state.sidebar)
    }
  },
  actions: {
    async fetch(seedData) {
      const site = seedData || await $fetch('/api/stores/site')
        .catch((err) => console.error('Error fetching site', err))

      if (site?.alert) {
        this.alert = site.alert
      }

      if (site?.dialog) {
        this.dialog = site.dialog
      }

      if (site?.header) {
        this.header = site.header
      }

      if (site?.footer) {
        this.footer = site.footer
      }
    },
    suppressAlert() {
      const daysToSuppress = this.alert?.suppressionDuration
        ? Number(this.alert.suppressionDuration)
        : 1
      
      const cookie = useCookie(SITE_ALERT_COOKIE, {
        maxAge: 60 * 60 * 24 * daysToSuppress
      })
      cookie.value = true
    },
    suppressDialog() {
      const daysToSuppress = this.dialog?.suppressionDuration
        ? Number(this.dialog.suppressionDuration)
        : 1

      const cookie = useCookie(SITE_DIALOG_COOKIE, {
        maxAge: 60 * 60 * 24 * daysToSuppress
      })
      cookie.value = true
    },
    toggleSearchIsActive(isActive) {
      const searchIsActive =
        typeof isActive === 'boolean' ? isActive : !this.searchIsActive
        this.searchIsActive = searchIsActive
    },
    toggleSidebarIsActive(isActive) {
      const sidebarIsActive =
        typeof isActive === 'boolean' ? isActive : !this.sidebarIsActive
      this.sidebarIsActive = sidebarIsActive
    },
    setSidebar(sidebar) {
      if (!lodash.isEqual(this.sidebar, sidebar)) {
        this.sidebar = sidebar
      }
    },
    setSidebarForStory(fullSlug) {
      const collection = useStoriesStore().getCollectionForStory(fullSlug)

      if (collection) {
        this.sidebar = { collection }
      } else {
        this.sidebar = null
      }
    }
  }
})
