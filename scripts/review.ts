/**
 * Block Review CLI
 *
 * Quick review interface for factory-produced blocks.
 * Shows the screenshot, asks y/n, records the verdict.
 *
 * Usage:
 *   npx tsx scripts/review.ts                    # Review all pending
 *   npx tsx scripts/review.ts --block=hero-centered-01  # Review specific block
 */

import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createInterface } from 'node:readline'
import { execSync } from 'node:child_process'
import chalk from 'chalk'

const QUEUE_PATH = join(process.cwd(), 'factory', 'queue.json')
const REVIEWS_DIR = join(process.cwd(), 'factory', 'reviews')

interface QueueBlock {
  id: string
  category: string
  brief: string
  status: string
  priority: number
  blockName?: string
  iterations?: number
  lastRender?: string
}

interface Queue {
  version: number
  blocks: QueueBlock[]
}

interface Review {
  blockId: string
  verdict: 'approved' | 'rejected'
  note: string
  timestamp: string
  screenshot: string
}

async function loadQueue(): Promise<Queue> {
  return JSON.parse(await readFile(QUEUE_PATH, 'utf-8'))
}

async function saveQueue(queue: Queue): Promise<void> {
  await writeFile(QUEUE_PATH, JSON.stringify(queue, null, 2) + '\n')
}

function prompt(rl: ReturnType<typeof createInterface>, question: string): Promise<string> {
  return new Promise(resolve => rl.question(question, resolve))
}

async function reviewBlock(block: QueueBlock, rl: ReturnType<typeof createInterface>): Promise<Review | null> {
  console.log(chalk.bold(`\n${'─'.repeat(60)}`))
  console.log(chalk.bold.cyan(`Block: ${block.id}`))
  console.log(chalk.dim(`Category: ${block.category}`))
  console.log(chalk.dim(`Brief: ${block.brief}`))

  if (block.lastRender) {
    console.log(chalk.dim(`Render: ${block.lastRender}`))
    // Open the screenshot in the default viewer
    try {
      execSync(`open "${block.lastRender}"`, { stdio: 'ignore' })
    } catch {
      console.log(chalk.yellow(`  Could not open screenshot automatically`))
    }
  } else {
    console.log(chalk.yellow(`  No screenshot available`))
  }

  console.log()
  const answer = await prompt(rl, chalk.bold('  Approve? [y/n/s(kip)/q(uit)] '))
  const key = answer.trim().toLowerCase()

  if (key === 'q') return null
  if (key === 's') {
    console.log(chalk.dim('  Skipped'))
    return { blockId: block.id, verdict: 'rejected', note: 'skipped', timestamp: new Date().toISOString(), screenshot: block.lastRender || '' }
  }

  const verdict: 'approved' | 'rejected' = key === 'y' ? 'approved' : 'rejected'
  let note = ''

  if (verdict === 'rejected') {
    note = await prompt(rl, chalk.dim('  Note (what to fix): '))
  } else {
    note = await prompt(rl, chalk.dim('  Note (optional): '))
  }

  const review: Review = {
    blockId: block.id,
    verdict,
    note: note.trim(),
    timestamp: new Date().toISOString(),
    screenshot: block.lastRender || ''
  }

  console.log(verdict === 'approved'
    ? chalk.green(`  ✓ Approved`)
    : chalk.red(`  ✗ Rejected${note ? `: ${note}` : ''}`))

  return review
}

async function main() {
  const args = process.argv.slice(2)
  let filterBlock = ''
  for (const arg of args) {
    if (arg.startsWith('--block=')) filterBlock = arg.slice(8)
  }

  const queue = await loadQueue()
  const pending = queue.blocks.filter(b => {
    if (filterBlock) return b.id === filterBlock
    return b.status === 'ready_for_review'
  })

  if (pending.length === 0) {
    console.log(chalk.dim('\nNo blocks pending review.'))
    console.log(chalk.dim(`Queue: ${queue.blocks.filter(b => b.status === 'queued').length} queued, ${queue.blocks.filter(b => b.status === 'in_progress').length} in progress, ${queue.blocks.filter(b => b.status === 'approved').length} approved`))
    return
  }

  console.log(chalk.bold(`\nBlock Review — ${pending.length} pending`))

  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const reviews: Review[] = []

  try {
    for (const block of pending) {
      const review = await reviewBlock(block, rl)
      if (review === null) break // quit

      reviews.push(review)

      // Update queue status
      const qBlock = queue.blocks.find(b => b.id === block.id)
      if (qBlock) {
        qBlock.status = review.verdict
      }
    }
  } finally {
    rl.close()
  }

  // Save updated queue
  await saveQueue(queue)

  // Save review log
  if (reviews.length > 0) {
    const logPath = join(REVIEWS_DIR, `${new Date().toISOString().slice(0, 10)}.jsonl`)
    const lines = reviews.map(r => JSON.stringify(r)).join('\n') + '\n'
    try {
      const existing = await readFile(logPath, 'utf-8')
      await writeFile(logPath, existing + lines)
    } catch {
      await writeFile(logPath, lines)
    }
    console.log(chalk.dim(`\nSaved ${reviews.length} reviews to ${logPath}`))
  }

  // Summary
  const approved = reviews.filter(r => r.verdict === 'approved').length
  const rejected = reviews.filter(r => r.verdict === 'rejected').length
  console.log(chalk.bold(`\nSession: ${approved} approved, ${rejected} rejected`))
}

main().catch(err => {
  console.error(chalk.red(err.message || err))
  process.exit(1)
})
