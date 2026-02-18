import * as Sentry from '@sentry/nuxt'

const { sentry } = useRuntimeConfig().public

if (sentry.dsn) {
  Sentry.init({
    dsn: sentry.dsn,
    environment: sentry.environment,
    integrations: [
      Sentry.vueIntegration({
        tracingOptions: {
          trackComponents: true
        }
      }),
      Sentry.piniaIntegration(usePinia()),
      Sentry.replayIntegration({
        maskAllText: false,
        maskAllInputs: true,
        blockAllMedia: false
      })
    ],
    normalizeDepth: 10,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    ignoreErrors: [
      // Likely harmless, caused by Microsoft Outlook Safe Links feature
      // https://forum.sentry.io/t/unhandledrejection-non-error-promise-rejection-captured-with-value/14062/5
      'Non-Error promise rejection captured'
    ]
  })
}
