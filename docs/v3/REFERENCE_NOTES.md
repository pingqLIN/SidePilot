# SidePilot v3 — External Reference Notes

<!--
╔══════════════════════════════════════════════════════════════╗
║  FOR AI AGENT                                                ║
║  Primary reader  : AI assistant / engineer                   ║
║  Purpose         : Summarize useful external project         ║
║                    patterns for SidePilot v3 planning        ║
║  Confidence      : MEDIUM — comparative design notes         ║
║  Last updated    : 2026-03-15                                ║
╚══════════════════════════════════════════════════════════════╝
-->

> **Scope:** Notes from reviewing `vercel-labs/agent-browser` and `hydro13/tandem-browser`.
>
> **Intent:** Identify what SidePilot v3 should borrow, adapt, or explicitly avoid.
>
> **Not intent:** Reframe SidePilot as a standalone browser shell.

---

## Why This Note Exists

SidePilot v3 already has a clear internal direction:

- ambient live page context
- bounded browser control with evidence
- dev-mode diagnose / fix / verify loops

The two external projects reviewed here are useful because they each solve a different half of that problem:

- `agent-browser` is strong at **agent-friendly browser interaction contracts**
- `tandem-browser` is strong at **local-first browser architecture and security boundaries**

The best SidePilot v3 path is not to copy either project wholesale. The best path is to combine selected patterns from both.

---

## Quick Summary

| Project | Most useful lesson for SidePilot v3 | Main caution |
| ------- | ----------------------------------- | ------------ |
| `agent-browser` | Give the agent a compact, deterministic interaction surface such as `snapshot + @refs + diff` | Its default security posture is opt-in, so SidePilot should not copy that permissiveness blindly |
| `tandem-browser` | Treat human-visible browsing and agent control as separate layers with explicit safety boundaries | It is a full Electron browser; SidePilot should avoid inheriting that product scope |

---

## Project A — `agent-browser`

Repository:

- <https://github.com/vercel-labs/agent-browser>

### What stands out

`agent-browser` succeeds because it makes browser automation easy for LLMs to reason about.

Key patterns:

- accessibility-tree snapshots instead of raw DOM dumps
- stable `@ref` handles for follow-up actions
- semantic locators such as role, label, placeholder, and text
- built-in snapshot and screenshot diff flows for verification
- session and auth-state workflows designed for agents
- optional security controls such as domain allowlists, action policy, output boundaries, and confirmation gates

### What SidePilot v3 should borrow

#### 1. `snapshot + @refs` as the first inspect/action contract

This is the highest-value pattern to adopt for the v3 browser action plane.

Why it fits:

- it matches the `inspect` and `interact` capability groups in `BROWSER_CONTROL_API.md`
- it gives the agent deterministic targets without forcing CSS selector generation
- it creates a compact evidence format that can be logged, diffed, and reviewed

For SidePilot, this suggests an MVP action sequence like:

1. `inspect.snapshot`
2. resolve `@ref`
3. `interact.click` or `interact.type`
4. `verify.diff_snapshot`

#### 2. Diff-driven verification

The `diff snapshot` and `diff screenshot` model maps neatly to SidePilot's evidence contract.

Useful SidePilot v3 adaptation:

- collect `before` snapshot
- perform action
- collect `after` snapshot or screenshot
- produce a compact `changesObserved` summary

This is likely the fastest path from "the agent clicked something" to "the agent can prove what changed."

#### 3. Semantic locators as a compatibility layer

Even if SidePilot prefers `@refs`, semantic finders remain useful:

- `find role button --name "Submit"`
- `find label "Email"`
- `find text "Save"`

This is especially helpful when the agent starts with a user goal instead of an existing snapshot.

#### 4. Security controls at the tool boundary

`agent-browser` has a solid set of controls that SidePilot should adapt into extension and bridge policy:

- content boundary markers for page-derived output
- domain allowlists for automation scope
- action policy by category
- confirmation gates for risky actions
- output size caps to prevent prompt flooding

