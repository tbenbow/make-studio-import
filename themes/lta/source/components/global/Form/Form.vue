<template>
  <VeeForm
    v-slot="{ errors }"
    v-editable="$props"
    class="form"
    :action="action"
    method="POST"
    :enctype="enctype"
    @submit="onSubmit"
    @invalid-submit="onInvalidSubmit"
  >
    <template v-if="isSubmitted">
      <Notice
        key="notice-success"
        class="form-submitted"
        title="Form Submitted"
        :description="submissionMessage"
        icon="circle-check"
        :panel="true"
      >
        <template #footer>
          <ButtonComponent
            tag="button"
            name="Reset Form"
            icon="arrow-rotate-left"
            size="small"
            @click.prevent="reset"
          />
          <div v-if="formDataArray && formDataArray.length" class="form-data">
            <RichText size="small"
              ><p><strong>Here's what you entered:</strong></p></RichText
            >
            <List>
              <ListItem
                v-for="(field, index) in formDataArray"
                :key="index"
                :label="field[0]"
                size="small"
              >
                <p>{{ field[1] || '—' }}</p>
              </ListItem>
            </List>
          </div>
        </template>
      </Notice>
    </template>
    <template v-else>
      <Notice
        v-if="submissionError"
        key="notice-error"
        v-color="'extra-1'"
        class="form-submission-error"
        icon="circle-exclamation"
        align="left"
        :display-inline="true"
      >
        {{ submissionError }}
      </Notice>
      <div class="form-content">
        <slot v-bind="{ isSubmitting }" />
        <template v-if="content && content.length">
          <component
            :is="block.component"
            v-for="(block, index) in content"
            :key="index"
            v-bind="block"
            :disabled="isSubmitting"
            :submitting="isSubmitting"
            :errors="errors"
          />
        </template>
        <div v-if="honeypot" class="hp">
          <input type="text" name="hp" tabindex="-1" autocomplete="off" />
        </div>
      </div>
      <footer
        v-if="
          !contentHasSubmit && ($slots.default || (content && content.length))
        "
        class="form-footer"
      >
        <FormSubmit
          :name="submitButtonName"
          :submitting="isSubmitting"
          :disabled="isSubmitting"
        />
      </footer>
    </template>
  </VeeForm>
</template>

<script>
import { mapState } from 'pinia'
import { useSiteStore } from '../stores/site'
import { findDeep } from 'deepdash-es/standalone'

const submitTo = {
  HEADLESS_FORMS: 'headlessForms',
  PAGE: 'page',
  SELF: 'self'
}

