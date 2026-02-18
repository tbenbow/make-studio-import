<template>
  <ul class="share-networks">
    <li v-for="network in networks" :key="network.network" class="item">
      <component
        :is="network.component"
        :share-options="network.shareOptions"
        class="share-network"
      >
        <font-awesome-icon :icon="network.icon" />
      </component>
    </li>
  </ul>
</template>

<script>
import { SEmail, SFacebook, SLinkedIn, STwitter } from 'vue-socials'

export default {
  components: {
    SEmail,
    SFacebook,
    SLinkedIn,
    STwitter
  },
  props: {
    url: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    socialAccounts: {
      type: Object,
      default() {
        // TODO: Move this data to settings in storyblok
        return {
          facebook: 'landtrustalliance',
          twitter: 'ltalliance',
          instagram: 'ltalliance',
          linkedin: 'land-trust-alliance'
        }
      }
    },
    description: String,
    quote: String,
    hashtags: String
  },
  computed: {
    networks() {
      return [
        {
          component: SEmail,
          network: 'email',
          name: 'Email',
          icon: ['fal', 'envelope'],
          shareOptions: {
            mail: '',
            subject: this.title,
            body: this.url,
          }
        },
        {
          component: SFacebook,
          name: 'Facebook',
          network: 'facebook',
          icon: ['fab', 'facebook'],
          shareOptions: {
            url: this.url,
            quote: this.title
          }
        },
        {
          component: SLinkedIn,
          name: 'LinkedIn',
          network: 'linkedin',
          icon: ['fab', 'linkedin'],
          shareOptions: {
            url: this.url
          }
        },
        {
          component: STwitter,
          name: 'Twitter',
          network: 'twitter',
          icon: ['fab', 'twitter'],
          shareOptions: {
            url: this.url,
            text: this.title,
            via: this.socialAccounts.twitter
          }
        },
      ]
    }
  }
}
</script>

<style lang="postcss" scoped>
.share-networks {
  @apply flex flex-wrap;

  .item {
    @apply mr-4;

    &:last-child {
      @apply mr-0;
    }
  }
}

:deep(.share-network) {
  @apply h-8 inline-flex items-center justify-center cursor-pointer;
}
</style>
