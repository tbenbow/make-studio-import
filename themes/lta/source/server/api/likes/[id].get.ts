import { useRails } from '~/composables/useRails'

export default defineEventHandler(async (event) => {
  const { $fetchRails } = useRails()
  const id = getRouterParam(event, 'id')

  const response: any = await $fetchRails(`/likes`, { params: { oid: id } })

  if (response.success) {
    return response.count
  } else {
    throw createError({ statusMessage: 'Likes for object not found' })
  }
})
