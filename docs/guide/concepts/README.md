# SidePilot Concepts

> The mental model behind SidePilot: what each mode does, where context comes from, and why the local bridge exists.

---

## Core ideas

| Concept | Summary | Deep dive |
| --- | --- | --- |
| Modes | `iframe` is instant; `SDK` is programmable and context-aware | [../../FEATURES.md](../../FEATURES.md) |
| Memory vs Rules | Memory stores facts; Rules shape behavior | [../../USAGE.md#-memory-bank](../../USAGE.md#-memory-bank) |
| Local-first bridge | SDK mode uses a localhost control plane instead of a remote relay | [../API.md](../API.md) |
| Page capture | Browser content becomes prompt context faster | [../../SCREENSHOTS.md](../../SCREENSHOTS.md) |

## A simple way to think about SidePilot

1. **iframe mode** is the fastest way to start
2. **SDK mode** is the mode you grow into for serious workflows
3. **Memory** keeps project facts around
4. **Rules** tell the assistant how to behave
5. **Capture** pulls live page context into the conversation

## Recommended next reads

- Setup path: [../getting-started/README.md](../getting-started/README.md)
- Endpoint map: [../api/README.md](../api/README.md)
- Full walkthrough: [../../FEATURES.md](../../FEATURES.md)
