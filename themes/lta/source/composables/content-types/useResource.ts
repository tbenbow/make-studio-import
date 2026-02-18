import parseUrl from 'url-parse'
import {
  type as assetType,
  typeIcon as assetTypeIcon
} from '~/components/Asset/Asset.vue'
import { plainTextToRichText, richTextIsValid } from '~/utils/storyblok/index'
import type { AccessProps } from '~/composables/useAccess'
import type { SetupContext } from 'vue'

interface Type {
  key: string
  label: string
  icon?: string
  color?: string
}

export const types: Record<string, Type> = {
  DEFAULT: {
    key: 'default',
    label: 'Resource',
    icon: 'file'
  },
  COURSE: {
    key: 'course',
    label: 'Course',
    icon: 'graduation-cap',
    color: 'blue'
  },
  DOCUMENT: {
    key: 'document',
    label: 'Document',
    icon: 'file-lines',
    color: 'green'
  },
  DOCUMENT_CASE_STUDY: {
    key: 'document > case-study',
    label: 'Case Study'
  },
  DOCUMENT_EXERCISE: {
    key: 'document > exercise',
    label: 'Exercise'
  },
  DOCUMENT_FACTSHEET: {
    key: 'document > factsheet',
    label: 'Factsheet'
  },
  DOCUMENT_GUIDANCE: {
    key: 'document > guidance',
    label: 'Guidance'
  },
  DOCUMENT_LEGAL_OPINION: {
    key: 'document > legal-opinion',
    label: 'Legal Opinion'
  },
  DOCUMENT_NEWS_ARTICLE: {
    key: 'document > news-article',
    label: 'News Article'
  },
  DOCUMENT_PDF: {
    key: 'document > pdf',
    label: 'PDF'
  },
  DOCUMENT_PRACTICAL_POINTER: {
    key: 'document > practical-pointer',
    label: 'Practical Pointer'
  },
  DOCUMENT_PRACTICE: {
    key: 'document > practice',
    label: 'Practice'
  },
  DOCUMENT_REPORT: {
    key: 'document > report',
    label: 'Report / White Paper'
  },
  DOCUMENT_SAMPLE: {
    key: 'document > sample',
    label: 'Sample'
  },
  DOCUMENT_SAVING_LAND: {
    key: 'document > saving-land',
    label: 'Saving Land'
  },
  DOCUMENT_STANDARD: {
    key: 'document > standard',
    label: 'Standard'
  },
  DOCUMENT_TEMPLATE: {
    key: 'document > template',
    label: 'Template'
  },
  DOCUMENT_TOOLKIT: {
    key: 'document > toolkit',
    label: 'Toolkit'
  },
  DOCUMENT_WEB_LINK: {
    key: 'document > web-link',
    label: 'Web Link'
  },
  EVENT: {
    key: 'event',
    label: 'Event',
    icon: 'calendar-day',
    color: 'orange'
  },
  MULTIMEDIA: {
    key: 'multimedia',
    label: 'Multimedia',
    icon: 'photo-film-music',
    color: 'extra-3'
  },
  MULTIMEDIA_PODCAST: {
    key: 'multimedia > podcast',
    label: 'Podcast',
    icon: 'podcast'
  },
  MULTIMEDIA_VIDEO: {
    key: 'multimedia > video',
    label: 'Video',
    icon: 'film'
  },
  PUBLICATION: {
    key: 'publication',
    label: 'Publication',
    icon: 'book',
    color: 'yellow'
  },
  PUBLICATION_ACADEMIC_ARTICLE: {
    key: 'publication > academic-article',
    label: 'Academic Article'
  },
  PUBLICATION_BOOK: {
    key: 'publication > book',
    label: 'Book'
  },
  PUBLICATION_DISSERTATION: {
    key: 'publication > dissertation',
    label: 'Dissertation/Thesis'
  },
  WEBINAR: {
    key: 'webinar',
    label: 'Webinar',
    icon: 'presentation-screen',
    color: 'extra-1'
  }
}

// This isn't working as expected. We want it to be a union of all the `key`
// properties, but it's just returning `string`.
//
// Trying to replace the old validator:
// validator: (value) => Object.values(types).map((type) => type.key).includes(value)
type ResourceType = typeof types[keyof typeof types]['key']

export const expertises: Record<number | string, string> = {
  1: 'Basic',
  2: 'Intermediate',
  3: 'Advanced'
}

export interface ResourceProps extends AccessProps {
  // General
  type: ResourceType
  featured?: boolean
  excerpt?: string
  description?: Record<string, any> | string
  image?: Record<string, any>
  reviewDate?: string
  reviewDateLabel?: string

