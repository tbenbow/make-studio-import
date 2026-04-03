/**
 * Upload local files to R2 and return public URLs.
 * Usage: npx tsx scripts/upload-to-r2.ts --files=path1.png,path2.png [--prefix=sections]
 */
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
dotenv.config({ path: path.resolve(import.meta.dirname, '..', '.env') })

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { parseArgs } from '../src/utils/args.js'

const args = parseArgs(process.argv.slice(2))
const files = (args.files as string)?.split(',') || []
const prefix = (args.prefix as string) || ''

if (files.length === 0) {
  console.log('Usage: npx tsx scripts/upload-to-r2.ts --files=path1.png,path2.png [--prefix=sections]')
  process.exit(1)
}

const siteId = process.env.MAKE_STUDIO_SITE!
const r2Domain = process.env.R2_DOMAIN || 'makestudio.site'

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY!,
    secretAccessKey: process.env.R2_SECRET_KEY!,
  },
})

async function main() {
  const results: Record<string, string> = {}

  for (const filePath of files) {
    const buffer = fs.readFileSync(filePath)
    const ext = path.extname(filePath).slice(1)
    const basename = path.basename(filePath, `.${ext}`)
    const key = prefix ? `${siteId}/${prefix}/${basename}.${ext}` : `${siteId}/${basename}.${ext}`
    const contentType = ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/webp'

    await s3.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET || 'make-studio',
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }))

    const url = `https://${r2Domain}/${key}`
    results[basename] = url
    console.log(`  ✓ ${basename} → ${url}`)
  }

  console.log('\n' + JSON.stringify(results, null, 2))
}

main().catch(console.error)
