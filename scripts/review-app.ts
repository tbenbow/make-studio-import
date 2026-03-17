/**
 * Block Review Web App
 *
 * Local web UI for reviewing block screenshots.
 * Thumbnails on left, big preview on right, y/n + optional notes.
 *
 * Usage:
 *   npx tsx scripts/review-app.ts [--port=3333]
 */

import { createServer } from 'node:http'
import { readFile, readdir, writeFile, stat } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { execSync } from 'node:child_process'

const PORT = parseInt(process.argv.find(a => a.startsWith('--port='))?.slice(7) || '3333')
const ROOT = process.cwd()
const ITERATIONS_DIR = join(ROOT, 'themes/block-ingress/iterations')
const REVIEWS_FILE = join(ROOT, 'factory/reviews/session.json')

// ── Scan for screenshots ───────────────────────────────────────────────

interface BlockScreenshot {
  block: string
  file: string
  path: string
  url: string
  isNew: boolean
}

async function scanScreenshots(reviews: Record<string, { verdict: string; note: string }>): Promise<BlockScreenshot[]> {
  const results: BlockScreenshot[] = []
  // Track which blocks have been reviewed before (from session file)
  const previouslyReviewed = new Set(Object.keys(reviews))

  try {
    const blocks = await readdir(ITERATIONS_DIR)
    for (const block of blocks) {
      const blockDir = join(ITERATIONS_DIR, block)
      const s = await stat(blockDir)
      if (!s.isDirectory()) continue
      const files = await readdir(blockDir)
      const pngs = files.filter(f => f.endsWith('.png')).sort()
      // Take the latest render for each block
      const latest = pngs[pngs.length - 1]
      if (latest) {
        // A block is "new" if it has never been reviewed OR if there's a newer render than when it was last reviewed
        const hasMultipleRenders = pngs.length > 1
        const isNew = !previouslyReviewed.has(block) || hasMultipleRenders
        results.push({
          block,
          file: latest,
          path: join(blockDir, latest),
          url: `/img/${block}/${latest}`,
          isNew,
        })
      }
    }
  } catch { /* empty iterations dir */ }
  return results.sort((a, b) => a.block.localeCompare(b.block))
}

// ── HTML UI ────────────────────────────────────────────────────────────

