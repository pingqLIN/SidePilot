# SidePilot v3 — Dual-Channel Agent Architecture

<!--
╔══════════════════════════════════════════════════════════════╗
║  FOR AI AGENT                                                ║
║  Primary reader  : AI assistant / language model agent       ║
║  Purpose         : Define SidePilot v3 as a new project      ║
║                    direction with browser + CLI dual runtime ║
║  Confidence      : HIGH — strategic design draft             ║
║  Last updated    : 2026-03-15                                ║
╚══════════════════════════════════════════════════════════════╝
-->

> **Status:** Proposed new project line for the next major generation of SidePilot.
>
> **Naming:** Product name remains **SidePilot**.
>
> **Version line:** This document defines the **v3** vision.

---

## Project Identity

| Field | Value |
| ----- | ----- |
| Name | SidePilot |
| Version line | v3 |
| Positioning | Browser-native AI agent workspace with local development control |
| Core idea | One agent, two control channels: browser runtime + local CLI/runtime |
| Success metric | The agent can understand the current page, operate the browser, inspect itself, patch related code, and verify fixes in a closed loop |

---

## Why v3 Exists

SidePilot v0.5.x / v2 architecture already proved that:

- a Chrome side panel is a practical home for AI assistance
- official SDK mode via local bridge is viable
- memory, rules, and page capture improve task quality

However, the current product still has two major workflow gaps:

1. **Page understanding is too manual**
   - useful browser context often requires explicit capture actions
   - the agent does not continuously understand what the user is reading
   - context transfer is step-based instead of ambient

2. **Self-iteration is too fragmented**
   - the extension is developed with AI assistance, but validation remains manual
   - debugging requires switching between code edits, extension reloads, browser inspection, and repeated re-checks
   - the agent cannot yet observe, diagnose, fix, and verify in one unified loop

v3 exists to close these two gaps.

---

## Product Thesis

**SidePilot v3 is not only a side panel. It is a dual-channel agent runtime.**

The same agent should be able to:

- understand the active browser page without requiring manual capture every time
- collect richer runtime evidence from the browser layer
- use local tools and code access through a CLI/bridge runtime
- fix extension and bridge issues after diagnosis and approval
- validate those fixes by observing actual browser behavior

This turns SidePilot from a passive UI shell into an active browser-development copilot.

---

## Core Concept: Dual-Channel Runtime

### Channel A — Browser Runtime

Runs inside or next to the browser environment.

Responsibilities:

- observe current page context
- extract structured page knowledge
- monitor navigation, selection, focus, DOM state, and user-visible changes
- optionally perform low-risk browser interactions
- provide real-time context to the agent

### Channel B — Local Runtime

Runs through the local bridge / CLI / development environment.

Responsibilities:

- inspect repository code
- edit extension / bridge code
- run tests and validation commands
- orchestrate browser automation or CDP-style inspection
- close the fix-verify loop for SidePilot development

### Combined Behavior

The agent is considered fully capable only when both channels can cooperate:

- Browser Runtime answers: **"what is happening now?"**
- Local Runtime answers: **"what should change, and did it work?"**

---

## v3 Experience Goals

### 1. Ambient Page Awareness

The agent should know what the user is currently reading with minimal friction.

Desired behavior:

- detect active tab changes
- understand page title, URL, route, semantic sections, code blocks, tables, selected text
- summarize the page into an agent-friendly context packet
- let the user preview what context will be injected
- reduce dependence on explicit "capture page" actions

### 2. Browser Control with Evidence

The agent should be able to operate the browser with traceable evidence.

Desired behavior:

- inspect DOM and visible UI state
- observe console and network summaries
- click, type, navigate, wait, and verify when allowed
- attach evidence to diagnosis rather than relying on guesses

### 3. Self-Hosted Development Loop

The agent should help build and debug SidePilot itself.

Desired behavior:

- reproduce extension/runtime issues
- inspect code and runtime state together
- patch related files in `extension/` or `scripts/copilot-bridge/`
- run tests and focused validation
- reload / re-check / re-run until the issue is fixed or blocked

### 4. Permissioned Autonomy

The system must remain understandable and controllable.

Desired behavior:

- clear boundaries for observation vs action vs code modification
- explicit approval for high-risk actions
- environment-based restrictions for dev-only behaviors
- transparent logs of what the agent observed and changed

