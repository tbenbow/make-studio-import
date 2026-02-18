import SalesforceProvider from 'next-auth/providers/salesforce'
import { NuxtAuthHandler } from '#auth'

const { auth: { salesforce, secret } } = useRuntimeConfig()

export default NuxtAuthHandler({
  debug: false,
  secret,
  providers: [
    // @ts-expect-error Use .default here for it to work during SSR.
    SalesforceProvider.default<{ name: string }>({
      clientId: salesforce.clientId,
      clientSecret: salesforce.clientSecret,
      issuer: salesforce.issuer,
      checks: ['pkce'],
      authorization: {
        params: {
          scope: 'profile api refresh_token'
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      //console.log('[callbacks.jwt] token =', token)
      //console.log('[callbacks.jwt] account =', account)
      //console.log('[callbacks.jwt] profile =', profile)
      
      if (account) {
        token.access_token = account.access_token
        token.refresh_token = account.refresh_token
      }

      token.internalId = await $fetch('/api/user/internal-id', { params: { ...token } })

      return token
    },
    async session({ session, token }) {
      // console.log('[callbacks.session] session =', session)
      // console.log('[callbacks.session] token =', token)
      
      const user = await $fetch('/api/user', { params: { ...token } })

      return {
        ...session,
        user
      }
    }
  }
})
