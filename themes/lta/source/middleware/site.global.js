import { useSettingsStore } from '~/stores/settings'
import { useSiteStore } from '~/stores/site'

export default defineNuxtRouteMiddleware(async (to, from) => {
  // Get resource center root URL
  const settingsStore = useSettingsStore()
  const { getSettingLinkUrl } = storeToRefs(settingsStore)
  const rootResourceCenterUrl = getSettingLinkUrl.value('rootResourceCenter')

  // Set `isResourceCenter` based on whether the current route is in the resource center
  const siteStore = useSiteStore()
  const { isResourceCenter } = storeToRefs(siteStore)
  isResourceCenter.value = to.fullPath.startsWith(rootResourceCenterUrl)
})
