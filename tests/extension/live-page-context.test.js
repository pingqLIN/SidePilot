import { describe, expect, it } from "@jest/globals";
import "../../extension/js/live-page-context.js";

const LivePageContext = globalThis.SidePilotLivePageContext;

describe("Live Page Context", () => {
  it("builds a v3 packet with required top-level fields", () => {
    const packet = LivePageContext.buildPacket(
      {
        title: "SidePilot Architecture Guide",
        url: "https://docs.example.com/guide/sidepilot",
        text: "SidePilot v3 keeps live page context compact and inspectable.",
        paragraphs: ["SidePilot v3 keeps live page context compact and inspectable."],
        headings: [{ text: "Overview" }, { text: "Implementation" }],
        codeBlocks: [{ language: "js", code: "console.log('hello world');" }],
        wordCount: 9,
        charCount: 55,
        extractor: "defuddle",
      },
      {
        tabId: 41,
        capturedAt: "2026-03-15T12:00:00.000Z",
      },
    );

    expect(packet).toMatchObject({
      schemaVersion: "sidepilot.page-context/v1",
      packetId: "page-context:41:2026-03-15T12:00:00.000Z",
      source: {
        channel: "extension",
        captureMode: "ambient",
        extractor: "defuddle",
        observerVersion: "v3-mvp",
      },
      pageIdentity: {
        title: "SidePilot Architecture Guide",
        url: "https://docs.example.com/guide/sidepilot",
        origin: "https://docs.example.com",
        routeHint: "documentation",
        tabId: 41,
        extractor: "defuddle",
      },
      semanticSummary: {
        kind: "docs_page",
        sections: ["Overview", "Implementation"],
        wordCount: 9,
        charCount: 55,
        confidence: 0.9,
      },
      pageIntentGuess: "read_documentation",
      freshness: {
        capturedAt: "2026-03-15T12:00:00.000Z",
        lastValidatedAt: null,
        stale: false,
        reason: "initial_capture",
        ttlMs: 15000,
      },
      privacy: {
        reviewRequired: false,
        redactionLevel: "standard",
        gatedFields: [],
      },
    });

    expect(packet.selectedRegion).toBeNull();
    expect(packet.notableBlocks).toHaveLength(1);
  });

  it("redacts obvious secrets and marks gated fields", () => {
    const packet = LivePageContext.buildPacket({
      title: "Secrets",
      url: "https://github.com/pingqLIN/SidePilot/blob/main/.env",
      selectedText: "token=ghp_1234567890abcdefghijklmnopqrstuvwxyz",
      codeBlocks: [
        {
          language: "bash",
          code: "export API_KEY=sk-123456789012345678901234567890",
        },
      ],
    });

    expect(packet.selectedRegion).toMatchObject({
      kind: "selection",
      text: "[REDACTED_SECRET]",
    });
    expect(packet.notableBlocks[0].preview).toContain("[REDACTED_SECRET]");
    expect(packet.privacy).toEqual({
      reviewRequired: true,
      redactionLevel: "strict",
      gatedFields: ["selectedRegion.text", "notableBlocks[0].preview"],
    });
  });

  it("honors tab and freshness options for selection refreshes", () => {
    const packet = LivePageContext.buildPacket(
      {
        title: "Pull Request",
        url: "https://github.com/pingqLIN/SidePilot/pull/123",
        selectedText: "const ok = true;",
        extractor: "selection",
      },
      {
        tabId: 7,
        captureMode: "selection_refresh",
        freshnessReason: "selection_changed",
        ttlMs: 30000,
        stale: true,
      },
    );

    expect(packet.source.captureMode).toBe("selection_refresh");
    expect(packet.pageIdentity.routeHint).toBe("github.pull_request");
    expect(packet.pageIntentGuess).toBe("review_code_changes");
    expect(packet.freshness).toMatchObject({
      stale: true,
      reason: "selection_changed",
      ttlMs: 30000,
    });
  });

  it("formats packet content for prompt injection", () => {
    const packet = LivePageContext.buildPacket({
      title: "Issue 42",
      url: "https://github.com/pingqLIN/SidePilot/issues/42",
      text: "Extension crashes when context injection is enabled.",
      paragraphs: ["Extension crashes when context injection is enabled."],
      headings: [{ text: "Bug report" }],
      selectedText: "RangeError: Maximum call stack size exceeded",
    });

    const prompt = LivePageContext.formatForPrompt(packet);

    expect(prompt).toContain("Title: Issue 42");
    expect(prompt).toContain("Intent Guess: triage_issue");
    expect(prompt).toContain("Selected Text: RangeError: Maximum call stack size exceeded");
    expect(prompt).toContain("Freshness: fresh");
    expect(prompt).toContain("Privacy: standard");
  });
});
