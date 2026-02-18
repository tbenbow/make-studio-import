import { toStoryblok } from './toStoryblok'
import { resolveRoute } from '../resolveRoute'
import { cloneDeep } from 'lodash-es'

/**
 * Transform Algolia land trust object to Storyblok land trust object format.
 *
 * @param {object} algoliaLandTrust Algolia land trust object
 * @returns {object} Storyblok land trust object
 */
export function landTrustAlgoliaToStoryblok(algoliaLandTrust = {}) {
  const {
    name,
    slug,
    objectID,
    __position,
    _geoloc,
    _highlightResult,
    ...landTrust
  } = cloneDeep(algoliaLandTrust)

  const fullSlug = resolveRoute('land-trust', slug)?.replace(/^\//, '')

  return toStoryblok('LandTrust', landTrust, {
    name,
    slug,
    full_slug: fullSlug,
    uuid: objectID
  })
}
