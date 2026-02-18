import { Hooper, Slide, Navigation, Progress } from './hooper-vue3/hooper.esm'
import './hooper-vue3/hooper.css'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('Hooper', Hooper)
  nuxtApp.vueApp.component('HooperSlide', Slide)
  nuxtApp.vueApp.component('HooperNavigation', Navigation)
  nuxtApp.vueApp.component('HooperProgress', Progress)
})
