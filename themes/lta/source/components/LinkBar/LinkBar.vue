<template>
  <div v-editable="$props" class="link-bar">
    <div class="main">
      <nav v-if="links && links.length" class="nav">
        <a
          class="to-top"
          :href="route.path"
          @click.prevent="scrollToTop"
          ><font-awesome-icon
            :icon="['fal', 'arrow-up-to-line']"
            :fixed-width="true"
        /></a>
        <LinkBarItem
          v-for="link in links"
          :key="link.id"
          class="link-bar-item"
          :class="{
            'is-active': link.id === activeId
          }"
          :name="link.name"
          :link="link.link"
          @click="setActive(link.id)"
        />
      </nav>
    </div>
  </div>
</template>

<script setup>
import { useActiveScroll } from 'vue-use-active-scroll'

const props = defineProps({
  links: {
    type: Array,
    required: true,
    default: () => []
  },
  _editable: String
})

const route = useRoute()

// Add a `id` to each link (url with # removed)
const links = computed(() =>
  props.links.filter(link => link).map((link) => ({
    ...link,
    id: link?.link?.url?.replace(/^#/, '')
  })
))

const targets = computed(() =>
  links.value?.filter((link) => link?.link?.url?.startsWith('#'))
    .map((link) => link.id)
)

const { setActive, activeId } = useActiveScroll(targets)

function scrollToTop() {
  window.scrollTo(0, 0)
}
</script>

<style lang="postcss" scoped>
.link-bar {
  @apply sticky top-0 z-40;

  .layout-sidebar &,
  .breadcrumbs ~ & {
    @apply top-breadcrumbs-height;
  }
}

.main {
  @apply bleed-container overflow-hidden h-10 bg-green-dark;
}

.nav {
  @apply flex overflow-auto h-full;
  -ms-overflow-style: none;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }

  a,
  :deep(.link-bar-item) {
    @apply flex-1 flex items-center justify-center min-w-36 px-3 text-white-700 text-2xs text-center border-l border-white-200 uppercase tracking-wide;

    &:hover {
      @apply text-white;
    }

    &:last-child {
      @apply border-r;
    }

    &.to-top {
      @apply hidden lg:flex flex-none min-w-0 text-base;
    }

    &.is-active {
      @apply text-white bg-green border-green;

      + a {
        @apply border-l-green;
      }
    }
  }
}
</style>
