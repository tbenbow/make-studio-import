import fs from 'fs'
import path from 'path'
import {
  type CommandContext,
  output, requireApiConfig, MakeStudioClient
} from './context.js'

export async function mediaCommand(ctx: CommandContext): Promise<void> {
  const { args, rootDir } = ctx

  const subcommand = args._sub || 'list'
  const apiConfig = requireApiConfig(rootDir, args.env)
  const siteId = args.site || apiConfig.siteId
  const client = new MakeStudioClient(apiConfig.baseUrl, apiConfig.token)

  switch (subcommand) {
    case 'list': {
      const files = await client.listFiles(siteId)
      console.log(`${files.length} files:`)
      for (const file of files) {
        const sizeKb = Math.round(file.size / 1024)
        console.log(`  ${file.name} (${sizeKb}KB) ${file.mimeType}`)
        console.log(`    ${file.fullPath}`)
      }
      output({ count: files.length, files: files.map(f => ({ name: f.name, size: f.size, mimeType: f.mimeType, path: f.fullPath })) })
      break
    }

    case 'upload': {
      const filePath = args.file
      if (!filePath) {
        output({ error: '--file is required for media upload' })
        process.exit(1)
      }
      const absPath = path.resolve(filePath)
      if (!fs.existsSync(absPath)) {
        output({ error: `File not found: ${absPath}` })
        process.exit(1)
      }
      const buffer = fs.readFileSync(absPath)
      const filename = path.basename(absPath)
      const ext = path.extname(absPath).toLowerCase()
      const mimeTypes: Record<string, string> = {
        '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
        '.png': 'image/png', '.gif': 'image/gif',
        '.webp': 'image/webp', '.svg': 'image/svg+xml',
        '.pdf': 'application/pdf'
      }
      const contentType = mimeTypes[ext] || 'application/octet-stream'

      console.log(`Uploading ${filename} (${Math.round(buffer.length / 1024)}KB)...`)
      const result = await client.uploadFile(siteId, buffer, filename, contentType)
      console.log(`Uploaded: ${result.url}`)
      output({ success: true, ...result })
      break
    }

    case 'delete': {
      const fileId = args.id
      if (!fileId) {
        output({ error: '--id is required for media delete' })
        process.exit(1)
      }
      // Note: Delete endpoint not yet in API client — this is a placeholder
      output({ error: 'Media delete not yet implemented in the API client' })
      process.exit(1)
      break
    }

    case 'unused': {
      const themeName = args.theme
      if (!themeName) {
        output({ error: '--theme is required for media unused' })
        process.exit(1)
      }
      const themePath = path.join(rootDir, 'themes', themeName)
      const blocksDir = path.join(themePath, 'converted', 'blocks')

      // Get all files
      const files = await client.listFiles(siteId)

      // Scan all block templates for references
      const allTemplateContent: string[] = []
      if (fs.existsSync(blocksDir)) {
        for (const file of fs.readdirSync(blocksDir).filter(f => f.endsWith('.html'))) {
          allTemplateContent.push(fs.readFileSync(path.join(blocksDir, file), 'utf-8'))
        }
      }
      const allContent = allTemplateContent.join('\n')

      const unused = files.filter(f => !allContent.includes(f.fullPath) && !allContent.includes(f.name))
      console.log(`${unused.length} potentially unused files out of ${files.length}:`)
      for (const f of unused) {
        console.log(`  ${f.name} (${Math.round(f.size / 1024)}KB)`)
      }
      output({ total: files.length, unused: unused.length, files: unused.map(f => f.name) })
      break
    }

    default:
      output({ error: `Unknown media subcommand: ${subcommand}. Use: list, upload, delete, unused` })
      process.exit(1)
  }
}
