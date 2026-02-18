<template>
  <div
    v-editable="$props"
    class="embed"
    :class="{
      [`service-${service}`]: service,
      [`hostname-${hostname}`]: hostname
    }"
    :style="{
      maxWidth: widthOrDefault && `${widthOrDefault}px`,
      height: !aspectRatioOrDefault && heightOrDefault && `${heightOrDefault}px`
    }"
  >
    <VEmbed
      v-if="url"
      ref="vembed"
      class="vembed"
      :class="aspectRatioClass"
      :options="options"
    >
      <a :href="url" class="url">{{ url }}</a>
    </VEmbed>
    <iframe v-if="iframeUrl" ref="iframe" class="iframe" :src="iframeUrl" />
    <div v-if="code" ref="code" class="code" />
  </div>
</template>

<script>
import DOMPurify from 'dompurify'
import { withoutDetailsTemplate } from 'embed-plugin-utilities'
import parseUrl from 'url-parse'
import { aspectRatios, aspectRatioClass } from '@/components/Asset/Asset'
import { useHead } from '@unhead/vue'

// Domains allowed to be used in <script src=""> attributes in `code` field
const allowedScriptSrcDomains = [
  'embed.typeform.com',
  'www.instagram.com',
  'landtrustalliance.tfaforms.net'
]

export default {
  props: {
    url: String,
    iframeUrl: String,
    code: String,
    aspectRatio: {
      type: String,
      validator: (value) => ['', ...aspectRatios].includes(value)
    },
    width: [String, Number],
    height: [String, Number],
    videoOptions: Object
  },
  data() {
    return {
      // Default aspect ratios for services/hostnames
      defaultAspectRatios: {
        vimeo: '16:9',
        youtube: '16:9'
      },

      // Default widths for services/hostnames
      defaultWidths: {
        facebook: 550,
        instagram: 300,
        twitter: 550
      },

      // Default heights for services/hostnames
      defaultHeights: {
        facebook: 400,
        instagram: 440
      },

      // The current service for the URL
      service: undefined,

      // Options for YouTube embeds
      youtubeOptions: {
        iv_load_policy: 3,
        modestbranding: 1,
        widget_referrer: this.$config.public.baseUrl
      }
    }
  },
  setup(props) {
    if (props.url.includes('twitter') || props.url.includes('x.com')) {
      useHead({
        script: [
          {
            hid: 'twitter',
            type: 'text/javascript',
            src: '//platform.twitter.com/widgets.js',
            async: true,
            defer: true
          }
        ]
      })
    }
  },
  computed: {
    /**
     * Options for VEmbed
     * @see https://github.com/Gomah/vue-embed#options
     */
    options() {
      return {
        inlineEmbed: false,
        replaceUrl: true,
        plugins: [
          {
            name: 'facebook'
          }, {
            name: 'instagram'
          }, {
            name: 'noembed',
            options: {
              exclude: ['twitter', 'vimeo', 'youtube']
            }
          }, {
            name: 'twitter',
            options: {
              regex: /https:\/\/(twitter|x)\.com\/\w+\/\w+\/\d+/gi,
              ...(this.width ? { maxWidth: this.width } : {}),
              linkColor: this.$theme.colors.green.DEFAULT
            }
          }, {
            name: 'vimeo',
            options: {
              urlParams: this.urlParams
            }
          }, {
            name: 'youtube',
            options: {
              gAuthKey: this.$config.public.google.apiKey,
              details: false,
              ...(this.height ? { height: this.height } : {}),
              template: (args, _options, pluginOptions) => {
                // Use custom template to set parameters for YouTube embed

                const params = new URLSearchParams({
                  ...this.youtubeOptions,
                  ...(this.videoOptions?.loop ? { playlist: args[1] } : {}),
                  ...this.videoOptions
                }).toString()

                const embedUrl = `https://www.youtube.com/embed/${args[1]}?${params}`

                return withoutDetailsTemplate(
                  embedUrl,
                  pluginOptions.height,
                  pluginOptions.id
                )
              }
            }
          }
        ]
      }
    },

    /**
     * Use provided aspect ratio or a default for the service/hostname
     */
    aspectRatioOrDefault() {
      return (
        this.aspectRatio ||
        this.defaultAspectRatios[this.service] ||
        this.defaultAspectRatios[this.hostname]
      )
    },

    /**
     * Generate the class name used to implement the aspect ratio
     */
    aspectRatioClass() {
      return this.aspectRatioOrDefault
        ? aspectRatioClass(this.aspectRatioOrDefault)
        : undefined
    },

    /**
     * Use provided width or a default for the service/hostname
     */
    widthOrDefault() {
      return (
        this.width ||
        this.defaultWidths[this.service] ||
        this.defaultWidths[this.hostname]
      )
    },

    /**
     * Use provided height or a default for the service/hostname
     */
    heightOrDefault() {
      return (
        this.height ||
        this.defaultHeights[this.service] ||
        this.defaultHeights[this.hostname]
      )
    },

    /**
     * Get the hostname from the URL
     */
    hostname() {
      const url = this.url ? parseUrl(this.url) : undefined

      return url
        ? url.hostname
            .replace(/www\./, '')
            .replace(/\.(com|net|org|us)/, '')
            .replace(/\./, '-')
        : undefined
    }
  },
  mounted() {
    // Method for getting the name of the service as determined by VEmbed
    this.$watch(
      () => this.$refs.vembed?.vEmbed?.options?._services,
      (services) =>
        Array.isArray(services) && services.length
          ? (this.service = services[0].id)
          : undefined,
      { deep: 1 }
    )

    if (this.code) {
      const { $postscribe } = useNuxtApp()

      DOMPurify.addHook('uponSanitizeElement', (node, data) => {
        if (data.tagName === 'script') {
          const src = node.getAttribute('src')

          if (src) {
            const url = parseUrl(src)
            const isAllowed = allowedScriptSrcDomains.some((domain) =>
              url.hostname.endsWith(domain)
            )
            if (!isAllowed) {
              console.error(`[Embed] Blocked script from ${url.hostname}`)
              node.parentNode?.removeChild(node)
            }
          }
        }
      })

      const sanitizedCode = DOMPurify.sanitize(this.code, {
        ADD_TAGS: ['iframe', 'script']
      })

      $postscribe(this.$refs.code, sanitizedCode, {
        done() {
          // Trigger Form Assembly initializer
          if (typeof loadFormAssemblyFormHeadAndBodyContents === 'function') {
            loadFormAssemblyFormHeadAndBodyContents()
          }
        }
      })
    }
  }
}
</script>

<style lang="postcss" scoped>
.embed {
}

:deep(.vembed) {
  @apply h-full w-full max-w-full overflow-auto;

  iframe {
    @apply h-full w-full inline-block align-top;
  }

  &.ejs-applied {
    .url {
      @apply hidden;
    }
  }
}

.iframe {
  @apply h-full w-full inline-block align-top;
}

.code {
  @apply max-w-full overflow-auto;
}

/**
 * Service
 */

.embed.service-facebook {
  :deep(.vembed) {
    @apply overflow-visible;

    iframe {
      @apply w-[calc(100%_+_2px)];
    }
  }
}

.embed.service-instagram {
  :deep(.vembed) {
    @apply overflow-hidden border border-black-200 rounded-lg;
  }
}

.embed.service-twitter {
  .twitter-tweet {
    @apply my-0 !important;
  }
}

.embed.service-youtube,
.embed.hostname-vimeo {
  :deep(.vembed) {
    iframe {
      @apply rounded-lg;
    }
  }
}
</style>