function renderHTML(screenshots: BlockScreenshot[], reviews: Record<string, { verdict: string; note: string }>): string {
  const cards = screenshots.map((s, i) => {
    const review = reviews[s.block]
    const statusClass = review
      ? review.verdict === 'approved' ? 'ring-2 ring-emerald-500' : 'ring-2 ring-red-500'
      : ''
    const statusBadge = review
      ? review.verdict === 'approved'
        ? '<div class="absolute top-1 right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs">✓</div>'
        : '<div class="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">✗</div>'
      : ''
    const dataNew = s.isNew ? 'true' : 'false'
    const dataReviewed = review ? 'true' : 'false'
    return `<button onclick="select(${i})" id="thumb-${i}" data-new="${dataNew}" data-reviewed="${dataReviewed}" class="thumb-card relative group rounded-lg overflow-hidden ${statusClass} hover:ring-2 hover:ring-blue-400 transition-all flex-shrink-0">
      ${statusBadge}
      <img src="${s.url}" class="w-full h-auto" loading="lazy" />
      <div class="absolute bottom-0 inset-x-0 bg-black/70 backdrop-blur-sm px-2 py-1">
        <span class="text-[11px] text-white/90 font-mono truncate block">${s.block}</span>
      </div>
    </button>`
  }).join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Block Review</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background: #0a0a0a; }
    .thumb-grid::-webkit-scrollbar { width: 6px; }
    .thumb-grid::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
    .thumb-grid::-webkit-scrollbar-track { background: transparent; }
  </style>
</head>
<body class="h-screen flex text-white overflow-hidden">

  <!-- Left: Thumbnails -->
  <div class="w-64 flex-shrink-0 border-r border-white/10 flex flex-col">
    <div class="p-3 border-b border-white/10">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium text-white/70">${screenshots.length} blocks</span>
        <span id="counter" class="text-xs text-white/40">0 reviewed</span>
      </div>
      <div class="flex gap-1">
        <button onclick="setFilter('all')" id="filter-all" class="filter-btn text-[11px] px-2 py-1 rounded bg-white/10 text-white/80">All</button>
        <button onclick="setFilter('new')" id="filter-new" class="filter-btn text-[11px] px-2 py-1 rounded text-white/40 hover:text-white/60">New</button>
        <button onclick="setFilter('unreviewed')" id="filter-unreviewed" class="filter-btn text-[11px] px-2 py-1 rounded text-white/40 hover:text-white/60">Unreviewed</button>
      </div>
    </div>
    <div class="thumb-grid flex-1 overflow-y-auto p-2 space-y-2">
      ${cards}
    </div>
    <div class="p-3 border-t border-white/10">
      <button onclick="submitAll()" class="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2 px-4 rounded-lg transition">
        Save Reviews
      </button>
    </div>
  </div>

  <!-- Right: Preview + Controls -->
  <div class="flex-1 flex flex-col min-w-0">
    <!-- Preview -->
    <div class="flex-1 overflow-auto flex items-start justify-center p-6 bg-[#111]">
      <img id="preview" src="" class="max-w-full rounded-lg shadow-2xl" style="display:none" />
      <div id="empty" class="text-white/30 text-lg mt-32">Select a block to review</div>
    </div>

    <!-- Controls -->
    <div id="controls" class="border-t border-white/10 bg-[#0a0a0a] p-4" style="display:none">
      <div class="max-w-3xl mx-auto flex items-start gap-4">
        <div class="flex-1">
          <div class="flex items-center gap-3 mb-3">
            <span id="block-name" class="text-lg font-medium font-mono"></span>
            <span id="verdict-badge" class="text-xs px-2 py-0.5 rounded-full"></span>
          </div>
          <textarea id="note" placeholder="Optional feedback..." rows="2"
            class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-blue-500"></textarea>
        </div>
        <div class="flex flex-col gap-2 pt-1">
          <button onclick="approve()" class="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium py-2.5 px-6 rounded-lg transition flex items-center gap-2">
            <span class="text-base">✓</span> Approve
          </button>
          <button onclick="reject()" class="bg-red-600/80 hover:bg-red-600 text-white text-sm font-medium py-2.5 px-6 rounded-lg transition flex items-center gap-2">
            <span class="text-base">✗</span> Reject
          </button>
          <button onclick="skip()" class="bg-white/5 hover:bg-white/10 text-white/50 text-sm py-2 px-6 rounded-lg transition">
            Skip →
          </button>
        </div>
      </div>
    </div>
  </div>

  <script>
    const screenshots = ${JSON.stringify(screenshots)}
    const reviews = ${JSON.stringify(reviews)}
    let current = -1
    let activeFilter = 'all'

    function updateCounter() {
      const count = Object.keys(reviews).length
      document.getElementById('counter').textContent = count + ' reviewed'
    }

    function setFilter(filter) {
      activeFilter = filter
      document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.className = 'filter-btn text-[11px] px-2 py-1 rounded text-white/40 hover:text-white/60'
      })
      document.getElementById('filter-' + filter).className = 'filter-btn text-[11px] px-2 py-1 rounded bg-white/10 text-white/80'
      document.querySelectorAll('.thumb-card').forEach(card => {
        const isNew = card.dataset.new === 'true'
        const isReviewed = card.dataset.reviewed === 'true'
        let show = true
        if (filter === 'new') show = isNew
        if (filter === 'unreviewed') show = !isReviewed
        card.style.display = show ? '' : 'none'
      })
    }

    function select(i) {
      current = i
      const s = screenshots[i]
      document.getElementById('preview').src = s.url
      document.getElementById('preview').style.display = 'block'
      document.getElementById('empty').style.display = 'none'
      document.getElementById('controls').style.display = 'block'
      document.getElementById('block-name').textContent = s.block
      document.getElementById('note').value = reviews[s.block]?.note || ''
      updateVerdictBadge(s.block)

      // Highlight active thumbnail
      document.querySelectorAll('[id^=thumb-]').forEach(el => el.classList.remove('ring-2', 'ring-blue-400'))
      document.getElementById('thumb-' + i)?.classList.add('ring-2', 'ring-blue-400')
    }

    function updateVerdictBadge(block) {
      const badge = document.getElementById('verdict-badge')
      const r = reviews[block]
      if (!r) { badge.textContent = ''; badge.className = 'text-xs px-2 py-0.5 rounded-full'; return }
      if (r.verdict === 'approved') {
        badge.textContent = 'Approved'
        badge.className = 'text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400'
      } else {
        badge.textContent = 'Rejected'
        badge.className = 'text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400'
      }
    }

    function updateThumb(i, verdict) {
      const el = document.getElementById('thumb-' + i)
      if (!el) return
      el.classList.remove('ring-emerald-500', 'ring-red-500')
      el.classList.add(verdict === 'approved' ? 'ring-emerald-500' : 'ring-red-500')
      // Update or add badge
      let badge = el.querySelector('.absolute.top-1')
      if (!badge) {
        badge = document.createElement('div')
        badge.className = 'absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs'
        el.prepend(badge)
      }
      badge.className = 'absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs ' +
        (verdict === 'approved' ? 'bg-emerald-500' : 'bg-red-500')
      badge.textContent = verdict === 'approved' ? '✓' : '✗'
    }

    function recordVerdict(verdict) {
      if (current < 0) return
      const block = screenshots[current].block
      reviews[block] = { verdict, note: document.getElementById('note').value.trim() }
      updateThumb(current, verdict)
      updateVerdictBadge(block)
      updateCounter()
      // Auto-advance
      if (current < screenshots.length - 1) select(current + 1)
    }

    function approve() { recordVerdict('approved') }
    function reject() { recordVerdict('rejected') }
    function skip() { if (current < screenshots.length - 1) select(current + 1) }

    async function submitAll() {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviews)
      })
      if (res.ok) {
        const data = await res.json()
        alert('Saved ' + data.count + ' reviews!')
      }
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'TEXTAREA') return
      if (e.key === 'y' || e.key === 'a') approve()
      if (e.key === 'n' || e.key === 'r') reject()
      if (e.key === 's' || e.key === 'ArrowRight' || e.key === 'ArrowDown') skip()
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { if (current > 0) select(current - 1) }
    })

    updateCounter()
    // Auto-select first
    if (screenshots.length > 0) select(0)
  </script>

