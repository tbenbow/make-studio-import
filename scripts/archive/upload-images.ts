/**
 * Upload images to R2 and register in mediafiles collection.
 *
 * For each image in the manifest:
 * 1. Convert to webp
 * 2. Resize to fit within 2000x2000 (preserving aspect ratio)
 * 3. Upload to R2 at {siteId}/{filename}.webp
 * 4. Create a mediafiles document with resolution, size, etc.
 * 5. Update the manifest with the new fullPath URL
 */

import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import mongoose from 'mongoose'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const siteId = '69952211cb6e382590893367'
const manifestPath = 'themes/okgosandbox/source/images/manifest.json'

const R2_ENDPOINT = 'https://cdb9394087febcf07876a341a9ffe487.r2.cloudflarestorage.com'
const R2_ACCESS_KEY = 'a05f0d716005045a51d010e738cadae3'
const R2_SECRET_KEY = 'cb62bed26032b39796e0212232450991dd352a718e1260e7b62d58a479710b55'
const R2_BUCKET = 'make-studio'
const R2_DOMAIN = 'makestudio.site'

const MAX_DIMENSION = 2000

interface ManifestEntry {
  url: string
  filename: string
  localPath?: string
  skipped?: boolean
  uploaded?: boolean
  newUrl?: string
  uploadedFilename?: string
  references: Array<{
    page: string
    pageSlug: string
    block: string
    fieldId: string
    fieldPath: string
  }>
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY,
    secretAccessKey: R2_SECRET_KEY,
  },
})

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

function toWebpFilename(originalFilename: string): string {
  const base = originalFilename.replace(/\.[^.]+$/, '')
  return sanitizeFilename(base) + '.webp'
}

async function processAndUpload(
  localPath: string,
  originalFilename: string
): Promise<{ webpFilename: string; buffer: Buffer; width: number; height: number }> {
  const input = fs.readFileSync(localPath)
  let pipeline = sharp(input)

  // Get original dimensions
  const metadata = await pipeline.metadata()
  const origWidth = metadata.width || 0
  const origHeight = metadata.height || 0

  // Resize if exceeds max dimension (preserve aspect ratio)
  if (origWidth > MAX_DIMENSION || origHeight > MAX_DIMENSION) {
    pipeline = pipeline.resize(MAX_DIMENSION, MAX_DIMENSION, {
      fit: 'inside',
      withoutEnlargement: true,
    })
  }

  // Convert to webp
  const buffer = await pipeline.webp({ quality: 80 }).toBuffer()
  const resizedMeta = await sharp(buffer).metadata()

  const webpFilename = toWebpFilename(originalFilename)

  return {
    webpFilename,
    buffer,
    width: resizedMeta.width || origWidth,
    height: resizedMeta.height || origHeight,
  }
}

async function uploadToR2(fileKey: string, buffer: Buffer): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: fileKey,
      Body: buffer,
      ContentType: 'image/webp',
    })
  )
}

async function registerMediaFile(
  db: mongoose.mongo.Db,
  webpFilename: string,
  fileKey: string,
  fullPath: string,
  size: number,
  width: number,
  height: number
): Promise<void> {
  const existing = await db.collection('mediafiles').findOne({ fileKey })
  if (existing) {
    console.log(`    already registered in DB, skipping`)
    return
  }

  await db.collection('mediafiles').insertOne({
    site_id: siteId,
    fileKey,
    fileName: webpFilename,
    fullPath,
    mimeType: 'image/webp',
    size,
    tags: [],
    resolution: { width, height },
    fileType: 'image',
    uploadedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    __v: 0,
  })
}

async function main() {
  await mongoose.connect('mongodb://localhost:27017/webstir')
  const db = mongoose.connection.db
  if (db == null) throw new Error('No db')

  const manifest: ManifestEntry[] = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))

  const toProcess = manifest.filter(e => e.localPath && !e.skipped)
  console.log(`Processing ${toProcess.length} images\n`)

  let uploaded = 0
  let skipped = 0
  let failed = 0

  for (const entry of toProcess) {
    const localPath = entry.localPath!
    if (!fs.existsSync(localPath)) {
      console.log(`  MISSING: ${localPath}`)
      failed++
      continue
    }

    const originalSize = fs.statSync(localPath).size
    process.stdout.write(`  ${entry.filename}`)

    try {
      const { webpFilename, buffer, width, height } = await processAndUpload(
        localPath,
        entry.filename
      )

      const fileKey = `${siteId}/${webpFilename}`
      const fullPath = `https://${R2_DOMAIN}/${fileKey}`

      process.stdout.write(
        ` → ${webpFilename} (${(originalSize / 1024).toFixed(0)}KB → ${(buffer.length / 1024).toFixed(0)}KB, ${width}x${height})`
      )

      await uploadToR2(fileKey, buffer)
      await registerMediaFile(db, webpFilename, fileKey, fullPath, buffer.length, width, height)

      // Update manifest
      entry.uploaded = true
      entry.newUrl = fullPath
      entry.uploadedFilename = webpFilename

      console.log(` ✓`)
      uploaded++
    } catch (err: any) {
      console.log(` ✗ ${err.message}`)
      failed++
    }
  }

  console.log(`\nDone: ${uploaded} uploaded, ${skipped} skipped, ${failed} failed`)

  // Save updated manifest
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
  console.log(`Manifest updated with new URLs`)

  await mongoose.disconnect()
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
