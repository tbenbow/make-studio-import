import { storyblokToComponentProps } from '~/utils/transform/index'

export interface StoryProps {
  alternates?: Record<string, any>[]
  content?: Record<string, any>
  created_at?: string
  default_full_slug?: string
  first_published_at?: string
  full_slug?: string
  group_id?: string
  id?: number
  is_startpage?: boolean
  lang?: string
  meta_data?: Record<string, any>
  name?: string
  parent_id?: number
  path?: string
  position?: number
  published_at?: string
  release_id?: string
  slug?: string
  sort_by_date?: string
  tag_list?: string[]
  translated_slugs?: Record<string, any>[]
  uuid?: string
}

export const useStory = (props: StoryProps) => {
  const component = computed(() => {
    return props.content?.component
      ? ['Settings', 'Site'].includes(props.content.component)
        ? false
        : props.content.component
      : 'Page'
  })

  const componentProps = computed(() => {
    return storyblokToComponentProps(props)
  })

  /**
   * Metadata
   */

  const head = ref()
  const seoMeta = ref()

  const img = useImage()

  // Get meta field
  const meta = props.content?.meta || {}

  // Get title from (1) meta or (2) story name
  const title = meta.title || props.name

  // Get description from (1) meta, (2) story field named `excerpt`, (3) story field name `description` that is a string
  const description =
    meta.description ||
    props.content?.excerpt ||
    (typeof props.content?.description === 'string' &&
      props.content.description)

  // Get image from (1) meta or (2) story field named `image`
  const image = meta.og_image || props.content?.image?.filename

  head.value = {
    title
  }

  seoMeta.value = withoutEmptyValues({
    description,
    ogTitle: meta.og_title || title,
    ogDescription: meta.og_description || description,
    ogImage: img(image, {}, { preset: 'ogImage' }),
    twitterTitle: meta.twitter_title || title,
    twitterDescription: meta.twitter_description || description,
    twitterImage: img(meta.twitter_image || image, {}, { preset: 'ogImage' })
  })

  return {
    ...props,
    component,
    componentProps,
    head,
    seoMeta
  }
}
