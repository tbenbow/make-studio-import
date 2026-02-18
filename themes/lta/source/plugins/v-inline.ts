/**
 * v-inline
 * 
 * Unwraps element contents.
 * 
 * In a situation like this were you don't want the wrapping `div`:
 * 
 * ```
 * <div v-html="content" />
 * ```
 * 
 * You can do this:
 * 
 * ```
 * <template v-html="content" v-inline />
 * ```
 * 
 * @src https://stackoverflow.com/a/69354385
 */

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('inline', (el) => {
    if (!el) {
      return
    }

    // Copy attributes to first child
    const content = el.tagName === 'TEMPLATE' ? el.content : el
    if (content.children.length) {
      [...el.attributes].forEach((attr) => content.firstChild.setAttribute(attr.name, attr.value))
    }

    // Replace element with content
    if (el.tagName === 'TEMPLATE') {
      el.replaceWith(el.content)
    } else {
      el.replaceWith(...el.children)
    }
  })
})
