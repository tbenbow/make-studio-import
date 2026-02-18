import { getToken } from '#auth'
import { useRails } from '~/composables/useRails'

export default defineEventHandler(async (event) => {
  const token = await getToken({ event })

  if (!token) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Unauthenticated'
    })
  }

  const { $fetchRails } = useRails()
  const id = getRouterParam(event, 'id')

  const response: any = await $fetchRails('/completions', {
    method: 'POST',
    params: {
      oid: id,
      uid: token.internalId
    }
  }).catch(() => {
    throw createError({ statusMessage: 'Error toggling completion' })
  })

  if (response.success) {
    return response.success
  } else {
    throw createError({ statusMessage: 'Completion not toggled' })
  }
})
