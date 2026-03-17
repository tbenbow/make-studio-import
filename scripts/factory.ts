/**
 * Block Factory — Queue Manager
 *
 * CLI for managing the block production queue.
 *
 * Usage:
 *   npx tsx scripts/factory.ts status          # Show queue status
 *   npx tsx scripts/factory.ts next             # Show next block to build
 *   npx tsx scripts/factory.ts start <id>       # Mark block as in_progress
 *   npx tsx scripts/factory.ts done <id>        # Mark block as ready_for_review
 *   npx tsx scripts/factory.ts add --brief="..." --category=hero  # Add new block
 */

import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import chalk from 'chalk'

const QUEUE_PATH = join(process.cwd(), 'factory', 'queue.json')

interface QueueBlock {
  id: string
  category: string
  brief: string
  status: string
  priority: number
  blockName?: string
  iterations?: number
  lastRender?: string
  startedAt?: string
  completedAt?: string
  notes?: string
}

interface Queue {
  version: number
  blocks: QueueBlock[]
}

async function loadQueue(): Promise<Queue> {
  return JSON.parse(await readFile(QUEUE_PATH, 'utf-8'))
}

async function saveQueue(queue: Queue): Promise<void> {
  await writeFile(QUEUE_PATH, JSON.stringify(queue, null, 2) + '\n')
}

function parseArgs() {
  const args = process.argv.slice(2)
  const command = args[0] || 'status'
  const positional = args[1] || ''
  const flags: Record<string, string> = {}
  for (const arg of args) {
    const match = arg.match(/^--(\w[\w-]*)=(.+)$/)
    if (match) flags[match[1]] = match[2]
  }
  return { command, positional, flags }
}

async function showStatus(queue: Queue) {
  const statuses = ['queued', 'in_progress', 'ready_for_review', 'approved', 'rejected']
  const counts: Record<string, number> = {}
  for (const s of statuses) counts[s] = 0
  for (const b of queue.blocks) counts[b.status] = (counts[b.status] || 0) + 1

  console.log(chalk.bold('\nBlock Factory Queue'))
  console.log(chalk.dim('─'.repeat(50)))
  console.log(`  ${chalk.yellow('Queued:')}           ${counts.queued}`)
  console.log(`  ${chalk.blue('In Progress:')}      ${counts.in_progress}`)
  console.log(`  ${chalk.magenta('Ready for Review:')} ${counts.ready_for_review}`)
  console.log(`  ${chalk.green('Approved:')}         ${counts.approved}`)
  console.log(`  ${chalk.red('Rejected:')}         ${counts.rejected}`)
  console.log(chalk.dim('─'.repeat(50)))
  console.log(`  Total: ${queue.blocks.length}`)

  // Show in-progress blocks
  const inProgress = queue.blocks.filter(b => b.status === 'in_progress')
  if (inProgress.length > 0) {
    console.log(chalk.bold('\nIn Progress:'))
    for (const b of inProgress) {
      console.log(`  ${chalk.blue(b.id)} — ${b.brief.slice(0, 60)}...`)
    }
  }

  // Show review-ready blocks
  const reviewReady = queue.blocks.filter(b => b.status === 'ready_for_review')
  if (reviewReady.length > 0) {
    console.log(chalk.bold('\nReady for Review:'))
    for (const b of reviewReady) {
      console.log(`  ${chalk.magenta(b.id)} — ${b.brief.slice(0, 60)}...`)
    }
  }
}

async function showNext(queue: Queue) {
  const next = queue.blocks
    .filter(b => b.status === 'queued')
    .sort((a, b) => a.priority - b.priority)[0]

  if (!next) {
    console.log(chalk.dim('\nNo blocks queued.'))
    return
  }

  console.log(chalk.bold(`\nNext block: ${chalk.cyan(next.id)}`))
  console.log(chalk.dim(`Category: ${next.category}`))
  console.log(chalk.dim(`Priority: ${next.priority}`))
  console.log(`\n${next.brief}`)
}

async function startBlock(queue: Queue, id: string) {
  const block = queue.blocks.find(b => b.id === id)
  if (!block) {
    console.error(chalk.red(`Block not found: ${id}`))
    process.exit(1)
  }
  block.status = 'in_progress'
  block.startedAt = new Date().toISOString()
  await saveQueue(queue)
  console.log(chalk.blue(`Started: ${id}`))
}

async function doneBlock(queue: Queue, id: string, flags: Record<string, string>) {
  const block = queue.blocks.find(b => b.id === id)
  if (!block) {
    console.error(chalk.red(`Block not found: ${id}`))
    process.exit(1)
  }
  block.status = 'ready_for_review'
  block.completedAt = new Date().toISOString()
  if (flags['block-name']) block.blockName = flags['block-name']
  if (flags['render']) block.lastRender = flags['render']
  if (flags['iterations']) block.iterations = parseInt(flags['iterations'])
  await saveQueue(queue)
  console.log(chalk.magenta(`Ready for review: ${id}`))
}

async function addBlock(queue: Queue, flags: Record<string, string>) {
  if (!flags.brief || !flags.category) {
    console.error(chalk.red('Required: --brief="..." --category=<cat>'))
    process.exit(1)
  }

  const existingIds = queue.blocks.map(b => b.id)
  const catBlocks = queue.blocks.filter(b => b.category === flags.category)
  const num = String(catBlocks.length + 1).padStart(2, '0')
  let id = `${flags.category}-${flags.id || `custom-${num}`}`
  if (flags.id) id = flags.id

  if (existingIds.includes(id)) {
    console.error(chalk.red(`ID already exists: ${id}`))
    process.exit(1)
  }

  queue.blocks.push({
    id,
    category: flags.category,
    brief: flags.brief,
    status: 'queued',
    priority: parseInt(flags.priority || '2')
  })

  await saveQueue(queue)
  console.log(chalk.green(`Added: ${id}`))
}

async function main() {
  const { command, positional, flags } = parseArgs()
  const queue = await loadQueue()

  switch (command) {
    case 'status': return showStatus(queue)
    case 'next': return showNext(queue)
    case 'start': return startBlock(queue, positional)
    case 'done': return doneBlock(queue, positional, flags)
    case 'add': return addBlock(queue, flags)
    default:
      console.error(chalk.red(`Unknown command: ${command}`))
      console.log('Commands: status, next, start <id>, done <id>, add --brief=... --category=...')
      process.exit(1)
  }
}

main().catch(err => {
  console.error(chalk.red(err.message || err))
  process.exit(1)
})
