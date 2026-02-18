<template>
  <Notice v-bind="$attrs" icon="spinner-third" :icon-spin="true">
    <span class="-mr-3"><slot>Loading…</slot></span>
  </Notice>
</template>
