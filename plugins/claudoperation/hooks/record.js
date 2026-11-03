// Claudoperation session record: parse, validate, and apply approvals.
// Format: skills/capture/SPEC.md (v0.1). Pure functions, no I/O, so the
// approval mod, the validator script, and tests all share one parser.

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

const PRODUCT_TYPES = ['endorsed', 'functional']
const APPROVALS = ['pending', 'individual', 'by-exception', 'bulk']
const REQUIRED = ['claudoperation', 'session', 'member', 'product', 'product_type', 'span', 'approval']
const REF_RELATIONS = ['supersedes', 'superseded by', 'refines', 'refined by', 'led_to', 'depends_on']
const RELATION_RE = /(corrects|checked|superseded by|supersedes|refined by|refines|led_to|depends_on): /g
const REF_RE = /^(\d{4}-\d{2}-\d{2}-[a-z0-9-]+)?#[HA]\d+$/

const HUMAN_RE = /^(\s*)- \[([ xX])\] (H\d+) · (?:(\S+) )?([A-Z][a-z]+) · (.*)$/u
const AI_RE = /^(\s*)- \[([ xX])\] (A\d+) · (.*)$/
const ACCURACY_RE = /^(\s*)- \[([ xX])\] All AI claims below are recorded accurately/

// Split "claim text → rel: value, rel: value. *Why key: ...*" into parts
function splitClaim(rest) {
  let why = null
  const whyAt = rest.indexOf('*Why key:')
  if (whyAt >= 0) {
    why = rest.slice(whyAt + 9).replace(/\*\s*$/, '').trim()
    rest = rest.slice(0, whyAt).trim()
  }
  let text = rest
  const relations = []
  const arrow = rest.indexOf(' → ')
  if (arrow >= 0) {
    text = rest.slice(0, arrow).trim()
    const relText = rest.slice(arrow + 3)
    const marks = [...relText.matchAll(RELATION_RE)]
    marks.forEach((m, i) => {
      const end = i + 1 < marks.length ? marks[i + 1].index : relText.length
      const value = relText.slice(m.index + m[0].length, end).replace(/[,.\s]+$/, '').trim()
      relations.push({ kind: m[1], value })
    })
  }
  return { text, relations, why }
}

export function parseRecord(source) {
  const lines = source.split('\n')
  const frontmatter = {}
  let i = 0
  if (lines[0] === '---') {
    for (i = 1; i < lines.length && lines[i] !== '---'; i++) {
      const m = lines[i].match(/^([a-z_]+):\s*(.*)$/)
      if (m) frontmatter[m[1]] = m[2].trim()
    }
    i += 1
  }
  const record = { frontmatter, summary: null, human: [], ai: [], accuracy: null, hasKeySection: false, lines }
  let inKey = false
  for (; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith('**Summary.**') && record.summary === null) {
      record.summary = line.slice('**Summary.**'.length).trim()
    }
    if (/^## What .+ did — key/.test(line)) { inKey = true; record.hasKeySection = true; continue }
    if (/^## /.test(line) || line.startsWith('<details>')) inKey = false
    let m = line.match(HUMAN_RE)
    if (m) {
      record.human.push({
        id: m[3], checked: m[2] !== ' ', emoji: m[4] || null, label: m[5],
        ...splitClaim(m[6]), isKey: inKey, line: i,
      })
      continue
    }
    m = line.match(ACCURACY_RE)
    if (m) { record.accuracy = { checked: m[2] !== ' ', line: i }; continue }
    m = line.match(AI_RE)
    if (m) {
      const parts = splitClaim(m[4])
      const note = /— never discussed/.test(parts.text) ? 'never discussed'
        : /— delegated, not reviewed/.test(parts.text) ? 'delegated' : null
      record.ai.push({ id: m[3], checked: m[2] !== ' ', ...parts, note, line: i })
    }
  }
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

  for (const key of REQUIRED) if (!fm[key]) errors.push(`frontmatter: missing "${key}"`)
  if (fm.product_type && !PRODUCT_TYPES.includes(fm.product_type)) errors.push(`frontmatter: product_type must be ${PRODUCT_TYPES.join(' or ')}`)
  if (fm.approval && !APPROVALS.includes(fm.approval)) errors.push(`frontmatter: approval must be one of ${APPROVALS.join(', ')}`)
  if (filename && fm.session && !filename.endsWith(fm.session + '.md')) warnings.push(`frontmatter: session "${fm.session}" does not match the file name`)

  if (r.summary === null) errors.push('summary: missing "**Summary.**" paragraph')
  else {
    if (sentences(r.summary).length > 2) errors.push('summary: more than 2 sentences')
    if (r.summary.split(/\s+/).length > 60) warnings.push('summary: over about 60 words')
  }

  if (!r.hasKeySection) errors.push('missing "## What <member> did — key" section')
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
    if (c.isKey && !c.why) errors.push(`${c.id}: key claim without "*Why key:*"`)
    if (!c.isKey && c.why) warnings.push(`${c.id}: "Why key" on a claim outside the key section`)
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
  const box = (line, on) => line.replace(/- \[[ xX]\]/, on ? '- [x]' : '- [ ]')

  for (const c of r.human) {
    const ch = changes.human?.[c.id]
    if (!ch) continue
    let line = lines[c.line]
    if (ch.checked !== undefined) line = box(line, ch.checked)
    if (ch.label && ch.label !== c.label) {
      const prefix = line.match(/^(\s*- \[[ xX]\] H\d+ · )/)[1]
      const after = line.slice(prefix.length).replace(/^(?:\S+ )?[A-Z][a-z]+ · /, '')
      line = `${prefix}${LABELS[ch.label]} ${ch.label} · ${after}`
    }
    if (ch.evidence) {
      const kind = EVIDENCE[ch.label || c.label]
      const whyAt = line.indexOf(' *Why key:')
      const head = whyAt >= 0 ? line.slice(0, whyAt).replace(/\.$/, '') : line
      const tail = whyAt >= 0 ? '.' + line.slice(whyAt) : ''
      const joiner = head.includes(' → ') ? ', ' : ' → '
      line = `${head}${joiner}${kind}: ${ch.evidence}${tail}`
    }
    lines[c.line] = line
  }
  for (const c of r.ai) {
    const ch = changes.ai?.[c.id]
    if (ch?.checked !== undefined) lines[c.line] = box(lines[c.line], ch.checked)
  }
  if (r.accuracy && changes.accuracy !== undefined) lines[r.accuracy.line] = box(lines[r.accuracy.line], changes.accuracy)

  if (changes.approval) {
    const at = lines.findIndex((l, i) => i > 0 && /^approval:/.test(l))
    if (at >= 0) lines[at] = `approval: ${changes.approval}`
  }

  const notes = (changes.notes || []).map((n) => `- author: ${n}`)
  if (notes.length) {
    const open = lines.findIndex((l) => l.startsWith('<details><summary>Links and evidence'))
    const close = open >= 0 ? lines.findIndex((l, i) => i > open && l.startsWith('</details>')) : -1
    if (close >= 0) lines.splice(close, 0, ...notes)
    else lines.push('', '<details><summary>Links and evidence</summary>', '', ...notes, '</details>')
  }
  return lines.join('\n')
}
