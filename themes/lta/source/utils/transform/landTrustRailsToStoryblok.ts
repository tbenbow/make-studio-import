import { toStoryblok } from './toStoryblok'
import { resolveRoute } from '../resolveRoute'
import { cloneDeep } from 'lodash-es'

/**
 * Transform Rails land trust object to Storyblok land trust object format.
 *
 * @param {object} railsLandTrust Algolia land trust object
 * @returns {object} Storyblok land trust object
 */
export const landTrustRailsToStoryblok = (railsLandTrust = {}) => {
  const { id, name, slug, ...landTrust } = cloneDeep(railsLandTrust)

  const fullSlug = resolveRoute('land-trust', slug)?.replace(/^\//, '')

  return toStoryblok('LandTrust', landTrust, {
    name,
    slug,
    full_slug: fullSlug,
    uuid: id
  })
}
