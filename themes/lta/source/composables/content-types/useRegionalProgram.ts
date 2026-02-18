import states from 'us-state-converter'
import { plainTextToRichText } from '~/utils/storyblok/index'

export interface RegionalProgramProps {
  aboutContent?: Record<string, any> | string
  aboutSectionHeader?: string
  alert?: Record<string, any>[]
  bannerImage?: Record<string, any>
  description?: string
  faqs?: Record<string, any>[]
  impactAdditionalContent?: Record<string, any>[]
  impactContent?: Record<string, any> | string
  impactProjects?: Record<string, any>[]
  impactProjectsHeader?: string
  impactSectionHeader?: string
  introduction?: Record<string, any> | string
  landTrust?: Record<string, any>
  memberGrid?: Record<string, any>[]
  menu?: Record<string, any>[]
  programListHeader?: string
  programList?: Record<string, any>[]
  region?: string
  resourcesSectionHeader?: string
  staff?: Record<string, any>[]
  states?: string[]
  meta?: Record<string, any> | string
  sys?: Record<string, any>
}

export const useRegionalProgram = (props: RegionalProgramProps) => {
  const descriptionAsRichText = computed(() => {
    return props.description ? plainTextToRichText(props.description) : undefined
  })

  const statesFullName = computed(() => {
    return Array.isArray(props.states) && props.states.length
      ? props.states.map((state) => states.fullName(state))
      : undefined
  })

  const statesString = computed(() => {
    return statesFullName.value && statesFullName.value.length
      ? statesFullName.value.join(', ')
      : undefined
  })

  const statesGainingGround = ref()

  async function fetchStatesGainingGround() {
    const states =
      props.states && props.states.length ? props.states.join(',') : undefined

    try {
      statesGainingGround.value = await $fetch('/api/stories', {
        query: {
          params: {
            content_type: 'GainingGround',
            filter_query: {
              state: {
                in: states
              }
            },
            sort_by: 'name:asc'
          }
        }
      })
    } catch (err) {}
  }

  return {
    ...props,
    descriptionAsRichText,
    statesFullName,
    statesString,
    statesGainingGround,
    fetchStatesGainingGround
  }
}
