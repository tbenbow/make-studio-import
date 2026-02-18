import svgLoader from 'vite-svg-loader'

const nuxtServerUseHttps = process.env.NUXT_SERVER_USE_HTTPS && true
const sentryEnabled = process.env.SENTRY_DSN && process.env.SENTRY_AUTH_TOKEN ? true : false
const baseUrl = (process.env.CONTEXT === 'deploy-preview' ? process.env.DEPLOY_PRIME_URL : process.env.URL) || `http${nuxtServerUseHttps ? 's' : ''}://localhost:3000`
const amazonS3BaseUrl = 'https://lta-util-production.s3.us-east-2.amazonaws.com'
const railsBaseUrl = process.env.RAILS_BASE_URL || 'https://lta-util-production.herokuapp.com/api/v1'
const headlessFormsBaseUrl = 'https://api.headlessforms.cloud/api/v1/form'

// https://nuxt.com/docs/api/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-03-04',

  devtools: {
    enabled: true,
    componentInspector: false // Temporary fix to resolve terminal warnings: https://github.com/nuxt/devtools/issues/722
  },

  sourcemap: {
    client: 'hidden' // Required for Sentry
  },

  build: {
    transpile: [
      '@algolia/recommend-core',
      '@fortawesome/vue-fontawesome',
      'resize-detector',
      'scorm-again',
      'vue-toastification'
    ]
  },

  vite: {
    plugins: [svgLoader({
      defaultImport: 'url',
      svgo: false
    })]
  },

  postcss: {
    plugins: {
      'postcss-hexrgba': {}
    }
  },
  
  routeRules: {
    '/headlessforms/**': {
      proxy: {
        to: `${headlessFormsBaseUrl}/**`,
        headers: {
          'Accept': 'application/json'
        }
      }
    },
    '/s3/**': { proxy: `${amazonS3BaseUrl}/**` },
    '/api/breadcrumbs/**': { cache: { maxAge: 60 * 60, swr: true } },
    '/api/links/**': { cache: { maxAge: 60 * 60, swr: true } },
    '/api/stores': { cache: { maxAge: 60 * 60, swr: true } },
    '/api/stores/glossaries': { cache: { maxAge: 60 * 60, swr: true } },
    '/api/stores/settings': { cache: { maxAge: 60 * 60, swr: true } },
    '/api/stores/site': { cache: { maxAge: 60 * 60, swr: true } },
    '/api/stores/stories': { cache: { maxAge: 60 * 60, swr: true } }
  },

  runtimeConfig: {
    public: {
      baseUrl,
      adobe: {
        pdfEmbedApiKey: process.env.ADOBE_PDF_EMBED_API_KEY
      },
      algolia: {
        applicationId: '9YSBZJ7RTK',
        apiKey: process.env.ALGOLIA_API_KEY,
        env: process.env.ALGOLIA_ENV || process.env.NODE_ENV
      },
      google: {
        apiKey: process.env.GOOGLE_API_KEY
      },
      salesforce: {
        instanceUrl: process.env.AUTH_SALESFORCE_ISSUER,
        apiBasePath: '/services/data/v61.0'
      },
      scripts: {
        googleTagManager: {
          id: process.env.GOOGLE_TAG_MANAGER_ID
        }
      },
      sentry: {
        dsn: process.env.SENTRY_DSN,
        environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV
      }
    },
    amazon: {
      s3BaseUrl: amazonS3BaseUrl
    },
    auth: {
      secret: process.env.AUTH_SECRET,
      salesforce: {
        clientId: process.env.AUTH_SALESFORCE_CLIENT_ID,
        clientSecret: process.env.AUTH_SALESFORCE_CLIENT_SECRET,
        issuer: process.env.AUTH_SALESFORCE_ISSUER
      }
    },
    rails: {
      baseUrl: railsBaseUrl
    },
    storyblok: {
      accessToken: process.env.STORYBLOK_API_KEY,
      preview: ['true', '1'].includes(process.env.STORYBLOK_PREVIEW || ''),
      releaseId: process.env.STORYBLOK_RELEASE_ID
    }
  },

  app: {
    head: {
      htmlAttrs: {
        lang: 'en'
      }
    },
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: [
    '@fortawesome/fontawesome-svg-core/styles.css'
  ],

  components: [
    {
      path: '~/components/global',
      pathPrefix: false,
      global: true
    }, {
      path: '~/components',
      pathPrefix: false,
      global: false
    }
  ],

  modules: [
    '@nuxt/image',
    '@nuxt/scripts',
    '@pinia/nuxt',
    // '@nuxtjs/stylelint-module',
    '@nuxtjs/tailwindcss',
    '@sentry/nuxt/module',
    '@sidebase/nuxt-auth',
    '@formkit/auto-animate/nuxt',
    '@vee-validate/nuxt',
    '@vite-pwa/nuxt',
    'nuxt-font-loader'
  ],

  // Auth module: https://auth.sidebase.io
  auth: {
    isEnabled: true,
    baseURL: `${baseUrl}/api/auth`,
    provider: {
      type: 'authjs',
      defaultProvider: 'salesforce'
    },
    sessionRefresh: {
      enablePeriodically: false,
      enableOnWindowFocus: false,
    }
  },

  // Font Loader build module (Typekit): https://github.com/ivodolenc/nuxt-font-loader
  fontLoader: {
    local: [
      {
        src: '/fonts/stateface/stateface-regular-webfont.woff',
        family: 'StateFaceRegular',
        class: 'font-stateface'
      }
    ],
    external: [
      {
        src: 'https://use.typekit.net/agx7yzm.css'
      }
    ]
  },

  // Image module: https://image.nuxtjs.org
  image: {
    screens: {
      xs: 640,
      sm: 768,
      md: 1024,
      lg: 1280,
      xl: 1440,
      '2xl': 1600,
      max: 3200,
      '2x': 9999
    },
    ipx: {},
    provider: 'cloudinary',
    providers: {
      cloudinary: {
        name: 'cloudinary',
        provider: '~/image-providers/cloudinary',
        options: {
          baseURL: 'https://res.cloudinary.com/land-trust-alliance/image/fetch/'
        }
      }
    },
    storyblok: {
      baseURL: 'https://a.storyblok.com'
    },
    presets: {
      ogImage: {
        modifiers: {
          format: 'webp',
          width: 1200,
          height: 630,
          quality: 60
        }
      }
    }
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Land Trust Alliance',
      short_name: 'LTA',
      description: 'Saving the Places People Love',
      theme_color: '#58a66f'
    },
    injectManifest: {
      sourcemap: sentryEnabled
    },
    pwaAssets: {
      config: true
    },
    workbox: {
      navigateFallback: null,
      runtimeCaching: [
        {
          // Cache Storyblok assets which are routed through Cloudinary (except video and audio)
          // TODO: Explore using `options.rangeRequests` to handle video and audio
          urlPattern: ({ request }) => {
            const storyblokAssetURL = new RegExp('^https:\/\/res\.cloudinary\.com\/.*', 'i')

            return request.url
              && storyblokAssetURL.test(request.url)
              && !['video', 'audio'].includes(request.destination)
          },
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'storyblok-assets'
          }
        }
      ]
    },
    devOptions: {
      enabled: false
    }
  },

  sentry: {
    enabled: sentryEnabled,
    autoInjectServerSentry: 'top-level-import',
    sourceMapsUploadOptions: {
      org: 'bust-out',
      project: 'land-trust-alliance',
      authToken: process.env.SENTRY_AUTH_TOKEN
    }
  },

  // stylelint: {
  //   files: 'assets/**/*.css',
  //   fix: true,
  //   lintDirtyModulesOnly: true
  // },

  // Tailwind module: https://tailwindcss.nuxtjs.org/options
  tailwindcss: {
    exposeConfig: true
  },

  // VeeValidate module: https://vee-validate.logaretm.com/v4/integrations/nuxt
  veeValidate: {
    autoImports: true,
    componentNames: {
      Form: 'VeeForm',
      Field: 'VeeField',
      FieldArray: 'VeeFieldArray',
      ErrorMessage: 'VeeErrorMessage'
    }
  },

  /**
   * Environment Overrides
   * https://nuxt.com/docs/getting-started/configuration#environment-overrides
   */

  // Production
  // Command: `nuxt build`
  $production: {
    routeRules: {
      '/': {
        cache: { maxAge: 60 * 60, swr: true },
        auth: { disableServerSideAuth: true }
      }
    },
    scripts: {
      registry: {
        googleTagManager: true
      }
    }
  },

  $env: {
    // Preview
    // Command: `nuxt build --envName preview`
    preview: {}
  }
})
