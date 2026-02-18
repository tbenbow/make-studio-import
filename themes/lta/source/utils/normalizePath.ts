import { withoutLeadingSlash, withoutTrailingSlash } from 'ufo'

export const normalizePath = (route: string = '') => {
  return withoutLeadingSlash(withoutTrailingSlash(route))
}
