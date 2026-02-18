import { useRails } from '~/composables/useRails'

export default defineEventHandler(async (event) => {
  const { $fetchRails } = useRails()
  const slug = getRouterParam(event, 'slug')

  try {
    const response: any = await $fetchRails(`/land_trusts/${slug}`)
    
    if (response.status === 'success') {
      return transform.landTrustRailsToStoryblok(response.data)
    }
  } catch (err) {
    throw createError({ statusMessage: 'Land trust not found' })
  }
})
