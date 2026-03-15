# SidePilot v3 — Page Context Model

<!--
╔══════════════════════════════════════════════════════════════╗
║  FOR AI AGENT                                                ║
║  Primary reader  : AI assistant / language model agent       ║
║  Purpose         : Define the implementation-ready live      ║
║                    page-context schema for SidePilot v3      ║
║  Confidence      : HIGH — schema-ready draft                ║
║  Last updated    : 2026-03-15                                ║
╚══════════════════════════════════════════════════════════════╝
-->

> **Related docs:** [ARCHITECTURE.md](ARCHITECTURE.md) · [BROWSER_CONTROL_API.md](BROWSER_CONTROL_API.md) · [DEV_MODE.md](DEV_MODE.md) · [../../v3/shared/schemas/page-context.v1.schema.json](../../v3/shared/schemas/page-context.v1.schema.json)

---

## Purpose

This document turns the v3 page-context idea into a schema that engineering can implement, validate, version, and inject into prompts without inventing field semantics ad hoc.

The packet is intended to be:

- compact enough for prompt injection
- stable enough for code and tests
- inspectable enough for user preview
- explicit enough for browser verification and dev-mode reuse

The target is not a DOM mirror. The target is a normalized, bounded, agent-facing summary of the active page state.

---

## Design Goals

| Goal | Meaning |
| ---- | ------- |
| Ambient | Common page context should be available without manual capture every time |
| Structured | The agent should receive named fields rather than a raw text dump |
| Compact | Output should favor summaries, selections, and notable regions over full-page copies |
| Inspectable | Users should be able to preview what context will be injected |
| Fresh | Context should expose when it was observed and how stale it may be |
| Bounded | Sensitive or noisy data should be filtered or gated before injection |
| Versioned | The packet must evolve via explicit schema versions rather than silent field drift |

---

## Schema Status

| Field | Value |
| ---- | ----- |
| Canonical schema ID | `sidepilot.page-context/v1` |
| Machine-readable schema | `v3/shared/schemas/page-context.v1.schema.json` |
| JSON Schema dialect | Draft 2020-12 |
| Intended producers | extension · bridge · hybrid pipeline |
| Intended consumers | prompt assembly · side panel preview · browser control · dev mode |

---

## Implementation Profiles

### MVP profile

The MVP producer should emit all top-level fields below, even when some values are `null`, empty arrays, or conservative defaults.

| Field | Required | Notes |
| ---- | -------- | ----- |
| `schemaVersion` | Yes | Must equal `sidepilot.page-context/v1` |
| `packetId` | Yes | Unique ID for traceability and caching |
| `source` | Yes | How and where the packet was produced |
| `pageIdentity` | Yes | Base page identity and route hints |
| `semanticSummary` | Yes | Bounded summary of page meaning |
| `selectedRegion` | Yes | `null` when no high-signal selection exists |
| `notableBlocks` | Yes | Array of surfaced fragments, possibly empty |
| `pageIntentGuess` | Yes | May be `null` if classifier confidence is low |
| `freshness` | Yes | Capture time, stale state, invalidation reason |
| `privacy` | Yes | Redaction and review metadata |

### Compatibility note

The current live packet builder in `extension/sidepanel.js` already emits a subset close to the v3 shape:

- `pageIdentity`
- `semanticSummary`
- `selectedRegion`
- `notableBlocks`
- `pageIntentGuess`
- `freshness`

To reach the v3 schema, current implementation mainly needs to add:

- `schemaVersion`
- `packetId`
- `source`
- `privacy`
- stable enums and normalization rules

---

## Proposed Input Sources

| Source | Examples | Notes |
| ------ | -------- | ----- |
| Tab identity | tab ID, URL, origin, route, title | Base identity for every packet |
| Navigation events | route change, reload, history update | Used to invalidate stale summaries |
| Page structure | headings, sections, paragraphs, lists, tables | Distilled into semantic summary |
| Code regions | `pre`, `code`, diff blocks, snippets | Extract only notable or selected blocks |
| Selection/focus | selected text, focused input, active element | High-signal user intent input |
| Viewport state | scroll segment, visible region hints | Useful for "what am I looking at now?" |
| User annotations | pinned notes, task tags, manual hints | Optional overlay supplied by the user |

---

## Canonical Packet Shape

### Top-level contract

