<template>
  <LinkComponent :link="link">{{ name }}</LinkComponent>
</template>

<script>
export default {
  props: {
    name: {
      type: String,
      required: true
    },
    link: {
      type: Object,
      required: true,
      validator: (value) => 'url' in value
    }
  }
}
</script>
