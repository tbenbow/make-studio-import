<template>
  <transition name="fade">
    <Overlay
      :active="!dialogIsSuppressed"
      @close="close"
    >
      <Dialog v-if="dialog?.length" v-bind="dialog[0]" @close="close" />
    </Overlay>
  </transition>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { useSiteStore } from '../stores/site'

export default {
  props: {
    active: Boolean,
    dialog: Array
  },
  computed: mapState(useSiteStore, [
    'dialogIsSuppressed'
  ]),
  methods: {
    ...mapActions(useSiteStore, ['suppressDialog']),
    close() {
      this.suppressDialog()
    }
  }
}
</script>
