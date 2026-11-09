---
name: synthesize
description: Write a member's net story (A to C) from their approved Claudoperation session records, optionally tag it as a release, and refresh their README section. Use when the user runs /synthesize or asks to summarize, roll up or release their sessions for teammates.
---

# Synthesize a net story

You turn one member's session records (`sessions/<member>/*.md`, format in `../capture/SPEC.md`) into a **net story**: what changed from the first record to the latest, so a reader can skip the steps in between. You only restate approved claims. **Never ask the author questions while drafting**; unclear items go under Open questions.

Read `../capture/SPEC.md` first. Narrative belongs here, not in session records.

## 1. Scope

- Member: the user's handle, or the folder named in the request.
- Records: everything in `sessions/<member>/` after the last release (`releases/<member>/*.md` newest `covers_to`). With no release yet, all records.
- Only **ticked** claims enter the story. A `pending` record contributes nothing; list it as an Open question ("N records not yet approved").
- With fewer than 2 approved records, say a net story adds little and stop unless the author insists.

## 2. Get the numbers

Do not count by hand. Run:

```bash
node <skill-folder>/scripts/stats.mjs sessions/<member>
```

If `node` is unavailable, count from the records and say the counts were manual.

## 3. Build the net story

1. Collect approved human claims. Drop any that are **superseded** (another claim points `supersedes:` at it). They vanish from the story but stay in the counts.
2. For `refines:` chains, state only the final form.
3. Group what remains by decision, ranked by influence (downstream dependency, reversal, scope, label), as in capture.
4. Write the story as the change from A to C: where the work stood, what the human decided, where it stands now. At most about 300 words, one idea per sentence, jargon defined, led by the decision.
5. Never add a claim, relation or label that is not in an approved record. AI claims appear only in "AI decisions not yet reviewed" unless endorsed.

## 4. Write the file

Path: `sessions/<member>/net/<YYYY-MM-DD>-net.md`. It reads like a short page, not like data: no frontmatter, no IDs or metadata before the story. Same rule as records (`../capture/SPEC.md` §1 to §3).

Body, in this order (the reader's order):

1. `# <Member>: net story to <last-session-date>`, then a one-line banner: `> **Unapproved draft.** Derived from approved records.` (or `**Release <label>.**`).
2. `## What <Member> contributed`: a table of the approved human claims that survive, ranked. Two columns, `Type | Claim`: the emoji and label, then the claim with its source (`<session-id>#<ID>`) on a second line after `<br>`. No checkboxes: approval already happened in the records.
3. `## Net story`: the narrative from step 3.
4. `## Open questions`: from records, plus unapproved records.
5. `## AI decisions not yet reviewed`: a one-column table, unticked AI claims only: the decision, then its source and "Never discussed" or "Delegated" on lines after `<br>`.
6. `<details><summary>Counts</summary>`: stats output as a two-column table (sessions, labels, human:AI ratio, superseded, bulk approvals, relabels, overrides).
7. `<details><summary>Record details</summary>`: a Field / Value table with rows `kind` = `net-story`, `member`, `covers` (`<first-session-id> → <last-session-id>`), `release` (`false`), `approval` (`pending`). Always last.

Between releases it stays `approval: pending` and carries the unapproved banner. It is derived, not authoritative.

## 5. Release (only if the author asks)

When the author approves the story, set `release` to `true`, `approval` to `individual` in Record details, change the banner, and record the version label they give (e.g. `v1-proposal`). Commit it together with the README update. Never release on your own.

## 6. Update the README section

Rewrite only the text between these markers in the repo `README.md`, creating the block once if missing:

```
<!-- claudoperation:<member>:start -->
...
<!-- claudoperation:<member>:end -->
```

Contents, at most about five lines:

- Session count and label counts (approved claims)
- Human:AI claim ratio, with the words "informational, not a target"
- Latest net story: 1 to 2 sentences and a link, marked unapproved unless released
- Unreviewed AI decisions count, bulk approvals, relabels, overrides

Do not touch anything outside the markers.

## 7. Hand over

Show the author the net story, the README block, and the counts. Apply corrections exactly. End with: files written, and whether it is a release or an unapproved draft. Nudge the author to run `/synthesize` again after about 5 more captures.
