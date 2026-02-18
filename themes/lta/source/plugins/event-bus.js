/**
 * Replacement for Vue 2 $on, $once, $off, $emit, but just on $nuxt
 * 
 * @src https://v3-migration.vuejs.org/breaking-changes/events-api#event-bus
 */

import mitt from 'mitt'

const emitter = mitt()

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.$on = (...args) => emitter.on(...args)
  nuxtApp.$once = (...args) => emitter.once(...args),
  nuxtApp.$off = (...args) => emitter.off(...args),
  nuxtApp.$emit = (...args) => emitter.emit(...args)
})
