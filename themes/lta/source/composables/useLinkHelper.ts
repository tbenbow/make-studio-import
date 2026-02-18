import { isEmpty } from 'lodash-es'

/**
 * @param link {object|string} - An object from a Storyblok link field or a string
 * @param name {string} - A name for the link
 */
export const useLinkHelper = (_link?: Record<string, any> | string, _name?: string) => {
  const link = toRef(_link)
  const name = toRef(_name)

  /**
   * @prop url {string} - The URL to prefix with a protocol
   * @returns {string} The URL prefixed with https
   */
  function withProtocolURL(url: string) {
    return !url.startsWith('http') &&
      !url.startsWith('//') &&
      !url.startsWith('/') &&
      !url.startsWith('#') &&
      !/^\w+:/.test(url)
      ? `https://${url}`
      : url
  }
  
  /**
   * @returns {string} The type of link
   */
  const type = computed(() => {
    // Storyblok link object
    if (typeof link.value === 'object' && link.value.linktype) {
      return link.value.linktype
    }
    // Vue Router object/string
    else if (
      (typeof link.value === 'object' && link.value.name) ||
      (typeof link.value === 'string' && link.value.startsWith('/'))
    ) {
      return 'router'
    } else {
      return undefined
    }
  })

  /**
   * @returns {string} The URL (could be fully-qualified URL, absolute path, anchor link, mailto)
   */
  const url = computed(() => {
    if (typeof link.value === 'string') {
      return withProtocolURL(link.value)
    }

    const storyUrl = typeof link.value === 'object'
      ? link.value.story?.url || link.value.cached_url || ''
      : ''

    switch (type.value) {
      case 'story':
        return storyUrl
          ? `${storyUrl.startsWith('/') ? '' : '/'}${
              storyUrl.length > 1 ? storyUrl.replace(/\/+$/, '') : storyUrl
            }`
          : storyUrl
      case 'email':
        return `mailto:${link.value?.email}`
      case 'url':
        return link.value?.url.startsWith('#')
          ? link.value?.url
          : withProtocolURL(link.value?.url)
      case 'asset':
        return withProtocolURL(link.value?.url)
      case 'router':
        return link
      default:
        return undefined
    }
  })
  
  /**
   * @returns {boolean} True if the link is valid
   */
  const isValid = computed(() => {
    switch (typeof link.value) {
      case 'object':
        return !!(
          link.value.name || // Vue Router object
          (link.value.linktype && // Storyblok link object
            ((link.value.linktype === 'story' &&
              (link.value.story?.url || link.value.cached_url)) ||
              (link.value.linktype === 'email' && link.value.email) ||
              (['url', 'asset'].includes(link.value.linktype) && link.value.url)))
        )
  
      case 'string':
        return !!link.value.trim()
  
      default:
        return false
    }
  })

  /**
   * A link is considered internal (use NuxtLink) if it's a Storyblok link to
   * a story ("story"), a Vue Router style link ("router"), or a "url"
   * starting with /.
   *
   * @returns {boolean} True if the link is considered internal
   */
  const isInternal = computed(() => {
    return (
      (['story', 'router'].includes(type.value) && !isEmpty(url.value)) ||
      (type.value === 'url' && url.value.startsWith('/'))
    )
  })

  /**
   * @returns {boolean} True if the link is considered external
   */
  const isExternal = computed(() => {
    return (
      url.value &&
      (url.value.startsWith('http') || url.value.startsWith('//'))
    )
  })

  /**
   * @returns {boolean} True if the link is an anchor
   */
  const isAnchor = computed(() => {
    return !!(url.value && url.value.startsWith('#'))
  })

  /**
   * @returns {string} The display name which is the provided name or the name determined based on the type of link (could be the story name, an email address, etc.)
   */
  const displayName = computed(() => {
    if (name.value) {
      return name.value
    }

    if (typeof link.value === 'object') {
      switch (type.value) {
        case 'story':
          return link.value.story?.name
        case 'email':
          return link.value.email
        case 'url':
          return link.value.url
      }
    }

    return undefined
  })

  return {
    type,
    url,
    isValid,
    isInternal,
    isExternal,
    isAnchor,
    displayName,
    withProtocolURL
  }
}
