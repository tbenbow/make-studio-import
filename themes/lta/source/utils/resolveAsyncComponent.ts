import type { AsyncComponentLoader } from 'vue'
import { filename } from 'pathe/utils'
import { pascalCase } from 'change-case'

// Components where the filename doesn't match the component name
const componentNameToFilenameMap: any = {
  'Button': 'ButtonComponent',
  'Link': 'LinkComponent',
  'AssetPdf': 'AssetPDF'
}

function resolveComponentName(name: string) {
  const namePascalCase = pascalCase(name) || ''
  
  return namePascalCase in componentNameToFilenameMap
    ? componentNameToFilenameMap[namePascalCase]
    : namePascalCase
}

export const resolveAsyncComponent = (name: string) => {
  const instance = getCurrentInstance()

  // Make sure component name is in Pascal case and accounts for name changes
  const componentName = resolveComponentName(name)

  // If component is already loaded (global), just return the name and let
  // <component :is="…"> do its thing.
  
  if (componentName && instance?.appContext.components.hasOwnProperty(componentName)) {
    return componentName
  }

  // Otherwise try to load the component asynchronously, if it doesn't exist
  // display a simple message

  function getAsyncComponentLoader(name: string) {
    const componentsGlob = import.meta.glob<AsyncComponentLoader>('~/components/**/*.vue')
    const components = Object.entries(componentsGlob).map(([key, value]) => {
      return {
        name: filename(key),
        path: key,
        loader: value
      }
    })

    const component = components.find((component) => component.name === name)
    
    if (components.filter((component) => component.name === name).length > 1) {
      console.warn(`[Block] Multiple components found with the name "${name}"${component ? ` (using \'${component.path}\')`: ''}`)
    }

    if (typeof component?.loader === 'function') {
      return component.loader()
    } else {
      throw new Error(`Component "${name}" not found`)
    }
  }

  return defineAsyncComponent(async () => {
    try {
      return await getAsyncComponentLoader(componentName)
    } catch (err: any) {
      return h('div', { class: 'px-4 py-3 text-center border-y border-primary', innerHTML: err.message })
    }
  })
}
