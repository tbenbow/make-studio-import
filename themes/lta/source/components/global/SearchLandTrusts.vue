<template>
  <div class="search-land-trusts">
    <Form class="form-query" :page="getSettingLinkUrl('rootLandTrust')">
      <template #default="{ isSubmitting }">
        <FormField>
          <font-awesome-icon
            class="search-icon"
            :icon="['fal', 'magnifying-glass']"
            :fixed-width="true"
          />
          <FormText type="hidden" name="nearby" value="false" />
          <FormText
            name="query"
            placeholder="Search by name…"
            @input="currentQuery = $event.target.value"
          />
          <FormSubmit
            icon="arrow-right"
            size="large"
            :submitting="isSubmitting"
            :disabled="!currentQuery || isSubmitting"
          />
        </FormField>
      </template>
    </Form>
    <form
      class="form-location"
      @keypress.enter.prevent="delayOnSubmit"
      @submit.prevent="onSubmit"
    >
      <FormField
        :note="
          currentLocation === false
            ? 'Please select a location from the dropdown list.'
            : undefined
        "
      >
        <client-only>
          <font-awesome-icon
            class="search-icon"
            :icon="['fal', 'location-dot']"
            :fixed-width="true"
          />
          <vue-google-autocomplete
            v-if="$googleMaps.loaded"
            :id="lodash.uniqueId('SearchLandTrustsLocationInput_')"
            ref="locationInput"
            placeholder="Search around a location…"
            types="(regions)"
            country="us"
            @inputChange="onInputChange"
            @placechanged="onPlacechanged"
          />
          <div ref="requiredForPlacesService" class="hidden" />
          <FormSubmit
            icon="arrow-right"
            size="large"
            :submitting="isSubmitting"
            :disabled="!currentLocation || isSubmitting"
          />
        </client-only>
      </FormField>
    </form>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { useSettingsStore } from '@/stores/settings'
import VueGoogleAutocomplete from 'vue-google-autocomplete'

export default {
  components: {
    VueGoogleAutocomplete
  },
  data() {
    return {
      currentQuery: '',
      currentLocation: '',
      ignoreNextInputChange: false,
      isSubmitting: false
    }
  },
  computed: mapState(useSettingsStore, ['getSettingLinkUrl']),
  methods: {
    onInputChange(value = { newVal: '', oldVal: '' }) {
      if (this.ignoreNextInputChange) {
        this.ignoreNextInputChange = false
      } else {
        this.currentLocation = value.newVal
      }
    },
    onPlacechanged(addressData) {
      this.currentLocation = addressData
      this.ignoreNextInputChange = true
    },
    delayOnSubmit() {
      this.isSubmitting = true

      // For when submitting the form by Enter key, delay submit handler.
      // When location is chosen via the keyboard, this allows the onPlacechanged
      // handler to fire before onSubmit.
      setTimeout(this.onSubmit, 500)
    },
    async onSubmit() {
      let params

      // Location was selected from Google autocomplete, search by location
      if (typeof this.currentLocation === 'object') {
        const {
          latitude,
          longitude,
          locality,
          administrative_area_level_1: stateAbbr
        } = this.currentLocation
        const location = `${latitude}, ${longitude}`
        const locationName = (locality ? `${locality}, ` : '') + stateAbbr

        params = {
          nearby: false,
          location,
          locationName
        }

        this.$router.push(this.getSettingLinkUrl('rootLandTrust', params))
      }
      // Location not selected…
      else if (typeof this.currentLocation === 'string') {
        this.isSubmitting = true

        // Try first Google prediction
        const firstPrediction = await this.getFirstPrediction(
          this.currentLocation
        )

        // If there's at least one prediction for the query, set it and re-submit
        if (firstPrediction) {
          this.currentLocation = firstPrediction
          return this.onSubmit()
        } else {
          this.currentLocation = false
        }
      }

      this.isSubmitting = false
    },
    /**
     * Get first Google prediction for input query.
     * @return {object|undefined} The first prediction as a PlaceResult
     */
    async getFirstPrediction(input) {
      const { componentRestrictions, types } =
        this.$refs.locationInput.autocomplete

      const predictions = await this.getPlacePredictions({
        input,
        componentRestrictions,
        types
      })

      if (predictions.length) {
        const place = await this.getPlace({
          placeId: predictions[0].place_id,
          fields: this.$refs.locationInput.fields
        })

        if (place) {
          return this.$refs.locationInput.formatResult(place)
        }
      }
    },
    /**
     * Get Google predictions for an input query.
     * @param {object} request The request
     * @return {array} The predictions
     */
    getPlacePredictions(request) {
      const service = new window.google.maps.places.AutocompleteService()

      return new Promise((resolve, reject) => {
        service.getPlacePredictions(request, (predictions, status) => {
          if (status === 'OK') {
            resolve(predictions)
          } else {
            resolve([])
          }
        })
      })
    },
    /**
     * Get Google place for a place ID.
     * @param {object} request The request
     * @return {object} The place as a PlaceObject
     */
    getPlace(request) {
      const service = new window.google.maps.places.PlacesService(
        this.$refs.requiredForPlacesService
      )

      return new Promise((resolve, reject) => {
        service.getDetails(request, (place, status) => {
          if (status === 'OK') {
            resolve(place)
          }
        })
      })
    }
  }
}
</script>

<style lang="postcss" scoped>
.search-land-trusts {
  @apply flex flex-col gap-3;

  :deep(.form-query),
  .form-location {
    @apply flex-1;
  }

  :deep(.form-field) {
    .field {
      @apply relative;
    }

    .search-icon {
      @apply absolute text-black-400 top-1/2 -translate-y-1/2 left-4;
    }

    input {
      @apply h-12 pl-12 pr-18 text-base rounded-full;
    }

    .form-submit {
      @apply absolute top-0 right-0 h-full w-18 rounded-r-full rounded-l-none disabled:opacity-100 disabled:text-black-400 disabled:bg-transparent;

      .name {
        @apply hidden;
      }
    }
  }
}

:deep(.form-query) {
  .form-footer {
    @apply hidden;
  }
}
</style>
