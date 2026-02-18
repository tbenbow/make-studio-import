import { parsePhoneNumberWithError } from 'libphonenumber-js'

export interface LandTrustProps {
  accredited?: boolean
  terrafirmaInsured?: boolean
  nrcs?: boolean
  description?: string
  features?: Record<string, any>
  protects?: Record<string, any>
  area?: Record<string, any>[]
  acresProtected?: number
  address?: Record<string, any>
  contact?: Record<string, any>
  demographics?: Record<string, any>
  imageUrl?: string
  imageCredit?: string
  logoUrl?: string
  memberType?: string
  category?: string
  gem?: boolean
  sys?: Record<string, any>
}

export const useLandTrust = (props: LandTrustProps) => {
  const defaultImageUrls = ref([
    'https://a.storyblok.com/f/120093/3200x2400/9c08c33e39/default-1.jpg',
    'https://a.storyblok.com/f/120093/3200x2400/0896480632/default-2.jpg',
    'https://a.storyblok.com/f/120093/3200x2400/5e48a95f6a/default-3.jpg',
    'https://a.storyblok.com/f/120093/3200x2400/df5d7e669f/default-4.jpg',
    'https://a.storyblok.com/f/120093/3200x2400/d99167b0c1/default-5.jpg',
    'https://a.storyblok.com/f/120093/3200x2400/362e0cd95c/default-6.jpg'
  ])

  const name = computed(() => props.sys?.name)

  const location = computed(() => {
    return props.address
      ? props.address.city && props.address.state
        ? `${props.address.city}, ${props.address.state}`
        : `${props.address.city ? props.address.city : ''}${
            props.address.state ? props.address.state : ''
          }`
      : undefined
  })

  const isNational = computed(() => props.category === 'Land Trust - National')

  const featuresTrueOnly = computed(() => {
    return Object.entries(props.features || {})
      .map(([key, value]) => ({ key, value }))
      .filter(({ value }) => value === true)
  })

  const hasFeatures = computed(() => !!featuresTrueOnly.value.length)

  const protectsTrueOnly = computed(() => {
    return Object.entries(props.protects || {})
      .map(([key, value]) => ({ key, value }))
      .filter(({ value }) => value === true)
  })

  const hasProtects = computed(() => !!protectsTrueOnly.value.length)

  const defaultImageUrl = computed(() => {
    const uuid = props.sys?.uuid || '1'
    const seed: number = isNaN(Number(uuid))
      ? uuid.split('').reduce((sum: number, char: string) => sum + char.charCodeAt(0), 0)
      : Number(uuid)
    const defaultImageCount = defaultImageUrls.value.length
    const defaultImageIndex = seed % defaultImageCount

    return defaultImageUrls.value[defaultImageIndex]
  })

  const imageOrDefaultUrl = computed(() => props.imageUrl || defaultImageUrl.value)

  const hasContacts = computed(() => !!props.contact?.websiteUrl)
  
  const contactSocial = computed(() => {
    return props.contact?.social
      ? Object.values(props.contact.social).filter((url) => url)
      : []
  })

  function decode(string: string = '') {
    if (typeof string !== 'string') {
      return string
    }

    const decodedString = string.replaceAll('--', '—').replaceAll('â€”', '—')

    try {
      return decodeURIComponent(escape(decodedString))
    } catch (err) {
      return decodedString
    }
  }

  function telLink(phoneNumber: string) {
    try {
      return parsePhoneNumberWithError(phoneNumber, 'US').getURI()
    } catch (err) {}
  }

  return {
    ...props,
    defaultImageUrls,
    name,
    location,
    isNational,
    featuresTrueOnly,
    hasFeatures,
    protectsTrueOnly,
    hasProtects,
    defaultImageUrl,
    imageOrDefaultUrl,
    hasContacts,
    contactSocial,
    decode,
    telLink
  }
}
