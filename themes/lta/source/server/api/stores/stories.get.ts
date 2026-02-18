import { keyBy, merge, pick, values } from 'lodash-es'
import { normalizePath } from '~/utils/normalizePath'

export default defineEventHandler(async (event) => {
  const collections = await $fetch('/api/stores/stories-collections')
    .catch(() => {
      throw new Error('Error fetching collections')
    })
  
  const completions = await $fetch('/api/stores/stories-completions')
    .catch(() => {
      throw new Error('Error fetching completions')
    })

  // Merge stories by uuid
  const storiesByKey = merge(
    keyBy(collections, 'uuid'),
    keyBy(completions, 'uuid')
  )

  // Now combine into standard array
  let stories = values(storiesByKey)

  // Reduce story data and add normalized full slug
  stories = stories.map((story: any) => ({
    ...pick(story, [
      'name',
      'uuid',
      'full_slug',
      'collection',
      'completion'
    ]),
    full_slug_normalized: normalizePath(story.full_slug)
  }))

  return stories
})
