import mongoose from 'mongoose'
import { v4 as uuid } from 'uuid'
import { connectTo } from './db.js'

const { ObjectId } = mongoose.Types

export interface PushSiteResult {
  success: boolean
  newSiteId?: string
  copied: {
    blocks: number
    partials: number
    folders: number
    layouts: number
    pages: number
    postTypes: number
  }
  errors: string[]
}

export interface PushSiteOptions {
  owner?: string
}

function remapBlockInstances(
  blocks: any[],
  blockIdMap: Map<string, string>
): any[] {
  return (blocks || []).map((instance: any) => ({
    ...instance,
    id: uuid(),
    blockId: blockIdMap.get(instance.blockId?.toString()) ?? instance.blockId,
  }))
}

async function buildOwnerUsers(owner: string | undefined, db: any): Promise<any[]> {
  if (!owner) return []
  const user = await db.collection('users').findOne({ clerkId: owner })
  return [{ userId: owner, authLevel: 0, name: user?.name || owner }]
}

export async function pushSite(
  sourceSiteId: string,
  sourceMongoUri: string,
  targetMongoUri: string,
  options: PushSiteOptions = {}
): Promise<PushSiteResult> {
  const result: PushSiteResult = {
    success: false,
    copied: {
      blocks: 0,
      partials: 0,
      folders: 0,
      layouts: 0,
      pages: 0,
      postTypes: 0,
    },
    errors: [],
  }

  const source = await connectTo(sourceMongoUri)
  const target = await connectTo(targetMongoUri)

  try {
    // 1. Read & verify source site exists
    const sourceSite = await source.db.collection('sites').findOne({
      _id: new ObjectId(sourceSiteId),
    })
    if (!sourceSite) {
      result.errors.push(`Source site ${sourceSiteId} not found`)
      return result
    }

    // 2. Create new site _id
    const newSiteId = new ObjectId()
    const newSiteIdStr = newSiteId.toHexString()
    result.newSiteId = newSiteIdStr

    // site_id type helpers: blocks/partials/posttypes use String, pages/layouts/folders use ObjectId
    const sourceSiteIdObj = new ObjectId(sourceSiteId)

    // 3. Insert blocks → populate blockIdMap (site_id is String)
    const blockIdMap = new Map<string, string>()
    const sourceBlocks = await source.db
      .collection('blocks')
      .find({ site_id: sourceSiteId })
      .toArray()

    for (const block of sourceBlocks) {
      const oldId = block._id.toHexString()
      const newId = new ObjectId()
      blockIdMap.set(oldId, newId.toHexString())

      const doc = { ...block, _id: newId, site_id: newSiteIdStr }
      await target.db.collection('blocks').insertOne(doc)
      result.copied.blocks++
    }

    // 4. Insert partials → populate partialIdMap (site_id is String)
    const partialIdMap = new Map<string, string>()
    const sourcePartials = await source.db
      .collection('partials')
      .find({ site_id: sourceSiteId })
      .toArray()

    for (const partial of sourcePartials) {
      const oldId = partial._id.toHexString()
      const newId = new ObjectId()
      partialIdMap.set(oldId, newId.toHexString())

      const doc = { ...partial, _id: newId, site_id: newSiteIdStr }
      await target.db.collection('partials').insertOne(doc)
      result.copied.partials++
    }

    // 5. Insert folders → populate folderIdMap (site_id is ObjectId, self-referencing parentId)
    const folderIdMap = new Map<string, string>()
    const sourceFolders = await source.db
      .collection('folders')
      .find({ site_id: sourceSiteIdObj })
      .toArray()

    for (const folder of sourceFolders) {
      const oldId = folder._id.toHexString()
      const newId = new ObjectId()
      folderIdMap.set(oldId, newId.toHexString())
    }

    for (const folder of sourceFolders) {
      const oldId = folder._id.toHexString()
      const newId = new ObjectId(folderIdMap.get(oldId)!)
      const doc: any = { ...folder, _id: newId, site_id: newSiteId }

      // Remap parentId if it references another folder
      if (doc.parentId) {
        const mappedParent = folderIdMap.get(doc.parentId.toHexString())
        if (mappedParent) {
          doc.parentId = new ObjectId(mappedParent)
        }
      }

      await target.db.collection('folders').insertOne(doc)
      result.copied.folders++
    }

    // 6. Insert layouts → populate layoutIdMap (site_id is ObjectId, remaps blockId refs)
    const layoutIdMap = new Map<string, string>()
    const sourceLayouts = await source.db
      .collection('layouts')
      .find({ site_id: sourceSiteIdObj })
      .toArray()

    for (const layout of sourceLayouts) {
      const oldId = layout._id.toHexString()
      const newId = new ObjectId()
      layoutIdMap.set(oldId, newId.toHexString())

      const doc: any = { ...layout, _id: newId, site_id: newSiteId }

      // Remap blockId refs in headerBlocks and footerBlocks
      if (doc.headerBlocks) {
        doc.headerBlocks = remapBlockInstances(doc.headerBlocks, blockIdMap)
      }
      if (doc.footerBlocks) {
        doc.footerBlocks = remapBlockInstances(doc.footerBlocks, blockIdMap)
      }

      await target.db.collection('layouts').insertOne(doc)
      result.copied.layouts++
    }

    // 7. Insert pages → populate pageIdMap (site_id is ObjectId, remaps blockId, layoutId, parentId)
    const pageIdMap = new Map<string, string>()
    const sourcePages = await source.db
      .collection('pages')
      .find({ site_id: sourceSiteIdObj })
      .toArray()

    for (const page of sourcePages) {
      const oldId = page._id.toHexString()
      const newId = new ObjectId()
      pageIdMap.set(oldId, newId.toHexString())

      const doc: any = { ...page, _id: newId, site_id: newSiteId }

      // Remap blocks array
      if (doc.blocks) {
        doc.blocks = remapBlockInstances(doc.blocks, blockIdMap)
      }

      // Remap settings.layoutId
      if (doc.settings?.layoutId) {
        const mappedLayout = layoutIdMap.get(doc.settings.layoutId.toString())
        if (mappedLayout) {
          doc.settings = { ...doc.settings, layoutId: new ObjectId(mappedLayout) }
        }
      }

      // Remap parentId (folder ref)
      if (doc.parentId) {
        const mappedFolder = folderIdMap.get(doc.parentId.toHexString())
        if (mappedFolder) {
          doc.parentId = new ObjectId(mappedFolder)
        }
      }

      await target.db.collection('pages').insertOne(doc)
      result.copied.pages++
    }

    // 8. Insert postTypes → populate postTypeIdMap (site_id is String, remaps page refs)
    const postTypeIdMap = new Map<string, string>()
    const sourcePostTypes = await source.db
      .collection('posttypes')
      .find({ site_id: sourceSiteId })
      .toArray()

    for (const postType of sourcePostTypes) {
      const oldId = postType._id.toHexString()
      const newId = new ObjectId()
      postTypeIdMap.set(oldId, newId.toHexString())

      const doc: any = { ...postType, _id: newId, site_id: newSiteIdStr }

      // Remap detailPageId
      if (doc.detailPageId) {
        const mapped = pageIdMap.get(doc.detailPageId.toString())
        if (mapped) doc.detailPageId = new ObjectId(mapped)
      }

      // Remap indexPageId
      if (doc.indexPageId) {
        const mapped = pageIdMap.get(doc.indexPageId.toString())
        if (mapped) doc.indexPageId = new ObjectId(mapped)
      }

      // Remap postIds[]
      if (doc.postIds && Array.isArray(doc.postIds)) {
        doc.postIds = doc.postIds.map((pid: any) => {
          const mapped = pageIdMap.get(pid.toString())
          return mapped ? new ObjectId(mapped) : pid
        })
      }

      await target.db.collection('posttypes').insertOne(doc)
      result.copied.postTypes++
    }

    // 9. Update pages with remapped postTypeId (circular dependency resolved via post-insert update)
    for (const page of sourcePages) {
      if (page.postTypeId) {
        const mappedPostType = postTypeIdMap.get(page.postTypeId.toString())
        if (mappedPostType) {
          const newPageId = pageIdMap.get(page._id.toHexString())
          if (newPageId) {
            await target.db.collection('pages').updateOne(
              { _id: new ObjectId(newPageId) },
              { $set: { postTypeId: new ObjectId(mappedPostType) } }
            )
          }
        }
      }
    }

    // 10. Insert site document
    const newSiteDoc: any = {
      ...sourceSite,
      _id: newSiteId,
      ownerId: options.owner || sourceSite.ownerId,
      users: await buildOwnerUsers(options.owner, target.db),
      customDomain: null,
      staticSite: {
        enabled: false, r2Path: null, domain: null, customDomain: null,
        lastDeployed: null, deploymentStatus: 'not_deployed', previewDomain: null,
        lastPreviewed: null, lastDeploySnapshot: null,
      },
    }

    // Remap abbreviated arrays on the site document
    if (newSiteDoc.blocks) {
      newSiteDoc.blocks = newSiteDoc.blocks.map((entry: any) => {
        const mapped = blockIdMap.get(entry._id?.toHexString?.() ?? entry._id?.toString())
        return mapped ? { ...entry, _id: new ObjectId(mapped) } : entry
      })
    }
    if (newSiteDoc.partials) {
      newSiteDoc.partials = newSiteDoc.partials.map((entry: any) => {
        const mapped = partialIdMap.get(entry._id?.toHexString?.() ?? entry._id?.toString())
        return mapped ? { ...entry, _id: new ObjectId(mapped) } : entry
      })
    }
    if (newSiteDoc.pages) {
      newSiteDoc.pages = newSiteDoc.pages.map((entry: any) => {
        const mapped = pageIdMap.get(entry._id?.toHexString?.() ?? entry._id?.toString())
        return mapped ? { ...entry, _id: new ObjectId(mapped) } : entry
      })
    }
    if (newSiteDoc.layouts) {
      newSiteDoc.layouts = newSiteDoc.layouts.map((entry: any) => {
        const mapped = layoutIdMap.get(entry._id?.toHexString?.() ?? entry._id?.toString())
        return mapped ? { ...entry, _id: new ObjectId(mapped) } : entry
      })
    }
    if (newSiteDoc.folders) {
      newSiteDoc.folders = newSiteDoc.folders.map((entry: any) => {
        const mapped = folderIdMap.get(entry._id?.toHexString?.() ?? entry._id?.toString())
        return mapped ? { ...entry, _id: new ObjectId(mapped) } : entry
      })
    }
    if (newSiteDoc.postTypes) {
      newSiteDoc.postTypes = newSiteDoc.postTypes.map((entry: any) => {
        const mapped = postTypeIdMap.get(entry._id?.toHexString?.() ?? entry._id?.toString())
        return mapped ? { ...entry, _id: new ObjectId(mapped) } : entry
      })
    }

    await target.db.collection('sites').insertOne(newSiteDoc)

    // Add site to owner's user record (the users collection controls site visibility)
    if (options.owner) {
      await target.db.collection('users').updateOne(
        { clerkId: options.owner },
        { $push: { sites: { authLevel: 0, id: newSiteIdStr } } as any }
      )
    }

    result.success = true
  } finally {
    await source.connection.close()
    await target.connection.close()
  }

  return result
}
