import states from 'us-state-converter'
import type { RegionalProgramProps } from './useRegionalProgram'

export interface PressMentionProps {
  publicationName?: string
  publicationUrl?: string
  excerpt?: Record<string, any> | string
  landTrusts?: Record<string, any>
  regions?: string[]
  locations?: string[]
  sys?: Record<string, any>
}

export const usePressMention = (props: PressMentionProps) => {
  const { formatDate, toDate } = useDateFns()
  
  const landTrustsData = ref()
  const regionsLinks = ref()

  const publishDate = computed(() => {
    return props.sys?.first_published_at
  })

  const publishDateUTC = computed(() => {
    return publishDate.value
      ? toDate(publishDate.value, { timeZone: 'UTC' })
      : undefined
  })

  const publishDateFormatted = computed(() => {
    return formatDate(publishDateUTC.value)
  })

  const hasLandTrusts = computed(() => {
    return !!(props.landTrusts?.ids && props.landTrusts.ids.length)
  })

  const hasRegions = computed(() => {
    return !!(props.regions && props.regions.length)
  })

  const hasLocations = computed(() => {
    return !!(props.locations && props.locations.length)
  })

  const hasMentionedData = computed(() => {
    return hasLandTrusts.value || hasRegions.value || hasLocations.value
  })

  const locationsFullName = computed(() => {
    return hasLocations.value
      // @ts-ignore possibly 'undefined'
      ? props.locations.map((state) => states.fullName(state))
      : undefined
  })


  async function fetchLandTrustsData() {
    if (hasLandTrusts.value) {
      try {
        landTrustsData.value = await Promise.all(
          // @ts-ignore possibly 'undefined'
          props.landTrusts.ids.map(
            async (id: string) => await $fetch(`/api/land-trusts/${id}`)
          )
        )
      } catch (e) {}
    }
  }

  async function fetchRegionsLinks() {
    if (hasRegions.value) {
      const regionalProgramProps: (keyof RegionalProgramProps)[] = [
        'aboutContent',
        'aboutSectionHeader',
        'alert',
        'bannerImage',
        'description',
        'faqs',
        'impactAdditionalContent',
        'impactContent',
        'impactProjects',
        'impactProjectsHeader',
        'impactSectionHeader',
        'introduction',
        'landTrust',
        'memberGrid',
        'menu',
        'programListHeader',
        'programList',
        'region',
        'resourcesSectionHeader',
        'staff',
        'states',
        'meta'
      ]

      try {
        regionsLinks.value = await $fetch('/api/stories', {
          query: {
            params: {
              content_type: 'RegionalProgram',
              filter_query: {
                // @ts-ignore possibly 'undefined'
                region: { in: props.regions.join(',') }
              },
              excluding_fields: regionalProgramProps.join(','),
              sort_by: 'content.region:asc'
            }
          }
        })
      } catch (e) {}
    }
  }

  return {
    ...props,
    publishDate,
    publishDateUTC,
    publishDateFormatted,
    hasLandTrusts,
    hasRegions,
    hasLocations,
    hasMentionedData,
    locationsFullName,
    landTrustsData,
    regionsLinks,
    fetchLandTrustsData,
    fetchRegionsLinks
  }
}
