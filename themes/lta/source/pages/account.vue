<template>
  <Blocks class="account" :root="true">
    <Heading title="My Account" :subtitle="user?.profile?.name" />
    <Tabs
      :tabs="[
        { title: 'Profile', link: { name: 'account' } },
        { title: 'Bookmarks', link: { name: 'account-bookmarks' } },
        { title: 'Purchases', link: { name: 'account-purchases' } },
        { title: 'Registrations', link: { name: 'account-registrations' } }
      ]"
    >
      <template #tab="{ isActive }">
        <NuxtPage v-if="isActive" keep-alive />
      </template>
    </Tabs>
    <template v-if="debug">
      <Divider label="User Data For Debugging" />
      <div class="bg-black-100 divide-y divide-line-2">
        <div class="p-6">
          <h4 class="mb-4">From Salesforce</h4>
          <pre class="text-xs">{{ user }}</pre>
        </div>
        <div class="p-6">
          <h4>Bookmarks</h4>
          <p class="mb-4">These are Storyblok UUIDs</p>
          <pre class="text-xs">{{ bookmarks }}</pre>
        </div>
        <div class="p-6">
          <h4>Likes</h4>
          <p class="mb-4">These are Storyblok UUIDs</p>
          <pre class="text-xs">{{ likes }}</pre>
        </div>
        <div class="p-6">
          <h4>Completions</h4>
          <p class="mb-4">These are Storyblok UUIDs</p>
          <pre class="text-xs">{{ completions }}</pre>
        </div>
      </div>
    </template>
  </Blocks>
</template>

<script setup>
import { useUserBookmarksStore } from '~/stores/userBookmarks'
import { useUserLikesStore } from '~/stores/userLikes'
import { useUserCompletionsStore } from '~/stores/userCompletions'

definePageMeta({
  middleware: 'auth',
  keepalive: true
})

const { user } = useLtaAuth()

const bookmarksStore = useUserBookmarksStore()
const { bookmarks } = storeToRefs(bookmarksStore)

const likesStore = useUserLikesStore()
const { likes } = storeToRefs(likesStore)

const completionsStore = useUserCompletionsStore()
const { completions } = storeToRefs(completionsStore)

const debug = ref('debug' in useRoute().query)
</script>
