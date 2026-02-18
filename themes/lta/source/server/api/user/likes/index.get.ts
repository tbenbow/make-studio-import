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

  const response: any = await $fetchRails(`/likes`, { params: { uid: token.internalId } })
  
  if (response.success) {
    return response.likes
  } else {
    throw createError('Error fetching likes')
  }
})
