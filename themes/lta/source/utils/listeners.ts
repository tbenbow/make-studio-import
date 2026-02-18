/**
 * Utility for keeping only listeners from an object of attributes. Listeners
 * are keys that start with "on" and are a function.
 * 
 * @param $attrs Array of attributes to filter
 * @param listeners List of specific listeners to include (defaults to all listeners)
 * @returns Attributes with listeners
 */
export default function ($attrs: any = {}, listeners: string[] = []) {
  const $attrsListeners = Object.fromEntries(
    Object.entries($attrs)
      .filter(([key, value]) => {
        const isListener = listeners.length
          ? listeners.includes(key)
          : key.startsWith('on')
        
        return isListener && typeof value === 'function'
      })
  )

  return $attrsListeners
}
