<template>
  <div>
    <Story v-bind="story" />
    <transition name="fade">
      <Overlay
        :active="showSignUpDialog"
        @close="showSignUpDialog = false"
      >
        <Dialog :hide-footer="true" @close="showSignUpDialog = false">
          <template #header>
            <GainingGroundLogo />
          </template>
          <Form v-bind="signUpFormFromBanner" />
        </Dialog>
      </Overlay>
    </transition>
  </div>
</template>

<script>
import { findDeep } from 'deepdash-es/standalone'
import GainingGroundLogo from '@/assets/img/gg-logo.svg?component'

export default {
  setup() {
    // This setup function is copied from ../[...slug].vue
    // Imported and extending it worked in development, but not in production

    definePageMeta({
      middleware: 'fetch-story-for-path'
    })

    const route = useRoute()

    // Get story from payload (set in middleware)
    const key = `story:${storyblok.resolveFullSlug(route.path)}`
    const { data: payload } = useNuxtData(key)

    const story = ref(payload.value.data)

    if (payload.value.error) {
      showError(payload.value.error)
    } else if (story.value) {
      // Set metadata
      const { head, seoMeta } = useStory(story.value)
      useHead(head)
      useSeoMeta(seoMeta)
    }

    return {
      story
    }
  },
  components: { GainingGroundLogo },
  data() {
    return {
      showSignUpDialog: false
    }
  },
  computed: {
    signUpFormFromBanner() {
      const banner = this.story?.content?.blocks?.[0]

      if (banner) {
        const form = findDeep(
          banner.aside,
          (value, key) => key === 'component' && value === 'Form'
        )

        if (form) {
          return lodash.cloneDeep(form.parent)
        }
      }

      return undefined
    }
  },
  mounted() {
    this.handleSignUpDialog()
  },
  methods: {
    handleSignUpDialog() {
      const cookie = useCookie('gaining_ground_dialog', {
        maxAge: 60 * 60 * 24 // 1 day
      })

      // If cookie doesn't exist…
      if (!cookie.value) {
        // Show dialog
        this.showSignUpDialog = true

        // Set cookie
        cookie.value = true
      }
    }
  }
}
</script>