export default {
  props: {
    page: [Object, String],
    headlessFormsFormToken: String,
    content: Array,
    submitButtonName: String,
    honeypot: Boolean
  },
  data() {
    return {
      isSubmitting: false,
      isSubmitted: false,
      submissionMessage: undefined,
      submissionError: undefined,
      formData: undefined
    }
  },
  computed: {
    ...mapState(useSiteStore, [
      'currentStory'
    ]),
    submitTo() {
      return this.page && this.pageLink.isValid
        ? submitTo.PAGE
        : this.headlessFormsFormToken
        ? submitTo.HEADLESS_FORMS
        : submitTo.SELF
    },
    submitToPage() {
      return this.submitTo === submitTo.PAGE
    },
    submitToPageInternal() {
      return this.submitToPage && this.pageLink.isInternal
    },
    submitToPageExternal() {
      return this.submitToPage && this.pageLink.isExternal
    },
    submitToHeadlessForms() {
      return this.submitTo === submitTo.HEADLESS_FORMS
    },
    submitToSelf() {
      return this.submitTo === submitTo.SELF
    },
    pageLink() {
      const { isValid, isInternal, isExternal, url } = useLinkHelper(this.page)

      return {
        isValid: isValid.value,
        isInternal: isInternal.value,
        isExternal: isExternal.value,
        url: url.value
      }
    },
    action() {
      switch (this.submitTo) {
        case submitTo.PAGE:
          return this.pageLink.url

        case submitTo.HEADLESS_FORMS:
          return `/headlessforms/${this.headlessFormsFormToken}`

        case submitTo.SELF:
        default:
          return undefined
      }
    },
    /**
     * If the form contains a file field, enctype must be `multipart/form-data`.
     * Otherwise it should be the default (`application/x-www-form-urlencoded`).
     * @returns {string} The encoding type
     */
    enctype() {
      return this.content &&
        this.content.length &&
        findDeep(
          this.content,
          (value, key) => key === 'component' && value === 'FormFile'
        )
        ? 'multipart/form-data'
        : 'application/x-www-form-urlencoded'
    },
    contentHasSubmit() {
      return (
        this.content &&
        this.content.length &&
        findDeep(
          this.content,
          (value, key) => key === 'component' && value === 'FormSubmit'
        )
      )
    },
    formDataArray() {
      return this.formData ? Array.from(this.formData) : undefined
    },
    currentStoryDetails() {
      return this.currentStory
        ? {
            story_name: this.currentStory.name,
            story_full_slug: this.currentStory.full_slug,
            story_uuid: this.currentStory.uuid
          }
        : undefined
    },
    isQueryVarSubmitted() {
      return Object.keys(this.$route.query).includes('form-submitted')
    },
    queryVarSubmissionMessage() {
      return typeof this.$route.query['form-submitted'] === 'string'
        ? this.$route.query['form-submitted']
        : undefined
    }
  },
  created() {
    // Set form submission message based on a query var — this is useful when
    // submitting to external forms like Salesforce. Also only allowed to work
    // with external-submission forms because (1) it's only useful in that case
    // and (2) to avoid showing the message in other forms on the page.
    if (this.submitToPageExternal && this.isQueryVarSubmitted) {
      this.isSubmitted = true
      this.submissionMessage = this.queryVarSubmissionMessage
    }
  },
  methods: {
    async onSubmit() {
      this.formData = new FormData(this.$el)

      // Check honeypot field - if filled, it's likely a bot
      if (this.honeypot && this.formData.get('hp')) {
        // Silently fail for bots - don't show error, just reset
        this.$el.reset()
        this.reset()
        return false
      }

      this.isSubmitting = true

      if (this.submitToPage) {
        if (this.submitToPageInternal) {
          // Submit to internal page with form data as query params
          await navigateTo({
            path: this.action,
            query: Object.fromEntries(new URLSearchParams(this.formData))
          })
        } else {
          // Submit to external page with default form behavior
          this.$el.submit()
        }

        this.reset()

        return true
      } else if (this.submitToHeadlessForms) {
        this.submissionError = undefined

        try {
          // Use fresh copy of form data so current story details don't appear
          // when displaying form data after submission
          const formData = new FormData(this.$el)

          // Set current story details before sending
          if (this.currentStoryDetails) {
            Object.entries(this.currentStoryDetails).forEach(([key, value]) =>
              formData.set(key, value)
            )
          }

          const response = await $fetch(this.action, {
            method: 'POST',
            body: formData,
            timeout: 1000 * 60 * 5 // 5 minutes
          })

          if (response?.status === 200) {
            this.isSubmitted = true
            this.submissionMessage = 'Your form was successfully submitted.'
          } else {
            let message = `${response?.message}${
              response?.error ? `: ${response.error}` : ''
            }.`

            if (typeof response?.data === 'object') {
              Object.entries(response.data).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                  message += ` ${value.join(' ')}`
                } else if (typeof value === 'string') {
                  message += ` ${value}`
                }
              })
            }

            message += ' Resubmit the form or try again later.'

            this.submissionError = message
          }

          this.$el.scrollIntoView()
        } catch (err) {
          const message = err?.data?.error || err?.message || err

          this.submissionError = message
        }
      } else if (this.submitToSelf) {
        this.isSubmitted = true
      }

      this.isSubmitting = false

      return this.isSubmitted
    },
    onInvalidSubmit() {
      this.submissionError = 'Please fix the errors and submit the form again.'
      this.$el.scrollIntoView()
    },
    reset() {
      this.isSubmitting = false
      this.isSubmitted = false
      this.submissionMessage = undefined
      this.submissionError = undefined
      this.formData = undefined
    }
  }
}
</script>

<style lang="postcss">
.form {
  &-submission-error {
    @apply mb-8;
  }

  &-content {
    @apply flex flex-col gap-8;

    .hp {
      @apply absolute left-[-9999px] top-[-9999px] opacity-0;
    }
  }

  &-data {
    @apply mt-8 pt-8 text-left border-t border-line;

    .list {
      @apply mt-6;
    }
  }

  &-footer {
    @apply mt-8;
  }
  .errors {
    @apply mt-2 text-xs text-extra-1;
  }
}
</style>
