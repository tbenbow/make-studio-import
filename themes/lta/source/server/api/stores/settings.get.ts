import omitDeep from 'omit-deep-lodash'

export default defineEventHandler(async (event) => {
  console.info('Fetch settings')

  const { getStory } = event.context.$storyblok
  
  const response = await getStory('settings')

  let settings = response?.data?.story?.content

  if (settings) {
    settings = omitDeep(settings, [
      '_editable',
      'alternates',
      'created_at',
      'default_full_slug',
      'first_published_at',
      'group_id',
      'is_startpage',
      'lang',
      'meta_data',
      'sort_by_date',
      'tag_list',
      'translated_slugs'
    ])

    return settings
  }
})
