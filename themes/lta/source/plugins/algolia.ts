import { algoliasearch } from 'algoliasearch'
import { recommendClient } from '@algolia/recommend'
import AlgoliaAnalytics from 'search-insights'

class Algolia {
  client
  env

  constructor(applicationId: string, apiKey: string, env: string) {
    this.env = env
    this.client = algoliasearch(applicationId, apiKey)
  }

  indexName(name: string) {
    return this.env ? `${name}_${this.env}` : name
  }
}

export default defineNuxtPlugin(() => {
  const { loggedIn, user } = useLtaAuth()
  const { public: { algolia } } = useRuntimeConfig()

  AlgoliaAnalytics('init', {
    appId: algolia.applicationId,
    apiKey: algolia.apiKey,
    useCookie: true,
    userToken: loggedIn.value ? user.value?.internalId : undefined
  })
  
  return {
    provide: {
      algolia: new Algolia(
        algolia.applicationId,
        algolia.apiKey,
        algolia.env
      ),
      algoliaRecommend: recommendClient(algolia.applicationId, algolia.apiKey),
      algoliaAnalytics: AlgoliaAnalytics
    }
  }
})