</body>
</html>`
}

// ── Server ─────────────────────────────────────────────────────────────

async function main() {
  let reviews: Record<string, { verdict: string; note: string }> = {}

  // Load existing reviews
  try {
    reviews = JSON.parse(await readFile(REVIEWS_FILE, 'utf-8'))
  } catch { /* no existing reviews */ }

  const server = createServer(async (req, res) => {
    const url = new URL(req.url || '/', `http://localhost:${PORT}`)

    // Serve screenshots
    if (url.pathname.startsWith('/img/')) {
      const relPath = url.pathname.slice(5) // remove /img/
      const filePath = join(ITERATIONS_DIR, relPath)
      try {
        const data = await readFile(filePath)
        const ext = extname(filePath).toLowerCase()
        const mime = ext === '.png' ? 'image/png' : ext === '.jpg' ? 'image/jpeg' : 'application/octet-stream'
        res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-cache' })
        res.end(data)
      } catch {
        res.writeHead(404)
        res.end('Not found')
      }
      return
    }

    // Save reviews
    if (url.pathname === '/api/reviews' && req.method === 'POST') {
      let body = ''
      req.on('data', chunk => body += chunk)
      req.on('end', async () => {
        try {
          reviews = JSON.parse(body)
          await writeFile(REVIEWS_FILE, JSON.stringify(reviews, null, 2) + '\n')
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ ok: true, count: Object.keys(reviews).length }))
        } catch (err) {
          res.writeHead(400)
          res.end(JSON.stringify({ error: String(err) }))
        }
      })
      return
    }

    // Main page
    if (url.pathname === '/') {
      const screenshots = await scanScreenshots(reviews)
      const html = renderHTML(screenshots, reviews)
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end(html)
      return
    }

    res.writeHead(404)
    res.end('Not found')
  })

  server.listen(PORT, () => {
    const url = `http://localhost:${PORT}`
    console.log(`\n  Review app running at ${url}\n`)
    console.log(`  Keyboard: y=approve  n=reject  →=skip  ←=back\n`)
    execSync(`open ${url}`)
  })
}

main()
