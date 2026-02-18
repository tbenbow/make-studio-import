<template>
  <Site>
    <SiteContent>
      <RichText class="py-24 max-w-xl">
        <Label
          >Error<template v-if="statusCode">
            {{ error.statusCode }}</template
          ></Label
        >
        <template v-if="statusCode === 404">
          <h2>Page not found</h2>
          <p class="text-lg">
            We cannot find the page you requested. Please use the navigation above
            to find the content you need.
          </p>
        </template>
        <template v-else>
          <h2>An error occurred</h2>
        </template>
        <p v-if="errorMessage">
          <strong>Error details:</strong> {{ errorMessage }}
        </p>
      </RichText>
    </SiteContent>
  </Site>
</template>

<script>
export default {
  props: {
    error: Object
  },
  computed: {
    statusCode() {
      return this.error?.statusCode
    },
    errorMessage() {
      return this.error?.message
        ? Array.isArray(this.error.message)
          ? this.error.message.join(', ')
          : this.error.message
        : undefinedthis.error?.messageArray.isArraythis.error.message.join
    }
  }
}
</script>
