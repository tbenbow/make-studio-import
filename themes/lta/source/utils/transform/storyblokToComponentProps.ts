import { cloneDeep } from 'lodash-es'

/**
 * Transform Storyblok story object to component props object format.
 *
 * @param {object} storyblokStory Storyblok story object
 * @returns {object} Component props object
 */
export const storyblokToComponentProps = (storyblokStory = {}) => {
  const { content, ...sys } = cloneDeep(storyblokStory)

  return {
    ...content,
    sys
  }
}
