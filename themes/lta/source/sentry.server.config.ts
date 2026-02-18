import dotenv from 'dotenv'
import * as Sentry from '@sentry/nuxt'

dotenv.config()

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV
  })
}
