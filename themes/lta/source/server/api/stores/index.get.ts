export default defineEventHandler(async () => {
  console.info('Fetch stores…')

  const [
    settings,
    site,
    stories,
    glossaries
  ] = await Promise.all([
    $fetch('/api/stores/settings'),
    $fetch('/api/stores/site'),
    $fetch('/api/stores/stories'),
    $fetch('/api/stores/glossaries')
  ]).catch(() => {
    throw createError({ statusMessage: 'Error fetching stores' })
  })

  return {
    settings,
    site,
    stories,
    glossaries
  }
})
