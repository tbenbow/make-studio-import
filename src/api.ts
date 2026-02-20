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

export interface ApiLayout {
  _id: string
  name: string
  site_id?: string
  description?: string
  headerBlocks?: unknown[]
  footerBlocks?: unknown[]
  settings?: Record<string, unknown>
  isDefault?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface ApiPostType {
  _id: string
  name: string
  site_id?: string
  detailPageId?: string
  indexPageId?: string
  postIds?: string[]
  createdAt?: string
  updatedAt?: string
}

export interface ApiActivityLogEntry {
  _id: string
  siteId: string
  action: string
  entityType: string
  entityId?: string
  entityName?: string
  createdAt: string
}

export interface ApiSnapshot {
  _id: string
  siteId: string
  label: string
  createdBy?: { userId: string; name: string }
  sizeBytes?: number
  createdAt: string
}

export interface ApiDeploymentRequest {
  _id: string
  siteId: string
  title: string
  description?: string
  status: string
  selectedPageIds?: string[]
  createdAt?: string
  updatedAt?: string
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

  // ─── Pages ───

  async getPages(siteId: string): Promise<any[]> {
    return this.request('GET', `/pages?site_id=${siteId}`)
  }

  async getPage(id: string): Promise<any> {
    return this.request('GET', `/pages/${id}`)
  }

  async createPage(data: {
    name: string
    site_id: string
    settings?: Record<string, unknown>
    parentId?: string
    postTypeId?: string
  }): Promise<any> {
    return this.request('POST', '/pages', data)
  }

  async updatePage(id: string, data: Record<string, unknown>): Promise<any> {
    return this.request('PATCH', `/pages/${id}`, data)
  }

  async deletePage(id: string): Promise<{ message: string }> {
    return this.request('DELETE', `/pages/${id}`)
  }

  async setPageContent(id: string, content: Record<string, Record<string, unknown>>): Promise<any> {
    return this.request('PATCH', `/pages/${id}/set-content`, content)
  }

  // ─── Layouts ───

  async getLayouts(siteId: string): Promise<ApiLayout[]> {
    return this.request('GET', `/layouts?site_id=${siteId}`)
  }

  async getLayout(id: string): Promise<ApiLayout> {
    return this.request('GET', `/layouts/${id}`)
  }

  async createLayout(data: {
    name: string
    site_id: string
    description?: string
    headerBlocks?: unknown[]
    footerBlocks?: unknown[]
    settings?: Record<string, unknown>
    isDefault?: boolean
  }): Promise<ApiLayout> {
    return this.request('POST', '/layouts', data)
  }

  async updateLayout(id: string, data: {
    name?: string
    description?: string
    headerBlocks?: unknown[]
    footerBlocks?: unknown[]
    settings?: Record<string, unknown>
    isDefault?: boolean
  }): Promise<ApiLayout> {
    return this.request('PATCH', `/layouts/${id}`, data)
  }

  async deleteLayout(id: string): Promise<void> {
    await this.request('DELETE', `/layouts/${id}`)
  }

  // ─── Post Types ───

  async getPostTypes(siteId: string): Promise<ApiPostType[]> {
    return this.request('GET', `/postTypes?site_id=${siteId}`)
  }

  async createPostType(data: {
    name: string
    site_id: string
  }): Promise<ApiPostType> {
    return this.request('POST', '/postTypes', data)
  }

  async updatePostType(id: string, data: Record<string, unknown>): Promise<ApiPostType> {
    return this.request('PATCH', `/postTypes/${id}`, data)
  }

  async deletePostType(id: string): Promise<{ message: string }> {
    return this.request('DELETE', `/postTypes/${id}`)
  }

  // ─── Activity Log ───

  async getActivityLog(siteId: string, opts?: {
    limit?: number
    entityType?: string
    action?: string
    since?: string
  }): Promise<ApiActivityLogEntry[]> {
    const params = new URLSearchParams({ site_id: siteId })
    if (opts?.limit) params.set('limit', String(opts.limit))
    if (opts?.entityType) params.set('entityType', opts.entityType)
    if (opts?.action) params.set('action', opts.action)
    if (opts?.since) params.set('since', opts.since)
    return this.request('GET', `/activity-log?${params}`)
  }

