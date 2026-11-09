// Claudoperation session record: parse, validate, and apply approvals.
// Format: skills/capture/SPEC.md (v0.2). Pure functions, no I/O, so the
// approval mod, the validator script, and tests all share one parser.
// A record reads as a story: title, summary, claim tables. Its metadata sits
// in a collapsed "Record details" table at the end.

export const LABELS = {
  Direction: '🎯',
  Choice: '🔀',
  Origination: '💡',
  Correction: '🛠️',
  Knowledge: '📚',
  Verification: '✅',
  Acceptance: '👍',
}

// Labels that need evidence, and the relation that carries it
export const EVIDENCE = { Correction: 'corrects', Verification: 'checked' }

export const OFF = '☐'
export const ON = '☑'

const PRODUCT_TYPES = ['endorsed', 'functional']
const APPROVALS = ['pending', 'individual', 'by-exception', 'bulk']
const REQUIRED = ['claudoperation', 'session', 'member', 'product', 'product_type', 'span', 'approval']
const REF_RELATIONS = ['supersedes', 'superseded by', 'refines', 'refined by', 'led_to', 'depends_on']
const RELATION_RE = /(corrects|checked|superseded by|supersedes|refined by|refines|led_to|depends_on): /g
const REF_RE = /^(\d{4}-\d{2}-\d{2}-[a-z0-9-]+)?#[HA]\d+$/

const HUMAN_ROW_RE = /^\s*\|\s*([☐☑])\s*(H\d+)\b/u
const AI_ROW_RE = /^\s*\|\s*([☐☑])\s*(A\d+)\b/u
const ACCURACY_RE = /^(\s*)([☐☑]) All AI claims below are recorded accurately/u
const META_ROW_RE = /^\s*\|\s*([a-z_]+)\s*\|\s*(.*?)\s*\|\s*$/
const WHY_RE = /^\*\*Why key:\*\*\s*/

// Cells of one table row, raw (escaped pipes kept) and trimmed
export function splitCells(line) {
  const inner = line.trim().replace(/^\|/, '').replace(/\|$/, '')
  return inner.split(/(?<!\\)\|/).map((c) => c.trim())
}
const unescape = (s) => s.replace(/\\\|/g, '|')
const escape = (s) => s.replace(/\|/g, '\\|')
const joinCells = (cells) => '| ' + cells.join(' | ') + ' |'

// A row is two cells: "☑ H2<br>🛠️ Correction" and "claim<br>**Why key:** phrase<br>corrects: x".
// The claim is the first <br> item of the second cell; the rest are notes.
const BR = /<br\s*\/?>/i
function splitClaim(cell) {
  const [claim, ...notes] = (cell || '').split(BR)
  return { claim: (claim || '').trim(), notes: notes.join('<br>') }
}

// Notes: "**Why key:** phrase<br>corrects: x<br>led_to: #H8"
function parseNotes(cell) {
  const items = cell.split(BR).map((s) => s.trim()).filter(Boolean)
  let why = null
  const rest = []
  for (const item of items) {
    if (WHY_RE.test(item)) why = unescape(item.replace(WHY_RE, '').trim())
    else rest.push(item)
  }
  const relText = rest.join(', ')
  const relations = []
  const marks = [...relText.matchAll(RELATION_RE)]
  marks.forEach((m, i) => {
    const end = i + 1 < marks.length ? marks[i + 1].index : relText.length
    const value = relText.slice(m.index + m[0].length, end).replace(/[,.\s]+$/, '').trim()
    relations.push({ kind: m[1], value: unescape(value) })
  })
  return { why, relations, text: unescape(rest.join(' ')) }
}