| Field | Type | Intent |
| ----- | ---- | ------ |
| `schemaVersion` | string | Packet schema identifier and version |
| `packetId` | string | Unique packet reference for caching, logging, and action history |
| `source` | object | Producer channel, capture mode, and extractor metadata |
| `pageIdentity` | object | Canonical page identity: title, URL, origin, route hint |
| `semanticSummary` | object | Short summary of the page and its main sections |
| `selectedRegion` | object or `null` | Current user selection or focused high-signal region |
| `notableBlocks` | array | Code blocks, tables, or UI fragments worth surfacing |
| `pageIntentGuess` | string or `null` | Best-effort normalized page-purpose classification |
| `freshness` | object | Observation time, invalidation reason, TTL, staleness estimate |
| `privacy` | object | Redaction mode, gated fields, and whether user review is required |

### Stable enums

#### `source.channel`

- `extension`
- `bridge`
- `hybrid`

#### `source.captureMode`

- `ambient`
- `manual_capture`
- `selection_refresh`
- `route_refresh`
- `dev_verify`

#### `pageIntentGuess`

- `general_page_review`
- `read_documentation`
- `read_source_file`
- `review_code_changes`
- `triage_issue`
- `change_settings`

#### `selectedRegion.kind`

- `selection`
- `focused_input`
- `code_block`
- `diff_hunk`
- `table_region`

#### `notableBlocks[].kind`

- `code`
- `table`
- `list`
- `form`
- `diff_hunk`
- `ui_fragment`

#### `freshness.reason`

- `initial_capture`
- `same_route_same_selection`
- `route_changed`
- `selection_changed`
- `visible_ui_changed`
- `manual_refresh`
- `live_observation_disabled`

#### `privacy.redactionLevel`

- `none`
- `standard`
- `strict`

---

## Field Definitions

### `source`

| Field | Type | Required | Notes |
| ----- | ---- | -------- | ----- |
| `channel` | enum | Yes | `extension`, `bridge`, or `hybrid` |
| `captureMode` | enum | Yes | How the packet was produced |
| `extractor` | string | No | Example: `basic`, `defuddle`, `readability` |
| `observerVersion` | string | No | Useful for debugging extraction regressions |

### `pageIdentity`

| Field | Type | Required | Notes |
| ----- | ---- | -------- | ----- |
| `title` | string | Yes | Max 160 chars after normalization |
| `url` | string | Yes | Full page URL |
| `origin` | string | Yes | URL origin or empty string when unavailable |
| `routeHint` | string or `null` | No | Example: `github.pull_request` |
| `tabId` | integer or `null` | No | Extension-side tab identity |
| `extractor` | string or `null` | No | Kept optional for near-term compatibility |

### `semanticSummary`

| Field | Type | Required | Notes |
| ----- | ---- | -------- | ----- |
| `kind` | string or `null` | No | Example: `code_review`, `docs_page` |
| `summary` | string or `null` | Yes | Max 1200 chars |
| `sections` | string[] | Yes | Max 12 section labels, each max 80 chars |
| `wordCount` | integer | Yes | `0` allowed |
| `charCount` | integer | Yes | `0` allowed |
| `confidence` | number or `null` | No | Range `0..1` |

### `selectedRegion`

When present, this should describe the single highest-signal active region.

| Field | Type | Required | Notes |
| ----- | ---- | -------- | ----- |
| `kind` | enum | Yes | One of the `selectedRegion.kind` values |
| `label` | string or `null` | No | Human-readable label for preview |
| `text` | string | Yes | Max 2000 chars after normalization |
| `selectorHint` | string or `null` | No | Optional browser-side selector hint |

### `notableBlocks[]`

| Field | Type | Required | Notes |
| ----- | ---- | -------- | ----- |
| `kind` | enum | Yes | One of the `notableBlocks[].kind` values |
| `label` | string | Yes | Max 80 chars |
| `language` | string or `null` | No | Mainly for code/diff blocks |
| `preview` | string or `null` | No | Max 500 chars |
| `selectorHint` | string or `null` | No | Optional browser-side selector hint |

### `freshness`

| Field | Type | Required | Notes |
| ----- | ---- | -------- | ----- |
| `capturedAt` | date-time string | Yes | Primary observation timestamp |
| `lastValidatedAt` | date-time string or `null` | No | Optional later validation timestamp |
| `stale` | boolean | Yes | Whether packet is considered outdated |
| `reason` | enum | Yes | Why current freshness state was assigned |
| `ttlMs` | integer | Yes | Producer-recommended freshness window |

### `privacy`

| Field | Type | Required | Notes |
|------|------|----------|-------|
| `reviewRequired` | boolean | Yes | Whether preview/approval should precede injection |
| `redactionLevel` | enum | Yes | `none`, `standard`, or `strict` |
| `gatedFields` | string[] | Yes | Fields or regions requiring stronger review |

