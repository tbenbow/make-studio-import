import omitDeep from 'omit-deep-lodash'

export default defineEventHandler(async (event) => {
  console.info('Fetch site (header and footer)')

  const { getStories } = event.context.$storyblok
  
  const response = await getStories({
    by_slugs: 'site',
    content_type: 'Site',
    excluding_fields: ['settings', 'blocks', 'meta'].join(',')
  })

  const site = response?.[0]

  if (site) {
    const alert = omitDeep(site?.content?.alert?.[0], [
      '_editable'
    ])

    const dialog = omitDeep(site?.content?.dialog?.[0], [
      '_editable'
    ])

    const header = omitDeep(site?.content?.header?.[0], [
      '_editable'
    ])

    const footer = omitDeep(site?.content?.footer?.[0], [
      '_editable'
    ])

    return {
      alert,
      dialog,
      header,
      footer
    }
  }
})