These map directly to the `Permissioned Autonomy` goal in `ARCHITECTURE.md`.

### What not to copy directly

- SidePilot should not expose a large action surface before the approval and evidence model is ready.
- SidePilot should not inherit an opt-in-only security posture for browser actions if v3 is meant to operate inside a real user browser.
- SidePilot should not optimize only for headless automation workflows; its UX still centers on the side panel and shared browsing context.

---

## Project B — `tandem-browser`

Repository:

- <https://github.com/hydro13/tandem-browser>

### What stands out

`tandem-browser` treats the browser as a shared human + agent workspace with a strong local control API and an unusually explicit security model.

Key patterns:

- visible browser layer and hidden agent/control layer are separated
- local HTTP API is the main agent interface
- accessibility snapshot and semantic locator surfaces were explicitly added to close gaps with `agent-browser`
- CDP-driven inspection and main-process input injection are preferred over ad hoc page-side automation
- risky or ambiguous cases are escalated through a gatekeeper model
- live context is treated as a first-class bridge concern, not only a one-shot page scrape

### What SidePilot v3 should borrow

#### 1. The layered architecture, not the browser shell

Tandem's strongest lesson is architectural:

- one layer is for human browsing and UI
- one layer is for agent control
- one layer handles policy, logging, and security decisions

This is highly compatible with SidePilot's dual-channel thesis in `ARCHITECTURE.md`.

The adaptation for SidePilot should be:

- keep Chrome as the browser shell
- keep the SidePilot extension as the visible UI
- use the local bridge as the privileged local runtime
- add a bounded browser-control plane that spans extension and bridge when needed

#### 2. Main-process or privileged inspection for high-trust operations

Tandem's use of CDP and trusted input injection is a useful reference for SidePilot's future bridge-led actions.

Why this matters:

- page-side scripts are easier to detect, interfere with, or corrupt
- browser/DevTools evidence is stronger than guessed DOM interaction
- dev-mode reproduce/fix/verify loops benefit from a more trustworthy evidence source

This is especially relevant for:

- console summaries
- network summaries
- accessibility snapshots
- screenshot evidence
- state verification after a patch

#### 3. Context as an indexed bridge capability

Tandem's `ContextBridge` is a good reminder that "live context" can be more than a transient prompt block.

Useful SidePilot extensions to consider after MVP:

- packet history by URL or tab
- searchable recent page-context packets
- lightweight task-scoped context cache
- explicit invalidation reasons and freshness tracking

#### 4. Human-in-the-loop gatekeeping

Tandem's gatekeeper idea aligns with SidePilot's intended approval model:

- observe freely within clear bounds
- request approval for state-changing actions
- make ambiguous or risky flows visible in UI
- keep action and evidence logs reviewable after the fact

This is likely more important for SidePilot than Tandem's stealth or anti-detection work.

### What not to copy directly

- SidePilot should not become an Electron browser product line.
- SidePilot should not absorb the full Tandem surface area such as workspaces, shell UI, or large local API expansion unless a specific v3 milestone needs it.
- SidePilot should not make anti-detection or stealth a core v3 goal; the current v3 thesis is about context, evidence, and self-iteration.

---

## Mapping To SidePilot v3

| SidePilot v3 area | Borrow from `agent-browser` | Borrow from `tandem-browser` |
| ----------------- | --------------------------- | ---------------------------- |
| Live page context | Compact agent-facing extraction shapes | Indexed context history and local bridge awareness |
| Browser inspect plane | Accessibility snapshot, `@refs`, semantic finders | Privileged capture via CDP or bridge where possible |
| Browser interaction | Ref-based click/fill/wait/verify workflow | Trusted execution path and stronger audit trail |
| Evidence model | Snapshot/screenshot diff | Bridge-visible runtime and browser evidence |
| Approval model | Action categories and explicit confirmation gates | Gatekeeper-style escalation and visible policy state |
| Dev mode | Deterministic verification commands | Dual runtime integration for diagnose / fix / verify |

