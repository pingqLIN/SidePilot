param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$Uri,
  [string]$BridgeDir = '',
  [int]$Port = 31031,
  [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptDir '..\..\..')
$launcherRoot = Join-Path $env:LOCALAPPDATA 'SidePilot\BridgeLauncher'
$logPath = Join-Path $launcherRoot 'launcher.log'
$configPath = Join-Path $launcherRoot 'launcher-config.json'
New-Item -ItemType Directory -Path $launcherRoot -Force | Out-Null

if ([string]::IsNullOrWhiteSpace($BridgeDir) -and (Test-Path -Path $configPath -PathType Leaf)) {
  try {
    $config = Get-Content -Path $configPath -Raw | ConvertFrom-Json
    if ($config.BridgeDir -and -not [string]::IsNullOrWhiteSpace([string]$config.BridgeDir)) {
      $BridgeDir = [string]$config.BridgeDir
    }
  } catch {
    # Ignore config parse errors and fallback to repo-relative path.
  }
}
if ([string]::IsNullOrWhiteSpace($BridgeDir)) {
  $BridgeDir = Join-Path $repoRoot 'scripts\copilot-bridge'
}

function Write-LauncherLog {
  param(
    [string]$Level,
    [string]$Message,
    [string]$Code = '',
    [string]$Details = ''
  )
  $ts = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
  $line = "{0} [{1}] code={2} msg={3} details={4}" -f $ts, $Level, $Code, $Message, $Details
  Add-Content -Path $logPath -Value $line
}

function Exit-WithCode {
  param(
    [int]$ExitCode,
    [string]$Code,
    [string]$Message,
    [string]$Details = ''
  )
  if ($ExitCode -eq 0) {
    Write-LauncherLog -Level 'INFO' -Code $Code -Message $Message -Details $Details
  } else {
    Write-LauncherLog -Level 'ERROR' -Code $Code -Message $Message -Details $Details
  }
  Write-Output ("{0}: {1}" -f $Code, $Message)
  if (-not [string]::IsNullOrWhiteSpace($Details)) {
    Write-Output ("details: {0}" -f $Details)
  }
  exit $ExitCode
}

function Parse-QueryString {
  param([string]$Query)
  $result = @{}
  if ([string]::IsNullOrWhiteSpace($Query)) {
    return $result
  }

  $clean = $Query.TrimStart('?')
  if ([string]::IsNullOrWhiteSpace($clean)) {
    return $result
  }

  $pairs = $clean -split '&'
  foreach ($pair in $pairs) {
    if ([string]::IsNullOrWhiteSpace($pair)) {
      continue
    }
    $kv = $pair -split '=', 2
    $key = [Uri]::UnescapeDataString($kv[0])
    $value = if ($kv.Length -gt 1) { [Uri]::UnescapeDataString($kv[1]) } else { '' }
    $result[$key] = $value
  }
  return $result
}

function Test-BridgeReady {
  param([int]$HealthPort)

  $healthUrl = "http://localhost:{0}/health" -f $HealthPort
  try {
    $health = Invoke-RestMethod -Uri $healthUrl -Method Get -TimeoutSec 2
    if ($null -eq $health) {
      return $false
    }
    if ($health.service -and $health.service -ne 'sidepilot-copilot-bridge') {
      return $false
    }
    return $true
  } catch {
    return $false
  }
}

$parsedUri = $null
try {
  $parsedUri = [Uri]$Uri
} catch {
  Exit-WithCode -ExitCode 101 -Code 'LCH-001' -Message 'Invalid protocol URI' -Details $Uri
}

if ($parsedUri.Scheme -ne 'sidepilot') {
  Exit-WithCode -ExitCode 101 -Code 'LCH-001' -Message 'Invalid scheme' -Details $parsedUri.Scheme
}

$target = if (-not [string]::IsNullOrWhiteSpace($parsedUri.Host)) {
  $parsedUri.Host
} else {
  $parsedUri.AbsolutePath.Trim('/')
}

if ($target -ne 'start-bridge') {
  Exit-WithCode -ExitCode 101 -Code 'LCH-001' -Message 'Invalid protocol path' -Details $target
}

$queryMap = Parse-QueryString -Query $parsedUri.Query
$allowedKeys = @('source', 'v')
foreach ($key in $queryMap.Keys) {
  if ($allowedKeys -notcontains $key) {
    Exit-WithCode -ExitCode 102 -Code 'LCH-002' -Message 'Unsupported query key' -Details $key
  }
  $valueLength = ([string]$queryMap[$key]).Length
  if ($valueLength -gt 32) {
    Exit-WithCode -ExitCode 102 -Code 'LCH-002' -Message 'Query value too long' -Details $key
  }
}

if (-not (Test-Path -Path $BridgeDir -PathType Container)) {
  Exit-WithCode -ExitCode 103 -Code 'LCH-003' -Message 'Bridge directory not found' -Details $BridgeDir
}

$npm = Get-Command npm -ErrorAction SilentlyContinue
if ($null -eq $npm) {
  Exit-WithCode -ExitCode 104 -Code 'LCH-004' -Message 'npm is not available in PATH'
}

if (Test-BridgeReady -HealthPort $Port) {
  Exit-WithCode -ExitCode 0 -Code 'LCH-006' -Message 'Bridge already running' -Details ("port={0}" -f $Port)
}

$lockName = 'Local\SidePilotBridgeLauncherLock'
$createdNew = $false
$mutex = New-Object System.Threading.Mutex($false, $lockName, [ref]$createdNew)
$hasHandle = $false

try {
  $hasHandle = $mutex.WaitOne(0)
  if (-not $hasHandle) {
    Exit-WithCode -ExitCode 0 -Code 'LCH-006' -Message 'Bridge launch already in progress'
  }

  if ($DryRun) {
    Exit-WithCode -ExitCode 0 -Code 'OK-DRYRUN' -Message 'Dry-run passed' -Details ("dir={0} port={1}" -f $BridgeDir, $Port)
  }

  $process = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c npm run dev' -WorkingDirectory $BridgeDir -WindowStyle Hidden -PassThru
  $detail = "pid={0} dir={1} port={2}" -f $process.Id, $BridgeDir, $Port
  Exit-WithCode -ExitCode 0 -Code 'OK-STARTED' -Message 'Bridge launch command started' -Details $detail
} catch {
  Exit-WithCode -ExitCode 105 -Code 'LCH-005' -Message 'Failed to start bridge process' -Details $_.Exception.Message
} finally {
  if ($hasHandle) {
    $mutex.ReleaseMutex() | Out-Null
  }
  $mutex.Dispose()
}
