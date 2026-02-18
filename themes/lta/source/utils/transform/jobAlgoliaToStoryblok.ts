import { toStoryblok } from './toStoryblok'
import { resolveRoot } from '~/utils/resolveRoot'
import { plainTextToRichText } from '~/utils/storyblok/index'
import { cloneDeep } from 'lodash-es'

/**
 * Transform Algolia job object to Storyblok job object format.
 *
 * @param {object} algoliaJob Algolia job object
 * @returns {object} Storyblok job object
 */
export const jobAlgoliaToStoryblok = (algoliaJob = {}) => {
  const { name, slug, objectID, __position, _highlightResult, ...job } =
    cloneDeep(algoliaJob)

  // Convert the simple excerpt string to a rich text object
  job.excerpt = plainTextToRichText(job.excerpt)

  return toStoryblok('Job', job, {
    name,
    slug,
    full_slug: resolveRoot('job', slug)?.replace(/^\//, ''),
    uuid: objectID
  })
}
