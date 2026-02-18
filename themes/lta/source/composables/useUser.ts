import type { SessionUser } from '~/types/auth'
import { useDateFns } from '~/composables/useDateFns'

// Webinar Pass badge suffixes
// Webinar Pass badges must be in one of these formats:
// - "YYYY Webinar Pass" (2025 and earlier)
// - "YYYY Online Learning Pass" (2026 and beyond)
const WEBINAR_PASS_BADGE_SUFFIXES = ['Webinar Pass', 'Online Learning Pass']

export const useUser = (user?: SessionUser) => {
  const { config, toDate, format, formatDate } = useDateFns()

  /**
   * Check if user has access to a webinar resource via Webinar Pass badge; the years must match
   * @param {object} resource - The resource
   * @returns {boolean} True if user has access
   */
  function hasAccessViaWebinarPass(resource: any) {
    const resourceHasWebinarPass = resource?.webinarPass ? true : false
    const resourceStartDate = resource?.startDate
      ? toDate(resource.startDate, { timeZone: 'UTC' })
      : undefined
    const resourceYear = resourceStartDate
      ? format(resourceStartDate, 'yyyy', true)
      : undefined
    const userBadges = user?.profile?.badges?.map((badge) => badge.toLowerCase())

    // Check if user has any of the valid webinar pass badge formats for this year
    const hasMatchingBadge = WEBINAR_PASS_BADGE_SUFFIXES.some((suffix) => {
      const badgeName = `${resourceYear} ${suffix}`.toLowerCase()
      return userBadges?.includes(badgeName)
    })

    return resourceHasWebinarPass && resourceYear && hasMatchingBadge
      ? true
      : false
  }

  /**
   * Check if user is in a group
   * @param {string|array} group The group ID or array of group IDs
   * @returns True if the user is in any of the given groups
   */
  function inGroup(group: string | string[]) {
    const compareGroups = typeof group === 'string'
      ? [group]
      : Array.isArray(group)
        ? group
        : []
    
    return compareGroups.some((group) => user?.groups?.includes(group))
  }

  /**
   * Get user purchased product record
   * @param {string} id - The product ID
   * @returns {object} The purchased product record (id, date)
   */
  function getProduct(id: string) {
    return user?.products?.find((product) => product.id === id)
  }

  function getProductDate(id: string) {
    const product = getProduct(id)

    if (product?.date) {
      const dateUTC = toDate(product.date, {
        timeZone: config.timeZone
      })
      return formatDate(dateUTC)
    }

    return undefined
  }

  /**
   * Check if user has purchased a product ID
   * @param {string} id - The product ID
   * @returns {boolean} True if user has purchased the ID
   */
  function hasProduct(id: string) {
    return !!getProduct(id)
  }

  /**
   * Get user purchased registration record
   * @param {string} id - The registration ID
   * @returns {object} The purchased registration record (id, date)
   */
  function getRegistration(id: string) {
    return user?.registrations?.find((registration) => registration.id === id)
  }

  function getRegistrationDate(id: string) {
    const registration = getRegistration(id)

    if (registration?.date) {
      const dateUTC = toDate(registration.date, {
        timeZone: config.timeZone
      })
      return formatDate(dateUTC)
    }

    return undefined
  }

  /**
   * Check if user has purchased a registration ID
   * @param {string} id - The registration ID
   * @returns {boolean} True if user has purchased the ID
   */
  function hasRegistration(id: string) {
    return !!getRegistration(id)
  }

  return {
    user,
    hasAccessViaWebinarPass,
    inGroup,
    getProduct,
    getProductDate,
    hasProduct,
    getRegistration,
    getRegistrationDate,
    hasRegistration
  }
}
