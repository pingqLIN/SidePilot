# SidePilot Bridge Launcher (Windows)

## Files

- `sidepilot-bridge-launcher.ps1`: protocol launcher entrypoint (`sidepilot://start-bridge`)
- `install-launcher.ps1`: install launcher files and register protocol in `HKCU:\Software\Classes\sidepilot`
- `uninstall-launcher.ps1`: remove protocol registration (optional file cleanup)
- `test-launcher.ps1`: basic parameter validation tests

## Quick Start

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\install-launcher.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File .\test-launcher.ps1
```

## Uninstall

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\uninstall-launcher.ps1 -RemoveFiles
```
