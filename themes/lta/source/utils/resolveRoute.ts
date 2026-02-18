export const resolveRoute = (name?: string, slug?: string) => {
  switch (name) {
    case 'affiliate':
      return `/resources/connect/affiliates/${slug}`
    
    case 'land-trust':
      return `/land-trusts/explore/${slug}`
  }
}
