export default defineEventHandler(async (event) => {
  // Purge Storyblok client cache
  const { flushCache } = event.context.$storyblok
  await flushCache()
  console.log('Purged Storyblok client cache')

  // Purge cached API routes
  const cachedApiKeys = await useStorage('cache').getKeys('nitro:routes:_:')
  
  console.log(`Purging ${cachedApiKeys.length} cache keys…`)

  cachedApiKeys.forEach(async (key) => {
    if (key.startsWith('nitro:routes:_:api')) {
      console.log('Purged cache key:', key)
      await useStorage('cache').removeItem(key)
    }
  })

  console.log('Done purging cache')

  event.node.res.end()
})
