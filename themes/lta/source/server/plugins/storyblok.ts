import { useStoryblok } from '~/composables/useStoryblok'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', (event) => {
    event.context.$storyblok = useStoryblok()
  })
})
