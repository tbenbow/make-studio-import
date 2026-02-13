import mongoose from 'mongoose'

export function getModels() {
  const siteSchema = new mongoose.Schema({
    partials: [{ _id: mongoose.Schema.Types.Mixed, name: String }],
    blocks: [{ _id: mongoose.Schema.Types.Mixed, name: String }],
    pages: [{ _id: mongoose.Schema.Types.Mixed, name: String }],
    theme: mongoose.Schema.Types.Mixed
  })

  const blockSchema = new mongoose.Schema({
    name: String,
    description: String,
    thumbnailType: String,
    site_id: String,
    template: String,
    fields: [mongoose.Schema.Types.Mixed]
  }, { timestamps: true })

  const partialSchema = new mongoose.Schema({
    name: String,
    site_id: String,
    template: String
  }, { timestamps: true })

  const pageSchema = new mongoose.Schema({
    name: String,
    site_id: String,
    settings: {
      title: String,
      description: String
    },
    blocks: [{
      block_id: mongoose.Schema.Types.Mixed,
      content: mongoose.Schema.Types.Mixed
    }]
  }, { timestamps: true })

  return {
    Site: mongoose.models.Site || mongoose.model('Site', siteSchema),
    Block: mongoose.models.Block || mongoose.model('Block', blockSchema),
    Partial: mongoose.models.Partial || mongoose.model('Partial', partialSchema),
    Page: mongoose.models.Page || mongoose.model('Page', pageSchema)
  }
}

export async function connect(mongoUri: string) {
  await mongoose.connect(mongoUri)
  return getModels()
}

export async function connectTo(mongoUri: string) {
  const connection = mongoose.createConnection(mongoUri)
  await connection.asPromise()
  return { connection, db: connection.db! }
}

export async function disconnect() {
  await mongoose.disconnect()
}
