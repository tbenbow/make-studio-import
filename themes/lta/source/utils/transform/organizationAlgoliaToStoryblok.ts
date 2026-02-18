import { toStoryblok } from './toStoryblok'
import { cloneDeep } from 'lodash-es'

/**
 * Transform Algolia organization object to Storyblok organization object format.
 *
 * @param {object} algoliaOrganization Algolia organization object
 * @returns {object} Storyblok organization object
 */
export const organizationAlgoliaToStoryblok = (algoliaOrganization = {}) => {
  const {
    name,
    slug,
    fullSlug,
    tags,
    objectID,
    __position,
    _highlightResult,
    ...organization
  } = cloneDeep(algoliaOrganization)

  return toStoryblok('Organization', organization, {
    name,
    slug,
    full_slug: fullSlug,
    tag_list: tags,
    uuid: objectID
  })
}
