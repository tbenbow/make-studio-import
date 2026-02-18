export interface PostProps {
  body?: Record<string, any>
  authors?: Record<string, any>[]
  categories?: Record<string, any>[]
  image?: Record<string, any> | string
  excerpt?: string
  meta?: Record<string, any>
  sys?: Record<string, any>
}

export const usePost = (props: PostProps) => {
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
    return publishDate.value
      ? formatDate(publishDateUTC.value)
      : undefined
  })

  const authorsString = computed(() => {
    return Array.isArray(props.authors)
      ? props.authors.map((author) => author.name).join(', ')
      : ''
  })

  const hasImage = computed(() => {
    return typeof props.image === 'object' && props.image?.filename
  })

  return {
    ...props,
    publishDate,
    publishDateUTC,
    publishDateFormatted,
    authorsString,
    hasImage
  }
}