export function parseRecord(source) {
  const lines = source.split('\n')
  const record = {
    title: null, frontmatter: {}, summary: null, human: [], ai: [], accuracy: null,
    hasKeySection: false, lines,
  }
  let inKey = false
  let inMeta = false
  let inSummary = true
  let summary = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (/^# /.test(line) && record.title === null) { record.title = line.slice(2).trim(); continue }
    if (line.startsWith('<details><summary>Record details')) { inMeta = true; inKey = false; continue }
    if (inMeta) {
      if (line.startsWith('</details>')) inMeta = false
      else {
        const m = line.match(META_ROW_RE)
        if (m && REQUIRED.includes(m[1])) record.frontmatter[m[1]] = m[2].replace(/^`|`$/g, '')
      }
      continue
    }
    if (/^## /.test(line)) inSummary = false
    if (inSummary && record.title !== null) {
      if (line.trim() && !/^[#|<>-]/.test(line.trim())) summary.push(line.trim())
      else if (!line.trim() && summary.length) inSummary = false
    }
    if (/^## What .+ did/.test(line)) { inKey = true; record.hasKeySection = true; continue }
    if (/^## /.test(line) || line.startsWith('<details>')) inKey = false

    let m = line.match(HUMAN_ROW_RE)
    if (m) {
      const cells = splitCells(line)
      const typeText = (cells[0] || '').split(BR)[1] || ''
      const type = typeText.trim().match(/^(?:(\S+) )?([A-Z][a-z]+)$/u)
      const { claim, notes: rest } = splitClaim(cells[1])
      const notes = parseNotes(rest)
      record.human.push({
        id: m[2], checked: m[1] === ON, emoji: type?.[1] || null, label: type?.[2] || typeText.trim(),
        text: unescape(claim), relations: notes.relations, why: notes.why, isKey: inKey, line: i,
      })
      continue
    }
    m = line.match(ACCURACY_RE)
    if (m) { record.accuracy = { checked: m[2] === ON, line: i }; continue }
    m = line.match(AI_ROW_RE)
    if (m) {
      const cells = splitCells(line)
      const { claim, notes: rest } = splitClaim(cells[1])
      const notes = parseNotes(rest)
      const note = /never discussed/i.test(rest) ? 'never discussed' : /delegated/i.test(rest) ? 'delegated' : null
      record.ai.push({ id: m[2], checked: m[1] === ON, text: unescape(claim), relations: notes.relations, note, line: i })
    }
  }
  record.summary = summary.length ? summary.join(' ') : null
  return record
}

function sentences(text) {
  return text.split(/(?<=[.!?])\s+(?=[A-Z])/).filter((s) => s.trim())
}

export function validateRecord(source, { filename } = {}) {
  const errors = []
  const warnings = []
  const r = parseRecord(source)
  const fm = r.frontmatter

  for (const key of REQUIRED) if (!fm[key]) errors.push(`record details: missing "${key}"`)
  if (fm.product_type && !PRODUCT_TYPES.includes(fm.product_type)) errors.push(`record details: product_type must be ${PRODUCT_TYPES.join(' or ')}`)
  if (fm.approval && !APPROVALS.includes(fm.approval)) errors.push(`record details: approval must be one of ${APPROVALS.join(', ')}`)
  if (filename && fm.session && !filename.endsWith(fm.session + '.md')) warnings.push(`record details: session "${fm.session}" does not match the file name`)

  if (r.title === null) errors.push('title: missing "# <Member>: <topic>" heading')
  if (r.summary === null) errors.push('summary: missing the summary paragraph under the title')
  else {
    if (sentences(r.summary).length > 2) errors.push('summary: more than 2 sentences')
    if (r.summary.split(/\s+/).length > 60) warnings.push('summary: over about 60 words')
  }

  if (!r.hasKeySection) errors.push('missing "## What <member> did" section')
  const key = r.human.filter((c) => c.isKey)
  if (key.length > 3) errors.push(`key: ${key.length} key claims, at most 3`)
  if (r.human.length && key.length === 0) errors.push('key: no key claims')
  if (r.human.length > 12) warnings.push(`${r.human.length} human claims: consider splitting the session`)

  const seen = new Set()
  for (const c of [...r.human, ...r.ai]) {
    if (seen.has(c.id)) errors.push(`${c.id}: duplicate id`)
    seen.add(c.id)
  }

  for (const c of r.human) {
    if (!LABELS[c.label]) { errors.push(`${c.id}: unknown label "${c.label}"`); continue }
    if (c.emoji !== LABELS[c.label]) warnings.push(`${c.id}: emoji should be ${LABELS[c.label]} for ${c.label}`)
    if (c.isKey && !c.why) errors.push(`${c.id}: key claim without "**Why key:**" in Notes`)
    if (!c.isKey && c.why) warnings.push(`${c.id}: "Why key" on a claim outside the key table`)
    const need = EVIDENCE[c.label]
    if (need && !c.relations.some((rel) => rel.kind === need)) errors.push(`${c.id}: ${c.label} needs a "${need}:" relation`)
    if (c.text.split(/\s+/).length > 30) warnings.push(`${c.id}: claim over about 25 words`)
  }

  for (const c of [...r.human, ...r.ai]) {
    for (const rel of c.relations) {
      if (!REF_RELATIONS.includes(rel.kind)) continue
      for (const ref of rel.value.split(',').map((s) => s.trim())) {
        if (!REF_RE.test(ref)) errors.push(`${c.id}: "${rel.kind}: ${ref}" is not <session-id>#<ID> or #<ID>`)
      }
    }
  }

  if (r.ai.length && !r.accuracy) errors.push('AI decisions: missing the "All AI claims below are recorded accurately" checkbox')

  return { errors, warnings, record: r }
}

// changes = { human: { H1: { checked, label, evidence } }, ai: { A1: { checked } },
//             accuracy: boolean, approval: 'individual' | 'bulk' | ..., notes: [string] }
export function applyApproval(source, changes) {
  const r = parseRecord(source)
  const lines = [...r.lines]
  const box = (line, on) => line.replace(/[☐☑]/u, on ? ON : OFF)

  for (const c of r.human) {
    const ch = changes.human?.[c.id]
    if (!ch) continue
    let line = lines[c.line]
    if (ch.checked !== undefined) line = box(line, ch.checked)
    if (ch.label && ch.label !== c.label || ch.evidence) {
      const cells = splitCells(line)
      while (cells.length < 2) cells.push('')
      if (ch.label && ch.label !== c.label) {
        const [head] = cells[0].split(BR)
        cells[0] = `${head}<br>${LABELS[ch.label]} ${ch.label}`
      }
      if (ch.evidence) {
        const kind = EVIDENCE[ch.label || c.label]
        cells[1] = `${cells[1]}<br>${kind}: ${escape(ch.evidence)}`
      }
      line = joinCells(cells)
    }
    lines[c.line] = line
  }
  for (const c of r.ai) {
    const ch = changes.ai?.[c.id]
    if (ch?.checked !== undefined) lines[c.line] = box(lines[c.line], ch.checked)
  }
  if (r.accuracy && changes.accuracy !== undefined) lines[r.accuracy.line] = box(lines[r.accuracy.line], changes.accuracy)

  if (changes.approval) {
    const at = lines.findIndex((l) => /^\s*\|\s*approval\s*\|/.test(l))
    if (at >= 0) lines[at] = `| approval | ${changes.approval} |`
  }

  const notes = (changes.notes || []).map((n) => `- author: ${n}`)
  if (notes.length) {
    const open = lines.findIndex((l) => l.startsWith('<details><summary>Links and evidence'))
    const close = open >= 0 ? lines.findIndex((l, i) => i > open && l.startsWith('</details>')) : -1
    if (close >= 0) lines.splice(close, 0, ...notes)
    else {
      const meta = lines.findIndex((l) => l.startsWith('<details><summary>Record details'))
      const block = ['<details><summary>Links and evidence</summary>', '', ...notes, '</details>', '']
      if (meta >= 0) lines.splice(meta, 0, ...block)
      else lines.push('', ...block)
    }
  }
  return lines.join('\n')
}
