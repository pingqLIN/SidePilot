param(
  [string]$ProjectRoot = '',
  [string]$LauncherRoot = '',
  [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if ([string]::IsNullOrWhiteSpace($ProjectRoot)) {
  $ProjectRoot = (Resolve-Path (Join-Path $scriptDir '..\..\..')).Path
}
if ([string]::IsNullOrWhiteSpace($LauncherRoot)) {
  $LauncherRoot = Join-Path $env:LOCALAPPDATA 'SidePilot\BridgeLauncher'
}

$sourceLauncherPs1 = Join-Path $scriptDir 'sidepilot-bridge-launcher.ps1'
$targetLauncherPs1 = Join-Path $LauncherRoot 'sidepilot-bridge-launcher.ps1'
$targetLauncherCmd = Join-Path $LauncherRoot 'sidepilot-bridge-launcher.cmd'
$bridgeDir = Join-Path $ProjectRoot 'scripts\copilot-bridge'

$registryBase = 'HKCU:\Software\Classes\sidepilot'
$registryCommandKey = Join-Path $registryBase 'shell\open\command'

function Write-Step {
  param([string]$Message)
  Write-Host ("[install] {0}" -f $Message)
}

if (-not (Test-Path -Path $sourceLauncherPs1 -PathType Leaf)) {
  throw "Launcher script not found: $sourceLauncherPs1"
}

if ($DryRun) {
  Write-Step "Dry-run mode enabled."
  Write-Step "Would create launcher root: $LauncherRoot"
  Write-Step "Would copy launcher script to: $targetLauncherPs1"
  Write-Step "Would write wrapper cmd: $targetLauncherCmd"
  Write-Step "Would register protocol key: $registryBase"
  return
}

New-Item -ItemType Directory -Path $LauncherRoot -Force | Out-Null
Copy-Item -Path $sourceLauncherPs1 -Destination $targetLauncherPs1 -Force

$cmdContent = @(
  '@echo off',
  ('powershell -NoProfile -ExecutionPolicy Bypass -File "{0}" -Uri "%~1" -BridgeDir "{1}"' -f $targetLauncherPs1, $bridgeDir)
)
Set-Content -Path $targetLauncherCmd -Value $cmdContent -Encoding ASCII

New-Item -Path $registryBase -Force | Out-Null
Set-Item -Path $registryBase -Value 'URL:SidePilot Protocol'
New-ItemProperty -Path $registryBase -Name 'URL Protocol' -Value '' -PropertyType String -Force | Out-Null

New-Item -Path $registryCommandKey -Force | Out-Null
Set-Item -Path $registryCommandKey -Value ('"{0}" "%1"' -f $targetLauncherCmd)

$commandValue = (Get-Item -Path $registryCommandKey).GetValue('')
Write-Step ("Protocol registered: sidepilot:// -> {0}" -f $commandValue)
Write-Step ("Launcher root: {0}" -f $LauncherRoot)