---

## Normalization Rules

These rules are part of the schema contract, not optional producer behavior.

1. Collapse repeated whitespace in preview-oriented text fields.
2. Trim all string fields before output.
3. Prefer `null` over empty string for optional semantic fields.
4. Prefer empty arrays over omitted array fields.
5. Truncate overly long summaries, selections, and previews before packet emission.
6. Never inject raw credentials or obvious secrets into `selectedRegion.text` or `notableBlocks[].preview`.

---

## Recommended Budgets

| Field | Suggested max |
| ----- | ------------- |
| `pageIdentity.title` | 160 chars |
| `semanticSummary.summary` | 1200 chars |
| `semanticSummary.sections` | 12 items |
| `selectedRegion.text` | 2000 chars |
| `notableBlocks` | 8 items |
| `notableBlocks[].preview` | 500 chars |

These are intentionally prompt-aware budgets. Producers may enforce tighter budgets, but not looser ones without a schema bump.

---

## Example Packet

```json
{
  "schemaVersion": "sidepilot.page-context/v1",
  "packetId": "page-context:active:2026-03-15T10:20:00.000Z",
  "source": {
    "channel": "extension",
    "captureMode": "ambient",
    "extractor": "defuddle",
    "observerVersion": "v3-mvp"
  },
  "pageIdentity": {
    "title": "SidePilot Pull Request Review",
    "url": "https://github.com/pingqLIN/SidePilot/pull/123",
    "origin": "https://github.com",
    "routeHint": "github.pull_request",
    "tabId": 417,
    "extractor": "defuddle"
  },
  "semanticSummary": {
    "kind": "code_review",
    "summary": "Open pull request with changed extension and bridge files.",
    "sections": ["description", "changed files", "review comments"],
    "wordCount": 842,
    "charCount": 5114,
    "confidence": 0.86
  },
  "selectedRegion": {
    "kind": "diff_hunk",
    "label": "extension/sidepanel.js",
    "text": "Selected lines from the active diff",
    "selectorHint": null
  },
  "notableBlocks": [
    {
      "kind": "code",
      "label": "mode-manager.js diff",
      "language": "javascript",
      "preview": "Highlighted changes in mode detection and bridge probing.",
      "selectorHint": null
    }
  ],
  "pageIntentGuess": "review_code_changes",
  "freshness": {
    "capturedAt": "2026-03-15T10:20:00Z",
    "lastValidatedAt": null,
    "stale": false,
    "reason": "same_route_same_selection",
    "ttlMs": 30000
  },
  "privacy": {
    "reviewRequired": false,
    "redactionLevel": "standard",
    "gatedFields": []
  }
}
```

---

## Freshness And Invalidation

The packet should expose whether it still reflects the current page.

| Trigger | Expected behavior |
| ------- | ----------------- |
| URL or route changed | Rebuild packet identity and semantic summary |
| Selection changed | Refresh `selectedRegion` first |
| Visible UI changed materially | Mark summary stale and request re-observation |
| User disables live observation | Freeze packet and stop background refresh |

Freshness should remain cheap to evaluate. The packet only needs enough metadata for the agent and user to judge whether the context is still trustworthy.

---

## Privacy And Redaction

Default behavior should bias toward minimal capture.

| Rule | Intent |
| ---- | ------ |
| Avoid raw full-page dumps by default | Reduce prompt noise and accidental sensitive capture |
| Treat forms and editable fields as gated regions | Require stronger review or explicit inclusion |
| Mark user-generated secrets or credentials as redaction targets | Never inject obvious secrets into prompts |
| Expose a preview surface in the side panel | Keep observation visible and understandable |

---

## Integration Expectations

- The extension should cache the latest valid packet per active tab context.
- Prompt assembly should inject a named `[Live Page Context]` block instead of an unstructured blob.
- Browser control and dev-mode workflows should be able to reference the same packet as shared evidence.
- Producers should validate packets against `page-context.v1.schema.json` before they become user-visible or prompt-visible.

---

## Schema Evolution Rules

1. New required fields require a schema version bump.
2. New optional fields may be added within the same major schema version if they preserve backward compatibility.
3. Enum tightening requires a version bump.
4. Prompt assembly should key behavior off `schemaVersion`, not guessed field presence.

---

## Current Open Decisions

1. Which fields are always safe for automatic injection versus preview-only?
2. How much page text should be preserved verbatim versus summarized?
3. Should packet generation be extension-only, bridge-assisted, or hybrid for heavier summarization?
