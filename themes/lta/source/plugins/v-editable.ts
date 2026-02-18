/**
 * Storyblok v-editable directive
 * 
 * Note: Our app configuration doesn't used the standard @storyblok/nuxt
 * package which auto-includes an API client, components, and other things.
 * Our Storyblok data is fetched in API routes, so we don't need the client nor
 * do we need the components. We only need the v-editable directive, and since
 * it's not exported by the package, we have to manually add it below.
 */

import type { Directive } from 'vue'
import { storyblokEditable } from '@storyblok/js'

/**
 * v-editable directive
 * 
 * @src https://github.com/storyblok/storyblok-vue/blob/2a31ad52336446600c2dacd5c630a6c66a6bbe44/lib/index.ts#L44
 * 
 * Modified to allow for not passing a value, in which case it will
 * use the _editable attribute on the element.
 */
const vEditableDirective: Directive<HTMLElement> = {
  beforeMount(el, binding) {
    const elAttrs = el.hasAttribute('_editable')
      ? { _editable: el.getAttribute('_editable') }
      : undefined
    
    const value = binding.value || elAttrs

    if (value) {
      const options: any = storyblokEditable(value)
      if (Object.keys(options).length > 0) {
        el.setAttribute('data-blok-c', options['data-blok-c'])
        el.setAttribute('data-blok-uid', options['data-blok-uid'])
        el.classList.add('storyblok__outline')
      }
    }
  }
}

export default defineNuxtPlugin(({ vueApp }) => {
  vueApp.directive('editable', vEditableDirective)
})
