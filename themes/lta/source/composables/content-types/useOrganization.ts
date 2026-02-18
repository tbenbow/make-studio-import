import { plainTextToRichText } from '~/utils/storyblok/index'

export interface OrganizationProps {
  type?: string
  region?: string
  description?: string
  websiteUrl?: string
  meta?: Record<string, any>
  sys?: Record<string, any>
}

export const useOrganization = (props: OrganizationProps) => {
  const descriptionAsRichText = computed(() => {
    return plainTextToRichText(props.description)
  })

  return {
    ...props,
    descriptionAsRichText
  }
}