---

## Recommended MVP Order

These references reinforce the current internal priority order rather than replacing it.

### Step 1 — Finish the live page-context packet

Start from the existing packet builder in `extension/sidepanel.js`, which already emits:

- `pageIdentity`
- `semanticSummary`
- `selectedRegion`
- `notableBlocks`
- `pageIntentGuess`
- `freshness`

Bring it to the v3 schema by adding:

- `schemaVersion`
- `packetId`
- `source`
- `privacy`
- stable freshness reasons and TTL

### Step 2 — Add inspect-only browser evidence actions

Borrow mostly from `agent-browser`, but keep the execution path bounded:

- `inspect.snapshot`
- `inspect.visible_text`
- `inspect.console_summary`
- `inspect.network_summary`
- `capture.screenshot`

Do this before broad interactive control.

### Step 3 — Add `@ref`-based interaction

Implement a narrow first slice:

- `interact.click`
- `interact.type`
- `verify.wait_for_text`
- `verify.diff_snapshot`

This is the smallest useful active-control loop.

### Step 4 — Add policy and approval enforcement

Before expanding action coverage, add:

- action categories
- approval requirements
- prompt-safe page content boundaries
- output truncation / bounded evidence
- domain or scope restrictions where relevant

### Step 5 — Reuse the same evidence contract in dev mode

Dev mode should not invent a second browser automation language.

Instead, it should reuse:

- the page-context packet
- inspect and capture actions
- action logs
- before/after verification summaries

This matches the direction already stated in `DEV_MODE.md`.

---

## Concrete Suggestions For Current Code

### Already present in SidePilot

The current codebase already has a useful v3 foothold:

- `extension/js/automation.js` captures page basics and selected text
- `extension/sidepanel.js` already builds a structured live page-context packet close to the v3 schema
- `scripts/copilot-bridge/` already provides the local runtime channel that v3 wants to deepen

This means SidePilot does not need a greenfield rewrite to start learning from these projects.

### Most practical next moves

1. Normalize the current live packet to the published v3 schema.
2. Add a packet preview/debug surface that shows freshness and privacy state explicitly.
3. Design the inspect-only browser action contract around snapshot and evidence first.
4. Only then add state-changing interactions and confirmation flows.

---

## Recommended Borrow / Avoid List

### Borrow first

- `agent-browser` accessibility snapshot format
- `agent-browser` `@ref` interaction model
- `agent-browser` diff-oriented verification
- `agent-browser` action policy and confirmation categories
- `tandem-browser` layered human/agent/control architecture
- `tandem-browser` bridge-aware context model
- `tandem-browser` gatekeeper-style escalation mindset

### Avoid for v3 MVP

- full standalone browser-shell scope
- very large action/API surface before evidence and approval are stable
- stealth or anti-detection work as a primary milestone
- unrestricted autonomous browsing behavior

---

## Bottom Line

If SidePilot v3 learns one thing from `agent-browser`, it should be:

- make browser interaction deterministic and compact for the agent

If SidePilot v3 learns one thing from `tandem-browser`, it should be:

- separate browser control power from user-visible browsing, and put policy in between

That combination matches SidePilot's own v3 thesis better than either reference project alone.

---

## References

- <https://github.com/vercel-labs/agent-browser>
- <https://github.com/vercel-labs/agent-browser/blob/main/README.md>
- <https://github.com/vercel-labs/agent-browser/blob/main/docs/src/app/snapshots/page.mdx>
- <https://github.com/vercel-labs/agent-browser/blob/main/docs/src/app/security/page.mdx>
- <https://github.com/vercel-labs/agent-browser/blob/main/docs/src/app/diffing/page.mdx>
- <https://github.com/vercel-labs/agent-browser/blob/main/docs/src/app/sessions/page.mdx>
- <https://github.com/hydro13/tandem-browser>
- <https://github.com/hydro13/tandem-browser/blob/main/README.md>
- <https://github.com/hydro13/tandem-browser/blob/main/PROJECT.md>
