import { toStoryblok } from './toStoryblok'
import { cloneDeep } from 'lodash-es'

/**
 * Transform Algolia resource object to Storyblok resource object format.
 *
 * @param {object} algoliaResource Algolia resource object
 * @returns {object} Storyblok resource object
 */
export const resourceAlgoliaToStoryblok = (algoliaResource = {}) => {
  const {
    name,
    slug,
    fullSlug,
    objectID,
    publishDate,
    tags,
    'topics.lvl0': topicsLvl0,
    'topics.lvl1': topicsLvl1,
    'type.lvl0': typeLvl0,
    'type.lvl1': typeLvl1,
    imageUrl,
    contentLink,
    __position,
    _highlightResult,
    ...resource
  } = cloneDeep(algoliaResource)

  resource.topics = []

  if (Array.isArray(topicsLvl1)) {
    // Convert 'Parent Topic > Topic' string to Storyblok-like object
    topicsLvl1.forEach((topicLvl1) => {
      const [parentName, name] = topicLvl1.split('>').map((part: string) => part.trim())

      resource.topics.push({
        name,
        content: { parent: { name: parentName } }
      })

      // Delete level 1 topics from level 0 topics
      topicsLvl0.find(
        (topicLvl0: string, index: number) =>
          (topicLvl0 === name || topicLvl0 === parentName) &&
          topicsLvl0.splice(index, 1)
      )
    })
  }

  if (Array.isArray(topicsLvl0)) {
    // Add all remaining level 0 topics
    topicsLvl0.forEach((topic) => {
      resource.topics.push({ name: topic })
    })
  }

  resource.type = typeLvl1 || typeLvl0

  resource.image = { filename: imageUrl }

  if (typeof contentLink === 'string') {
    resource.contentLink = contentLink.startsWith('http')
      ? { linktype: 'url', url: contentLink }
      : { linktype: 'story', story: { url: contentLink } }
  }

  return toStoryblok('Resource', resource, {
    name,
    slug,
    first_published_at: publishDate,
    full_slug: fullSlug,
    tag_list: tags,
    uuid: objectID
  })
}
