import { cloneDeep } from 'lodash-es'
import { defineStore } from 'pinia'
import { useLinkHelper } from '~/composables/useLinkHelper'

export const useSettingsStore = defineStore('settings', {
  id: 'settingsStore',
  state: () => {
    return {
      attributes: {
        accredited: {
          name: 'Accredited',
          icon: 'accredited',
          description:
            'Accredited land trusts undergo a thorough review of their practices in governance, finance, transactions and stewardship.'
        },
        'features.publicAccess': {
          name: 'Public Access',
          color: 'yellow',
          icon: 'people-simple',
          description:
            'Land trusts that welcome visitors for activities such as walking, hiking, biking, boating, fishing, birding and more.'
        },
        'features.trails': {
          name: 'Trails',
          color: 'blue',
          icon: 'person-hiking',
          description:
            'Land trusts with public trails for guided or individual hikes, walks, biking and more.'
        },
        'features.volunteerOpportunities': {
          name: 'Volunteer Opportunities',
          color: 'orange',
          icon: 'hand-holding-heart',
          description:
            'Land trusts with volunteer opportunities, such as trail maintenance, clean ups, administrative duties, giving tours and more.'
        },
        nrcs: {
          name: 'NRCS ACEP-ALE Certified',
          icon: 'nrcs',
          description:
            'Land trusts certified by the Natural Resources Conservation Service as having demonstrated extensive experience successfully preserving agricultural land with the Agricultural Land Easement component of the Agricultural Conservation Easement Program.'
        },
        'protects.forests': {
          name: 'Forests',
          color: 'green',
          icon: 'tree',
          description:
            'Land trusts that protect forested lands for habitat preservation, sequestering carbon, sustainable timber, conserving wilderness and more.'
        },
        'protects.habitat': {
          name: 'Wildlife Habitat',
          color: 'extra-2',
          icon: 'paw-claws',
          description:
            'Land trusts that protect habitat for plants and animals, such as wildlife corridors, breeding grounds and habitats for endangered species.'
        },
        'protects.agLand': {
          name: 'Agricultural Land',
          color: 'extra-1',
          icon: 'farm',
          description:
            'Land trusts that protect farms and ranches to ensure sustainable food and secure agricultural ways of life.'
        },
        terrafirmaInsured: {
          name: 'Terrafirma Insured',
          icon: 'terrafirma',
          description:
            'An independent insurance service that insures the costs of upholding conservation easements and fee lands held for conservation purposes.'
        }
      },
      settings: {},
    }
  },
  getters: {
    getAttribute(state) {
      return (attribute, key) => {
        return this.attributeExists(attribute)
          ? Object.keys(state.attributes[attribute]).includes(key)
            ? state.attributes[attribute][key]
            : state.attributes[attribute]
          : undefined
      }
    },
    attributeExists: (state) => (attribute) => {
      return Object.keys(state.attributes).includes(attribute)
    },
    getSettingLinkUrl: (state) => (key, params) => {
      const { isValid, url } = useLinkHelper(state.settings[key])

      const paramsString = params
        ? new URLSearchParams(Object.entries(params)).toString()
        : undefined

      return isValid.value
        ? url.value + (paramsString ? `?${paramsString}` : '')
        : ''
    },
    getRedirects: (state) => {
      const redirectsLines = state.settings.redirects ? state.settings.redirects.split(/\r?\n/) : []
      /* const redirectsLines = `/redirect-test-1 /redirected-basic
  /redirect-test-2     /redirected-extra-spaces
  /redirect-test-3(.*) /redirected-regex$1
  /redirect-test-4 /redirected-status-code 302`.split(/\r?\n/) */

      return redirectsLines.map((line) => {
        const [from, to, statusCode] = line.replace(/  +/, ' ').split(' ')

        const redirect = {
          from: new RegExp(`^${from}$`) || '',
          to: to || ''
        }

        if (statusCode) {
          redirect.statusCode = parseInt(statusCode)
        }

        return redirect
      })
    },
    getRedirect(state) {
      let getRedirects = this.getRedirects
      return function(path) {
        const redirect = cloneDeep(
          getRedirects.find((redirect) => redirect.from.test(path))
        )

        if (redirect) {
          redirect.to = path.replace(redirect.from, redirect.to)
          return redirect
        }
      }
    }
  },
  actions: {
    async fetch(seedData) {
      const settings = seedData || await $fetch('/api/stores/settings')
        .catch((err) => console.error('Error fetching settings', err))

      if (settings) {
        Object.entries(settings).forEach(
          ([setting, value]) => (this.settings[setting] = value)
        )
      }
    }
  }
})
