import { isBefore, parseISO } from 'date-fns'
import { defu } from 'defu'
import { cloneDeep, isEmpty, merge } from 'lodash-es'
import StoryblokClient, { type ISbConfig, type ISbError, type ISbStoriesParams } from 'storyblok-js-client'
import { useAccess } from '~/composables/useAccess'
import type { SessionUser } from '~/types/auth'

interface UseStoryblokConfig extends ISbConfig {
  preview?: boolean
  spaceId?: string
  releaseId?: string
}

const privateFields: Record<string, (string | Record<string, string>)[]> = {
  Resource: [
    { name: 'content', type: 'boolean' },
    'contentAssets',
    'contentLink'
  ]
}

const excludedFields: Record<string, (string | Record<string, string>)[]> = {
  Resource: [
    'products.0.assets',
    'products.0.content',
    'registrations.0.content'
  ]
}

export const useStoryblok = ((instanceConfig: UseStoryblokConfig = {}) => {
  const { storyblok: runtimeConfig } = useRuntimeConfig()

  const config: UseStoryblokConfig = defu(instanceConfig, runtimeConfig, {
    cache: {
      type: 'memory',
      clear: 'auto'
    }
  }) as UseStoryblokConfig

  const isManagementClient = config.oauthToken ? true : false

  if (isManagementClient) {
    delete config.accessToken
  } else {
    delete config.oauthToken
  }

  const client = new StoryblokClient(config)

  const prefix = isManagementClient
    ? `spaces/${config.spaceId}`
    : 'cdn'
  
  /**
   * Generate default params for the given endpoint
   * @param {string} endpoint - The endpoint to create default params for
   * @param {boolean} isSingle - If request will be for a single story
   * @returns The default params
   */
  function defaultParams(endpoint: string, isSingle: boolean = false) {
    const params: any = {}

    switch (endpoint) {
      case 'stories':
        // Common parameters
        params.version = config.preview ? 'draft' : 'published'
        params.from_release = config.releaseId
        params.resolve_links = 'url'
        params.resolve_relations = [
          'AlgoliaResources.topic',
          'Completion.sharedForm',
          'Glossary.glossaryTerms',
          'GlossaryTermItem.glossaryTerm',
          'Menu.root',
          'Newsroom.contact',
          'Post.authors',
          'Post.categories',
          'PressRelease.contacts',
          'RegionalProgram.staff',
          'Resource.relatedResourcesByTopic',
          'Resource.topics',
          'Topic.featuredSubTopic',
          'Topic.parent'
        ]

        if (!isSingle) {
          params.first_published_at_lt = config.preview
            ? undefined
            : new Date().toISOString()
        }

        break

      case 'links':
        params.version = config.preview ? 'draft' : 'published'
        break

      case 'tags':
        params.version = config.preview ? 'draft' : 'published'
        break
    }

    return params
  }

  /**
   * Merge params
   * @param  {...object} params - Multiple params objects
   * @returns The merged params
   */
  function mergeParams(...params: any[]) {
    const mergedParams = merge({}, ...params)

    // Filter out `undefined` values
    Object.entries(mergedParams).forEach(([key, value]) => {
      if (value === undefined) {
        delete mergedParams[key]
      }
    })

    return mergedParams
  }

  /**
   * @see https://github.com/storyblok/storyblok-js-client#method-storyblokget
   */
  async function get(path: string, params: ISbStoriesParams = {}) {
    const pathParts = path.split('/')
    const endpoint = pathParts[1]
    const isSingle = pathParts.length > 2
    const response = await client.get(
      path,
      mergeParams(defaultParams(endpoint, isSingle), params)
    ).catch((error: any) => {
      throw createError({
        statusCode: (error as ISbError).status,
        statusMessage: (error as ISbError).message,
        data: (error as ISbError).response
      })
    })

    // The `get` method above can retrieve one or multiple stories, and the API
    // accepts different params for each case. See API docs:
    //   * Retrieve one story: https://www.storyblok.com/docs/api/content-delivery/v2#core-resources/stories/retrieve-one-story
    //   * Retrieve multiple stories: https://www.storyblok.com/docs/api/content-delivery/v2#core-resources/stories/retrieve-multiple-stories
    // Retrieving one story doesn't allow the `first_published_at_lt` param. So
    // here we're checking the published status _after_ the response and
    // throwing a 404 error if it's not published. Checking the first published
    // date allows publishing in the future.
    if (
      !config.preview &&
      isSingle &&
      response.data?.story?.first_published_at &&
      isBefore(new Date(), parseISO(response.data?.story?.first_published_at))
    ) {
      throw new Error('Request failed with status code 404')
    }

    return response
  }

  /**
   * @see https://github.com/storyblok/storyblok-js-client#method-storyblokgetall
   */
  async function getAll(path: string, params: ISbStoriesParams = {}, entity?: string) {
    const pathParts = path.split('/')
    const endpoint = pathParts[1]

    return await client.getAll(
      path,
      mergeParams(defaultParams(endpoint), params),
      entity
    )
  }

  /**
   * Get datasource entries
   * @param {object} params - Query params
   * @returns Datasource entries
   */
  function getDatasourceEntries(params?: ISbStoriesParams) {
    return getAll(`${prefix}/datasource_entries`, params)
  }

  /**
   * Get links
   * @param {object} params - Query params
   * @returns Links
   */
  function getLinks(params?: ISbStoriesParams & { paginated?: number }) {
    return getAll(`${prefix}/links`, params)
  }

  /**
   * Get a resource for a Salesforce ID.
   * @param {string} salesforceId - The Salesforce ID (either a product code or event key)
   * @param {object} params - Additional query params
   * @param {object} user - The user
   * @returns The resource for the Storyblok ID (the most recent if there happen to be multiple)
   */
  async function getResourceBySalesforceId(salesforceId?: string, params: ISbStoriesParams = {}, user?: SessionUser) {
    if (!salesforceId) {
      return
    }

    const resources = await getStories({
      content_type: 'Resource',
      filter_query: {
        __or: [
          { 'products.0.salesforceId': { in: salesforceId } },
          { 'registrations.0.salesforceId': { in: salesforceId } }
        ]
      },
      sort_by: 'first_published_at:desc',
      ...params
    }, false, user)

    return resources.length ? resources[0] : undefined
  }

  /**
   * Get a story
   * @param {string} id - ID: a full_slug, id, or uuid
   * @param {object} params - Query params
   * @param {boolean} keepHiddenStories - True to keep stories the user can't view
   * @param {object} user - The user
   * @returns The story
   */
  async function getStory(id?: string, params: ISbStoriesParams = {}, keepHiddenStories: boolean = false, user?: SessionUser) {
    const response = cloneDeep(
      await get(`${prefix}/stories${id ? `/${id}` : ''}`, params)
    )

    if (response.data?.story) {
      filterStory(response.data.story, user)

      if (!keepHiddenStories) {
        // Only keep stories the user can view
        response.data.story = response.data.story.user_has_view_access
          ? response.data.story
          : undefined
      }
    }

    if (response.data?.stories) {
      filterStories(response.data.stories, user)

      if (!keepHiddenStories) {
        // Only keep stories the user can view
        response.data.stories = response.data.stories.filter(
          (story: any) => story.user_has_view_access
        )
      }
    }
    return response
  }

  /**
   * Get stories
   * @param {object} params - Query params
   * @param {boolean} keepHiddenStories - True to keep stories the user can't view
   * @param {object} user - The user
   * @returns The stories
   */
  async function getStories(params: ISbStoriesParams = {}, keepHiddenStories: boolean = false, user?: SessionUser) {
    const response = cloneDeep(await getAll(`${prefix}/stories`, params))

    filterStories(response, user)

    if (!keepHiddenStories) {
      // Only keep stories the user can view
      return response.filter((story: any) => story.user_has_view_access)
    }

    return response
  }

  /**
   * Get tags
   * @param {object} params - Query params
   * @returns Tags
   */
  function getTags(params?: ISbStoriesParams) {
    return getAll(`${prefix}/tags`, params)
  }

  /**
   * Filter stories
   * @param {array} stories - Stories to be filtered
   * @param {object} user - The user
   * @returns Filtered stories
   */
  function filterStories(stories: any[], user?: SessionUser) {
    if (Array.isArray(stories)) {
      stories.forEach((story) => {
        if (story?.uuid) {
          filterStory(story, user)
        }
      })
    }

    return stories
  }

  /**
   * Filter out sensitive fields for restricted and private stories
   * @param {object} story - Story to be filtered
   * @param {object} user - The user
   * @returns Filtered story
   */
  function filterStory(story: any = {}, user?: SessionUser) {
    const { access, accessGroups } = story.content
    const {
      accessIsRestricted,
      accessIsPrivate,
      userHasAccess,
      userHasViewAccess
    } = useAccess({ access, accessGroups }, user)
    
    story.user_has_access = userHasAccess.value
    story.user_has_view_access = userHasViewAccess.value

    // Access
    // - If user has access, return complete story
    if (userHasAccess.value) {
      return story
    }

    // Access: Restricted
    // - Change the name and keep just the access fields
    if (accessIsRestricted.value) {
      story.name = 'Access Restricted'

      story.content = {
        access,
        accessGroups
      }

      return story
    }

    // Access: Private
    // - Filter private fields for each content type
    if (accessIsPrivate.value) {
      if (story.content.component in privateFields) {
        privateFields[story.content.component].forEach((field) =>
          filterStoryField(story.content, field)
        )
      }
    }

    // Filter excluded fields for each content type
    if (story.content.component in excludedFields) {
      excludedFields[story.content.component].forEach((field) =>
        filterStoryField(story.content, field)
      )
    }

    // Filter content fields with stories
    Object.values(story.content)
      .filter((value) => Array.isArray(value) && value.length && value[0]?.uuid)
      .forEach((stories) => filterStories(stories as any[], user))

    // Filter content fields with a story
    Object.values(story.content)
      .filter((value?: any) => value?.uuid)
      .forEach((story) => filterStory(story, user))

    return story
  }

  /**
   * Filter a story field
   * @param {object} content - Story content object
   * @param {string} field - Field name, ex: 'fieldName' or 'fieldName.0.nestedFieldName'
   * @param {object} field - Field object, ex: { name: 'fieldName', type: 'boolean' }
   * @returns
   */
  function filterStoryField(content: any, field: string | any) {
    const { name, type } = field
    const fieldName = name || field

    // If field includes dot notation, assume it's targeting a field in an
    // array. Split field name into parts, look for sub-field in field array.
    if (/\w\.[0-9]*\.\w/.test(fieldName)) {
      const [arrFieldName, arrIndex, arrSubFieldName] = fieldName.split('.')

      if (
        Array.isArray(content[arrFieldName]) &&
        content[arrFieldName][arrIndex]
      ) {
        return filterStoryField(
          content[arrFieldName][arrIndex],
          arrSubFieldName
        )
      }
    }

    let value

    // If field is given as an object with a `type` property, filter according
    // to the given type.
    //
    // Types:
    // - boolean: set to `true` if field is not empty
    // - default: set to `undefined`
    if (type === 'boolean') {
      value = !isEmpty(content[fieldName])
    } else {
      value = undefined
    }

    content[fieldName] = value

    return value
  }

  /**
   * @see https://github.com/storyblok/storyblok-js-client#method-storyblokflushcache
   */
  function flushCache() {
    return client.flushCache()
  }

  return {
    defaultParams,
    getDatasourceEntries,
    getLinks,
    getResourceBySalesforceId,
    getStory,
    getStories,
    getTags,
    flushCache
  }
})
