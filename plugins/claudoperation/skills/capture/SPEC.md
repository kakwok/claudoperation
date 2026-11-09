# Claudoperation session record format — v0.2

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
| `claudoperation` | yes | Format version, `0.2` |
| `session` | yes | The session ID |
| `member` | yes | Author's handle, same as the folder name |
| `product` | yes | What the session contributed to: a repo path, document, or PR |
| `product_type` | yes | `endorsed` or `functional` (section 8) |
| `span` | yes | `YYYY-MM-DD` or `YYYY-MM-DD → YYYY-MM-DD` |
| `approval` | yes | `pending`, `individual`, `by-exception`, `bulk` (section 7) |

## 3. Body, in this order

1. **Title** — `# <Member>: <topic in a few words>`.
2. **Summary** — one plain paragraph under the title, at most 2 sentences and about 60 words. It says what the human did, not what the AI produced.
3. **`## What <Member> did`** — a table of at most 3 key human claims, the most influential first, each with a *Why key* phrase in Notes.
4. **`<details><summary>Also (N more)</summary>`** — the remaining human claims, ranked, in the same table format, collapsed. Omit if there are none.
5. **`## AI decisions`** — an accuracy checkbox line, then a table of AI claims ranked by influence (section 6).
6. **`## Open questions`** — optional; unresolved items, one line each.
7. **`<details><summary>Links and evidence</summary>`** — optional; pointers into the product.
8. **`## Endorsements`** — optional; appended later by teammates (section 6).
9. **`<details><summary>Record details</summary>`** — the metadata (section 2). Always last.

The title, summary and key table must fit on one screen.

## 4. Human claims table

Two columns, so the claim gets most of the width:

```
| Approve | Claim |
| :-- | --- |
| ☐ H2<br>🛠️ Correction | <claim><br>**Why key:** <phrase><br>corrects: <what> |
```

- **Approve cell**: the box, the ID, and the type on a second line. The box is `☐` or `☑`; ticked means the author approves the claim as an accurate account of their contribution. (Task-list boxes do not render inside tables, so the record uses these characters.) The ID is `H1`, `H2`, … unique within the session, numbered in conversation order (so ranking does not renumber them). The type is the emoji and label word (below).
- **Claim cell**: the claim first, one idea, at most about 25 words, stated as the decision itself. Write a literal pipe as `\|`. Then, each on its own line after `<br>`: for key claims `**Why key:** <phrase>`, then relations (section 5), one per line.

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

- **ID**: `A1`, `A2`, … No label in v0.2.
- The line above the table confirms all AI claims are accurately recorded. Each Endorse box means *endorsed*: a human checked the decision and agrees. Unticked means recorded, not reviewed.
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

- At most 3 key claims.
- More than about 12 human claims in one record means the session should be split; capture says so.
- Summary at most 2 sentences.
- No prose narrative in a session record beyond the summary; narrative belongs to `synthesize`.
- Nothing a reader has to decode comes before the summary: no metadata, IDs or relations above it.
