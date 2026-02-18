<template>
  <ButtonComponent
    v-tooltip="tooltip"
    v-bind="$attrs"
    class="bookmark"
    :class="{ 'is-bookmarked': isBookmarked }"
    tag="button"
    :name="isBookmarked ? buttonNameActive : buttonName"
    :icon="isBookmarked ? ['fas', 'bookmark'] : 'bookmark'"
    :icon-props="{ fixedWidth: true }"
    :icon-position-reverse="true"
    variation="link"
    :disabled="!loggedIn"
    @click.prevent="toggleBookmark(objectId)"
  >
    <template #default="{ displayName }">
      <transition name="fade" mode="out-in">
        <span :key="displayName">{{ displayName }}</span>
      </transition>
    </template>
  </ButtonComponent>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { useUserBookmarksStore } from '@/stores/userBookmarks'
import { useMounted } from '@vueuse/core'

export default {
  props: {
    objectId: {
      type: String,
      required: true
    },
    buttonName: {
      type: String,
      default: 'Bookmark this'
    },
    buttonNameActive: {
      type: String,
      default: 'Bookmarked'
    },
    tooltip: {
      type: String,
      default:
        'Bookmark this to easily reference it later. Access your bookmarks in My Account.'
    }
  },
  setup() {
    const { loggedIn } = useLtaAuth()
    const isMounted = useMounted()

    return {
      loggedIn,
      isMounted
    }
  },
  computed: {
    ...mapState(useUserBookmarksStore, ['hasBookmark']),
    isBookmarked() {
      return this.isMounted && this.hasBookmark(this.objectId)
    }
  },
  methods: mapActions(useUserBookmarksStore, ['toggleBookmark'])
}
</script>