  // Attributes
  topics?: Record<string, any>[]
  regions?: string[]
  expertise?: string | number
  demographics?: string[]
  landHistoryTopics?: string[]
  internal?: Boolean
  source?: string
  author?: string
  location?: string
  instructor?: string
  length?: string
  startDate?: string
  startDateAllDay?: boolean
  endDate?: string
  endDateAllDay?: boolean
  locationAndDate?: string
  sponsors?: Record<string, any>[]

  // Content
  content?: Record<string, any> | boolean
  contentAssets?: Record<string, any>[]
  contentLink?: Record<string, any> | string

  // Purchase
  webinarPass?: boolean
  registrations?: Record<string, any>[]
  products?: Record<string, any>[]

  // Related
  relatedResources?: Record<string, any>[]
  relatedResourcesByTopic?: Record<string, any> | string
  relatedResourcesByType?: string
  relatedResourcesByExpertise?: string
  relatedResourcesByRegions?: string[]
  relatedResourcesByDemographics?: string[]
  relatedResourcesByTags?: string

  meta?: Record<string, any> | string
  sys?: Record<string, any>
}

type ResourceContext = Omit<SetupContext<['algolia-send-event']>, 'slots' | 'expose'>

export const useResource = (props: ResourceProps, { attrs, emit }: ResourceContext = {} as ResourceContext) => {
  const { public: { salesforce } } = useRuntimeConfig()
  const { $algolia, $algoliaAnalytics, $filters } = useNuxtApp()
  const route = useRoute()
  const { user } = useLtaAuth()
  const {
    hasAccessViaWebinarPass: userHasAccessViaWebinarPass,
    hasProduct: userHasProduct,
    hasRegistration: userHasRegistration
  } = useUser(user.value)
  const {
    config,
    format,
    formatDate,
    formatDateTime,
    formatDateTimeRange,
    startOfYear,
    endOfDay,
    subYears,
    isBefore,
    isPast,
    isSameYear,
    toDate
  } = useDateFns()

  const relatedResourcesFromAlgolia = ref()
  const reviewDateTooltip = ref('Resources are regularly reviewed for accuracy and relevance.')
  const storyblokVisualEditorUserPurchasedContent = ref(false)

  const rootType = computed(() => {
    const typeOrDefault =
      typeof props.type === 'string' && props.type
        ? props.type
        : types.DEFAULT.key
    const typeParts = typeOrDefault
      .split('>')
      .map((type) => type.trim())
      .filter((type) => type)

    return (
      Object.values(types).find((type) => type.key === typeParts[0]) ||
      types.DEFAULT
    )
  })
  
  const resourceType = computed(() => {
    return {
      ...rootType.value,
      ...Object.values(types).find((type) => type.key === props.type)
    }
  })
  
  const isCourse = computed(() => {
    return rootType.value.key === types.COURSE.key
  })
  
  const isDocument = computed(() => {
    return rootType.value.key === types.DOCUMENT.key
  })
  
  const isEvent = computed(() => {
    return rootType.value.key === types.EVENT.key
  })
  
  const isMultimedia = computed(() => {
    return rootType.value.key === types.MULTIMEDIA.key
  })
  
  const isPublication = computed(() => {
    return rootType.value.key === types.PUBLICATION.key
  })
  
  const isWebinar = computed(() => {
    return rootType.value.key === types.WEBINAR.key
  })
  
  const hasImage = computed(() => {
    return !!props.image?.filename
  })
  
  const hasDescription = computed(() => {
    return richTextIsValid(props.description)
  })
  
  const hasContent = computed(() => {
    return !!(
      (Array.isArray(props.content) && props.content.length) ||
      props.content === true
    )
  })
  
  const hasContentLink = computed(() => {
    const { isValid } = useLinkHelper(props.contentLink)

    return props.contentLink && isValid.value
  })
  
  const hasContentAssets = computed(() => {
    return !!(props.contentAssets && props.contentAssets.length)
  })
  
  const hasContentAssetsPDF = computed(() => {
    return (
      hasContentAssets.value &&
      // @ts-ignore possibly 'undefined'
      props.contentAssets.some((asset) => assetType(asset.filename) === 'pdf')
    )
  })
  
  const hasRegistrations = computed(() => {
    return !!(props.registrations && props.registrations.length)
  })
  
  const hasProducts = computed(() => {
    return !!(props.products && props.products.length)
  })

  const hasAvailableProducts = computed(() => {
    return hasProducts.value &&
      (!hasRegistrations.value ||
        (hasRegistrations.value && startOrEndDateIsPast.value))
  })
  
  const hasRegistrationContent = computed(() => {
    return hasRegistrations.value
      // @ts-ignore possibly 'undefined'
      ? props.registrations.some(
          (registration) =>
            registration.content && registration.content.length
        )
      : false
  })
  
  const hasProductContent = computed(() => {
    return hasProducts.value
      // @ts-ignore possibly 'undefined'
      ? props.products.some(
          (product) => product.content && product.content.length
        )
      : false
  })
  
  const hasRelatedResources = computed(() => {
    return props.relatedResources && props.relatedResources.length
  })
  
  const hasRelatedResourcesFromAlgolia = computed(() => {
    return (
      relatedResourcesFromAlgolia.value &&
      relatedResourcesFromAlgolia.value.length
    )
  })
  
  const hasRelatedResourcesByFilter = computed(() => {
    return (
      props.relatedResourcesByTopic ||
      props.relatedResourcesByType ||
      props.relatedResourcesByExpertise ||
      (props.relatedResourcesByRegions &&
        props.relatedResourcesByRegions.length) ||
      (props.relatedResourcesByDemographics &&
        props.relatedResourcesByDemographics.length) ||
      props.relatedResourcesByTags
    )
  })
  
  const hasAnyRelatedResources = computed(() => {
    return (
      hasRelatedResources.value ||
      hasRelatedResourcesFromAlgolia.value ||
      hasRelatedResourcesByFilter.value
    )
  })
  
  const hasActions = computed(() => {
    return (
      hasProducts.value ||
      hasRegistrations.value ||
      hasContentLink.value ||
      hasContent.value ||
      hasContentAssetsPDF.value
    )
  })

  const userPurchasedAccessViaWebinarPass = computed(() => {
    return userHasAccessViaWebinarPass(props)
  })
  
  const userPurchasedRegistration = computed(() => {
    return hasRegistrations.value
      // @ts-ignore possibly 'undefined'
      ? props.registrations.some((registration) =>
          userHasRegistration(registration.salesforceId)
        )
      : false
  })
  
  const userPurchasedProduct = computed(() => {
    return hasProducts.value
      ? userPurchasedAccessViaWebinarPass.value ||
          userPurchasedRegistration.value ||
          // @ts-ignore possibly 'undefined'
          props.products.some((product) =>
            userHasProduct(product.salesforceId)
          )
      : false
  })
  
  const hasUserPurchasedContent = computed(() => {
    return (
      (userPurchasedRegistration.value && hasRegistrationContent.value) ||
      (userPurchasedProduct.value && hasProductContent.value)
    )
  })

  const storyblokVisualEditorUserPurchasedRegistration = computed(() => {
    return hasRegistrations.value && storyblokVisualEditorUserPurchasedContent.value
  })

  const storyblokVisualEditorUserPurchasedProduct = computed(() => {
    return hasProducts.value && storyblokVisualEditorUserPurchasedContent.value
  })

  const hasStoryblokVisualEditorUserPurchasedContent = computed(() => {
    return (
      (storyblokVisualEditorUserPurchasedRegistration.value &&
        hasRegistrationContent.value) ||
      (storyblokVisualEditorUserPurchasedProduct.value &&
        hasProductContent.value)
    )
  })
  
  const contentLinkIsExternal = computed(() => {
    const { isExternal } = useLinkHelper(props.contentLink)
    return isExternal.value
  })
  
  const contentLinkIsInternal = computed(() => {
    const { isInternal } = useLinkHelper(props.contentLink)
    return isInternal.value
  })
  
  const link = computed(() => {
    return props.sys?.full_slug ? `/${props.sys.full_slug}` : undefined
  })
  
  const publishDate = computed(() => {
    return props.sys?.first_published_at
  })
  
  const publishDateUTC = computed(() => {
    return publishDate.value
      ? toDate(publishDate.value, { timeZone: 'UTC' })
      : undefined
  })
  
  const publishDateFormatted = computed(() => {
    const publishDate = publishDateUTC.value

    if (!publishDate) {
      return
    }

    // Jan. 1, [currentYear - 3]
    const threeYearsAgo = startOfYear(
      subYears(new Date(), 3)
    )

    // Publish date is before Jan. 1, [currentYear - 3]?
    const showYearOnly = isBefore(publishDate, threeYearsAgo)

    return showYearOnly
      ? format(publishDate, 'yyyy')
      : formatDate(publishDate)
  })
  
  const displayPublishDate = computed(() => {
    return ![types.EVENT.key, types.WEBINAR.key].includes(
      resourceType.value.key
    )
  })
  
  const reviewDateUTC = computed(() => {
    return props.reviewDate
      ? toDate(props.reviewDate, { timeZone: config.timeZone })
      : undefined
  })
  
  const reviewDateFormatted = computed(() => {
    return formatDate(reviewDateUTC.value)
  })
  
  const copyright = computed(() => {
    if (!isDocument.value || !props.internal) {
      return
    }

    const firstDate = publishDateUTC.value
    const secondDate = reviewDateUTC.value

    const year =
      firstDate && secondDate
        ? isSameYear(firstDate, secondDate)
          ? format(firstDate, 'yyyy')
          : `${format(firstDate, 'yyyy')}–${format(secondDate, 'yyyy')}`
        : firstDate
        ? format(firstDate, 'yyyy')
        : secondDate
        ? format(secondDate, 'yyyy')
        : undefined

    return `©${
      year ? ` ${year}` : ''
    } Land Trust Alliance, Inc. All rights reserved.`
  })
  
  const excerptIsHTML = computed(() => {
    return props.excerpt && /^<[a-zA-Z][\w]*>/.test(props.excerpt.trim())
  })
  
  const excerptAsRichText = computed(() => {
    return props.excerpt ? plainTextToRichText(props.excerpt) : undefined
  })
  
  const expertiseLabel = computed(() => {
    return props.expertise && Object.keys(expertises)
      ? expertises[props.expertise]
      : undefined
  })
  
  const startDateUTC = computed(() => {
    return props.startDate
      ? toDate(props.startDate, { timeZone: 'UTC' })
      : undefined
  })
  
  const startDateFormatted = computed(() => {
    return formatDateTime(
      startDateUTC.value,
      props.startDateAllDay
    )
  })
  
  const endDateUTC = computed(() => {
    return props.endDate
      ? toDate(props.endDate, { timeZone: 'UTC' })
      : undefined
  })
  
  const endDateFormatted = computed(() => {
    return formatDateTime(endDateUTC.value, props.endDateAllDay)
  })
  
  const startToEndDateFormatted = computed(() => {
    return props.endDate
      ? formatDateTimeRange(
          startDateUTC.value,
          endDateUTC.value,
          props.startDateAllDay,
          props.endDateAllDay
        )
      : startDateFormatted.value
  })
  
  const startOrEndDateIsPast = computed(() => {
    const startOrEndDate = endDateUTC.value || startDateUTC.value

    return startOrEndDate
      ? isPast(endOfDay(startOrEndDate))
      : undefined
  })

  const webinarPassLabel = computed(() => {
    const year = startDateUTC.value
      ? format(startDateUTC.value, 'yyyy', true)
      : ''

    // Use "Online Learning Pass" for 2026 and beyond
    const passName = year && parseInt(year) >= 2026 ? 'Online Learning Pass' : 'Webinar Pass'

    return `${year ? `${year} ` : ''}${passName}`
  })

  function urlHostname(url = '') {
    const parsedUrl = url ? parseUrl(url) : undefined

    return parsedUrl ? parsedUrl.hostname.replace(/www\./, '') : undefined
  }

  function registrationUrl(salesforceId: string) {
    return salesforceId && salesforce.instanceUrl
      ? `${salesforce.instanceUrl}/eventapi__router?event=${salesforceId}`
      : undefined
  }

  function productUrl(salesforceId: string) {
    return salesforceId && salesforce.instanceUrl
      ? `${salesforce.instanceUrl}/s/store#/store/browse/detail/${salesforceId}`
      : undefined
  }

  function productIsRepurchasable(salesforceId = '') {
    const invalidPrefixes = ['DL_', 'WEB_']

    // Product is repurchasable if it doesn't start with DL_ or WEB_
    return !invalidPrefixes.some((prefix) =>
      salesforceId.toUpperCase().startsWith(prefix)
    )
  }

  function isFree(price: string) {
    return !price || parseFloat(price) <= 0
  }

  function formatPrice(value: string) {
    return isFree(value) ? 'Free' : $filters.currency(value)
  }

  async function algoliaGetRelatedResources() {
    try {
      const recommendClient = $algolia.client.initRecommend()

      const { results } = await recommendClient.getRecommendations({
        requests: [{
          indexName: $algolia.indexName('resources'),
          model: 'related-products',
          objectID: props.sys?.uuid,
          threshold: 25,
          maxRecommendations: 10
        }]
      })

      return results?.[0]?.hits
    } catch (err) {}
  }

  async function fetchRelatedResourcesFromAlgolia() {
    relatedResourcesFromAlgolia.value = await algoliaGetRelatedResources()
  }

  function algoliaSendEvent(method: string, payload: any) {
    const index = $algolia.indexName('resources')
    const { eventType, eventName, filters, objectIDs, positions, queryID } =
      payload

    // If the component provides its own event handler:
    //   <component @algolia-send-event="sendEvent" />
    // emit instead of triggering aa methods.
    if ('onAlgoliaSendEvent' in attrs && emit) {
      return emit('algolia-send-event', eventType, eventName)
    }

    switch (method) {
      case 'clickedObjectIDs':
      case 'convertedObjectIDs':
      case 'viewedObjectIDs':
        return $algoliaAnalytics(method, {
          index,
          eventName,
          objectIDs
        })

      case 'clickedObjectIDsAfterSearch':
        return $algoliaAnalytics(method, {
          index,
          eventName,
          objectIDs,
          positions,
          queryID
        })

      case 'convertedObjectIDsAfterSearch':
        return $algoliaAnalytics(method, {
          index,
          eventName,
          objectIDs,
          queryID
        })

      case 'clickedFilters':
      case 'convertedFilters':
      case 'viewedFilters':
        return $algoliaAnalytics(method, {
          index,
          eventName,
          filters
        })
    }
  }

  function algoliaSendClick(eventName: string) {
    return algoliaSendEvent('clickedObjectIDs', {
      eventType: 'click',
      eventName,
      objectIDs: [props.sys?.uuid]
    })
  }

  function algoliaSendConversion(eventName: string) {
    const method = route.query?.queryID
      ? 'convertedObjectIDsAfterSearch'
      : 'convertedObjectIDs'

    return algoliaSendEvent(method, {
      eventType: 'conversion',
      eventName,
      objectIDs: [props.sys?.uuid],
      queryID: route.query?.queryID
    })
  }

  function algoliaSendView(eventName: string) {
    return algoliaSendEvent('viewedObjectIDs', {
      eventType: 'view',
      eventName,
      objectIDs: [props.sys?.uuid]
    })
  }

  function algoliaSendClickFilters(eventName: string, filters: string[]) {
    return algoliaSendEvent('clickedFilters', {
      eventType: 'click',
      eventName,
      filters
    })
  }

  function algoliaSendConversionFilters(eventName: string, filters: string[]) {
    return algoliaSendEvent('convertedFilters', {
      eventType: 'conversion',
      eventName,
      filters
    })
  }

  function algoliaSendViewFilters(eventName: string, filters: string[]) {
    return algoliaSendEvent('viewedFilters', {
      eventType: 'view',
      eventName,
      filters
    })
  }

  return {
    ...props,

    // Refs
    relatedResourcesFromAlgolia,
    reviewDateTooltip,
    storyblokVisualEditorUserPurchasedContent,

    // Computed
    rootType,
    resourceType,
    isCourse,
    isDocument,
    isEvent,
    isMultimedia,
    isPublication,
    isWebinar,
    hasImage,
    hasDescription,
    hasContent,
    hasContentLink,
    hasContentAssets,
    hasContentAssetsPDF,
    hasRegistrations,
    hasProducts,
    hasAvailableProducts,
    hasRegistrationContent,
    hasProductContent,
    hasRelatedResources,
    hasRelatedResourcesFromAlgolia,
    hasRelatedResourcesByFilter,
    hasAnyRelatedResources,
    hasActions,
    userPurchasedAccessViaWebinarPass,
    userPurchasedRegistration,
    userPurchasedProduct,
    hasUserPurchasedContent,
    storyblokVisualEditorUserPurchasedRegistration,
    storyblokVisualEditorUserPurchasedProduct,
    hasStoryblokVisualEditorUserPurchasedContent,
    contentLinkIsExternal,
    contentLinkIsInternal,
    link,
    publishDate,
    publishDateUTC,
    publishDateFormatted,
    displayPublishDate,
    reviewDateUTC,
    reviewDateFormatted,
    copyright,
    excerptIsHTML,
    excerptAsRichText,
    expertiseLabel,
    startDateUTC,
    startDateFormatted,
    endDateUTC,
    endDateFormatted,
    startToEndDateFormatted,
    startOrEndDateIsPast,
    webinarPassLabel,

    // Functions
    assetType,
    assetTypeIcon,
    urlHostname,
    registrationUrl,
    productUrl,
    productIsRepurchasable,
    isFree,
    formatPrice,
    algoliaGetRelatedResources,
    fetchRelatedResourcesFromAlgolia,
    algoliaSendEvent,
    algoliaSendClick,
    algoliaSendConversion,
    algoliaSendView,
    algoliaSendClickFilters,
    algoliaSendConversionFilters,
    algoliaSendViewFilters
  }
}
