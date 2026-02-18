import { reactive } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import { theme } from '#tailwind-config'

const useScreens = function () {
  const screens = {}

  Object.entries(theme.screens).forEach(([key, value]) => {
    if (typeof value === 'string') {
      screens[key] = useMediaQuery(`(min-width: ${value})`)
    }
  })

  return screens
}

export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.provide('theme', theme)
  nuxtApp.provide('screens', reactive(useScreens()))
})