<template>
  <Blocks class="account-bookmarks">
    <Heading title-tag="h4">
      <template #description>
        <p>
          Resources you've bookmarked are shown below.
          <ButtonComponent
            v-if="getSettingLinkUrl('rootResource')"
            class="ml-2 !align-text-bottom"
            :link="getSettingLinkUrl('rootResource')"
            variation="link"
            >Explore Resources</ButtonComponent
          >
        </p>
      </template>
    </Heading>
    <client-only>
      <ItemList
        v-if="userBookmarksIds && userBookmarksIds.length"
        :show-source-pagination="true"
        :source="userBookmarksIds.join(',')"
        :source-limit="10"
        :source-item-template="{ type: 'card-horizontal' }"
      >
        <template #before-source-item="{ story }">
          <aside class="details">
            <div>
              <UserActions>
                <Bookmark
                  :object-id="story.uuid"
                  button-name-active="Remove bookmark"
                  tooltip=""
                />
              </UserActions>
            </div>
          </aside>
        </template>
        <template #empty-source>
          <Notice :panel="true"> No bookmarks found. </Notice>
        </template>
      </ItemList>
      <Notice v-else :panel="true"> You have no bookmarks. </Notice>
    </client-only>
  </Blocks>
</template>

<script>
import { mapState } from 'pinia'
import { useSettingsStore } from '../stores/settings'
import { useUserBookmarksStore } from '../stores/userBookmarks'

export default {
  computed: {
    ...mapState(useSettingsStore, ['getSettingLinkUrl']),
    ...mapState(useUserBookmarksStore, ['bookmarks']),
    userBookmarksIds() {
      return this.bookmarks && this.bookmarks.length
        ? [...this.bookmarks].reverse()
        : undefined
    }
  },
  head() {
    return {
      title: 'Bookmarks'
    }
  }
}
</script>

<style lang="postcss" scoped>
.account-bookmarks {
  :deep(.item-list) {
    > .item-list-source-item {
      @apply grid grid-cols-1 gap-6 xl:grid-cols-12 xl:gap-12;

      .details {
        @apply xl:col-span-3 xl:order-2 pt-3 text-sm border-t border-black-200;

        .user-actions {
          @apply -ml-3;
        }
      }

      .item {
        @apply xl:col-span-9;
      }
    }
  }
}
</style>