---

## Non-Goals for v3 MVP

To avoid turning v3 into an uncontrolled mega-project, the MVP should **not** attempt all of the following at once:

- full autonomous browsing across arbitrary websites with no approval boundaries
- broad remote cloud orchestration outside the local machine
- automatic commits / pushes / PR creation by default
- replacing Chrome DevTools completely
- perfect understanding of all page types from day one
- unrestricted background surveillance of browser activity

---

## Proposed Architecture

```text
┌────────────────────────────────────────────────────────────┐
│                     SidePilot v3                          │
├────────────────────────────────────────────────────────────┤
│  Side Panel UI                                            │
│  - chat                                                   │
│  - live page context                                      │
│  - dev/runtime status                                     │
│  - approval / action log                                  │
├────────────────────────────────────────────────────────────┤
│  Extension Control Layer                                  │
│  - mode / policy / permissions                            │
│  - current task context                                   │
│  - page context cache                                     │
│  - browser event routing                                  │
├────────────────────────────────────────────────────────────┤
│  Browser Runtime Channel                                  │
│  - content scripts                                        │
│  - DOM / route / selection observers                      │
│  - lightweight page extraction                            │
│  - optional browser action adapters                       │
├────────────────────────────────────────────────────────────┤
│  Local Runtime Channel                                    │
│  - bridge server                                          │
│  - CLI / repo access                                      │
│  - tests / validation                                     │
│  - browser automation / DevTools integration              │
├────────────────────────────────────────────────────────────┤
│  Agent Orchestration Layer                                │
│  - diagnosis                                              │
│  - planning                                               │
│  - action selection                                       │
│  - evidence synthesis                                     │
│  - fix / verify loop                                      │
└────────────────────────────────────────────────────────────┘
```

---

## Key Subsystems

### 1. Live Page Context System

A new subsystem that continuously derives structured page context.

Possible inputs:

- active tab metadata
- URL and route transitions
- document title
- selected text
- semantic headings
- paragraphs / lists / tables
- code blocks / pre tags
- forms and focused elements
- viewport location / scroll segment
- page-level annotations from the user

Output shape should be compact and structured, for example:

- `page identity`
- `semantic summary`
- `selected region`
- `notable code blocks`
- `page intent guess`
- `confidence / freshness`

This is not a raw-DOM dump. It is a **distilled context packet**.

---

### 2. Browser Action Plane

A capability plane for interacting with the browser when authorized.

Potential actions:

- navigate
- click
- type
- press key
- inspect DOM
- take snapshot
- capture screenshot
- collect console and network summaries
- verify visible state

This plane should always preserve an evidence trail:

- what was attempted
- on which page
- with what result
- what changed after the action

---

### 3. Dev Fix Loop

A new development-oriented workflow for SidePilot itself.

Loop:

1. Observe issue in browser/runtime
2. Collect evidence
3. Read affected code
4. Propose likely root cause
5. After approval, patch minimal relevant files
6. Run focused validation
7. Reload / re-check browser state
8. Repeat until fixed or blocked

This is the capability that makes SidePilot a self-improving development environment rather than a passive assistant.

---

### 4. Policy & Safety Layer

A first-class permissions model is mandatory.

#### Suggested capability tiers

| Tier | Name | Allowed behaviors |
| ---- | ---- | ----------------- |
| L1 | Observe | Read page context, summarize, inspect state |
| L2 | Assist | Suggest actions, perform low-risk browser actions with approval |
| L3 | Dev Fix | Modify local SidePilot code, run validation, reload / retest in dev mode |
| L4 | Autopilot Dev (optional future) | Multi-step diagnose-fix-verify loop under tightly constrained dev settings |

#### Safety rules

- high-risk actions require explicit confirmation
- destructive actions require impact explanation first
- code modification is limited to approved workspace scope
- browsing observation should be visible and user-controllable
- logs must show what context was captured and why

---

## Suggested Repository Direction

This can be treated as a new project line while keeping the same product name.

### Practical interpretation

- **Product name stays:** `SidePilot`
- **Repo name stays:** `SidePilot`
- **Project line changes:** the current repo hosts both the shipped `v0.5.x / v2` line and the planned `SidePilot v3` line
- the existing v0.5.x / v2 foundation is reused selectively, not assumed to be final

