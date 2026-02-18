import { computed } from 'vue'
import { useUser } from '~/composables/useUser'
import type { SessionUser } from '~/types/auth'

export const access: any = {
  PUBLIC: 'public',
  PRIVATE: 'private',
  RESTRICTED: 'restricted'
} as const

export const accessGroups: any = {
  ADVOCACY_AMBASSADOR: 'AA',
  BOARD: 'BO',
  BOARD_EMERITUS: 'BE',
  COMMISSIONER: 'CO',
  CONSERVATION_DEFENSE: 'CD',
  FARM_BILL_WORKING_GROUP: 'FB',
  LEADERSHIP_COUNCIL: 'LC'
} as const

// Map Storyblok access group values to Salesforce badge values.
// Note: Some have not been re-added in Salesforce (yet?)
export const accessGroupsToSalesforceBadges: any = {
  [accessGroups.ADVOCACY_AMBASSADOR]: 'Land Trust Alliance Advocacy Ambassadors',
  [accessGroups.BOARD]: 'Land Trust Alliance Board of Directors',
  [accessGroups.BOARD_EMERITUS]: 'Land Trust Alliance Board Emeritus',
  [accessGroups.CONSERVATION_DEFENSE]: 'Conservation Defense Network',
  [accessGroups.FARM_BILL_WORKING_GROUP]: 'Farm Bill Working Group',
  [accessGroups.LEADERSHIP_COUNCIL]: 'Land Trust Alliance Leadership Council'
} as const

export interface AccessProps {
  access?: typeof access[keyof typeof access]
  accessGroups?: string[]
}

export const props = {
  access: {
    type: String as PropType<AccessProps['access']>,
    default: access.PUBLIC,
    validator: (value: AccessProps['access']) => !value || Object.values(access).includes(value)
  },
  accessGroups: {
    type: Array as PropType<AccessProps['accessGroups']>
  }
}

export const useAccess = (props: AccessProps = { access: access.PUBLIC }, user?: SessionUser) => {
  const { inGroup: userInGroup } = useUser(user)

  const accessIsPublic = computed(() => {
    return props.access === access.PUBLIC || !props.access
  })

  const accessIsPrivate = computed(() => {
    return props.access === access.PRIVATE
  })

  const accessIsRestricted = computed(() => {
    return props.access === access.RESTRICTED
  })

  const accessIsLimited = computed(() => {
    return accessIsPrivate.value || accessIsRestricted.value
  })

  const accessIsLimitedToGroups = computed(() => {
    return (accessIsLimited.value && props.accessGroups && props.accessGroups.length)
      ? true
      : false
  })

  /**
   * Checks if the user has full access. Full access is determined by:
   * - `access` is public
   * - `access` is private, user is logged-in, and user is authorized
   * - `access` is restricted, user is logged-in, user is authorized, and, if
   *   restricted to groups, the user is in the group
   *
   * @returns True if user has full access (public or private/restricted with authorized access)
   */
  const userHasAccess = computed(() => {
    if (accessIsPublic.value) {
      return true
    }

    if (accessIsLimited.value) {
      // if (loggedIn.value && user.value?.authorized) {
      if (user?.authorized) {
        if (accessIsLimitedToGroups.value) {
          // @ts-ignore Type 'undefined' is not assignable, `props.accessGroups` checked for value in `accessIsLimitedToGroups`
          if (userInGroup(props.accessGroups)) {
            return true
          }
        } else {
          return true
        }
      }
    }

    return false
  })

  /**
   * Checks if the user has view access. View access is determined by:
   * - `access` is public
   * - `access` is private (private access generally means only part of the content is restricted)
   * - `access` is restricted and user has full access
   *
   * @returns True if user has view access
   */
  const userHasViewAccess = computed(() => {
    return !!(
      accessIsPublic.value ||
      accessIsPrivate.value ||
      (accessIsRestricted.value && userHasAccess.value)
    )
  })

  return {
    accessIsPublic,
    accessIsPrivate,
    accessIsRestricted,
    accessIsLimited,
    accessIsLimitedToGroups,
    userHasAccess,
    userHasViewAccess
  }
}
