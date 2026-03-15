# SidePilot v3 — Dev Mode

<!--
╔══════════════════════════════════════════════════════════════╗
║  FOR AI AGENT                                                ║
║  Primary reader  : AI assistant / language model agent       ║
║  Purpose         : Define the proposed dev-only workflow     ║
║                    for diagnose / fix / verify loops        ║
║  Confidence      : MEDIUM — initial draft framework         ║
║  Last updated    : 2026-03-15                                ║
╚══════════════════════════════════════════════════════════════╝
-->

> **Related docs:** [ARCHITECTURE.md](ARCHITECTURE.md) · [BROWSER_CONTROL_API.md](BROWSER_CONTROL_API.md) · [MVP_TASKS.md](MVP_TASKS.md)

---

## Purpose

Dev Mode is the v3 capability tier that lets SidePilot help build, debug, and verify SidePilot itself inside a local development workspace.

This mode should support a narrow but high-value loop:

1. observe a problem
2. collect evidence
3. inspect relevant code
4. propose a likely cause
5. apply an approved patch
6. run focused verification
7. report the outcome

It is a workspace-oriented feature, not the default end-user operating mode.

---

## Scope Boundary

| Area | In scope | Out of scope for initial draft |
|------|----------|--------------------------------|
| Repo access | Local SidePilot workspace | Arbitrary remote repositories |
| Runtime control | Extension reload, bridge checks, focused test commands | Broad system administration |
| Browser interaction | Reproduce and verify SidePilot behavior | Unbounded browsing automation |
| Code changes | Minimal approved patches in workspace | Automatic commit/push by default |

---

## Capability Tiers

| Tier | Meaning |
|------|---------|
| Observe | Read page context, runtime state, logs, and code |
| Diagnose | Correlate browser/runtime evidence with likely code hotspots |
| Fix | Apply approved local patches in the SidePilot workspace |
| Verify | Run focused tests, reload, and re-check browser behavior |

Dev Mode should expose which tier is active and why a higher tier is needed before escalation.

---

## Suggested Workflow

| Step | Intent |
|------|--------|
| Reproduce | Confirm the issue on the current page or extension surface |
| Capture evidence | Gather snapshot, console, network, and bridge/runtime clues |
| Map to code | Identify likely files and implementation boundaries |
| Propose fix | Summarize hypothesis, touched files, and validation plan |
| Apply patch | Make the smallest useful approved code change |
| Verify | Run focused checks and compare before/after evidence |
| Summarize | Report what changed, what passed, and what remains uncertain |

---

## Approval Model

| Action | Expected policy |
|--------|-----------------|
| Read code and inspect browser/runtime state | Allowed in dev observe mode |
| Patch workspace files | Requires explicit approval |
| Run tests/builds that may affect local caches | Allowed when scoped and explained |
| Destructive actions or broad system changes | Blocked by default unless separately approved |

The approval UI should make it obvious whether the agent is only observing, preparing a fix, or actually mutating repo state.

---

## Audit And Reporting

Every dev-mode run should preserve a compact audit trail.

| Record | Why it matters |
|--------|----------------|
| Observed issue summary | Establishes the starting point |
| Evidence references | Explains why the hypothesis was formed |
| Files changed | Keeps the patch boundary explicit |
| Commands run | Shows how verification happened |
| Result summary | Distinguishes fixed, blocked, or partially verified outcomes |

---

## Safety Constraints

- Dev Mode should be clearly disabled outside approved development contexts.
- Workspace mutation should stay inside the intended SidePilot repo unless the user explicitly widens scope.
- Approval should be re-requested for materially broader follow-up changes rather than assumed from the first patch.

---

## Current Open Decisions

1. How should Dev Mode be enabled and surfaced in the extension UI without leaking into normal usage?
2. Which verification actions belong in-browser versus in the bridge/local runtime?
3. What audit format is sufficient for MVP: chat transcript only, structured log, or both?
