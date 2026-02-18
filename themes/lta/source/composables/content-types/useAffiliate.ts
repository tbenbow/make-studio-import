import { parsePhoneNumberWithError } from 'libphonenumber-js'
import states from 'us-state-converter'
import { plainTextToRichText } from '~/utils/storyblok/index'

export interface AffiliateProps {
  type?: string
  premium?: boolean
  location?: string[]
  locationRemote?: boolean
  expertise?: string[]
  description?: string
  address?: Record<string, any>
  contact?: Record<string, any>
  imageUrl?: string
  sys?: Record<string, any>
}

export const useAffiliate = (props: AffiliateProps) => {
  const locationString = computed(() => {
    return Array.isArray(props.location) && props.location.length
      ? props.location.map((state) => states.fullName(state)).join(', ')
      : undefined
  })

  const locationOrRemote = computed(() => {
    const location = []

    if (props.locationRemote) {
      location.push('Remote')
    }

    if (locationString.value) {
      location.push(locationString.value)
    }

    return location.join(' or ')
  })

  const excerpt = computed(() => {
    return plainTextToRichText(props.description, 1)
  })

  const descriptionAsRichText = computed(() => {
    return plainTextToRichText(props.description)
  })

  const contactSocial = computed(() => {
    return props.contact?.social
      ? Object.values(props.contact.social).filter((url) => url)
      : []
  })

  function telLink(phoneNumber: string) {
    try {
      return parsePhoneNumberWithError(phoneNumber, 'US').getURI()
    } catch (err) {}
  }

  return {
    ...props,
    locationString,
    locationOrRemote,
    excerpt,
    descriptionAsRichText,
    contactSocial,
    telLink
  }
}
