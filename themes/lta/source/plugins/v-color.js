import { theme } from '#tailwind-config'

const colors = theme.colors

/**
 * Gets a color's value from the Tailwind config and sets a variable with the
 * color's value.
 *
 * <el v-color[:<colorVarName>]="<colorName>">
 *
 * String input:
 * <el v-color:accent="'green-dark'">
 * <el style="--color-accent: #26484c">
 *
 * Variable input:
 * const accentColor = 'yellow'
 * <el v-color:accent="accentColor">
 * <el style="--color-accent: #d9a832">
 *
 * The variable name argument is optional:
 * <el v-color="'blue'">
 * <el style="--color-accent: #50abbd">
 */

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('color', {
    beforeMount(el, { value, arg }) {
      if (!value) {
        return
      }

      const colorsKeys = Object.keys(colors)
      const valueParts = value.split('-')
      const colorName = arg || 'accent'
      let color

      // Get color from Tailwind config
      if (colorsKeys.includes(value) && typeof colors[value] === 'string') {
        // value: color
        color = colors[value]
      } else if (
        colorsKeys.includes(value) &&
        typeof colors[value] === 'object' &&
        Object.keys(colors[value]).includes('DEFAULT')
      ) {
        // value: {
        //   DEFAULT: color
        // }
        color = colors[value].DEFAULT
      } else if (
        // value: {
        //   variant: color
        // }
        valueParts.length > 1 &&
        colorsKeys.includes(valueParts[0]) &&
        typeof colors[valueParts[0]] === 'object' &&
        Object.keys(colors[valueParts[0]]).includes(valueParts[1])
      ) {
        color = colors[valueParts[0]][valueParts[1]]
      }

      if (color) {
        el.style = `--color-${colorName}: ${color}`
      }
    }
  })
})