import { useRails } from '~/composables/useRails'

export default defineEventHandler(async (event) => {
  const { $fetchRails } = useRails()
  const { slug } = getQuery(event)

  try {
    const response: any = await $fetchRails(`/affiliates/${slug}`)
    
    if (response.status === 'success') {
      return transform.affiliateRailsToStoryblok(response.data)
    }
  } catch (err) {
    throw createError({ statusMessage: 'Affiliate not found' })
  }
})
