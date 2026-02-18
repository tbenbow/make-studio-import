/**
 * Transform a text string to a simple rich text document
 * @param {string} text The text string
 * @param {number} length Truncate to a given number of paragraph
 * @returns {object} A rich text document
 */

import { BlockTypes, TextTypes, type StoryblokRichTextDocumentNode } from '@storyblok/richtext'

export const plainTextToRichText = (text?: string, length?: number) => {
  const document: StoryblokRichTextDocumentNode = {
    type: BlockTypes.DOCUMENT,
    content: (text || '').split(/\r?\n/).map((paragraph) => ({
      type: BlockTypes.PARAGRAPH,
      content: [
        {
          type: TextTypes.TEXT,
          text: paragraph
        }
      ]
    }))
  }

  if (length && document.content?.length) {
    document.content = document.content.slice(0, length)
  }

  return document
}
