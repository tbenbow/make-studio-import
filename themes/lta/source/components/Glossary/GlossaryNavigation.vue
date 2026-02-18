<template>
  <div v-editable="$props" class="glossary-navigation">
    <nav class="nav">
      <LinkComponent
        v-for="(link, index) in links"
        :key="index"
        class="nav-link"
        :class="{ 'is-active': link.letter === activeId }"
        :link="'#' + link.letter"
        @click="setActive(link.letter)"
      >
        {{ link.letter }}
      </LinkComponent>
    </nav>
  </div>
</template>

<script setup>
import { useActiveScroll } from 'vue-use-active-scroll'

const props = defineProps({
  links: {
    type: Object,
    required: true,
    default: () => {}
  },
  _editable: String
})

const targets = computed(() => Object.values(props.links)?.map((link) => link.letter))

const { setActive, activeId } = useActiveScroll(targets)
</script>

<style lang="postcss" scoped>
.glossary-navigation {
  @apply sticky top-4 z-10;
}

.nav {
  @apply flex overflow-auto h-10;
  -ms-overflow-style: none;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  :deep(.nav-link) {
    @apply flex items-center justify-center px-4 bg-background uppercase rounded hover:bg-black-100-solid;

    &.is-active {
      @apply text-white bg-blue;
    }
  }
}
</style>
