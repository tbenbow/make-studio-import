/**
 * In Storyblok Visual Editor
 * 
 * Detect whether site is being viewed inside the Storyblok visual editor.
 *
 * @src https://www.storyblok.com/faq/how-to-verify-the-preview-query-parameters-of-the-visual-editor
 */

import crypto from 'crypto'
import type { LocationQuery } from 'vue-router'

export const inVisualEditor = (query: LocationQuery = {}, apiKey = ''): boolean => {
  const validationString =
    query['_storyblok_tk[space_id]'] +
    ':' +
    apiKey +
    ':' +
    query['_storyblok_tk[timestamp]']
  const validationToken = crypto
    .createHash('sha1')
    .update(validationString)
    .digest('hex')

  return !!(
    query['_storyblok_tk[token]'] === validationToken &&
    typeof query['_storyblok_tk[timestamp]'] === 'string' &&
    parseInt(query['_storyblok_tk[timestamp]']) > Math.floor(Date.now() / 1000) - 3600
  )
}
