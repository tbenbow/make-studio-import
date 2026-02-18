import { useSettingsStore } from '~/stores/settings'

export default defineNuxtRouteMiddleware(async (to, from) => {
  const { getRedirect } = useSettingsStore()

  /**
   * Check for redirects defined in Storyblok → Site → Site Settings → Redirects
   */
  const foundRedirect = getRedirect(to.path)

  if (foundRedirect) {
    return navigateTo(foundRedirect.to, { redirectCode: foundRedirect.statusCode || 301 })
  }

  /**
   * Redirect a Salesforce ID to the associated Storyblok resource
   * /redirect/resource/:salesforceId
   */
  const redirectResource = '^/redirect/resource/([A-Za-z0-9_-]+)/?$'
  const redirectResourceRegExp = new RegExp(redirectResource)

  if (redirectResourceRegExp.test(to.path)) {
    const salesforceId = redirectResourceRegExp.exec(to.path)[1]

    try {
      const resource = await $fetch('/api/resource-by-salesforce-id', {
        query: {
          id: salesforceId,
          params: {
            excluding_fields:
              'content,contentAssets,contentLink,description,image,meta,products,registrations,sponsors,topics',
            resolve_relations: false,
            resolve_assets: false
          }
        }
      })

      if (resource) {
        return navigateTo(`/${resource.full_slug}`, { redirectCode: 301 })
      }
    } catch (err) {}
  }
})
