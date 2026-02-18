import {
  options,
  vTooltip
} from 'floating-vue'
import 'floating-vue/dist/style.css'

options.distance = 6
options.themes.tooltip.triggers.push('click')
options.themes.tooltip.html = true

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('tooltip', vTooltip)
})
