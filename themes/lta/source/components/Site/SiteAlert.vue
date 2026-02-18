<template>
  <div class="site-alert">
    <div class="main">
      <font-awesome-icon class="icon" :icon="['fal', 'circle-info']" />
      <div class="content">
        <span class="text">{{ text }}</span>
        <LinkComponent
          v-if="actionLinkIsValid"
          :link="actionLink"
          :open-in-new-window="actionLink.target === '_blank'"
          >{{ actionText || 'Learn More' }}</LinkComponent
        >
        <template v-else-if="actionDialogIsValid">
          <LinkComponent tag="button" @click="showDialog = true">{{
            actionText || 'Learn More'
          }}</LinkComponent>
          <transition name="fade">
            <Overlay
              v-if="showDialog"
              :active="showDialog"
              @close="showDialog = false"
            >
              <Dialog title="Alert" @close="showDialog = false">
                <RichText :document="actionDialog" />
              </Dialog>
            </Overlay>
          </transition>
        </template>
      </div>
    </div>
    <aside class="aside">
      <button class="close-button" @click="close">
        <font-awesome-icon :icon="['fal', 'xmark']" />
      </button>
    </aside>
  </div>
</template>

<script>
import { mapActions } from 'pinia'
import { useSiteStore } from '../stores/site'
import { documentIsValid } from '@/components/RichText'

export default {
  props: {
    text: String,
    actionText: String,
    actionLink: [Object, String],
    actionDialog: [Object, String]
  },
  setup(props) {
    const { isValid: actionLinkIsValid } = useLinkHelper(props.actionLink)

    return {
      actionLinkIsValid
    }
  },
  data() {
    return {
      showDialog: false
    }
  },
  computed: {
    actionDialogIsValid() {
      return documentIsValid(this.actionDialog)
    }
  },
  methods: {
    ...mapActions(useSiteStore, ['suppressAlert']),
    close() {
      this.suppressAlert()
    }
  }
}
</script>

<style lang="postcss" scoped>
.site-alert {
  @apply px-4 flex items-center gap-8 bg-orange;

  .main {
    @apply flex-1;
  }
}

.main {
  @apply flex items-center gap-2 py-4;
}

.icon {
  @apply text-lg;
}

.content {
  @apply inline-flex flex-wrap gap-x-1 text-sm;

  a,
  button {
    @apply font-bold underline;
    text-decoration-color: theme('colors.orange.dark');

    &:hover {
      text-decoration-color: inherit;
    }
  }
}

.close-button {
  @apply h-8 w-8 flex items-center justify-center border border-body-4 rounded-sm hover:border-body;
}
</style>
