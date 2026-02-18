import { library, config, type IconPack } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import * as fab from './fontawesome/brands-icons'
import * as fal from './fontawesome/pro-light-icons'
import * as fas from './fontawesome/pro-solid-icons'

library.add(
  fab as IconPack,
  fal as IconPack,
  fas as IconPack
)

config.autoAddCss = false

export default defineNuxtPlugin((nuxtApp) => {
  // Using custom wrapper component at global/FontAwesomeIcon.vue so we can
  // provide a default value for the `title-id` prop. The one that ships with
  // it doesn't seem to be SSR-safe as it can cause hydration warnings.
  //
  // nuxtApp.vueApp.component('font-awesome-icon', FontAwesomeIcon)
})
