<template>
  <RichText class="form-note" :document="note" size="small" />
</template>

<script>
export default {
  props: {
    note: [Object, String]
  }
}
</script>
