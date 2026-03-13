param(
  [string]$ProjectRoot = '',
  [string]$LauncherRoot = '',
  [ValidateSet('auto', 'windows', 'wsl')]
  [string]$Runtime = 'auto',
  [string]$WslDistro = '',
  [string]$WslBridgeDir = '',
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
$targetConfigJson = Join-Path $LauncherRoot 'launcher-config.json'

$registryBase = 'HKCU:\Software\Classes\sidepilot'
$registryCommandKey = Join-Path $registryBase 'shell\open\command'

function Write-Step {
  param([string]$Message)
  Write-Host ("[install] {0}" -f $Message)
}

function Test-IsLinuxPath {
  param([string]$PathValue)
  return [string]$PathValue -match '^/'
}

function Test-IsWindowsPath {
  param([string]$PathValue)
  return [string]$PathValue -match '^(?:[A-Za-z]:\\|\\\\)'
}

function Convert-WindowsPathToWslPath {
  param([string]$WindowsPath)
  $match = [regex]::Match([string]$WindowsPath, '^([A-Za-z]):\\(.*)$')
  if (-not $match.Success) {
    return ''
  }
  $drive = $match.Groups[1].Value.ToLower()
  $rest = $match.Groups[2].Value -replace '\\', '/'
  return "/mnt/$drive/$rest"
}

function Join-LinuxPath {
  param(
    [string]$BasePath,
    [string]$ChildPath
  )
  $trimmedBase = ([string]$BasePath).TrimEnd('/')
  $trimmedChild = ([string]$ChildPath).TrimStart('/')
  return "$trimmedBase/$trimmedChild"
}

if (-not (Test-Path -Path $sourceLauncherPs1 -PathType Leaf)) {
  throw "Launcher script not found: $sourceLauncherPs1"
}

$runtimeMode = $Runtime
$windowsBridgeDir = ''
$resolvedWslBridgeDir = $WslBridgeDir

if (Test-IsLinuxPath $ProjectRoot) {
  if ($runtimeMode -eq 'auto') {
    $runtimeMode = 'wsl'
  }
  if ([string]::IsNullOrWhiteSpace($resolvedWslBridgeDir)) {
    $resolvedWslBridgeDir = Join-LinuxPath -BasePath $ProjectRoot -ChildPath 'scripts/copilot-bridge'
  }
} else {
  $windowsBridgeDir = Join-Path $ProjectRoot 'scripts\copilot-bridge'
  if ($runtimeMode -eq 'auto') {
    $runtimeMode = 'windows'
  }
  if ($runtimeMode -eq 'wsl' -and [string]::IsNullOrWhiteSpace($resolvedWslBridgeDir)) {
    $resolvedWslBridgeDir = Convert-WindowsPathToWslPath -WindowsPath $windowsBridgeDir
  }
}

if ($runtimeMode -eq 'windows' -and [string]::IsNullOrWhiteSpace($windowsBridgeDir) -and (Test-IsWindowsPath $ProjectRoot)) {
  $windowsBridgeDir = Join-Path $ProjectRoot 'scripts\copilot-bridge'
}

if ($DryRun) {
  Write-Step 'Dry-run mode enabled.'
  Write-Step ("Runtime: {0}" -f $runtimeMode)
  if (-not [string]::IsNullOrWhiteSpace($windowsBridgeDir)) {
    Write-Step ("Windows bridge dir: {0}" -f $windowsBridgeDir)
  }
  if (-not [string]::IsNullOrWhiteSpace($resolvedWslBridgeDir)) {
    Write-Step ("WSL bridge dir: {0}" -f $resolvedWslBridgeDir)
  }
  Write-Step ("Would create launcher root: {0}" -f $LauncherRoot)
  Write-Step ("Would copy launcher script to: {0}" -f $targetLauncherPs1)
  Write-Step ("Would write wrapper cmd: {0}" -f $targetLauncherCmd)
  Write-Step ("Would write config: {0}" -f $targetConfigJson)
  Write-Step ("Would register protocol key: {0}" -f $registryBase)
  return
}

New-Item -ItemType Directory -Path $LauncherRoot -Force | Out-Null
Copy-Item -Path $sourceLauncherPs1 -Destination $targetLauncherPs1 -Force

$cmdContent = @(
  '@echo off',
  ('powershell -NoProfile -ExecutionPolicy Bypass -File "{0}" -Uri "%~1"' -f $targetLauncherPs1)
)
Set-Content -Path $targetLauncherCmd -Value $cmdContent -Encoding ASCII

$configObject = [ordered]@{
  Runtime = $runtimeMode
  BridgeDir = $windowsBridgeDir
  WslBridgeDir = $resolvedWslBridgeDir
  WslDistro = $WslDistro
  Port = 31031
  InstalledAt = (Get-Date).ToString('o')
}
$configObject | ConvertTo-Json | Set-Content -Path $targetConfigJson -Encoding UTF8

New-Item -Path $registryBase -Force | Out-Null
Set-Item -Path $registryBase -Value 'URL:SidePilot Protocol'
New-ItemProperty -Path $registryBase -Name 'URL Protocol' -Value '' -PropertyType String -Force | Out-Null

New-Item -Path $registryCommandKey -Force | Out-Null
Set-Item -Path $registryCommandKey -Value ('"{0}" "%1"' -f $targetLauncherCmd)

$commandValue = (Get-Item -Path $registryCommandKey).GetValue('')
Write-Step ("Protocol registered: sidepilot:// -> {0}" -f $commandValue)
Write-Step ("Launcher root: {0}" -f $LauncherRoot)
Write-Step ("Runtime: {0}" -f $runtimeMode)
