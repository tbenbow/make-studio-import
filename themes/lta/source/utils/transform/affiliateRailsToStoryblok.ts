import { toStoryblok } from './toStoryblok'
import { resolveRoute } from '../resolveRoute'
import { cloneDeep } from 'lodash-es'

/**
 * Transform Rails affiliate object to Storyblok affiliate object format.
 *
 * @param {object} affiliateRails Algolia affiliate object
 * @returns {object} Storyblok affiliate object
 */
export const affiliateRailsToStoryblok = (affiliateRails = {}) => {
  const { id, name, slug, ...affiliate } = cloneDeep(affiliateRails)

  const fullSlug = resolveRoute('affiliate', slug)?.replace(/^\//, '')

  return toStoryblok('Affiliate', affiliate, {
    name,
    slug,
    full_slug: fullSlug,
    uuid: id
  })
}
