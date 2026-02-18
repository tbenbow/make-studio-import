import { cloneDeep } from 'lodash-es'

export const useSalesforce = (access_token: string) => {
  const { public: { salesforce: { instanceUrl, apiBasePath } } } = useRuntimeConfig()

  const apiBaseUrl = `${instanceUrl}${apiBasePath}`

  /**
   * Simple wrapper around $fetch that includes the Salesforce access token and
   * prepends composite request URLs with `apiBasePath`.
   */
  function $fetchSalesforce(path: string, options: any = {}) {
    const { body: _body, ...optionsExceptBody } = options

    const body = cloneDeep(_body)

    // Prepend `compositeRequest` URLs with `apiBasePath`
    if (typeof body === 'object' && Array.isArray(body.compositeRequest)) {
      body.compositeRequest.forEach((request: any) => {
        if (request.url) {
          request.url = `${apiBasePath}${request.url}`
        }
      })
    }

    return $fetch(`${apiBaseUrl}${path}`, {
      ...optionsExceptBody,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${access_token}`
      },
      body
    })
  }

  return {
    $fetchSalesforce
  }
}
