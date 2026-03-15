const SIDEPILOT_PAGE_CONTEXT_SCHEMA = "sidepilot.page-context/v1";
const DEFAULT_TTL_MS = 15000;
const SUMMARY_MAX_LENGTH = 280;
const SELECTED_TEXT_MAX_LENGTH = 800;
const SECTION_LABEL_MAX_LENGTH = 80;
const HEADING_LIMIT = 6;
const CODE_BLOCK_LIMIT = 3;
const CODE_BLOCK_PREVIEW_MAX_LENGTH = 180;
const TITLE_MAX_LENGTH = 160;
const OBSERVER_VERSION = "v3-mvp";

const CAPTURE_MODE_VALUES = new Set([
  "ambient",
  "manual_capture",
  "selection_refresh",
  "route_refresh",
  "dev_verify",
]);

const FRESHNESS_REASON_VALUES = new Set([
  "initial_capture",
  "same_route_same_selection",
  "route_changed",
  "selection_changed",
  "visible_ui_changed",
  "manual_refresh",
  "live_observation_disabled",
]);

const SECRET_PATTERNS = [
  /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g,
  /\bgithub_pat_[A-Za-z0-9_]{20,}\b/g,
  /\bsk-[A-Za-z0-9]{20,}\b/g,
  /\bAKIA[0-9A-Z]{16}\b/g,
  /\bBearer\s+[A-Za-z0-9._-]{16,}\b/gi,
  /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9._-]+\.[A-Za-z0-9._-]+\b/g,
  /\b(?:password|passwd|pwd|secret|token|api[_-]?key)\s*[:=]\s*["']?[^\s"'`]{6,}/gi,
];

