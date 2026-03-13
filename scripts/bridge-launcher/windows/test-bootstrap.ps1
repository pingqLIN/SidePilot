param(
  [string]$BootstrapPath = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if ([string]::IsNullOrWhiteSpace($BootstrapPath)) {
  $BootstrapPath = Join-Path $scriptDir 'bootstrap-bridge.ps1'
}

if (-not (Test-Path -Path $BootstrapPath -PathType Leaf)) {
  throw "Bootstrap script not found: $BootstrapPath"
}

function Invoke-Case {
  param(
    [string]$Name,
    [string[]]$Args
  )

  $previous = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  $escapedScript = $BootstrapPath.Replace("'", "''")
  $escapedArgs = $Args | ForEach-Object {
    $value = [string]$_
    if ($value -match "^[A-Za-z0-9_:\\.\-/\$]+$") {
      $value
    } else {
      "'" + $value.Replace("'", "''") + "'"
    }
  }
  $commandText = '$env:SIDEPILOT_BOOTSTRAP_DRY_RUN=''1''; & ''' + $escapedScript + ''' ' + ($escapedArgs -join ' ')
  $invokeArgs = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', $commandText)
  $output = (& powershell.exe @invokeArgs 2>&1 | Out-String).Trim()
  $ErrorActionPreference = $previous

  if ($output -notmatch 'Dry-run mode enabled') {
    throw "Case '$Name' failed. Output=$output"
  }
  Write-Host ("[PASS] {0}" -f $Name)
}

Invoke-Case -Name 'Windows dry-run' -Args @(
  '-ProjectRoot', 'C:\Projects\SidePilot',
  '-Runtime', 'windows',
  '-DryRun:$true'
)
Invoke-Case -Name 'WSL dry-run' -Args @(
  '-ProjectRoot', '/path/to/SidePilot',
  '-Runtime', 'wsl',
  '-WslDistro', 'Ubuntu',
  '-WslBridgeDir', '/path/to/SidePilot/scripts/copilot-bridge',
  '-DryRun:$true'
)

Write-Host '[PASS] All bootstrap tests completed.'
