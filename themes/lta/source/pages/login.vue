<template>
  <div class="py-20">
    <NoticeLoading>Redirecting to login page…</NoticeLoading>
  </div>
</template>

<script>
export default {
  setup() {
    const { signIn } = useLtaAuth()

    return {
      signIn
    }
  },
  mounted() {
    this.signIn(undefined, { callbackUrl: '/' })
  }
}
</script>
