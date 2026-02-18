import type { DefaultSession } from 'next-auth'

interface SessionUser {
  id: string | undefined
  internalId: string | undefined
  authorized: boolean
  profile: {
    contactId?: string
    imisId?: string
    name?: string
    nickname?: string
    email?: string
    emailType?: string
    phone?: string
    phoneType?: string
    badges?: string[]
    url?: string
  }
  organization: {
    name?: string
    membershipType?: string
    membershipStatus?: string
    membershipExpiration?: string
    administrators?: string
    region?: string
    accreditationExpiration?: string
    lastTerrafirmaPolicyYear?: string
    terrafirmaRegion?: string
    url?: string
    membershipUrl?: string
    userIsAdmin?: boolean
  }
  groups: string[]
  products: {
    id: string
    date: string
    name: string
  }[]
  registrations: {
    id: string
    date: string
    name: string
  }[]
}

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: SessionUser
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    access_token?: string
  }
}
