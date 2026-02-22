export interface SourceField {
  type: string
  name: string
  default?: unknown  // Default value for the field
  config?: {
    fields?: SourceField[]
    [key: string]: unknown
  }
}

export interface DbField {
  id: string
  type: string
  name: string
  value: unknown
  config: Record<string, unknown>
}

export interface ComponentData {
  name: string
  template: string
  fields: DbField[]
}

export interface Manifest {
  siteId: string
  lastImport: string
  components: {
    blocks: Record<string, { status: string; id: string; updatedAt: string }>
    partials: Record<string, { status: string; id: string; updatedAt: string }>
  }
}

export interface ImportResult {
  success: boolean
  created: { blocks: string[]; partials: string[] }
  updated: { blocks: string[]; partials: string[] }
  skipped: { blocks: string[]; partials: string[] }
  errors: { component: string; type: string; error: string }[]
}

export interface ValidationResult {
  valid: boolean
  components: { blocks: number; partials: number }
  errors: { file: string; message: string }[]
  warnings: { file: string; message: string }[]
}

export interface ApiPage {
  _id: string
  name: string
  site_id: string
  blocks?: Array<{ id: string; blockId: string; name: string }>
  settings?: {
    slug?: string
    layoutId?: string
    [key: string]: unknown
  }
  parentId?: string
  postTypeId?: string
  createdAt?: string
  updatedAt?: string
}

export interface UploadedFile {
  _id: string
  url: string
  filename: string
  contentType: string
  size: number
}

export interface CreateSiteResponse {
  _id: string
  name: string
  theme: Record<string, unknown>
  blocks: Array<{ _id: string; name: string }>
  partials: Array<{ _id: string; name: string }>
  pages: Array<{ _id: string; name: string }>
  layouts: Array<{ _id: string; name: string }>
  apiToken?: string
}

