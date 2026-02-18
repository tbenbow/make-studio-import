<template>
  <div class="site" :class="{ 'is-resource-center': isResourceCenter }">
    <ClientOnly>
      <SiteAlert v-if="alertIsActive && !alertIsSuppressed" v-bind="alert" />
      <SiteDialog v-if="dialogIsActive && !inStoryblokVisualEditor" v-bind="dialog" />
    </ClientOnly>
    <div class="relative">
      <SiteHeader v-bind="header" />
      <SiteMain>
        <slot />
      </SiteMain>
      <SiteFooter
        v-bind="footer"
        :menu-primary="isResourceCenter ? menuPrimaryResources : menuPrimary"
      />
      <transition name="fade">
        <SiteSearch v-show="searchIsActive" />
      </transition>
    </div>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { useSiteStore } from '../stores/site'

export default {
  setup() {
    const title = 'Land Trust Alliance'

    const { public: { baseUrl } } = useRuntimeConfig()
    const route = useRoute()
    const url = computed(() => `${baseUrl}${route.fullPath}`)

    useHead({
      title,
      titleTemplate: (pageTitle) => pageTitle && pageTitle !== title
        ? `${pageTitle} - ${title}`
        : title,
      link: [{ rel: 'canonical', href: () => url.value }]
    })

    useSeoMeta({
      ogUrl: () => url.value
    })
    
    useScript({
      src: 'https://cdn.fundraiseup.com/widget/ASPJYWNP',
      crossorigin: false
    })
  },
  computed: {
    ...mapState(useSiteStore, [
      'isResourceCenter',
      'alert',
      'alertIsActive',
      'alertIsSuppressed',
      'dialog',
      'dialogIsActive',
      'header',
      'footer',
      'searchIsActive',
      'inStoryblokVisualEditor'
    ]),
    menuPrimary() {
      return this.header?.menuPrimary
    },
    menuPrimaryResources() {
      return this.header?.menuPrimaryResources
    }
  }
}
</script>
