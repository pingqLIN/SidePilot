# SidePilot v3 — Repo Split Handoff Template

<!--
╔══════════════════════════════════════════════════════════════╗
║  FOR AI AGENT                                                ║
║  Primary reader  : AI assistant / engineer                   ║
║  Purpose         : Provide a standard handoff package        ║
║                    template for the moment SidePilot v3      ║
║                    becomes ready for a dedicated repository  ║
║  Confidence      : HIGH — operational handoff template       ║
║  Last updated    : 2026-03-15                                ║
╚══════════════════════════════════════════════════════════════╝
-->

> **Related docs:** [MIGRATION_STRATEGY.md](MIGRATION_STRATEGY.md) · [AGENT_CHECKPOINTS.md](AGENT_CHECKPOINTS.md) · [ARCHITECTURE.md](ARCHITECTURE.md)

---

## Purpose

This file is the standard template an Agent should use once SidePilot v3 is considered ready to move into a dedicated repository.

It is meant to reduce ambiguity at split time by ensuring that the same essential information is always handed off:

- why the split is happening now
- what parts of v3 are already proven
- what still remains incomplete
- what the new repository should contain first

---

## When To Use This Template

Use this template only after the split checkpoint in [MIGRATION_STRATEGY.md](MIGRATION_STRATEGY.md) is satisfied.

That means Agents should first confirm:

- V3-A is validated
- V3-B is validated
- V3-C is validated
- cross-cutting safety requirements are satisfied
- v3 works as a coherent real flow rather than disconnected experiments

If those conditions are not met, do **not** use this template as if repo split were already justified.

---

## Suggested Output Title

Use a title like:

`SidePilot v3 Repo Split Handoff — YYYY-MM-DD`

---

## Handoff Template

Copy the structure below when preparing the actual split package.

---

## 1. Split Decision Summary

### Recommended action

- [ ] Open a dedicated repository for SidePilot v3
- [ ] Keep v3 in the current repository for now

### Reason for current recommendation

<!-- Summarize why the checkpoint passed or failed. -->

### Decision date

- Date:
- Evaluating agent:

---

## 2. Checkpoint Outcome

### Baseline operational status

- V3-A Ambient Context: `not-started | in-progress | validated | blocked`
- V3-B Browser Evidence/Action: `not-started | in-progress | validated | blocked`
- V3-C Dev Mode: `not-started | in-progress | validated | blocked`
- V3-D Unified Workspace: `not-started | in-progress | validated | blocked`

### Safety status

- Safety / policy boundary status:
- Approval model status:
- Audit trail status:

### Short conclusion

<!-- One paragraph maximum. -->

---

## 3. Evidence That Triggered The Split

List the real flows that prove v3 is ready for separation.

### Proven flow 1

- Scenario:
- What the browser runtime did:
- What the local runtime did:
- Evidence collected:
- Outcome:

### Proven flow 2

- Scenario:
- What the browser runtime did:
- What the local runtime did:
- Evidence collected:
- Outcome:

### Optional additional flows

- Scenario:
- Evidence:
- Outcome:

---

## 4. Architecture Snapshot At Split Time

### Current v3 thesis

<!-- Short summary of what SidePilot v3 has become in practice. -->

### Confirmed active subsystems

- [ ] Live page context system
- [ ] Prompt pipeline support for live page context
- [ ] Browser evidence plane
- [ ] Browser interaction plane
- [ ] Dev mode diagnose/fix/verify loop
- [ ] Shared task context / unified workspace support

### Important architectural decisions already made

- Browser control model:
- Context packet schema version:
- Dev-mode scope boundary:
- Approval / policy model:

---

## 5. Current Proven Files And Areas

Document the code areas that are already known to matter.

### Extension-side areas

- `extension/...`
- `extension/js/...`
- Notes:

### Bridge-side areas

- `scripts/copilot-bridge/...`
- Notes:

### V3-specific areas

- `docs/v3/...`
- `v3/...`
- Notes:

---

## 6. Contracts And Schemas To Carry Forward

### Required documents

- [ ] `docs/v3/ARCHITECTURE.md`
- [ ] `docs/v3/PAGE_CONTEXT_MODEL.md`
- [ ] `docs/v3/BROWSER_CONTROL_API.md`
- [ ] `docs/v3/DEV_MODE.md`
- [ ] `docs/v3/MVP_TASKS.md`
- [ ] `docs/v3/MIGRATION_STRATEGY.md`
- [ ] `docs/v3/AGENT_CHECKPOINTS.md`

### Required machine-readable contracts

- [ ] `v3/shared/schemas/page-context.v1.schema.json`
- [ ] Other schema(s):

### Notes on contract stability

<!-- Which contracts are stable, provisional, or due for revision? -->

---

## 7. What Is Still Incomplete

This section is required so the split does not falsely imply full completion.

### Known unfinished items

- Item:
- Why it is still open:
- Risk level:

### Known architectural uncertainties

- Decision still open:
- Affected area:
- Why it matters:

### Known implementation risks

- Risk:
- Surface impacted:
- Mitigation idea:

---

## 8. Recommended Initial Repository Shape

### Suggested repository name

- Preferred name:
- Alternate name:

### Suggested top-level structure

```text
sidepilot-v3/
  docs/
  extension/
  bridge/
  shared/
  tests/
```

### Notes on mapping from current repo

- What should move first:
- What can remain behind temporarily:
- What should be copied versus redesigned:

---

## 9. Release And Scope Recommendation

### Recommended initial positioning

- [ ] experimental v3 line
- [ ] internal preview
- [ ] developer preview
- [ ] public alpha

### Scope boundary for the new repo

- In scope immediately:
- Deferred after split:
- Explicitly out of scope:

---

## 10. Migration Plan From Current Repo

### Step sequence

1. Freeze or tag the current v3 checkpoint in the existing repo
2. Prepare the initial v3 file set
3. Establish the new repository structure
4. Move or copy validated contracts and implementation areas
5. Reconnect tests, docs, and validation paths
6. Publish a split summary and remaining gaps

### Validation after split

- [ ] docs still align with implementation
- [ ] schemas validate correctly
- [ ] at least one real v3 flow still works after separation
- [ ] dev-mode verification path still works in the new repo

---

## 11. Handoff Summary

### One-paragraph summary

<!-- Final human-readable handoff paragraph. -->

### Final recommendation

- [ ] Proceed with dedicated v3 repository
- [ ] Delay repo split and continue incubating in current repo

---

## One-Sentence Rule

**Use this template only when SidePilot v3 is already operational enough that repo split is a packaging decision, not a wishful architecture bet.**
