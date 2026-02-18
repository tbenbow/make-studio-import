import Vue3FiltersModule from 'vue3-filters'

export default defineNuxtPlugin((nuxtApp) => {
  // Fix: Available in client only through `default` key (incorrect export from module?)
  const Vue3Filters = Vue3FiltersModule.default || Vue3FiltersModule

  const { config, formatDate, toDate } = useDateFns()

  return {
    provide: {
      'filters': {
        ...Vue3Filters.filters,
        formatDate(date) {
          const dateUTC = toDate(date, {
            timeZone: config.timeZone
          })
          return formatDate(dateUTC)
        }
      }
    }
  }
})
