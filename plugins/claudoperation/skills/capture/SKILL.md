---
name: capture
description: Draft a Claudoperation session record of what the human contributed since the last capture, for the human to approve. Use when the user runs /capture or asks to capture, record or log this session for teammates.
---

# Capture a session record

You draft a session record in the format defined in `SPEC.md`, in this skill's folder. The human only approves, relabels and reorders. **Never ask the author questions while drafting** (the one exception is the capture destination, step 0, asked once before drafting starts). If something is unclear, record it under Open questions.

Gold examples: `examples/*.md` in this skill's folder. Read `SPEC.md` and one example before drafting.

## 0. Capture destination

Records go to `<capture_dir>/<member>/<session-id>.md`. Read `capture_dir` from `.claudoperation/policy.yml` at the repo root.

- **Set:** use it. Do not ask.
- **Not set (first capture, or no policy file):** before drafting, ask the author once where records should be saved, offering `sessions` (the default, relative to the repo root) as the suggested answer. Save the answer as `capture_dir: <path>` in `.claudoperation/policy.yml`, creating the file if needed and keeping any other keys, and tell the author you did. Later captures reuse it silently. The author changes it by editing that line.
- Use a path inside the repo, relative to the repo root. If the author gives an absolute path or one outside the repo, say so and ask for another.
- Anywhere below, `sessions/` means this `capture_dir`.

## 1. Scope

- Start after the last marker in this conversation: `[claudoperation:captured <session-id>]`. With no marker, start at the beginning.
- If you can no longer see back to the marker or the start (earlier context was summarized), say so as an Open question. Do not reconstruct from memory.
- Product and product type: read `.claudoperation/policy.yml` for the path the session touched. With no policy file, use `product_type: endorsed`.

## 2. Find the claims

Walk the human turns in order. For each, ask: **what did this change?** A turn that changed nothing produces no claim.

Origin rules — getting these wrong is the most serious error a record can make:

- The human stated it unprompted → human claim (Direction, Origination or Knowledge).
- The human rejected or altered an AI proposal → human **Correction**, with `corrects:` naming the proposal.
- The human picked among several options the AI offered → human **Choice**.
- The human **added something** to an AI proposal → the addition is a **separate human claim**. Never fold it into the AI claim.
- The human agreed to a single AI recommendation ("OK", "agreed") → **AI claim**, not a human Choice.
- The human said "your call" / "I trust your choice" → AI claim with a `Delegated, not reviewed` line.
- The AI decided something the human never responded to → AI claim with a `Never discussed` line.
- The human reversed or narrowed **their own** earlier decision → **Direction**, with `supersedes:` or `refines:` pointing at the earlier claim. Correction is only for fixing the AI.
- Origination only if the idea does not appear earlier in the session as an AI proposal. Otherwise it is a Choice, Correction or AI claim.
- Verification only if the human says what they checked and how. Otherwise Acceptance, or no claim.

Superseded claims stay in the record, with the relation, ranked low.

### Teammate test: boxed claim or minor detail

Give a human claim an Approve box only if a teammate reading just this record would change what they do or believe: premise, goal, scope, design, constraints, corrections of the AI, facts others must know. Wording, naming, formatting, ordering and one-line tweaks fail. Put those, and small AI decisions of the same kind, in the collapsed **Minor details** block (`- M1 …`, no boxes, no labels; SPEC.md section 4a). Do not cap the boxed claims by count: the test decides. Keep a failing claim boxed if a boxed claim depends on it.

If nothing passes the test (a fix-only session), write no record. Tell the author why in one sentence and add the marker.

## 3. Recall check

Before ranking, list for yourself every decision that changed the product or the plan. Each must map to a claim. Minor inputs go to Minor details, never dropped silently; **a key decision may never be dropped.** For `functional` products, keep only design-level decisions.

## 4. Rank

Order human claims, and separately AI claims, by influence. Signals, in rough order of weight:

1. **Downstream dependency** — how many later claims build on it.
2. **Reversal** — it supersedes or corrects an earlier direction.
3. **Scope** — premise or goal > design > detail > wording.
4. **Label** — Correction, Origination and Direction usually outrank Choice and Knowledge; Acceptance ranks lowest.

Mark the top 3 human claims as key, each with a *Why key* phrase of under 15 words that names the signal ("reversed the goal; reader view and policy follow from it").

## 5. Write

