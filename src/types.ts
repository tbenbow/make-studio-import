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

// Site configuration (sites/<name>/site.json)
export interface SiteConfig {
  siteId: string
  theme: string
  name: string
}

// Catalog types
export interface CatalogFieldOption {
  key: string
  value: string
}

export interface CatalogField {
  name: string
  type: string
  default?: unknown
  options?: CatalogFieldOption[]  // For select fields
  itemFields?: CatalogField[]      // For items fields
}

export interface CatalogBlock {
  name: string
  description: string
  category: string
  fields: CatalogField[]
}

export interface BlockCatalog {
  theme: string
  generatedAt: string
  blocks: CatalogBlock[]
}

// Page interchange types
export interface PageBlockContent {
  [fieldName: string]: unknown
}

export interface PageBlock {
  block: string
  content: PageBlockContent
}

export interface PageSettings {
  title: string
  description?: string
}

export interface PageInterchange {
  name: string
  settings: PageSettings
  blocks: PageBlock[]
}

// Import result types
export interface ImportPageResult {
  success: boolean
  pageId?: string
  pageName: string
  blocksImported: number
  errors: string[]
}

// Page validation types
export interface PageValidationResult {
  valid: boolean
  errors: { block: string; field: string; message: string }[]
  warnings: { block: string; field: string; message: string }[]
}
