import {
  disableBodyScroll,
  enableBodyScroll,
  clearAllBodyScrollLocks
} from 'body-scroll-lock'

export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.provide('bodyScroll', {
    lock: disableBodyScroll,
    unlock: enableBodyScroll,
    clearAll: clearAllBodyScrollLocks
  })
})