import { toStoryblok } from './toStoryblok'
import { resolveRoot } from '~/utils/resolveRoot'
import { cloneDeep } from 'lodash-es'

/**
 * Transform Algolia post object to Storyblok post object format.
 *
 * @param {object} algoliaPost Algolia post object
 * @returns {object} Storyblok post object
 */
export const postAlgoliaToStoryblok = (algoliaPost = {}) => {
  const {
    name,
    slug,
    objectID,
    publishDate,
    imageUrl,
    categories,
    authors,
    __position,
    _highlightResult,
    ...post
  } = cloneDeep(algoliaPost)

  post.image = { filename: imageUrl }

  return toStoryblok('Post', post, {
    name,
    slug,
    first_published_at: publishDate,
    full_slug: resolveRoot('post', slug)?.replace(/^\//, ''),
    uuid: objectID
  })
}
