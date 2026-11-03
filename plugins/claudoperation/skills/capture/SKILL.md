---
name: capture
description: Draft a Claudoperation session record of what the human contributed since the last capture, for the human to approve. Use when the user runs /capture or asks to capture, record or log this session for teammates.
---

# Capture a session record

You draft a session record in the format defined in `SPEC.md`, in this skill's folder. The human only approves, relabels and reorders. **Never ask the author questions while drafting.** If something is unclear, record it under Open questions.

Gold examples: `examples/*.md` in this skill's folder. Read `SPEC.md` and one example before drafting.

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
- The human said "your call" / "I trust your choice" → AI claim marked `— delegated, not reviewed`.
- The AI decided something the human never responded to → AI claim marked `— never discussed`.
- The human reversed or narrowed **their own** earlier decision → **Direction**, with `supersedes:` or `refines:` pointing at the earlier claim. Correction is only for fixing the AI.
- Origination only if the idea does not appear earlier in the session as an AI proposal. Otherwise it is a Choice, Correction or AI claim.
- Verification only if the human says what they checked and how. Otherwise Acceptance, or no claim.

Superseded claims stay in the record, with the relation, ranked low.

## 3. Recall check

Before ranking, list for yourself every decision that changed the product or the plan. Each must map to a claim. Minor inputs may be dropped; **a key decision may never be dropped.** For `functional` products, keep only design-level decisions.

## 4. Rank

Order human claims, and separately AI claims, by influence. Signals, in rough order of weight:

1. **Downstream dependency** — how many later claims build on it.
2. **Reversal** — it supersedes or corrects an earlier direction.
3. **Scope** — premise or goal > design > detail > wording.
4. **Label** — Correction, Origination and Direction usually outrank Choice and Knowledge; Acceptance ranks lowest.

Mark the top 3 human claims as key, each with a *Why key* phrase of under 15 words that names the signal ("reversed the goal; reader view and policy follow from it").

## 5. Write

- Summary: at most 2 sentences about what the human did.
- Each claim: one idea, about 25 words at most, stated as the decision, plain words, jargon defined or avoided.
- IDs in conversation order; ranking reorders lines, never renumbers them.
- Add `supersedes`, `refines`, `led_to`, `depends_on` relations where clear, using `<session-id>#<ID>` for other sessions.
- More than about 12 human claims: still write the record, and add an Open question suggesting the session be split at a named boundary.

## 6. Self-check

Run the validator from this skill's folder and fix every error it reports:

```bash
node <skill-folder>/scripts/validate.mjs sessions/<member>/<session-id>.md
```

If `node` is not available, check by hand:

- [ ] Frontmatter complete; `approval: pending`
- [ ] Every Correction has `corrects:`; every Verification has `checked:`
- [ ] No human addition hidden inside an AI claim
- [ ] At most 3 key claims, each with *Why key*
- [ ] Summary plus key claims fit on one screen
- [ ] Every key decision from the recall list is present

## 7. Hand over for approval

- Write the file to `sessions/<member>/<session-id>.md`.
- Show the author the summary, the key claims, and counts: human claims, AI claims, never discussed, delegated.
- Approval by product type: `functional` → the author replies "ok" or lists corrections (`by-exception`); `endorsed` → the author ticks claims and endorsements in the file, the PR, or with `/claudo-approve`, the approval pane in Claude Code (`individual`).
- Apply the author's corrections exactly, note them in Links and evidence as `author: <change>`, and set `approval`.
- End your reply with the marker on its own line: `[claudoperation:captured <session-id>]`
