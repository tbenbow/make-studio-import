import { reactive } from 'vue'
import { Loader } from '@googlemaps/js-api-loader'

class GoogleMaps {
  loader
  google
  loaded = false

  constructor(loader, autoLoad = true) {
    if (loader) {
      this.loader = loader

      if (autoLoad) {
        this.load()
      }
    }
  }

  load() {
    this.loader
      .load()
      .then((google) => {
        this.google = google
        this.loaded = true
      })
      .catch((err) => console.error(err))
  }
}

export default defineNuxtPlugin(nuxtApp => {
  const runtimeConfig = useRuntimeConfig()
  const placesLoader = process.client
  ? new Loader({
      apiKey: runtimeConfig.public.google.apiKey,
      libraries: ['places']
    })
  : undefined

  nuxtApp.provide('googleMaps', reactive(new GoogleMaps(placesLoader)))
})