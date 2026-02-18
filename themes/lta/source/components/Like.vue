<template>
  <ButtonComponent
    v-tooltip="'Like this if you found it helpful.'"
    v-bind="$attrs"
    class="like"
    :class="{ 'is-liked': isLiked }"
    tag="button"
    :name="buttonName"
    :icon="isLiked ? ['fas', 'thumbs-up'] : 'thumbs-up'"
    :icon-props="{ fixedWidth: true }"
    :icon-position-reverse="true"
    variation="link"
    :disabled="!loggedIn"
    @click.prevent="toggleLike(objectId)"
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
import { useUserLikesStore } from '@/stores/userLikes'
import { useMounted } from '@vueuse/core'

export default {
  props: {
    objectId: {
      type: String,
      required: true
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
  data() {
    return {
      count: 0
    }
  },
  computed: {
    ...mapState(useUserLikesStore, ['hasLike']),
    isLiked() {
      return this.isMounted && this.hasLike(this.objectId)
    },
    buttonName() {
      if (this.isLiked) {
        const adjustedCount = this.count - 1

        return adjustedCount > 0
          ? `You and ${adjustedCount} ${
              adjustedCount === 1 ? 'person' : 'people'
            } found this helpful`
          : `You found this helpful`
      }

      return this.count > 0
        ? `${this.count} ${
            this.count === 1 ? 'person' : 'people'
          } found this helpful`
        : 'Like this'
    }
  },
  watch: {
    isLiked() {
      this.updateCount()
    }
  },
  mounted() {
    this.updateCount()
  },
  methods: {
    ...mapActions(useUserLikesStore, ['toggleLike']),
    async updateCount() {
      this.count = await $fetch(`/api/likes/${this.objectId}`)
    }
  }
}
</script>
