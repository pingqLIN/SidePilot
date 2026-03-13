# SidePilot API Guide

> A compact map of the local bridge control plane used by SDK mode.

---

## What lives here

The SidePilot bridge runs locally at `http://localhost:31031` and powers:

- authentication bootstrap
- session lifecycle
- streaming and sync chat
- permission decisions
- prompt strategy
- history / log streams
- backup and restore

## Read this when you need to

| Goal | Link |
| --- | --- |
| Understand the auth bootstrap flow | [../API.md](../API.md) |
| Learn how SDK mode fits together | [../concepts/README.md](../concepts/README.md) |
| Get setup steps before calling the bridge | [../getting-started/README.md](../getting-started/README.md) |

## Fast checks

- Use `GET /health` to verify the bridge is alive
- Use `POST /api/auth/bootstrap` before protected `/api/*` calls
- Use backup endpoints before risky local experimentation

## Next step

Open the full endpoint reference: [../API.md](../API.md)
