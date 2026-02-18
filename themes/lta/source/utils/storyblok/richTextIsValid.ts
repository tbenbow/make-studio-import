/**
 * Test if a storyblok link field is valid. When link fields are empty in
 * Storyblok, they still come through as an object, so we need to check the
 * relevant fields based on the `linktype`.
 */

export const richTextIsValid = (richText?: any): boolean => {
  return richText
      && typeof richText === 'object'
      && Array.isArray(richText.content?.[0]?.content)
      && richText.content?.[0]?.content.length
    ? true
    : false
}