### Likely repo strategy options

#### Option A — Evolve in-place

- keep current repository
- introduce `v3` documents and subsystems incrementally
- preserve backward compatibility where useful

#### Option B — New app line inside same repo

- add a dedicated `v3/` or `packages/` structure
- let the current extension remain stable while v3 is prototyped beside it
- best when architecture divergence is large

#### Option C — Separate repo later

- use this repo for design + spike work
- split when v3 architecture stabilizes

**Current recommendation:** start with **Option B mindset**, even if the physical split is not immediate.
This keeps experimental v3 work from destabilizing the working product too early.

---

## Proposed v3 Milestones

### Milestone V3-A — Ambient Context MVP

Goal: remove the need for manual page capture as the primary context path.

Deliverables:

- live page observation toggle
- active tab + route awareness
- structured page context packet
- side panel preview of current page context
- SDK prompt pipeline support for `[Live Page Context]`

Success criteria:

- users can ask page-related questions without pressing capture first
- injected page context is inspectable and bounded
- the feature works on common documentation / article / GitHub pages

---

### Milestone V3-B — Browser Control Plane

Goal: give the agent bounded browser action + evidence collection.

Deliverables:

- browser action API surface
- DOM / console / network evidence collection
- action result logging
- permission prompts for active interactions

Success criteria:

- the agent can reproduce common UI steps with traceable evidence
- the user can review what was done and why
- failures produce useful diagnostics rather than silent action attempts

---

### Milestone V3-C — Self-Iteration Dev Mode

Goal: let SidePilot help build and debug itself.

Deliverables:

- dev-mode gating
- diagnose-fix-verify workflow
- integration with local tests / reload / browser checks
- explicit approval boundary for code changes

Success criteria:

- the agent can fix a narrow class of SidePilot issues end-to-end
- each fix includes code diff + runtime verification summary
- the loop reduces manual switching cost for iterative development

---

### Milestone V3-D — Unified Agent Workspace

Goal: make browser work and development work feel like one coherent environment.

Deliverables:

- shared task context between page work and repo work
- better status surfaces in side panel
- history of actions, observations, and fixes
- stronger multi-step orchestration

Success criteria:

- users can move from reading → diagnosing → changing → verifying in one continuous flow

---

## MVP Recommendation

If only one v3 slice is started now, begin with:

1. **Live Page Context System**
2. **Prompt pipeline support for page context**
3. **Policy model for observe vs act vs fix**

Why this first:

- highest user-facing value per unit complexity
- directly solves current manual capture friction
- creates the data foundation needed for later browser control and self-iteration

---

## Implementation Impact Areas

### Extension-side likely hotspots

- `extension/js/automation.js`
- `extension/js/storage-manager.js`
- `extension/js/connection-controller.js`
- `extension/js/sdk-chat.js`
- `extension/sidepanel.js`
- additional content scripts or observation modules

### Bridge-side likely hotspots

- `scripts/copilot-bridge/src/server.ts`
- `scripts/copilot-bridge/src/session-manager.ts`
- possible new browser-control service modules
- supervisor/runtime coordination for dev automation

---

## Open Questions

These should be answered before major implementation begins:

1. Should v3 browser control be extension-led, bridge-led, or hybrid?
2. Should browser automation rely on CDP, Playwright, extension APIs, or all three under one abstraction?
3. What exact page context schema should be injected into prompts?
4. How should privacy boundaries be surfaced to users when live observation is enabled?
5. Should v3 coexist with `iframe` mode, or treat it as legacy / optional?
6. Should dev-mode self-fix be a workspace-only feature rather than a general user feature?

---

## Recommended Next Artifacts

After this document, the next useful documents are:

- `docs/v3/README.md`
- `docs/v3/PAGE_CONTEXT_MODEL.md`
- `docs/v3/BROWSER_CONTROL_API.md`
- `docs/v3/DEV_MODE.md`
- `docs/v3/MVP_TASKS.md`
- `docs/v3/MIGRATION_STRATEGY.md`

---

## One-Sentence Summary

**SidePilot v3 keeps the SidePilot name, but redefines the product as a dual-channel agent system that can understand the browser from within, operate it with evidence, and improve its own extension/bridge workflow through a local development loop.**
