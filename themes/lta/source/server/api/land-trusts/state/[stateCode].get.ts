import { useRails } from '~/composables/useRails'

export default defineEventHandler(async (event) => {
  const { $fetchRails } = useRails()
  const stateCode = getRouterParam(event, 'stateCode')

  try {
    const response: any = await $fetchRails(`/land_trusts/state/${stateCode}`)

    if (response.status === 'success') {
      return response.data
        .sort((a: any, b: any) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
        .map((landTrust: any) => transform.landTrustRailsToStoryblok(landTrust))
    }
  } catch (err) {
    throw createError({ statusMessage: 'Land trusts not found' })
  }
})
