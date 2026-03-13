param(
  [string]$LauncherPath = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if ([string]::IsNullOrWhiteSpace($LauncherPath)) {
  $LauncherPath = Join-Path $scriptDir 'sidepilot-bridge-launcher.ps1'
}

if (-not (Test-Path -Path $LauncherPath -PathType Leaf)) {
  throw "Launcher script not found: $LauncherPath"
}

function Invoke-Case {
  param(
    [string]$Name,
    [string]$Uri,
    [string]$ExpectedCode,
    [string[]]$ExtraArgs = @()
  )

  $previous = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  $invokeArgs = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $LauncherPath, '-Uri', $Uri, '-Port', '39999', '-DryRun') + $ExtraArgs
  $output = (& powershell @invokeArgs 2>&1 | Out-String).Trim()
  $ErrorActionPreference = $previous

  if ($output -notmatch [regex]::Escape($ExpectedCode)) {
    throw "Case '$Name' failed. Expected code '$ExpectedCode'. Output=$output"
  }
  Write-Host ("[PASS] {0} ({1})" -f $Name, $ExpectedCode)
}

Invoke-Case -Name 'Invalid scheme' -Uri 'https://start-bridge?source=test&v=1' -ExpectedCode 'LCH-001'
Invoke-Case -Name 'Invalid path' -Uri 'sidepilot://bad-path?source=test&v=1' -ExpectedCode 'LCH-001'
Invoke-Case -Name 'Invalid query key' -Uri 'sidepilot://start-bridge?cmd=rm' -ExpectedCode 'LCH-002'
Invoke-Case -Name 'Valid dry-run' -Uri 'sidepilot://start-bridge?source=test&v=1' -ExpectedCode 'OK-DRYRUN'
Invoke-Case -Name 'Valid WSL dry-run' -Uri 'sidepilot://start-bridge?source=test&v=1' -ExpectedCode 'OK-DRYRUN' -ExtraArgs @('-Runtime', 'wsl', '-WslBridgeDir', '/path/to/SidePilot/scripts/copilot-bridge')

Write-Host '[PASS] All launcher tests completed.'
