<template>
  <li class="collection-link-item">
    <template v-if="is_folder">
      <template v-if="levelsDeep > 0">
        <div
          class="folder"
          :class="{ 'is-active': folderIsActive }"
          @click="toggleFolder"
        >
          <font-awesome-icon
            class="icon"
            :icon="['fal', folderIsActive ? 'chevron-down' : 'chevron-right']"
            :fixed-width="true"
          />
          <span class="name">{{ name }}</span>
        </div>
        <template v-if="links && links.length">
          <CollectionLinks
            v-show="folderIsActive"
            :links="links"
            :levels-deep="levelsDeep - 1"
          />
        </template>
      </template>
    </template>
    <LinkComponent
      v-else
      class="link"
      :class="{ 'is-complete': complete }"
      :link="`/${slug}`"
      :name="name"
    >
      <template #default="{ displayName }">
        <span class="link-main">
          {{ displayName }}
        </span>
        <span v-if="completion" class="link-aside">
          <font-awesome-icon
            class="link-completion-icon"
            :icon="
              complete ? ['fas', 'circle-check'] : ['fal', 'circle-dashed']
            "
            :title="complete ? 'Complete' : 'Incomplete'"
          />
        </span>
      </template>
    </LinkComponent>
  </li>
</template>

<script>
export default {
  props: {
    is_folder: Boolean,
    name: String,
    slug: String,
    links: Array,
    completion: Boolean,
    complete: Boolean,
    levelsDeep: Number
  },
  data() {
    return {
      folderIsActive: true
    }
  },
  methods: {
    toggleFolder() {
      this.folderIsActive = !this.folderIsActive
    }
  }
}
</script>

<style lang="postcss" >
.collection-links .folder {
  @apply flex gap-2 items-start mx-3 mt-3 p-3 text-heading text-xs font-bold uppercase tracking-wide border-b border-b-line-2 cursor-pointer hover:bg-black-100;

  .icon {
    @apply relative top-[2px] flex-shrink-0;
  }
}

.collection-links .link {
  @apply flex items-center gap-2 pl-5 pr-6 border-l-4 border-transparent text-xs hover:bg-black-100;

  &-main {
    @apply flex-1 py-3;
  }

  &-aside {
    @apply flex-shrink-0 py-1 text-base;
  }

  &-completion-icon {
    @apply block text-black-400;
  }

  &.nuxt-link-exact-active {
    @apply bg-black-100 border-accent;
  }

  &.is-complete {
    .link-completion-icon {
      @apply text-accent;
    }
  }
}
</style>
