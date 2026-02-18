import states from 'us-state-converter'

export interface JobProps {
  location?: string
  locationRemote?: boolean
  category?: string
  type?: string
  excerpt?: Record<string, any> | string
  description?: Record<string, any> | string
  internal?: boolean
  landTrust?: Record<string, any>
  address?: string
  applicationDeadline: string
  applicationUrl?: string
  meta?: Record<string, any> | string
  sys?: Record<string, any>
}

export const useJob = (props: JobProps) => {
  const {
    config,
    format,
    getUnixTime,
    isBefore,
    isSameDay,
    isSameYear,
    toDate
  } = useDateFns()

  const locationFullName = computed(() => {
    return props.location ? states.fullName(props.location) : undefined
  })

  const locationOrRemote = computed(() => {
    const location = []

    if (props.locationRemote) {
      location.push('Remote')
    }

    if (locationFullName.value) {
      location.push(locationFullName.value)
    }

    return location.join(' or ')
  })

  const applicationDeadlineUTC = computed(() => {
    return toDate(props.applicationDeadline, {
      timeZone: config.timeZone
    })
  })

  const applicationDeadlineIsFuture = computed(() => {
    return (
      isBefore(new Date(), applicationDeadlineUTC.value) ||
      isSameDay(new Date(), applicationDeadlineUTC.value)
    )
  })

  const applicationDeadlineFormatted = computed(() => {
    return props.applicationDeadline
      ? applicationDeadlineIsFuture.value &&
        isSameYear(applicationDeadlineUTC.value, new Date())
        ? format(applicationDeadlineUTC.value, 'MMMM d')
        : format(applicationDeadlineUTC.value, 'MMMM d, yyyy')
      : undefined
  })

  const applicationDeadlineTimestamp = computed(() => {
    return getUnixTime(applicationDeadlineUTC.value)
  })

  return {
    ...props,
    locationFullName,
    locationOrRemote,
    applicationDeadlineUTC,
    applicationDeadlineIsFuture,
    applicationDeadlineFormatted,
    applicationDeadlineTimestamp
  }
}
