<script setup>
  import * as Sentry from "@sentry/nuxt";

  function triggerClientError() {
    throw new Error("Nuxt Button Error");
  }

  function getSentryData() {
    Sentry.startSpan(
      {
        name: "Example Frontend Span",
        op: "test",
      },
      async () => {
        await $fetch("/api/sentry-test");
      },
    );
  }
</script>

<template>
  <ButtonComponent id="errorBtn" type="button" @click="triggerClientError">
    Throw Client Error
  </ButtonComponent>
  &nbsp;
  <ButtonComponent type="button" @click="getSentryData">Throw Server Error</ButtonComponent>
</template>
