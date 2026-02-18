<template>
  <ul class="resource-pricing">
    <li v-if="webinarPass">
      {{ webinarPassLabel || 'Webinar Pass' }} holders:
      <strong>Free</strong>
    </li>
    <template v-if="price !== priceMember">
      <li>
        Alliance members:
        <strong>{{ formatPrice(priceMember) }}</strong>
      </li>
      <li>
        Non-members:
        <strong>{{ formatPrice(price) }}</strong>
      </li>
    </template>
    <template v-else>
      <li>
        <strong>{{ formatPrice(price) }}</strong>
      </li>
    </template>
  </ul>
</template>

<script>
export default {
  props: {
    price: [String, Number],
    priceMember: [String, Number],
    webinarPass: Boolean,
    webinarPassLabel: String,
    formatPrice: Function
  }
}
</script>
