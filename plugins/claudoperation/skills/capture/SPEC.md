# Claudoperation session record format — v0.1

A session record is a short Markdown file that tells a teammate what a human did in one working session with Claude. It is written by Claude, approved by the human, and kept beside the product.

Worked examples: `examples/` in this folder. Validate a record with `node scripts/validate.mjs <record.md>`.

## 1. File

- Path: `sessions/<member>/<YYYY-MM-DD>-<slug>.md`
- The session ID is the filename stem, e.g. `2026-11-03-policy-format`.
- Records are append-only. A later change is a new claim in a later session that points back with a relation (section 5). Never renumber or rewrite an approved claim.

## 2. Frontmatter

| Field | Required | Values |
| --- | --- | --- |
| `claudoperation` | yes | Format version, `0.1` |
| `session` | yes | The session ID |
| `member` | yes | Author's handle, same as the folder name |
| `product` | yes | What the session contributed to: a repo path, document, or PR |
| `product_type` | yes | `endorsed` or `functional` (section 8) |
| `span` | yes | `YYYY-MM-DD` or `YYYY-MM-DD → YYYY-MM-DD` |
| `approval` | yes | `pending`, `individual`, `by-exception`, `bulk` (section 7) |

## 3. Body, in this order

1. **Summary** — one paragraph starting `**Summary.**`, at most 2 sentences and about 60 words. It says what the human did, not what the AI produced.
2. **`## What <member> did — key`** — at most 3 human claims, the most influential first, each with a *Why key* phrase.
3. **`<details><summary>Also (N more)</summary>`** — the remaining human claims, ranked, inside a collapsed block. Omit if there are none.
4. **`## AI decisions`** — an accuracy checkbox, then AI claims ranked by influence (section 6).
5. **`## Open questions`** — optional; unresolved items, one line each.
6. **`<details><summary>Links and evidence</summary>`** — optional; pointers into the product.
7. **`## Endorsements`** — optional; appended later by teammates (section 6).

The summary plus the key claims must fit on one screen.

## 4. Human claim line

```
- [ ] <ID> · <emoji> <Label> · <claim>[ → <relation>: <ref>][. *Why key: <phrase>.*]
```

- `<ID>`: `H1`, `H2`, … unique within the session, numbered in conversation order (so ranking does not renumber them).
- `<claim>`: one idea, at most about 25 words, stated as the decision itself.
- *Why key* appears only on key claims.
- Checkbox ticked = the author approves the claim as an accurate account of their contribution.

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

Written after `→`, comma-separated:

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
- [ ] All AI claims below are recorded accurately

Tick to endorse:
- [ ] <ID> · <claim>[ — never discussed | — delegated, not reviewed][ → <relation>: <ref>]
```

- `<ID>`: `A1`, `A2`, … No label in v0.1.
- The first checkbox confirms all AI claims are accurately recorded. Each later checkbox means *endorsed*: a human checked the decision and agrees. Unticked means recorded, not reviewed.
- `— never discussed`: the AI decided something the human never responded to.
- `— delegated, not reviewed`: the human explicitly left it to the AI.
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
- No prose narrative in a session record; narrative belongs to `synthesize`.
