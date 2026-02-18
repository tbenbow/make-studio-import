import { getToken } from '#auth'
import { accessGroupsToSalesforceBadges } from '~/composables/useAccess'
import { useSalesforce } from '~/composables/useSalesforce'
import type { SessionUser } from '~/types/auth'
import { uniqWith, isEqual } from 'lodash-es'

function resolveContactProfileResponse(response: any = {}): Partial<SessionUser['profile']> {
  return {
    contactId: response.Id,
    imisId: response.External_Import_Id__c,
    name: response.Name,
    nickname: response.Nickname__c,
    email: response.OrderApi__Preferred_Email__c,
    emailType: response.OrderApi__Preferred_Email_Type__c,
    phone: response.OrderApi__Preferred_Phone__c,
    phoneType: response.OrderApi__Preferred_Phone_Type__c,
    badges: typeof response.OrderApi__Badges__c === 'string'
      ? response.OrderApi__Badges__c.split(',')
      : []
  }
}

function resolveContactOrganizationResponse(response: any = {}): Partial<SessionUser['organization']> {
  return {
    name: response.Contact_Acct_Name__c,
    membershipType: response.Primary_Account_Member_type__c,
    membershipStatus: response.Primary_Account_Membership_Status__c,
    membershipExpiration: response.Account_Membership_Paid_Through_Date__c,
    administrators: response.Primary_Account_Administrators__c,
    region: response.Primary_Account_Region__c,
    accreditationExpiration: response.Primary_Account_Land_Trust_Accreditation__c,
    lastTerrafirmaPolicyYear: response.Primary_Account_Last_Terrafirma_Policy_Y__c,
    terrafirmaRegion: response.Primary_Account_Terrafirma_region__c
  }
}

function resolveProductsResponse(response: any[] = []): SessionUser['products'] {
  const products = response.map((product) => ({
    id: product.OrderApi__Item__c,
    date: product.OrderApi__Receipt__r?.OrderApi__Date__c,
    name: product.OrderApi__Item__r?.Name
  }))

  return uniqWith(products, isEqual)
}

function resolveRegistrationsResponse(response: any[] = []): SessionUser['registrations'] {
  const registrations = response.map((registration) => ({
    id: registration.EventApi__Attendee_Event__c,
    date: registration.EventApi__Registration_Date__c,
    name: registration.Event_Name__c
  }))

  return uniqWith(registrations, isEqual)
}

export default defineEventHandler(async (event) => {
  const token = ['access_token', 'sub'].every((key) => getQuery(event).hasOwnProperty(key))
    ? getQuery(event)
    : await getToken({ event })
  
  //console.log('[/api/session] token =', token)

  if (!token) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Unauthenticated'
    })
  }

  const { public: { salesforce: { instanceUrl } } } = useRuntimeConfig()
  const { $fetchSalesforce } = useSalesforce(token.access_token as string)

  const testUserId = ''

  const userId = process.env.NODE_ENV === 'development' && testUserId
    ? testUserId
    : token.sub
  
  const responses: any = await $fetchSalesforce(`/composite`, {
    method: 'POST',
    body: {
      compositeRequest: [
        {
          method: 'GET',
          url: `/sobjects/User/${userId}`,
          referenceId: 'User'
        }, {
          method: 'GET',
          url: '/sobjects/Contact/@{User.ContactId}',
          referenceId: 'Contact'
        }, {
          method: 'GET',
          url: "/query?q=\
            SELECT OrderApi__Item__c, OrderApi__Receipt__r.OrderApi__Date__c, OrderApi__Item__r.Name \
            FROM OrderApi__Receipt_Line__c \
            WHERE OrderApi__Item__r.OrderApi__Item_Class__r.OrderApi__Is_Publication__c = true \
              AND OrderApi__Item__c != null \
              AND OrderApi__Contact__c = '@{User.ContactId}' \
            ORDER BY OrderApi__Receipt__r.OrderApi__Date__c DESC NULLS LAST, OrderApi__Item__r.Name ASC",
          referenceId: 'Products'
        }, {
          method: 'GET',
          url: "/query?q=\
            SELECT EventApi__Attendee_Event__c, Event_Name__c, EventApi__Registration_Date__c \
            FROM EventApi__Attendee__c \
            WHERE EventApi__Contact__c = '@{User.ContactId}' \
            ORDER BY EventApi__Registration_Date__c DESC NULLS LAST, Event_Name__c ASC",
          referenceId: 'Registrations'
        }
      ]
    }
  })

  if (responses) {
    // console.log('[/api/session] responses =', responses.compositeResponse)

    const user: SessionUser = {
      id: undefined,
      internalId: undefined,
      authorized: false,
      profile: {},
      organization: {},
      groups: [],
      products: [],
      registrations: []
    }

    responses.compositeResponse.forEach((response: any) => {
      //console.log(`[/api/session] response.${response.referenceId} [${response.httpStatusCode}] body =`, response.body)
      
      if (response.httpStatusCode === 200) {
        switch (response.referenceId) {
          case 'User':
            user.id = response.body.Id
            user.internalId = token.internalId as string
            break
          
          case 'Contact':
            user.profile = resolveContactProfileResponse(response.body)
            user.profile.url = `${instanceUrl}/s/#/profile/my_info`
            user.organization = resolveContactOrganizationResponse(response.body)
            user.organization.url = `${instanceUrl}/s/myorg`
            user.organization.membershipUrl = `${instanceUrl}/s/#/profile/acct_subscriptions`
            user.organization.userIsAdmin = user.profile.badges?.some((badge) => badge.toLowerCase() === 'administrator')
            break
          
          case 'Products':
            user.products = resolveProductsResponse(response.body.records)
            break
          
          case 'Registrations':
            user.registrations = resolveRegistrationsResponse(response.body.records)
            break
        }
      } else {
        /*
        throw createError({
          statusCode: response.httpStatusCode,
          statusMessage: `[${response.body.errorCode}] ${response.body.message}`
        })
        */
      }
    })

    // Set `authorized` based on badges
    if (user.profile.badges?.length) {
      user.authorized = user.profile.badges.some((badge) =>
        badge.toLowerCase().endsWith('member')
        || badge.toLowerCase() === 'land trust alliance staff'
        || badge.toLowerCase() === 'special access'
      )
    }
  
    // Translate user profile badges to array of Storyblok access group values.
    //   badges: [
    //     'Farm Bill Working Group',
    //     'Land Trust Member'
    //   ]
    // to
    //   groups: ['FB']
    if (user.profile.badges?.length) {
      user.groups = user.profile.badges.map((badge) =>
        Object
          .keys(accessGroupsToSalesforceBadges)
          .find((key) => accessGroupsToSalesforceBadges[key] === badge)
      ).filter((group) => group !== undefined)
    }
    
    return user
  } else {
    throw createError({
      statusCode: 406,
      statusMessage: 'Error fetching user'
    })
  }
})
