import { useSettingsStore } from '~/stores/settings'

export const resolveRoot = (name?: string, slug?: string) => {
  const { getSettingLinkUrl } = storeToRefs(useSettingsStore())

  switch (name) {    
    case 'job':
      const rootJobUrl = getSettingLinkUrl.value('rootJob')
      return `${rootJobUrl}/${slug}`
    
    case 'organization':
      const rootOrganizationUrl = getSettingLinkUrl.value('rootOrganization')
      return `${rootOrganizationUrl}/${slug}`
    
    case 'post':
      const rootPostUrl = getSettingLinkUrl.value('rootPost')
      return `${rootPostUrl}/${slug}`
  }
}
