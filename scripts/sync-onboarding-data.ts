/**
 * Sync Onboarding Data
 *
 * Syncs recipes, themes, and block library to the make-studio repo
 * as version-controlled JSON. Validates against schemas before writing.
 *
 * Usage:
 *   npx tsx scripts/sync-onboarding-data.ts [--target=../make-studio/server/data/] [--dry-run]
 *
 * Options:
 *   --target   Target directory (default: ../make-studio/server/data/)
 *   --dry-run  Validate only, don't write files
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { resolve, join } from 'path'

// ─── Schema Validation ───

interface ValidationError {
  file: string
  errors: string[]
}

function validateRecipe(id: string, data: Record<string, unknown>): string[] {
  const errors: string[] = []
  if (!data.label || typeof data.label !== 'string') errors.push('missing or invalid "label"')
  if (!data.description || typeof data.description !== 'string') errors.push('missing or invalid "description"')
  if (typeof data.buildPage !== 'boolean') errors.push('missing or invalid "buildPage"')
  if (!Array.isArray(data.slots) || data.slots.length === 0) errors.push('missing or empty "slots"')
  if (!data.extras || typeof data.extras !== 'object') errors.push('missing "extras"')

  // Validate each slot
  const slots = (data.slots || []) as Array<Record<string, unknown>>
  for (const slot of slots) {
    if (!slot.role) errors.push(`slot missing "role"`)
    if (!slot.blockTag) errors.push(`slot "${slot.role}" missing "blockTag"`)
  }

  const extras = (data.extras || {}) as Record<string, Record<string, unknown>>
  for (const [key, slot] of Object.entries(extras)) {
    if (!slot.role) errors.push(`extra "${key}" missing "role"`)
    if (!slot.blockTag) errors.push(`extra "${key}" missing "blockTag"`)
  }

  return errors
}

function validateTheme(data: Record<string, unknown>): string[] {
  const errors: string[] = []
  if (!data.id || typeof data.id !== 'string') errors.push('missing or invalid "id"')
  if (!data.name || typeof data.name !== 'string') errors.push('missing or invalid "name"')
  if (!Array.isArray(data.vibe) || data.vibe.length === 0) errors.push('missing or empty "vibe"')

  const theme = data.theme as Record<string, unknown> | undefined
  if (!theme) {
    errors.push('missing "theme" object')
    return errors
  }

  const required = ['fonts', 'systemColors', 'headingTypography', 'bodyTypography', 'palette', 'prose', 'buttons']
  for (const key of required) {
    if (!theme[key]) errors.push(`theme missing "${key}"`)
  }

  if (theme.systemColors && typeof theme.systemColors === 'object') {
    const colors = theme.systemColors as Record<string, string>
    const requiredColors = ['brand', 'on-brand', 'base', 'base-muted', 'base-alt', 'panel', 'fg', 'fg-muted', 'fg-alt', 'border']
    for (const key of requiredColors) {
      if (!colors[key]) errors.push(`systemColors missing "${key}"`)
    }
  }

  if (theme.headingTypography && typeof theme.headingTypography === 'object') {
    const tiers = Object.keys(theme.headingTypography as object)
    for (const tier of ['heading-xl', 'heading-lg', 'heading-md', 'heading-sm', 'heading-xs']) {
      if (!tiers.includes(tier)) errors.push(`headingTypography missing "${tier}"`)
    }
  }

  if (theme.bodyTypography && typeof theme.bodyTypography === 'object') {
    const tiers = Object.keys(theme.bodyTypography as object)
    for (const tier of ['body-lg', 'body-md', 'body-sm']) {
      if (!tiers.includes(tier)) errors.push(`bodyTypography missing "${tier}"`)
    }
  }

  if (theme.buttons && typeof theme.buttons === 'object') {
    const buttons = theme.buttons as Record<string, unknown>
    if (!buttons.global) errors.push('buttons missing "global"')
    if (!buttons.variants) errors.push('buttons missing "variants"')
  }

  return errors
}

function validateBlockLibrary(data: unknown[]): string[] {
  const errors: string[] = []
  const names = new Set<string>()

  for (const entry of data) {
    const block = entry as Record<string, unknown>
    if (!block.name) {
      errors.push('block entry missing "name"')
      continue
    }
    if (names.has(block.name as string)) {
      errors.push(`duplicate block name: "${block.name}"`)
    }
    names.add(block.name as string)

    if (!block.description) errors.push(`"${block.name}" missing "description"`)
    if (!block.aiDescription) errors.push(`"${block.name}" missing "aiDescription"`)
    if (!Array.isArray(block.tags) || block.tags.length === 0) errors.push(`"${block.name}" missing or empty "tags"`)
  }

  return errors
}

// ─── Cross-Reference Validation ───

function crossValidate(
  recipes: Record<string, Record<string, unknown>>,
  blocks: Array<Record<string, unknown>>
): string[] {
  const errors: string[] = []
  const blockNames = new Set(blocks.map(b => b.name as string))

  for (const [id, recipe] of Object.entries(recipes)) {
    const slots = (recipe.slots || []) as Array<Record<string, unknown>>
    const extras = (recipe.extras || {}) as Record<string, Record<string, unknown>>

    for (const slot of slots) {
      if (slot.blockName && !blockNames.has(slot.blockName as string)) {
        errors.push(`recipe "${id}": slot "${slot.role}" references missing block "${slot.blockName}"`)
      }
    }
    for (const [key, slot] of Object.entries(extras)) {
      if (slot.blockName && !blockNames.has(slot.blockName as string)) {
        errors.push(`recipe "${id}": extra "${key}" references missing block "${slot.blockName}"`)
      }
    }
  }

  return errors
}

// ─── Needs Coverage Validation ───

function validateNeedsCoverage(
  recipes: Record<string, Record<string, unknown>>
): string[] {
  const errors: string[] = []
  const allNeeds = ['gallery', 'contact-form', 'pricing', 'team', 'faq', 'location', 'blog', 'menu', 'hours', 'booking']

  // Only check recipes that build pages (skip empty, about, contact)
  const pageRecipes = Object.entries(recipes).filter(([_, r]) => r.buildPage && Object.keys(r.extras as object).length > 0)

  for (const need of allNeeds) {
    const covered = pageRecipes.some(([_, r]) => {
      const extras = r.extras as Record<string, unknown>
      return extras[need] !== undefined
    })
    if (!covered) {
      errors.push(`need "${need}" has no extra slot in any page-building recipe`)
    }
  }

  return errors
}

// ─── Main ───

async function main() {
  const args = process.argv.slice(2)
  const targetArg = args.find(a => a.startsWith('--target='))
  const dryRun = args.includes('--dry-run')

  const targetDir = targetArg?.split('=')[1] || '../make-studio/server/data/'
  const dataDir = resolve('data')

  console.log(`Source: ${dataDir}`)
  console.log(`Target: ${resolve(targetDir)}`)
  if (dryRun) console.log('(dry run — validation only)')
  console.log()

  const allErrors: ValidationError[] = []

  // Load and validate recipes (single file)
  const recipesPath = join(dataDir, 'recipes.json')
  const recipes = JSON.parse(readFileSync(recipesPath, 'utf-8')) as Record<string, Record<string, unknown>>
  const recipeIds = Object.keys(recipes)

  for (const id of recipeIds) {
    const errors = validateRecipe(id, recipes[id])
    if (errors.length > 0) allErrors.push({ file: `recipes.json → "${id}"`, errors })
  }
  console.log(`Recipes: ${recipeIds.length} (${recipeIds.join(', ')})`)

  // Load and validate themes (single file)
  const themesPath = join(dataDir, 'themeLibrary.json')
  const themes = JSON.parse(readFileSync(themesPath, 'utf-8')) as Array<Record<string, unknown>>

  for (const theme of themes) {
    const errors = validateTheme(theme)
    if (errors.length > 0) allErrors.push({ file: `themeLibrary.json → "${theme.id}"`, errors })
  }
  console.log(`Themes: ${themes.length} (${themes.map(t => t.id).join(', ')})`)

  // Load and validate block library
  const blocksPath = join(dataDir, 'blocks.json')
  const blocks = JSON.parse(readFileSync(blocksPath, 'utf-8')) as unknown[]
  const blockErrors = validateBlockLibrary(blocks)
  if (blockErrors.length > 0) allErrors.push({ file: 'blocks.json', errors: blockErrors })
  console.log(`Blocks: ${blocks.length} entries`)

  // Cross-reference validation
  const crossErrors = crossValidate(recipes, blocks as Array<Record<string, unknown>>)
  if (crossErrors.length > 0) allErrors.push({ file: '(cross-reference)', errors: crossErrors })

  // Needs coverage validation
  const needsErrors = validateNeedsCoverage(recipes)
  if (needsErrors.length > 0) allErrors.push({ file: '(needs coverage)', errors: needsErrors })

  // Report errors
  console.log()
  if (allErrors.length > 0) {
    console.error('Validation errors:')
    for (const { file, errors } of allErrors) {
      console.error(`  ${file}:`)
      for (const e of errors) console.error(`    - ${e}`)
    }
    if (!dryRun) {
      console.error('\nFix validation errors before syncing.')
      process.exit(1)
    }
  } else {
    console.log('All validations passed.')
  }

  if (dryRun) return

  // Check target directory exists
  const resolvedTarget = resolve(targetDir)
  if (!existsSync(resolvedTarget)) {
    console.error(`Target directory does not exist: ${resolvedTarget}`)
    console.error('Is make-studio cloned at the expected location?')
    process.exit(1)
  }

  // Sync recipes.json
  const recipesSrc = readFileSync(recipesPath, 'utf-8')
  writeFileSync(join(resolvedTarget, 'recipes.json'), recipesSrc)
  console.log('Synced recipes.json')

  // Sync themeLibrary.json
  const themesSrc = readFileSync(themesPath, 'utf-8')
  writeFileSync(join(resolvedTarget, 'themeLibrary.json'), themesSrc)
  console.log('Synced themeLibrary.json')

  // Sync block library
  const blocksSrc = readFileSync(blocksPath, 'utf-8')
  writeFileSync(join(resolvedTarget, 'blocks.json'), blocksSrc)
  console.log('Synced blocks.json')

  console.log(`\nDone. Synced to ${resolvedTarget}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