  // ─── Snapshots (server-side) ───

  async listSnapshots(siteId: string): Promise<ApiSnapshot[]> {
    return this.request('GET', `/snapshots?site_id=${siteId}`)
  }

  async createSnapshot(siteId: string, label?: string): Promise<ApiSnapshot> {
    return this.request('POST', '/snapshots', { siteId, label })
  }

  async restoreSnapshot(id: string): Promise<{ success: boolean; message: string }> {
    return this.request('POST', `/snapshots/${id}/restore`)
  }

  // ─── Deployment ───

  async deployPreview(siteId: string): Promise<{ success: boolean; message: string; previewUrl: string }> {
    return this.request('POST', `/static-site/preview/${siteId}`)
  }

  async getPreviewStatus(siteId: string): Promise<{
    success: boolean
    isStale: boolean
    lastPreviewed: string | null
    previewUrl: string | null
  }> {
    return this.request('GET', `/static-site/preview-status/${siteId}`)
  }

  // ─── Deployment Requests ───

  async detectChanges(siteId: string): Promise<unknown> {
    return this.request('GET', `/deployment-requests/changes/${siteId}`)
  }

  async createDeploymentRequest(data: {
    siteId: string
    title: string
    description?: string
    selectedPageIds?: string[]
  }): Promise<ApiDeploymentRequest> {
    return this.request('POST', '/deployment-requests', data)
  }

  async listDeploymentRequests(siteId: string): Promise<ApiDeploymentRequest[]> {
    return this.request('GET', `/deployment-requests?site_id=${siteId}`)
  }

  // ─── Batch Operations ───

  async batchSync(siteId: string, operations: {
    blocks?: Array<{ action: 'create' | 'update' | 'delete'; id?: string; data?: Record<string, unknown> }>
    partials?: Array<{ action: 'create' | 'update' | 'delete'; id?: string; data?: Record<string, unknown> }>
    theme?: Record<string, unknown>
  }): Promise<{ snapshot: ApiSnapshot; results: { blocks: number; partials: number; theme: boolean } }> {
    // Create snapshot before batch changes
    const snapshot = await this.createSnapshot(siteId, `pre-batch-${new Date().toISOString()}`)

    let blockCount = 0
    let partialCount = 0
    let themeUpdated = false

    // Apply theme first
    if (operations.theme) {
      await this.updateSiteTheme(siteId, operations.theme)
      themeUpdated = true
    }

    // Apply block operations
    if (operations.blocks) {
      for (const op of operations.blocks) {
        switch (op.action) {
          case 'create':
            await this.createBlock({ site_id: siteId, name: '', ...op.data } as any)
            break
          case 'update':
            if (op.id) await this.updateBlock(op.id, op.data || {})
            break
          case 'delete':
            if (op.id) await this.deleteBlock(op.id)
            break
        }
        blockCount++
      }
    }

    // Apply partial operations
    if (operations.partials) {
      for (const op of operations.partials) {
        switch (op.action) {
          case 'create':
            await this.createPartial({ site_id: siteId, name: '', ...op.data } as any)
            break
          case 'update':
            if (op.id) await this.updatePartial(op.id, op.data || {})
            break
          case 'delete':
            if (op.id) await this.deletePartial(op.id)
            break
        }
        partialCount++
      }
    }

    return { snapshot, results: { blocks: blockCount, partials: partialCount, theme: themeUpdated } }
  }

  // ─── Files (requires server auth update — see docs/review/pending.md) ───

  async generateUploadUrl(siteId: string, opts: {
    filename: string
    contentType: string
  }): Promise<{ uploadUrl: string; key: string }> {
    return this.request('POST', '/files/upload-url', { siteId, ...opts })
  }

  async registerFile(siteId: string, opts: {
    key: string
    filename: string
    contentType: string
    size: number
  }): Promise<{ _id: string; url: string }> {
    return this.request('POST', '/files/register', { siteId, ...opts })
  }

  async listFiles(siteId: string): Promise<Array<{ _id: string; filename: string; url: string; contentType: string }>> {
    return this.request('GET', `/files?site_id=${siteId}`)
  }
}
