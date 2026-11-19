# Claudoperation session record format — v0.5

A session record is a short Markdown file that tells a teammate what a human did in one working session with Claude. It is written by Claude, approved by the human, and kept beside the product. It reads like a short page, not like data: a title, a summary, and claim tables. The metadata sits at the end, collapsed.

Worked examples: `examples/` in this folder. Validate a record with `node scripts/validate.mjs <record.md>`.

## 1. File

- Path: `sessions/<member>/<YYYY-MM-DD>-<slug>.md`
- The session ID is the filename stem, e.g. `2026-11-03-policy-format`.
- Records are append-only. A later change is a new claim in a later session that points back with a relation (section 5). Never renumber or rewrite an approved claim.
- No YAML frontmatter. GitHub draws frontmatter as a table at the top of the page, so metadata lives in the Record details block (section 2).

## 2. Record details

The last block of the file, collapsed: `<details><summary>Record details</summary>` holding a two-column table with these rows.

| Field | Required | Values |
| --- | --- | --- |
| `claudoperation` | yes | Format version, `0.5` |
| `session` | yes | The session ID |
| `member` | yes | Author's handle, same as the folder name |
| `product` | yes | What the session contributed to: a repo path, document, or PR |
| `product_type` | yes | `endorsed` or `functional` (section 8) |
| `span` | yes | `YYYY-MM-DD` or `YYYY-MM-DD → YYYY-MM-DD` |
| `approval` | yes | `pending`, `individual`, `by-exception`, `bulk` (section 7) |

## 3. Body, in this order

