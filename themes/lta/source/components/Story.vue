<template>
  <div class="story">
    <Notice
      v-if="accessIsRestricted && !userHasAccess"
      class="mt-12"
      icon="lock"
      size="large"
    >
      Access Restricted
      <template #description>
        <template v-if="loggedIn && accessIsLimitedToGroups">
          Access to this page is restricted to specific groups.
        </template>
        <template v-else>Access to this page is restricted.</template>
      </template>
      <template #footer>
        <ButtonComponent
          v-if="!loggedIn"
          link="/login"
          name="Log In"
          icon="arrow-right"
          @click.prevent="signIn()"
        />
      </template>
    </Notice>
    <component
      v-else
      v-once
      :is="resolveAsyncComponent(component)"
      v-bind="componentProps"
    >
      <template v-for="(_, slotName) in $slots" v-slot:[slotName]="slotData">
        <slot :name="slotName" v-bind="slotData" />
      </template>
    </component>
  </div>
</template>

<script setup lang="ts">
import type { StoryProps } from '~/composables/useStory'

const props = defineProps<StoryProps>()

const { component, componentProps } = useStory(props)

const { loggedIn, user, signIn } = useLtaAuth()

const access = props.content?.access
const accessGroups = props.content?.accessGroups

const {
  accessIsRestricted,
  accessIsLimitedToGroups,
  userHasAccess
} = useAccess({ access, accessGroups }, user.value)
</script>
