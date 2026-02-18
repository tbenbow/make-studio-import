import { getToken } from '#auth'
import { useSalesforce } from '~/composables/useSalesforce'
import { createHash } from 'crypto'

export default defineEventHandler(async (event) => {
  const token = ['access_token', 'sub'].every((key) => getQuery(event).hasOwnProperty(key))
    ? getQuery(event)
    : await getToken({ event })

  if (!token) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Unauthenticated'
    })
  }

  const { $fetchSalesforce } = useSalesforce(token.access_token as string)
  
  const responses: any = await $fetchSalesforce('/composite', {
    method: 'POST',
    body: {
      compositeRequest: [
        {
          method: 'GET',
          url: `/sobjects/User/${token.sub}`,
          referenceId: 'User'
        }, {
          method: 'GET',
          url: "/query?q=\
            SELECT External_Import_Id__c \
            FROM Contact \
            WHERE Id = '@{User.ContactId}'",
          referenceId: 'Contact'
        }
      ]
    }
  })

  if (responses) {
    let internalId = token.sub

    responses.compositeResponse
      .filter((response: any) => response.referenceId === 'Contact' && response.body.records.length)
      .forEach((response: any) => {
        // Support legacy `imisId` (if available) to preserve bookmarks/likes
        // data — we MD5-hashed the IMIS ID. Otherwise, use the Salesforce ID.
        const { External_Import_Id__c: imisId } = response.body.records[0]
        // const imisId = '232760'
        
        if (imisId) {
          internalId = createHash('md5').update(imisId).digest('hex')
        }
      })

    return internalId
  } else {
    throw createError({
      statusCode: 406,
      statusMessage: 'Error fetching ID hash'
    })
  }
})
