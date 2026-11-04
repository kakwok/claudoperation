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

Path: `sessions/<member>/net/<YYYY-MM-DD>-net.md`. Frontmatter:

```
---
claudoperation: 0.1
kind: net-story
member: <member>
covers: <first-session-id> → <last-session-id>
release: false
approval: pending
---
```

Body, in this order (the reader's order):

1. `## What <member> contributed`: approved human claims that survive, with labels, ranked, with `<session>#<ID>` refs.
2. `## Net story`: the narrative from step 3.
3. `## Open questions`: from records, plus unapproved records.
4. `## AI decisions not yet reviewed`: unticked AI claims with refs; mark never discussed / delegated.
5. `<details><summary>Metadata</summary>`: stats output as a table (sessions, labels, human:AI ratio, superseded, bulk approvals, relabels, overrides).

Between releases it stays `approval: pending` and is labeled **unapproved** at the top. It is derived, not authoritative.

## 5. Release (only if the author asks)

When the author approves the story, set `release: true`, `approval: individual`, and record the version label they give (e.g. `v1-proposal`). Commit it together with the README update. Never release on your own.

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
