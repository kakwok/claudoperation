#!/usr/bin/env node
// Deterministic analytics over one member's session records, for /synthesize.
// Usage: node stats.mjs <sessions/member dir | record.md ...>
// Prints JSON. Counts only; the skill writes the prose.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const { parseRecord, LABELS } = await import(pathToFileURL(join(here, '../../../hooks/record.js')))

const args = process.argv.slice(2)
if (!args.length) {
  console.error('usage: node stats.mjs <sessions/member dir | record.md ...>')
  process.exit(2)
}
const files = args.flatMap((a) =>
  statSync(a).isDirectory()
    ? readdirSync(a).filter((f) => f.endsWith('.md')).sort().map((f) => join(a, f))
    : [a])

const labels = Object.fromEntries(Object.keys(LABELS).map((l) => [l, 0]))
const out = {
  sessions: 0, pending: [], humanClaims: 0, approvedHuman: 0, aiClaims: 0,
  labels, superseded: 0, unreviewedAI: [], bulkApprovals: [], relabels: 0, overrides: 0,
  ratio: null, span: null, records: [],
}
const sessionOf = (f) => basename(f, '.md')
const records = files.map((f) => ({ id: sessionOf(f), r: parseRecord(readFileSync(f, 'utf8')), src: readFileSync(f, 'utf8') }))

// A claim is superseded if any record in the set points `supersedes:` at it
const superseded = new Set()
for (const { id, r } of records)
  for (const c of r.human)
    for (const rel of c.relations.filter((x) => x.kind === 'supersedes')) {
      const [s, cid] = rel.value.split('#')
      superseded.add(`${s || id}#${cid}`)
    }

for (const { id, r, src } of records) {
  out.sessions++
  const fm = r.frontmatter
  if (fm.approval === 'pending') out.pending.push(id)
  if (fm.approval === 'bulk') out.bulkApprovals.push(id)
  const [a, b] = (fm.span || '').split(' → ')
  const lo = a, hi = b || a
  if (lo) out.span = { from: out.span?.from && out.span.from < lo ? out.span.from : lo, to: out.span?.to && out.span.to > hi ? out.span.to : hi }
  out.relabels += (src.match(/author-relabeled from|author: relabel/gi) || []).length
  out.overrides += (src.match(/author: override/gi) || []).length
  out.humanClaims += r.human.length
  out.aiClaims += r.ai.length
  for (const c of r.human) {
    if (c.checked) { out.approvedHuman++; if (c.label in labels) labels[c.label]++ }
    if (superseded.has(`${id}#${c.id}`)) out.superseded++
  }
  for (const c of r.ai)
    if (!c.checked) out.unreviewedAI.push({ ref: `${id}#${c.id}`, claim: c.text.replace(/ — (never discussed|delegated, not reviewed)/, ''), note: c.note })
  out.records.push({ id, approval: fm.approval, human: r.human.length, ai: r.ai.length })
}
if (out.aiClaims) out.ratio = `${out.humanClaims}:${out.aiClaims}`
console.log(JSON.stringify(out, null, 2))
