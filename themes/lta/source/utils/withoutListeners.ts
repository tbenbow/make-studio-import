/**
 * Utility for removing listeners from an object of attributes. Helpful for
 * migration from Vue 2 to Vue 3 where $attrs includes listeners (in Vue 2,
 * event listeners were in a separate var called $listeners). During migration,
 * in places where we have `v-bind="$attrs"`, we can use this utility to filter
 * out all listeners or just specific listeners.
 * 
 * @param $attrs Array of attributes to filter
 * @param listeners List of specific listeners to exclude (defaults to all listeners)
 * @returns Attributes without listeners
 */
export default function ($attrs: any = {}, listeners: string[] = []) {
  const $attrsWithoutListeners = Object.fromEntries(
    Object.entries($attrs)
      .filter(([key, value]) => {
        const isListener = listeners.length
          ? listeners.includes(key)
          : key.startsWith('on')
        
        return !(isListener && typeof value === 'function')
      })
  )

  return $attrsWithoutListeners
}