- Title: `# <Member>: <topic in a few words>`. Summary: one plain paragraph under it, at most 2 sentences (about 70 words) about what the human did, written for a teammate who was not in the session: name what was worked on in outsider terms and define any project term inline (or link it to `GLOSSARY.md` if the repo has one) instead of reusing session shorthand.
- Claims go in tables as SPEC.md section 4 and 6 show: two columns, the Approve cell (`☐ H1<br>🎯 Direction`) and the claim cell. The claim comes first and gets most of the width; *Why key*, relations and "Never discussed" go on lines after it, after `<br>`, never in the claim text.
- Metadata goes last, in the collapsed Record details table (no frontmatter). Nothing a reader must decode comes before the summary.
- Each claim: one idea, about 25 words at most, stated as the decision, plain words, jargon defined or avoided.
- **Key claims carry their own context** (SPEC.md section 4). The claim text says what the thing is (up to about 50 words). After it, in this order and before `**Why key:**`, add as needed: `**Before:**` (what was there; skip it when a `corrects:` line already says it, and write that `corrects:` in plain words), `**Now:**` (what it became, if the claim states only the problem), `**Example:**` (one concrete case a reader can find in the product). Never put these on non-key claims.
  - Shorthand: `Reports are now tiered by effort, not by size.`
  - Context: `Each session record now gets a review tier (full, light or none) from how much the human steered it, instead of from how long it is.<br>**Before:** every record got the same review.<br>**Example:** a one-line wording fix gets no review; a change of the product's goal gets full review.`
- IDs in conversation order; ranking reorders lines, never renumbers them.
- Add `supersedes`, `refines`, `led_to`, `depends_on` relations where clear, using `<session-id>#<ID>` for other sessions.
- Minor details: a collapsed `<details><summary>Minor details (N)</summary>` after the AI table; the accuracy line then reads `All AI claims and minor details below are recorded accurately`.
- More than about 12 boxed human claims: still write the record, and add an Open question suggesting the session be split at a named boundary.

## 6. Self-check

Run the validator from this skill's folder and fix every error it reports:

```bash
node <skill-folder>/scripts/validate.mjs <capture_dir>/<member>/<session-id>.md
```

If `node` is not available, check by hand:

- [ ] Record details table complete; `approval` is `pending`; no frontmatter
- [ ] Every Correction has a `corrects:` line; every Verification has a `checked:` line
- [ ] No human addition hidden inside an AI claim
- [ ] At most 3 key claims, each with `**Why key:**` under the claim
- [ ] Title, summary and key table fit on one screen
- [ ] Outsider test: could a teammate who was not in the session say what each key claim means, from the record alone? Every project term in the summary and key claims is defined in place or linked to a glossary
- [ ] Before/Now/Example lines only on key claims, in that order, before `**Why key:**`; no `**Before:**` beside a `corrects:` line
- [ ] Every key decision from the recall list is present
- [ ] Every boxed claim passes the teammate test; the rest are in Minor details with no boxes

## 7. Hand over for approval

- Write the file to `<capture_dir>/<member>/<session-id>.md`.
- Show the author the summary, the key claims, and counts: human claims, minor details, AI claims, never discussed, delegated.
- **Session volume, Claude Code only** (SPEC.md section 10). Claude Code keeps a transcript of the session with timestamps and marks which turns a person typed. Locate it with `node <skill-folder>/scripts/session-stats.mjs --find`, then **ask the author for permission to read that file, naming its path**. Only on a yes, run `node <skill-folder>/scripts/session-stats.mjs <path> --section` and put its output in the record as the `## Session volume` section, just above Record details; show the three figures in your hand-over too. Active time counts only gaps of up to 15 minutes between messages (longer gaps are breaks); say so if the author asks. Pasted text is not counted. On a no, or with no `node`, no transcript, or on claude.ai or any other client, leave the section out without comment. Never estimate the numbers yourself, and never rank or credit anyone by them.
- Approval by product type: `functional` → the author replies "ok" or lists corrections (`by-exception`); `endorsed` → the author ticks claims and endorsements in the file, the PR, or with `/claudoperation-approve`, the approval pane in Claude Code (`individual`).
- **Only in Claude Code, and only for `endorsed` records:** end by asking the author to run `/claudoperation-approve`, which lists the session records in the approval pane (the author picks the new one). Claude Code is the only place the pane exists: on claude.ai or any other client, do not mention it and use the file or "ok" route instead. You cannot open the pane yourself, so make the request the last thing before the marker.
- Apply the author's corrections exactly, note them in Links and evidence as `author: <change>`, and set `approval`.
- End your reply with the marker on its own line: `[claudoperation:captured <session-id>]`
