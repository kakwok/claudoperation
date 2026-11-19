// Session volume stats from a Claude Code transcript (JSONL). Pure: the text goes
// in, numbers come out, so tests and scripts/session-stats.mjs share it.
// Counts volume only (human turns, typed words, active time). It says nothing about influence.
//
// Active time: the time between the first human turn and the last entry, counting
// only the gap between two consecutive transcript entries when it is at most
// IDLE_MINUTES (15). A longer gap (lunch, overnight, a walk away) is a break and adds
// nothing, so a session left open for a day still reports the hours actually worked.
// The 15 is a judgement, not a measured value; change it here and the SPEC note.

const MARKER_RE = /^\[claudoperation:captured [^\]\n]+\]\s*$/m
const PASTED_RE = /<pasted_content\b[^>]*>[\s\S]*?<\/pasted_content[^>]*>/g
export const IDLE_MINUTES = 15
const IDLE_MS = IDLE_MINUTES * 60 * 1000 // a longer gap between entries is a break, not active time

const words = (s) => (s.trim() ? s.trim().split(/\s+/).length : 0)

// Text of a message: a string, or the text blocks of a content array (never tool results)
function textOf(content) {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''
  return content.filter((b) => b && b.type === 'text' && typeof b.text === 'string').map((b) => b.text).join('\n')
}

export function parseTranscript(jsonl) {
  const out = []
  for (const line of jsonl.split('\n')) {
    if (!line.trim()) continue
    try { out.push(JSON.parse(line)) } catch { /* a partial last line while the session is live */ }
  }
  return out
}

// Typed words exclude pasted blocks; pasted words are reported apart. A turn is
// human when the transcript says so (origin.kind === 'human'): system notices,
// hook output and tool results are not.
export function transcriptStats(jsonl, { afterMarker = true } = {}) {
  const entries = parseTranscript(jsonl)
  let start = 0
  if (afterMarker) {
    for (let i = entries.length - 1; i >= 0; i--) {
      const e = entries[i]
      if (e.type === 'assistant' && MARKER_RE.test(textOf(e.message?.content))) { start = i + 1; break }
    }
  }
  const scope = entries.slice(start)
  const stamped = scope.filter((e) => e.timestamp && !Number.isNaN(Date.parse(e.timestamp)))

  let humanTurns = 0, typedWords = 0, firstHuman = null
  for (const e of scope) {
    if (e.type !== 'user' || e.origin?.kind !== 'human') continue
    const text = textOf(e.message?.content)
    if (!text.trim()) continue
    humanTurns++
    typedWords += words(text.replace(PASTED_RE, ' ')) // pasted blocks are left out
    if (!firstHuman && e.timestamp) firstHuman = Date.parse(e.timestamp)
  }

  let activeMs = 0, prev = null
  for (const e of stamped) {
    const t = Date.parse(e.timestamp)
    if (firstHuman !== null && t < firstHuman) continue
    if (prev !== null && t - prev <= IDLE_MS) activeMs += t - prev
    prev = t
  }
  return {
    scopedFromMarker: start > 0,
    humanTurns,
    typedWords,
    activeMinutes: firstHuman !== null ? Math.round(activeMs / 60000) : null,
  }
}

// The record's "## Session volume" section (SPEC.md section 3): "1 h 05 m" or "45 m"
export function formatVolume(stats) {
  const m = stats.activeMinutes ?? 0
  const active = m >= 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} m` : `${m} m`
  return [
    '## Session volume',
    '',
    `Volume only, not a measure of influence. Active time counts the gaps of up to ${IDLE_MINUTES} minutes between messages; a longer gap is a break.`,
    '',
    '| Active time | Human turns | Typed words |',
    '| --- | --- | --- |',
    `| ${active} | ${stats.humanTurns} | ${stats.typedWords} |`,
    '',
  ].join('\n')
}
