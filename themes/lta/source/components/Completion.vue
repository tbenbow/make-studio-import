<template>
  <div class="completion" :class="{ 'is-complete': isComplete }">
    <Divider :label="`${hasForm ? 'Leave Feedback & ' : ''}Mark Complete`" />
    <div class="completion-container">
      <client-only>
        <template v-if="loggedIn">
          <div v-if="showForm" class="feedback-form">
            <Form ref="form" v-bind="sharedFormOrForm" />
          </div>
          <div class="complete">
            <div v-if="isComplete" class="complete-note">
              <RichText size="small">
                <p>
                  <font-awesome-icon
                    class="mr-1"
                    :icon="['fal', 'circle-info']"
                  />
                  You have marked this page as <em>complete</em>. To undo this,
                  click the button below.
                </p>
              </RichText>
            </div>
            <ButtonComponent
              tag="button"
              class="complete-button"
              :name="
                isComplete
                  ? 'Mark As Incomplete'
                  : hasForm
                  ? 'Submit & Mark As Complete'
                  : 'Mark Complete'
              "
              :icon="
                isSubmitting
                  ? 'spinner-third'
                  : isComplete
                  ? 'circle-dashed'
                  : 'circle-check'
              "
              :icon-props="isSubmitting ? { spin: true } : undefined"
              :disabled="isSubmitting"
              @click.prevent="buttonClick"
            />
          </div>
        </template>
        <Notice v-else icon="lock" size="large">
          Account Required
          <template #description
            >An account is required to
            {{ hasForm ? `leave feedback and` : '' }}
            mark this section as complete.</template
          >
          <template #footer>
            <ButtonComponent
              link="/login"
              name="Log In"
              icon="arrow-right"
              @click.prevent="signIn()"
            />
          </template>
        </Notice>
      </client-only>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { useSiteStore } from '../stores/site'
import { useUserCompletionsStore } from '../stores/userCompletions'
import { useMounted } from '@vueuse/core'

export default {
  props: {
    sharedForm: [Object, String],
    form: Array
  },
  setup() {
    const { loggedIn, signIn } = useLtaAuth()
    const isMounted = useMounted()

    return {
      loggedIn,
      signIn,
      isMounted
    }
  },
  data() {
    return {
      isSubmitting: false
    }
  },
  computed: {
    ...mapState(useSiteStore, ['currentStory']),
    ...mapState(useUserCompletionsStore, ['hasCompletion']),
    objectId() {
      return this.currentStory?.uuid
    },
    isComplete() {
      return this.isMounted && this.hasCompletion(this.objectId)
    },
    hasForm() {
      return !!(this.sharedForm || (this.form && this.form.length))
    },
    showForm() {
      return this.hasForm && !this.isComplete
    },
    sharedFormOrForm() {
      return this.sharedForm
        ? this.sharedForm.content
        : this.form && this.form.length
        ? this.form[0]
        : undefined
    }
  },
  methods: {
    ...mapActions(useUserCompletionsStore, ['toggleCompletion']),
    async buttonClick() {
      this.isSubmitting = true

      if (this.showForm) {
        const formIsSubmitted = await this.$refs.form.onSubmit()

        if (formIsSubmitted) {
          await this.toggleCompletion(this.objectId)
        }
      } else {
        await this.toggleCompletion(this.objectId)
      }

      this.isSubmitting = false
    }
  }
}
</script>

<style lang="postcss" scoped>
.completion {
  @apply bleed-container;

  &-container {
    @apply container pt-18 pb-24;
  }
}

.feedback-form {
  @apply mx-auto max-w-cols-8;

  :deep(.form) {
    &-submitted,
    &-footer {
      @apply hidden;
    }
  }
}

.complete {
  @apply text-center;

  &-note {
    @apply mx-auto mb-6 max-w-cols-6;
  }

  .feedback-form + & {
    @apply mt-12;
  }
}

/* Is Complete */

.completion.is-complete {
  .complete {
    :deep(.complete-button) {
      @apply text-black-900;
      --color-accent: theme('colors.black.200');
    }
  }
}
</style>
