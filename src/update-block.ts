import fs from 'fs'
import { connect, disconnect } from './db.js'

export interface UpdateBlockResult {
  success: boolean
  error?: string
}

export async function updateBlock(
  blockId: string,
  templatePath: string,
  mongoUri: string
): Promise<UpdateBlockResult> {
  const template = fs.readFileSync(templatePath, 'utf-8')
  const { Block } = await connect(mongoUri)

  const result = await Block.findByIdAndUpdate(
    blockId,
    { template },
    { new: true }
  )

  await disconnect()

  if (!result) {
    return { success: false, error: `Block ${blockId} not found` }
  }

  return { success: true }
}
