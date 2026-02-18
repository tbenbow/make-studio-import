import { withoutLeadingSlash, withoutTrailingSlash } from 'ufo'

export const resolveFullSlug = (path: string | string[] = '/') => {
  const { storyblok: { homeSlug = 'home' } } = useAppConfig()

  const normalizedPath = Array.isArray(path)
    ? path.filter((part) => part).join('/')
    : path

  const fullSlug = withoutLeadingSlash(withoutTrailingSlash(normalizedPath))

  return !fullSlug || fullSlug === '/'
    ? homeSlug
    : fullSlug
}
