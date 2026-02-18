<template>
  <div v-editable="$props" class="menu-item">
    <LinkComponent class="link" :link="link" :name="name">
      <template #default="{ displayName }">
        <span class="name">
          <font-awesome-icon
            v-if="icon"
            class="icon"
            :icon="['fal', icon]"
            :fixed-width="true"
          />
          {{ displayName }}
        </span>
        <font-awesome-icon
          class="icon-chevron"
          :icon="['fal', 'chevron-right']"
        />
      </template>
    </LinkComponent>
    <Menu v-if="menu && menu.length" v-bind="menu[0]" />
  </div>
</template>

<script>
export default {
  props: {
    link: [Object, String],
    name: String,
    icon: String,
    menu: Array,
    _editable: String
  }
}
</script>

<style lang="postcss" scoped>
.menu-item {
}

:deep(.link) {
  @apply relative block -mx-3 pl-3 pr-8 py-[10px] text-sm text-body-2 rounded;

  .name {
    @apply flex;
  }

  .icon {
    @apply flex-shrink-0 mr-2 my-px text-base text-body-3;
  }

  .icon-chevron {
    @apply invisible absolute right-0 top-1/2 -translate-y-1/2 mr-3 text-accent;
  }

  &:hover,
  &.nuxt-link-active {
    @apply text-body bg-line;

    .icon {
      @apply text-body-2;
    }
  }

  &:hover {
    .icon-chevron {
      @apply visible;
    }
  }

  &.nuxt-link-active {
    @apply font-bold rounded-b-none last:rounded-b;
  }
}

:deep(.menu) {
  @apply hidden max-w-none -mx-3 px-6 rounded-b;

  .title {
    @apply hidden;
  }

  .menu-item {
    .link {
      @apply text-xs;
    }
  }

  .link.nuxt-link-active + & {
    @apply block max-w-none pb-3 bg-line;
  }
}
</style>
