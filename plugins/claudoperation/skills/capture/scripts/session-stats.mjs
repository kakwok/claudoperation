#!/usr/bin/env node
// Volume stats for the current Claude Code session: human turns, typed words, time.
// Usage: node session-stats.mjs --find            print the transcript path and stop
//        node session-stats.mjs <transcript.jsonl> [--all] [--section]
//            stats since the last capture marker (--all: whole session) as JSON,
//            or with --section the record's "## Session volume" text
// Active time counts only gaps of up to 15 minutes between messages (see hooks/transcript.js).
// Reads one local file and prints JSON. Claude Code only: other clients have no transcript.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { homedir } from 'node:os'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const { transcriptStats, formatVolume } = await import(pathToFileURL(join(here, '../../../hooks/transcript.js')))

// Claude Code keeps transcripts at <config dir>/projects/<cwd with / and . as ->/<session>.jsonl
function findTranscript() {
  const slug = process.cwd().replace(/[/.]/g, '-')
  const roots = [process.env.CLAUDE_CONFIG_DIR, join(homedir(), '.claude'), join(homedir(), '.claude-work')].filter(Boolean)
  const found = []
  for (const root of roots) {
    const dir = join(root, 'projects', slug)
    if (!existsSync(dir)) continue
    for (const f of readdirSync(dir)) if (f.endsWith('.jsonl')) found.push({ path: join(dir, f), mtime: statSync(join(dir, f)).mtimeMs })
  }
  found.sort((a, b) => b.mtime - a.mtime)
  return found[0]?.path || null // the live session is the one written most recently
}

const args = process.argv.slice(2)
if (args.includes('--find')) {
  const p = findTranscript()
  if (!p) { console.error('no transcript found for ' + process.cwd()); process.exit(1) }
  console.log(p)
  process.exit(0)
}
const file = args.find((a) => !a.startsWith('--'))
if (!file) { console.error('usage: node session-stats.mjs --find | <transcript.jsonl> [--all] [--section]'); process.exit(2) }
const stats = transcriptStats(readFileSync(file, 'utf8'), { afterMarker: !args.includes('--all') })
console.log(args.includes('--section') ? formatVolume(stats) : JSON.stringify(stats, null, 2))
