# Land Trust Alliance

## Sites

There are two sites: Production and Preview. Both sites display content from the same Storyblok space.

* Host: **Netlify**
  * Team: [Land Trust Alliance](https://app.netlify.com/teams/landtrustalliance/sites)
* CMS: **Storyblok**
  * Space: [Land Trust Alliance](https://app.storyblok.com/#/me/spaces/120093)
* Search: **Algolia**
  * Manage: [Dashboard](https://dashboard.algolia.com)
  * Various search interfaces across the site utilize Algolia and its InstantSearch components.
* Auth: **Salesforce**
  * Backend: [Salesforce Admin](https://landtrustallianceinc.my.salesforce.com)
* Code: **GitHub**
  * Repository: [bustoutsolutions/land-trust-alliance-nuxt3-new](https://github.com/bustoutsolutions/land-trust-alliance-nuxt3-new)

> [!IMPORTANT]
> * Environment/site-specific settings are configured at the bottom of [`nuxt.config`](https://github.com/bustoutsolutions/land-trust-alliance-nuxt3-new/blob/main/nuxt.config.ts)
> * Both sites auto-deploy the `main` branch
> * Both sites automatically create deploy preview sites for pull requests. URLs are added to the PR in comments.

> [!NOTE]
> This site has a companion [Rails Util app](https://github.com/bustoutsolutions/lta-util). It handles synchronizing data from Salesforce to Storyblok and Algolia. It also provides an API that the Nuxt app uses to fetch land trust and affiliate data, and store user data like bookmarks, likes, and completions.

### Production

The production site only displays published content from Storyblok.

* URL: [landtrustalliance.org](https://landtrustalliance.org)
* [Environment variables](https://app.netlify.com/sites/landtrustalliance/configuration/env#content)
* Build command: `nuxt build`
* Rendering mode: [Universal](https://nuxt.com/docs/guide/concepts/rendering#hybrid-rendering)
* Caching:
  * Certain API routes are cached on the server for 1 hour using a stale-while-revalidate strategy
  * These are configured via `routeRules` in `nuxt.config`
  * An API route is available for clearing the cache
    * Send `POST` to `/api/__cache/purge`
    * This route can be triggered from within [Storyblok > Tasks](https://app.storyblok.com/me/spaces/#/me/spaces/120093/tasks), see Purge Cache
* Sentry is enabled for error reporting: [sentry.io](https://sentry.io) (login is in 1Password)
* Google Tag Manager is enabled (via env var)

### Preview

The preview site displays both published and draft content from Storyblok.

* URL: [https://preview.landtrustalliance.org](https://preview.landtrustalliance.org)
* [Environment variables](https://app.netlify.com/sites/landtrustalliance-preview/configuration/env#content)
* Build command: `nuxt build --envName preview`
* Rendering mode: [Universal](https://nuxt.com/docs/guide/concepts/rendering#universal-rendering)
* Caching: Same configuration as Production

## Setup

### Requirements

* Node 20+

### Commands

```bash
# Install dependencies
yarn install

# Start dev server on `http://localhost:3000`
yarn dev

# Start dev server on `https://localhost:3000`
# Required for using `localhost` in Storyblok visual editor
yarn dev:https

# Production build + start preview server on `http://localhost:3000`
yarn build && yarn preview

# Production build of preview environment + start preview server on `http://localhost:3000`
yarn build --envName preview && yarn preview
```
