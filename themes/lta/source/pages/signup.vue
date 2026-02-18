<template>
  <div class="py-20">
    <NoticeLoading>Redirecting to signup page…</NoticeLoading>
  </div>
</template>

<script>
export default {
  mounted() {
    const signupUrl = `${this.$config.public.salesforce.instanceUrl}/s/login/SelfRegister`
    window.location.replace(signupUrl)
  }
}
</script>
