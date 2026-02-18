import { getServerSession } from '#auth'
import { pick } from 'lodash-es'

export default defineEventHandler(async (event) => {
  console.info('Fetch glossaries')

  const session = await getServerSession(event)
  const { getStories } = event.context.$storyblok

  const response = await getStories({
    content_type: 'Glossary',
    excluding_fields: ['definition'].join(',')
  }, false, session?.user)

  const glossaries = response?.map((glossary: any) => ({
    ...pick(glossary, ['name', 'uuid']),
    glossaryTerms: glossary.content?.glossaryTerms?.map(
      (glossaryTerm: any) => ({
        uuid: glossaryTerm.uuid,
        term: glossaryTerm.content?.term
      })
    )
  }))

  return glossaries
})