1. **Title** — `# <Member>: <topic in a few words>`.
2. **Summary** — one plain paragraph under the title, at most 2 sentences and about 70 words. It says what the human did, not what the AI produced, and it names what was worked on in terms an outsider understands: any project term it uses is defined inline (or linked to the repo's `GLOSSARY.md`, if there is one), never reused as session shorthand.
3. **`## What <Member> did`** — a table of at most 3 key human claims, the most influential first, each with a *Why key* phrase in Notes.
4. **`<details><summary>Also (N more)</summary>`** — the remaining human claims, ranked, in the same table format, collapsed. Omit if there are none.
5. **`## AI decisions`** — an accuracy checkbox line, then a table of AI claims ranked by influence (section 6).
6. **`<details><summary>Minor details (N)</summary>`** — optional; small items that fail the teammate test (section 4a). No boxes.
7. **`## Open questions`** — optional; unresolved items, one line each.
8. **`<details><summary>Links and evidence</summary>`** — optional; pointers into the product.
9. **`## Endorsements`** — optional; appended later by teammates (section 6).
10. **`## Session volume`** — optional; three plain figures about the session (section 10). Written at hand-over, only with the author's permission to read the session transcript.
11. **`<details><summary>Record details</summary>`** — the metadata (section 2). Always last.

The title, summary and key table must fit on one screen.

## 4. Human claims table

Two columns, so the claim gets most of the width:

```
| Approve | Claim |
| :-- | --- |
| ☐ H2<br>🛠️ Correction | <claim><br>**Why key:** <phrase><br>corrects: <what> |
```

- **Approve cell**: the box, the ID, and the type on a second line. The box is `☐` or `☑`; ticked means the author approves the claim as an accurate account of their contribution. (Task-list boxes do not render inside tables, so the record uses these characters.) The ID is `H1`, `H2`, … unique within the session, numbered in conversation order (so ranking does not renumber them). The type is the emoji and label word (below).
- **Claim cell**: the claim first, one idea, at most about 25 words, stated as the decision itself. Write a literal pipe as `\|`. Then, each on its own line after `<br>`: for key claims the context lines below and `**Why key:** <phrase>`, then relations (section 5), one per line.

### Key claims carry their own context

A teammate who was not in the session must be able to say what a key claim means from the record alone. So **only the (at most 3) key claims** may exceed the 25-word limit (up to about 50 words, the claim text stating what the thing is) and may add these lines after the claim, in this order, before `**Why key:**`:

| Line | Use |
| --- | --- |
| `**Before:** <text>` | what was there before, if a `corrects:` relation does not already say it. For a Correction, write `corrects:` in plain words so it serves as the "before", and omit `**Before:**`. |
| `**Now:** <text>` | what it became, if the claim states only the problem |
| `**Example:** <text>` | one concrete case, ideally one a reader can find in the product |

```
| ☐ H1<br>🎯 Direction | <claim, saying what the thing is><br>**Before:** <what was there><br>**Now:** <what it became><br>**Example:** <one concrete case><br>**Why key:** <phrase> |
```

Non-key claims stay short and take none of these lines: they are collapsed and read by people who want the detail. A term in the summary or a key claim is defined in place or linked to `GLOSSARY.md`. All three lines are optional, so v0.3 records stay valid.

### Labels

| Emoji | Label | The human… | Evidence required |
| --- | --- | --- | --- |
| 🎯 | Direction | set the goal or scope | — |
| 🔀 | Choice | picked one of several options the AI offered | — |
| 💡 | Origination | proposed an idea the AI had not | must not appear earlier in the session as an AI proposal |
| 🛠️ | Correction | fixed an AI error, assumption or proposal (a reversal of the human's own earlier decision is Direction with `supersedes:` or `refines:`) | a `corrects:` relation naming what was corrected |
| 📚 | Knowledge | supplied facts, data or experience the AI lacked | — |
| ✅ | Verification | actually checked output | a `checked:` relation saying what and how |
| 👍 | Acceptance | approved without substantive input | — |

One label per claim. A claim missing its required evidence falls back to the next weaker label. Validators read the label word; the emoji is for readers.

## 4a. Minor details

A human claim gets an Approve box only if it passes the **teammate test**: a teammate reading just this record would change what they do or believe. Premise, goal, scope, design, constraints, corrections of the AI, and facts others must know pass. Wording, naming, formatting, ordering and one-line tweaks do not.

Items that fail go in a collapsed block, plain bullets, no boxes, no labels, no relations:

```
<details><summary>Minor details (3)</summary>

- M1 Renamed 'Personnel' to 'Staff costs'.
- M2 Moved the footnote under the table.
- M3 AI: switched the table font to match the template (never discussed).

</details>
```

- IDs are `M1`, `M2`, …, unique within the session. AI-originated items start with `AI:` and may end with `(never discussed)` or `(delegated)`.
- They are covered by the one accuracy tick, worded `☐ All AI claims and minor details below are recorded accurately`. The line is required when the record has AI claims or minor details.
- They are not counted in the human:AI ratio and not used in the net story. A boxed item inside the block is a validation error.
- A claim that fails the test but is a key decision's evidence or is depended on by a boxed claim stays boxed.
- There is no fixed cap on boxed claims; the test decides. If more than about 12 still pass, capture suggests splitting the session.

## 5. Relations

Written in the claim cell, one line per relation after `<br>`:

| Relation | Meaning |
| --- | --- |
| `corrects: <text>` | the AI proposal or error this claim corrected (free text) |
| `checked: <text>` | what was verified and how |
| `supersedes: <ref>` / `superseded by: <ref>` | this claim replaces, or was replaced by, another |
| `refines: <ref>` / `refined by: <ref>` | narrows or extends another claim without replacing it |
| `led_to: <ref>` / `depends_on: <ref>` | causal links, used for ranking and later diagrams |

`<ref>` is `<session-id>#<ID>`, or `#<ID>` within the same session.

## 6. AI claims

```
☐ All AI claims below are recorded accurately

| Endorse | AI decision |
| :-- | --- |
| ☐ A1 | <claim><br>Never discussed |
```

- **ID**: `A1`, `A2`, … No label.
- The line above the table confirms all AI claims are accurately recorded (and the minor details, if the record has any: `All AI claims and minor details below are recorded accurately`). Each Endorse box means *endorsed*: a human checked the decision and agrees. Unticked means recorded, not reviewed.
- After the claim, on lines after `<br>`: `Never discussed` (the AI decided something the human never responded to), `Delegated, not reviewed` (the human explicitly left it to the AI), and any relations (section 5).
- Later endorsement by any teammate is appended, never edited in place:

```
## Endorsements
- <ID> endorsed by <member> on <YYYY-MM-DD> → checked: <what>
```

## 7. Approval modes

| `approval` | Meaning |
| --- | --- |
| `pending` | drafted, not yet reviewed |
| `individual` | the author ticked claims one by one |
| `by-exception` | the author replied "ok" or listed only corrections |
| `bulk` | "approve all" after confirmation |

Relabels, promotions or demotions between key and Also, and dropped claims are noted in Links and evidence as `author: <change>`.

## 8. Product types

| | `endorsed` (proposal, paper) | `functional` (working code) |
| --- | --- | --- |
| Human claims | all claims that pass the recall bar | design-level decisions only |
| AI claims | each with an endorse checkbox | accuracy checkbox only |
| Usual approval | `individual`, or ticked in the PR | `by-exception` |

## 9. Limits

- At most 3 key claims. Key claims may run to about 50 words and carry Before/Now/Example lines; every other claim is about 25 words with none.
- More than about 12 human claims in one record means the session should be split; capture says so.
- Summary at most 2 sentences, about 70 words, written for a reader who was not in the session.
- No prose narrative in a session record beyond the summary; narrative belongs to `synthesize`.
- Nothing a reader has to decode comes before the summary: no metadata, IDs or relations above it.

## 10. Session volume

An optional section just above Record details, written by capture in Claude Code (the only client that keeps a transcript with timestamps), and only after the author allows capture to read that transcript. Without permission, without the transcript, or in another client, the section is left out.

```
## Session volume

Volume only, not a measure of influence. Active time counts the gaps of up to 15 minutes between messages; a longer gap is a break.

| Active time | Human turns | Typed words |
| --- | --- | --- |
| 1 h 05 m | 24 | 1340 |
```

- **Active time** runs from the first human turn after the last capture marker to the last message, and counts the gap between two consecutive messages only when it is **at most 15 minutes**. A longer gap (lunch, overnight, a walk away) is a break and adds nothing, so a session left open for a day still reports the hours actually worked. The 15 is a judgement, not a measured value; it lives as `IDLE_MINUTES` in `hooks/transcript.js`. Written `1 h 05 m`, or `45 m` under an hour.
- **Human turns** are the messages the person sent, as the transcript marks them; tool results, system notices and hook output are not.
- **Typed words** are the words in those turns with pasted blocks (`<pasted_content>`) removed. Pasted text is not reported.
- These are volume figures, not influence: no ratio, no target, never used to rank or credit people. Absent from v0.3 and v0.4 records, which stay valid.

## Changelog

- **v0.5** — Optional `## Session volume` section (active time, human turns, typed words), written only with the author's permission to read the transcript. Active time ignores gaps over 15 minutes.

- **v0.4** — Outsider-readable records. The summary defines project terms in place (about 70 words); key claims may add `**Before:**`, `**Now:**` and `**Example:**` lines and run to about 50 words; capture's self-check gains an outsider test. No `audience:` policy option: the extra context is always written, since it is bounded to 3 key claims and a switch would invite the shorthand it replaces.
- **v0.3** — Minor details tier; table-format records.
