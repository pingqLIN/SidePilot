param(
  [string]$LauncherRoot = '',
  [switch]$RemoveFiles
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($LauncherRoot)) {
  $LauncherRoot = Join-Path $env:LOCALAPPDATA 'SidePilot\BridgeLauncher'
}

$registryBase = 'HKCU:\Software\Classes\sidepilot'

function Write-Step {
  param([string]$Message)
  Write-Host ("[uninstall] {0}" -f $Message)
}

if (Test-Path -Path $registryBase) {
  Remove-Item -Path $registryBase -Recurse -Force
  Write-Step "Removed protocol registry: $registryBase"
} else {
  Write-Step "Protocol registry not found: $registryBase"
}

if ($RemoveFiles) {
  if (Test-Path -Path $LauncherRoot) {
    Remove-Item -Path $LauncherRoot -Recurse -Force
    Write-Step "Removed launcher files: $LauncherRoot"
  } else {
    Write-Step "Launcher root not found: $LauncherRoot"
  }
} else {
  Write-Step "Launcher files kept. Use -RemoveFiles to delete: $LauncherRoot"
}
