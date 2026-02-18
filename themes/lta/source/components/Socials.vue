<template>
  <ul class="socials">
    <template v-for="(link, index) in socialLinks">
      <li v-if="socialIcon(link)" :key="index">
        <a :href="link" target="_blank" :aria-label="socialLabel(link)">
          <font-awesome-icon :icon="socialIcon(link)" />
        </a>
      </li>
    </template>
  </ul>
</template>

<script>
const socials = [
  {
    linkPartial: 'facebook',
    label: 'Facebook',
    icon: ['fab', 'facebook']
  },
  {
    linkPartial: 'flickr',
    label: 'Flickr',
    icon: ['fab', 'flickr']
  },
  {
    linkPartial: 'instagram',
    label: 'Instagram',
    icon: ['fab', 'instagram']
  },
  {
    linkPartial: 'linkedin',
    label: 'LinkedIn',
    icon: ['fab', 'linkedin']
  },
  {
    linkPartial: 'twitter',
    label: 'Twitter',
    icon: ['fab', 'twitter']
  },
  {
    linkPartial: 'youtube',
    label: 'YouTube',
    icon: ['fab', 'youtube']
  },
  {
    linkPartial: 'mail',
    label: 'Email',
    icon: ['fal', 'envelope']
  }
]

export default {
  props: {
    socialLinks: {
      type: Array,
      default: () => []
    }
  },
  methods: {
    social(link) {
      return socials.find((social) => link.includes(social.linkPartial))
    },
    socialIcon(link) {
      const social = this.social(link)

      return social?.icon
    },
    socialLabel(link) {
      const social = this.social(link)

      return social?.label
    }
  }
}
</script>

<style lang="postcss" scoped>
.socials {
  @apply flex items-center;

  li {
    @apply mr-4 last:mr-0;
  }
  a {
    @apply text-body hover:text-accent;
  }
}
</style>
