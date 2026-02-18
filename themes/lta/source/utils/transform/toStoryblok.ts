/**
 * Storyblok story object format.
 *
 * @param {string} component Name of the local component to render
 * @param {object} content The story content fields
 * @param {object} sys The story sys properties
 * @returns {object} Storyblok story object
 */
export const toStoryblok = (component = 'Story', content = {}, sys = {}) => {
  return {
    content: {
      component,
      ...content
    },
    ...sys
  }
}
