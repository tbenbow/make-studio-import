export default defineEventHandler(event => {
  throw createError({
    statusMessage: 'Sentry Example API Route Error'
  })
})