function truncateInlineText(text, maxLength) {
  if (typeof text !== "string") return "";
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(0, maxLength - 3))}...`;
}

function normalizeOptionalString(value, maxLength) {
  const normalized = truncateInlineText(value || "", maxLength);
  return normalized || null;
}

function normalizeEnum(value, allowedValues, fallback) {
  return allowedValues.has(value) ? value : fallback;
}

function parseOrigin(url) {
  try {
    return url ? new URL(url).origin : "";
  } catch {
    return "";
  }
}

function derivePageIntentGuess(content = {}) {
  const url = String(content.url || "");
  const title = String(content.title || "").toLowerCase();
  if (/github\.com\/.+\/pull\//i.test(url)) return "review_code_changes";
  if (/github\.com\/.+\/issues\//i.test(url)) return "triage_issue";
  if (/github\.com\/.+\/blob\//i.test(url)) return "read_source_file";
  if (/docs|guide|readme|documentation/i.test(`${url} ${title}`)) {
    return "read_documentation";
  }
  if (/settings|preferences|configuration/i.test(`${url} ${title}`)) {
    return "change_settings";
  }
  return "general_page_review";
}

function deriveRouteHint(url = "") {
  if (/github\.com\/[^/]+\/[^/]+\/pull\/\d+/i.test(url)) {
    return "github.pull_request";
  }
  if (/github\.com\/[^/]+\/[^/]+\/issues\/\d+/i.test(url)) {
    return "github.issue";
  }
  if (/github\.com\/[^/]+\/[^/]+\/blob\//i.test(url)) {
    return "github.blob";
  }
  if (/github\.com\/settings(\/|$)/i.test(url)) {
    return "github.settings";
  }
  if (/docs|guide|readme|documentation/i.test(url)) {
    return "documentation";
  }
  return null;
}

function deriveSemanticKind(pageIntentGuess) {
  switch (pageIntentGuess) {
    case "review_code_changes":
      return "code_review";
    case "read_source_file":
      return "source_code";
    case "read_documentation":
      return "docs_page";
    case "triage_issue":
      return "issue_triage";
    case "change_settings":
      return "settings_page";
    default:
      return "general_page";
  }
}

function deriveConfidence(extractor) {
  switch (extractor) {
    case "selection":
      return 0.98;
    case "defuddle":
      return 0.9;
    case "basic":
      return 0.72;
    case "basic-fallback":
      return 0.65;
    default:
      return 0.6;
  }
}

function redactSensitiveText(text) {
  let next = truncateInlineText(text, Number.MAX_SAFE_INTEGER);
  let redacted = false;

  for (const pattern of SECRET_PATTERNS) {
    next = next.replace(pattern, () => {
      redacted = true;
      return "[REDACTED_SECRET]";
    });
  }

  return {
    text: next,
    redacted,
  };
}

function buildSelectedRegion(content, gatedFields) {
  const selection = redactSensitiveText(content.selectedText || "");
  const text = truncateInlineText(selection.text, SELECTED_TEXT_MAX_LENGTH);
  if (!text) {
    return null;
  }
  if (selection.redacted) {
    gatedFields.push("selectedRegion.text");
  }
  return {
    kind: "selection",
    label: null,
    text,
    selectorHint: null,
  };
}

function buildNotableBlocks(codeBlocks, gatedFields) {
  if (!Array.isArray(codeBlocks)) {
    return [];
  }

  return codeBlocks.slice(0, CODE_BLOCK_LIMIT).map((block, index) => {
    const preview = redactSensitiveText(block?.code || "");
    if (preview.redacted) {
      gatedFields.push(`notableBlocks[${index}].preview`);
    }

    return {
      kind: "code",
      label:
        truncateInlineText(
          `Code ${index + 1}: ${block?.language || "plaintext"}`,
          SECTION_LABEL_MAX_LENGTH,
        ) || `Code ${index + 1}`,
      language: normalizeOptionalString(block?.language || "plaintext", 32),
      preview: normalizeOptionalString(preview.text, CODE_BLOCK_PREVIEW_MAX_LENGTH),
      selectorHint: null,
    };
  });
}

function buildPacket(content = {}, options = {}) {
  if (!content || typeof content !== "object") return null;

  const title = truncateInlineText(content.title || "", TITLE_MAX_LENGTH);
  const url = String(content.url || "").trim();
  if (!title && !url) {
    return null;
  }

  const extractor = truncateInlineText(content.extractor || "basic", 32) || "basic";
  const intent = derivePageIntentGuess(content);
  const description =
    content.meta?.description || content.meta?.["og:description"] || "";
  const firstParagraph = Array.isArray(content.paragraphs)
    ? content.paragraphs.find((item) => typeof item === "string" && item.trim())
    : "";
  const summary = normalizeOptionalString(
    description || firstParagraph || content.text || "",
    SUMMARY_MAX_LENGTH,
  );
  const sections = Array.isArray(content.headings)
    ? content.headings
        .map((heading) => truncateInlineText(heading?.text || "", SECTION_LABEL_MAX_LENGTH))
        .filter(Boolean)
        .slice(0, HEADING_LIMIT)
    : [];
  const capturedAt =
    typeof options.capturedAt === "string" && options.capturedAt
      ? options.capturedAt
      : new Date().toISOString();
  const tabId =
    Number.isInteger(options.tabId) || Number.isInteger(content.tabId)
      ? Number(options.tabId ?? content.tabId)
      : null;
  const captureMode = normalizeEnum(
    options.captureMode || (content.selectedText ? "selection_refresh" : "ambient"),
    CAPTURE_MODE_VALUES,
    "ambient",
  );
  const freshnessReason = normalizeEnum(
    options.freshnessReason ||
      (content.selectedText ? "selection_changed" : "initial_capture"),
    FRESHNESS_REASON_VALUES,
    "initial_capture",
  );
  const gatedFields = [];
  const selectedRegion = buildSelectedRegion(content, gatedFields);
  const notableBlocks = buildNotableBlocks(content.codeBlocks, gatedFields);
  const uniqueGatedFields = [...new Set(gatedFields)];

  return {
    schemaVersion: SIDEPILOT_PAGE_CONTEXT_SCHEMA,
    packetId: String(
      options.packetId || `page-context:${tabId ?? "active"}:${capturedAt}`,
    ),
    source: {
      channel: "extension",
      captureMode,
      extractor,
      observerVersion: truncateInlineText(
        options.observerVersion || OBSERVER_VERSION,
        32,
      ),
    },
    pageIdentity: {
      title: title || "(untitled)",
      url,
      origin: parseOrigin(url),
      routeHint: deriveRouteHint(url),
      tabId,
      extractor,
    },
    semanticSummary: {
      kind: deriveSemanticKind(intent),
      summary,
      sections,
      wordCount: Number(content.wordCount) || 0,
      charCount: Number(content.charCount) || 0,
      confidence: deriveConfidence(extractor),
    },
    selectedRegion,
    notableBlocks,
    pageIntentGuess: intent,
    freshness: {
      capturedAt,
      lastValidatedAt:
        typeof options.lastValidatedAt === "string" && options.lastValidatedAt
          ? options.lastValidatedAt
          : null,
      stale: !!options.stale,
      reason: freshnessReason,
      ttlMs:
        Number.isFinite(options.ttlMs) && options.ttlMs > 0
          ? Math.floor(options.ttlMs)
          : DEFAULT_TTL_MS,
    },
    privacy: {
      reviewRequired: uniqueGatedFields.length > 0,
      redactionLevel: uniqueGatedFields.length > 0 ? "strict" : "standard",
      gatedFields: uniqueGatedFields,
    },
  };
}

function formatForPrompt(packet) {
  if (!packet || typeof packet !== "object") return "";

  const lines = [];
  const title = packet.pageIdentity?.title || "(untitled)";
  const url = packet.pageIdentity?.url || "";
  const summary = packet.semanticSummary?.summary || "";
  const sections = Array.isArray(packet.semanticSummary?.sections)
    ? packet.semanticSummary.sections
    : [];
  const selected = packet.selectedRegion?.text || "";
  const blocks = Array.isArray(packet.notableBlocks) ? packet.notableBlocks : [];
  const freshness = packet.freshness || {};
  const privacy = packet.privacy || {};

  lines.push(`Title: ${title}`);
  if (url) lines.push(`URL: ${url}`);
  if (packet.pageIntentGuess) lines.push(`Intent Guess: ${packet.pageIntentGuess}`);
  if (summary) lines.push(`Summary: ${summary}`);
  if (sections.length > 0) lines.push(`Sections: ${sections.join(" | ")}`);
  if (selected) lines.push(`Selected Text: ${selected}`);
  if (blocks.length > 0) {
    lines.push(
      `Notable Blocks: ${blocks
        .map((block) => `${block.label}${block.preview ? ` -> ${block.preview}` : ""}`)
        .join(" | ")}`,
    );
  }
  if (freshness.capturedAt) {
    lines.push(
      `Freshness: ${freshness.stale ? "stale" : "fresh"}${freshness.reason ? ` (${freshness.reason})` : ""}`,
    );
  }
  if (privacy.redactionLevel) {
    lines.push(`Privacy: ${privacy.redactionLevel}`);
  }

  return lines.join("\n");
}

globalThis.SidePilotLivePageContext = {
  buildPacket,
  formatForPrompt,
  truncateInlineText,
};
