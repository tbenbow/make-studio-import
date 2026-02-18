/**
 * Make Studio API Client
 * Fetch-based client for syncing themes via per-site API tokens.
 */

export interface ApiBlock {
  _id: string
  name: string
  description?: string
  thumbnailType?: string
  category?: string
  site_id?: string
  template?: string
  fields?: Array<{
    id: string
    type: string
    name: string
    value: unknown
    config?: Record<string, unknown>
  }>
  createdAt?: string
  updatedAt?: string
}

export interface ApiPartial {
  _id: string
  name: string
  site_id?: string
  template?: string
  createdAt?: string
  updatedAt?: string
}

export interface ApiSite {
  _id: string
  name: string
  theme: Record<string, unknown>
  blocks: Array<{ _id: string; name: string }>
  partials: Array<{ _id: string; name: string }>
  pages: Array<{ _id: string; name: string }>
  layouts: Array<{ _id: string; name: string }>
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class MakeStudioClient {
  private baseUrl: string
  private token: string

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.token = token
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    }

    const res = await fetch(url, {
      method,
      headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {})
    })

    if (!res.ok) {
      let message = `HTTP ${res.status}`
      let code: string | undefined
      try {
        const err = await res.json()
        message = err.message || message
        code = err.code
      } catch {}
      throw new ApiError(res.status, message, code)
    }

    return res.json() as Promise<T>
  }

  // ─── Site ───

  async getSite(siteId: string): Promise<ApiSite> {
    return this.request('GET', `/sites/${siteId}`)
  }

  async updateSiteTheme(siteId: string, theme: Record<string, unknown>): Promise<ApiSite> {
    return this.request('PATCH', `/sites/${siteId}`, { theme })
  }

  async createSite(name: string): Promise<ApiSite & { apiToken?: string }> {
    return this.request('POST', '/sites', { name })
  }

  async reconcile(siteId: string): Promise<{ success: boolean; reconciled: Record<string, number> }> {
    return this.request('POST', `/sites/${siteId}/reconcile`)
  }

  // ─── Blocks ───

  async getBlocks(siteId: string): Promise<ApiBlock[]> {
    return this.request('GET', `/blocks?site_id=${siteId}`)
  }

  async createBlock(data: {
    name: string
    site_id: string
    template?: string
    fields?: unknown[]
    category?: string
  }): Promise<ApiBlock> {
    return this.request('POST', '/blocks', data)
  }

  async updateBlock(id: string, data: {
    name?: string
    template?: string
    fields?: unknown[]
    description?: string
    thumbnailType?: string
  }): Promise<ApiBlock> {
    return this.request('PATCH', `/blocks/${id}`, data)
  }

  async deleteBlock(id: string): Promise<{ message: string }> {
    return this.request('DELETE', `/blocks/${id}`)
  }

  // ─── Partials ───

  async getPartials(siteId: string): Promise<{ partials: ApiPartial[]; templateObject: Record<string, string> }> {
    return this.request('GET', `/partials/site/${siteId}`)
  }

  async createPartial(data: {
    name: string
    site_id: string
    template?: string
  }): Promise<ApiPartial> {
    return this.request('POST', '/partials', data)
  }

  async updatePartial(id: string, data: {
    name?: string
    template?: string
  }): Promise<ApiPartial> {
    return this.request('PATCH', `/partials/${id}`, data)
  }

  async deletePartial(id: string): Promise<{ message: string }> {
    return this.request('DELETE', `/partials/${id}`)
  }
}
