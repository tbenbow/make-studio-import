import { loadStoryblokBridge, useStoryblokBridge as _useStoryblokBridge } from '@storyblok/js'

export const useStoryblokBridge = async (...args: Parameters<typeof _useStoryblokBridge>) => {
  const inEditor = import.meta.client && window.location?.search?.includes('_storyblok_tk')
  
  if (inEditor && args?.[0]) {
    if (!args?.[0] || !args?.[1]) {
      return console.warn('[useStoryblokBridge] Story ID and callback function are required')
    }

    if (!args?.[2]) {
      const { defaultParams } = useStoryblok()
      const {
        resolve_relations: resolveRelations,
        resolve_links: resolveLinks
      } = defaultParams('stories')

      args[2] = {
        resolveRelations,
        resolveLinks
      }
    }

    await loadStoryblokBridge()
    _useStoryblokBridge(...args)
  }
}
