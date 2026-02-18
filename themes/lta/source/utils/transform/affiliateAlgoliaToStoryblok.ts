import { toStoryblok } from './toStoryblok'
import { resolveRoute } from '../resolveRoute'
import { cloneDeep } from 'lodash-es'

/**
 * Transform Algolia affiliate object to Storyblok affiliate object format.
 *
 * @param {object} algoliaAffiliate Algolia affiliate object
 * @returns {object} Storyblok affiliate object
 */
export const affiliateAlgoliaToStoryblok = (affiliateAlgolia = {}) => {
  const {
    name,
    slug,
    objectID,
    __position,
    _geoloc,
    _highlightResult,
    ...affiliate
  } = cloneDeep(affiliateAlgolia)

  const fullSlug = resolveRoute('affiliate', slug)?.replace(/^\//, '')

  return toStoryblok('Affiliate', affiliate, {
    name,
    slug,
    full_slug: fullSlug,
    uuid: objectID
  })
}
