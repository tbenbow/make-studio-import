export interface PressReleaseProps {
  subtitle?: string
  contacts?: Record<string, any>[]
  excerpt?: Record<string, any> | string
  body?: Record<string, any> | string
  image?: Record<string, any> | string
  sys?: Record<string, any>
}

export const usePressRelease = (props: PressReleaseProps) => {
  const { formatDate, toDate } = useDateFns()

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

  const hasImage = computed(() => {
    return typeof props.image === 'object' && props.image?.filename
  })

  return {
    ...props,
    publishDate,
    publishDateUTC,
    publishDateFormatted,
    hasImage
  }
}
