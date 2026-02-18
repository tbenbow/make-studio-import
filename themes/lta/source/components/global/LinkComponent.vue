<template>
  <NuxtLink
    v-if="isInternal || isAnchor"
    v-slot="{ href, navigate, isActive, isExactActive }"
    :to="url"
    custom
  >
    <component
      :is="tag"
      :class="[
        isActive && 'nuxt-link-active',
        isExactActive && 'nuxt-link-exact-active'
      ]"
      :href="tag === 'a' ? href : undefined"
      :target="openInNewWindow ? '_blank' : undefined"
      v-bind="$attrs"
      @click="handleClick($event, navigate)"
    >
      <slot v-bind="{ displayName }">{{ displayName }}</slot>
    </component>
  </NuxtLink>
  <component
    v-else
    :is="tag"
    :href="tag === 'a' && url"
    target="_blank"
    @click="handleClick"
  >
    <slot v-bind="{ displayName }">{{ displayName }}</slot>
  </component>
</template>

<script>
export default {
  props: {
    link: {
      type: [Object, String],
      default: () => ({ story: {} })
    },
    name: String,
    openInNewWindow: Boolean,
    tag: {
      type: String,
      default: 'a'
    }
  },
  emits: ['click'],
  setup(props) {
    const link = useLinkHelper(toRef(() => props.link), toRef(() => props.name))

    return {
      isValid: link.isValid,
      isInternal: link.isInternal,
      isAnchor: link.isAnchor,
      type: link.type,
      url: link.url,
      displayName: link.displayName
    }
  },
  methods: {
    /**
     * Trigger both this handler and `customHandler`:
     * <LinkComponent link="/" @click="customHandler" />
     * 
     * Trigger just `customHandler`:
     * <LinkComponent link="/" @click.prevent="customHandler" />
     * 
     * Triggers`customHandler` which decides to navigate or not:
     * <LinkComponent link="/" @click.prevent="customHandler" />
     * 
     * customHandler(event, defaultHandler) {
     *   if (something) {
     *     doSomething()
     *   } else {
     *     defaultHandler()
     *   }
     * }
     */
    handleClick(event, navigate) {
      const defaultHandler = (useOriginalEvent = false) => {
        if (this.$attrs.disabled) {
          event.preventDefault()
        } else if (typeof navigate === 'function') {
          if (useOriginalEvent) {
            return navigate(event)
          } else {
            // When using @click.prevent the event will be prevented causing
            // navigate() to do nothing. Use a copy of the event
            const { defaultPrevented, ...eventWithoutDefaultPrevented } = event
            return navigate(eventWithoutDefaultPrevented)
          }
        }
      }

      this.$emit('click', event, defaultHandler)

      return defaultHandler(true)
    }
  }
}
</script>
