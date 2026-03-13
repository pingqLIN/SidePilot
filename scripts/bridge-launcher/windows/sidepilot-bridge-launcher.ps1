param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$Uri,
  [string]$BridgeDir = '',
  [ValidateSet('auto', 'windows', 'wsl')]
  [string]$Runtime = 'auto',
  [string]$WslBridgeDir = '',
  [string]$WslDistro = '',
  [int]$Port = 31031,
  [int]$StartupTimeoutSec = 45,
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

function Test-IsLinuxPath {
  param([string]$PathValue)
  return [string]$PathValue -match '^/'
}

function Test-IsWindowsPath {
  param([string]$PathValue)
  return [string]$PathValue -match '^(?:[A-Za-z]:\\|\\\\)'
}

function Escape-BashArgument {
  param([string]$Value)
  $escaped = ([string]$Value) -replace "'", "'""'""'"
  return "'{0}'" -f $escaped
}

function Get-WslExePath {
  $cmd = Get-Command wsl.exe -ErrorAction SilentlyContinue
  if ($null -eq $cmd -or [string]::IsNullOrWhiteSpace($cmd.Source)) {
    return ''
  }
  return [string]$cmd.Source
}

function Invoke-WslBash {
  param(
    [string]$CommandText,
    [string]$Distro = ''
  )

  $wslExe = Get-WslExePath
  if ([string]::IsNullOrWhiteSpace($wslExe)) {
    throw 'wsl.exe is not available'
  }

  $args = @()
  if (-not [string]::IsNullOrWhiteSpace($Distro)) {
    $args += '-d'
    $args += $Distro
  }
  $args += '--'
  $args += 'bash'
  $args += '-lc'
  $args += $CommandText

  return & $wslExe @args
}

function Test-WslDirectory {
  param(
    [string]$LinuxPath,
    [string]$Distro = ''
  )

  if ([string]::IsNullOrWhiteSpace($LinuxPath)) {
    return $false
  }

  try {
    Invoke-WslBash -Distro $Distro -CommandText ("test -d {0}" -f (Escape-BashArgument $LinuxPath)) | Out-Null
    return $LASTEXITCODE -eq 0
  } catch {
    return $false
  }
}

function Test-WslBridgeBuildRequired {
  param(
    [string]$LinuxBridgeDir,
    [string]$Distro = ''
  )

  if ([string]::IsNullOrWhiteSpace($LinuxBridgeDir)) {
    return $true
  }

  $quotedDir = Escape-BashArgument $LinuxBridgeDir
  $commandText = @(
    'set -e'
    ("cd {0}" -f $quotedDir)
    'if [ ! -f dist/supervisor.js ]; then printf 1; exit 0; fi'
    'if [ -f package.json ] && [ package.json -nt dist/supervisor.js ]; then printf 1; exit 0; fi'
    'if [ -f package-lock.json ] && [ package-lock.json -nt dist/supervisor.js ]; then printf 1; exit 0; fi'
    'if [ -f tsconfig.json ] && [ tsconfig.json -nt dist/supervisor.js ]; then printf 1; exit 0; fi'
    "if find src -type f \( -name '*.ts' -o -name '*.d.ts' \) -newer dist/supervisor.js -print -quit | grep -q .; then printf 1; else printf 0; fi"
  ) -join '; '

  try {
    $result = [string](Invoke-WslBash -Distro $Distro -CommandText $commandText)
    return $result.Trim() -ne '0'
  } catch {
    return $true
  }
}

function Resolve-LauncherRuntime {
  param(
    [string]$RequestedRuntime,
    [string]$WindowsBridgeDir,
    [string]$LinuxBridgeDir
  )

  if ($RequestedRuntime -eq 'windows' -or $RequestedRuntime -eq 'wsl') {
    return $RequestedRuntime
  }
  if (-not [string]::IsNullOrWhiteSpace($LinuxBridgeDir) -or (Test-IsLinuxPath $WindowsBridgeDir)) {
    return 'wsl'
  }
  return 'windows'
}

function Wait-BridgeReady {
  param(
    [int]$HealthPort,
    [int]$TimeoutSec = 12
  )

  $deadline = (Get-Date).AddSeconds([Math]::Max(1, $TimeoutSec))
  while ((Get-Date) -lt $deadline) {
    if (Test-BridgeReady -HealthPort $HealthPort) {
      return $true
    }
    Start-Sleep -Milliseconds 500
  }
  return $false
}

if (Test-Path -Path $configPath -PathType Leaf) {
  try {
    $config = Get-Content -Path $configPath -Raw | ConvertFrom-Json
    if ([string]::IsNullOrWhiteSpace($BridgeDir) -and $config.BridgeDir -and -not [string]::IsNullOrWhiteSpace([string]$config.BridgeDir)) {
      $BridgeDir = [string]$config.BridgeDir
    }
    if ($Runtime -eq 'auto' -and $config.Runtime -and -not [string]::IsNullOrWhiteSpace([string]$config.Runtime)) {
      $Runtime = [string]$config.Runtime
    }
    if ([string]::IsNullOrWhiteSpace($WslBridgeDir) -and $config.WslBridgeDir -and -not [string]::IsNullOrWhiteSpace([string]$config.WslBridgeDir)) {
      $WslBridgeDir = [string]$config.WslBridgeDir
    }
    if ([string]::IsNullOrWhiteSpace($WslDistro) -and $config.WslDistro -and -not [string]::IsNullOrWhiteSpace([string]$config.WslDistro)) {
      $WslDistro = [string]$config.WslDistro
    }
    if ($Port -eq 31031 -and $config.Port) {
      $Port = [int]$config.Port
    }
  } catch {
    # Ignore config parse errors and fallback to repo-relative path.
  }
}
if ([string]::IsNullOrWhiteSpace($BridgeDir)) {
  $BridgeDir = Join-Path $repoRoot 'scripts\copilot-bridge'
}

$Runtime = Resolve-LauncherRuntime -RequestedRuntime $Runtime -WindowsBridgeDir $BridgeDir -LinuxBridgeDir $WslBridgeDir
if ($Runtime -eq 'wsl' -and [string]::IsNullOrWhiteSpace($WslBridgeDir) -and (Test-IsLinuxPath $BridgeDir)) {
  $WslBridgeDir = $BridgeDir
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

function Get-NodeMajorVersion {
  param([string]$NodeExe)

  try {
    $raw = [string](& $NodeExe --version 2>$null | Select-Object -First 1)
    if ([string]::IsNullOrWhiteSpace($raw)) {
      return 0
    }
    $match = [regex]::Match($raw.Trim(), '^v(\d+)')
    if ($match.Success) {
      return [int]$match.Groups[1].Value
    }
  } catch {
    return 0
  }

  return 0
}

function Resolve-NodeToolchain {
  $dirs = New-Object 'System.Collections.Generic.List[string]'

  $npmCmdInfo = Get-Command npm.cmd -ErrorAction SilentlyContinue
  $npmCmdPath = if ($null -ne $npmCmdInfo) { [string]$npmCmdInfo.Source } else { '' }
  if ([string]::IsNullOrWhiteSpace($npmCmdPath) -and $null -ne $npmCmdInfo) {
    $npmCmdPath = [string]$npmCmdInfo.Definition
  }
  if (-not [string]::IsNullOrWhiteSpace($npmCmdPath)) {
    $dirs.Add((Split-Path -Parent $npmCmdPath))
  }

  $nodeExeInfo = Get-Command node.exe -ErrorAction SilentlyContinue
  $nodeExePath = if ($null -ne $nodeExeInfo) { [string]$nodeExeInfo.Source } else { '' }
  if ([string]::IsNullOrWhiteSpace($nodeExePath) -and $null -ne $nodeExeInfo) {
    $nodeExePath = [string]$nodeExeInfo.Definition
  }
  if (-not [string]::IsNullOrWhiteSpace($nodeExePath)) {
    $dirs.Add((Split-Path -Parent $nodeExePath))
  }

  foreach ($candidate in @(
      (Join-Path $env:LOCALAPPDATA 'Programs\nodejs'),
      (Join-Path $env:ProgramFiles 'nodejs'),
      (Join-Path ${env:ProgramFiles(x86)} 'nodejs')
    )) {
    if (-not [string]::IsNullOrWhiteSpace($candidate)) {
      $dirs.Add($candidate)
    }
  }

  $seen = @{}
  foreach ($dir in $dirs) {
    if ([string]::IsNullOrWhiteSpace($dir)) {
      continue
    }
    $normalizedDir = [string]$dir
    if ($seen.ContainsKey($normalizedDir)) {
      continue
    }
    $seen[$normalizedDir] = $true

    $nodeExe = Join-Path $normalizedDir 'node.exe'
    $npmCmd = Join-Path $normalizedDir 'npm.cmd'
    if (-not (Test-Path -Path $nodeExe -PathType Leaf)) {
      continue
    }
    if (-not (Test-Path -Path $npmCmd -PathType Leaf)) {
      continue
    }

    $major = Get-NodeMajorVersion -NodeExe $nodeExe
    if ($major -ge 24) {
      return @{
        NodeExe = $nodeExe
        NpmCmd = $npmCmd
        Dir = $normalizedDir
        Major = $major
      }
    }
  }

  return $null
}

function Resolve-WslToolchain {
  param(
    [string]$LinuxBridgeDir,
    [string]$Distro = ''
  )

  if (-not (Test-WslDirectory -LinuxPath $LinuxBridgeDir -Distro $Distro)) {
    return $null
  }

  try {
    $nodeVersion = [string](Invoke-WslBash -Distro $Distro -CommandText 'node --version 2>/dev/null | head -n 1')
    $npmPath = [string](Invoke-WslBash -Distro $Distro -CommandText 'command -v npm 2>/dev/null | head -n 1')
    $npxPath = [string](Invoke-WslBash -Distro $Distro -CommandText 'command -v npx 2>/dev/null | head -n 1')
  } catch {
    return $null
  }

  $match = [regex]::Match($nodeVersion.Trim(), '^v(\d+)')
  $major = if ($match.Success) { [int]$match.Groups[1].Value } else { 0 }
  if ($major -ge 24 -and -not [string]::IsNullOrWhiteSpace($npmPath)) {
    return @{
      Mode = 'native'
      NodeVersion = $nodeVersion.Trim()
      BuildArgs = @('node', './node_modules/typescript/bin/tsc')
      StartArgs = @('node', 'dist/supervisor.js')
      Distro = $Distro
      LinuxBridgeDir = $LinuxBridgeDir
    }
  }

  $localNode24 = ''
  try {
    $localNode24 = [string](Invoke-WslBash -Distro $Distro -CommandText 'if [ -x /tmp/codex-node24/node_modules/node/bin/node ]; then printf %s /tmp/codex-node24/node_modules/node/bin/node; fi')
  } catch {
    $localNode24 = ''
  }
  if (-not [string]::IsNullOrWhiteSpace($localNode24)) {
    $localNode24Path = $localNode24.Trim()
    $quotedLocalNode24 = Escape-BashArgument $localNode24Path
    $localNodeVersion = [string](Invoke-WslBash -Distro $Distro -CommandText ("{0} --version 2>/dev/null | head -n 1" -f $quotedLocalNode24))
    return @{
      Mode = 'local-node24'
      NodeVersion = $localNodeVersion.Trim()
      BuildArgs = @($localNode24Path, './node_modules/typescript/bin/tsc')
      StartArgs = @($localNode24Path, 'dist/supervisor.js')
      Distro = $Distro
      LinuxBridgeDir = $LinuxBridgeDir
    }
  }

  if (-not [string]::IsNullOrWhiteSpace($npxPath)) {
    return @{
      Mode = 'npx-node24'
      NodeVersion = 'node@24 via npx'
      BuildArgs = @('npx', '-y', 'node@24', './node_modules/typescript/bin/tsc')
      StartArgs = @('npx', '-y', 'node@24', 'dist/supervisor.js')
      Distro = $Distro
      LinuxBridgeDir = $LinuxBridgeDir
    }
  }

  return $null
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
$allowedKeys = @('source', 'v', 'ext')
foreach ($key in $queryMap.Keys) {
  if ($allowedKeys -notcontains $key) {
    Exit-WithCode -ExitCode 102 -Code 'LCH-002' -Message 'Unsupported query key' -Details $key
  }
  $valueLength = ([string]$queryMap[$key]).Length
  if ($valueLength -gt 32) {
    Exit-WithCode -ExitCode 102 -Code 'LCH-002' -Message 'Query value too long' -Details $key
  }
}

$windowsBridgeDir = $BridgeDir
$linuxBridgeDir = if (-not [string]::IsNullOrWhiteSpace($WslBridgeDir)) { $WslBridgeDir } else { '' }

if ($Runtime -eq 'windows') {
  if (-not (Test-Path -Path $windowsBridgeDir -PathType Container)) {
    Exit-WithCode -ExitCode 103 -Code 'LCH-003' -Message 'Bridge directory not found' -Details $windowsBridgeDir
  }
} else {
  if ([string]::IsNullOrWhiteSpace($linuxBridgeDir)) {
    Exit-WithCode -ExitCode 103 -Code 'LCH-003' -Message 'WSL bridge directory not configured' -Details $windowsBridgeDir
  }
  if (-not (Test-WslDirectory -LinuxPath $linuxBridgeDir -Distro $WslDistro)) {
    Exit-WithCode -ExitCode 103 -Code 'LCH-003' -Message 'WSL bridge directory not found' -Details $linuxBridgeDir
  }
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

  $extensionId = ''
  if ($queryMap.ContainsKey('ext')) {
    $extensionId = [string]$queryMap['ext']
  }
  $extensionIdLabel = if ([string]::IsNullOrWhiteSpace($extensionId)) { '(unset)' } else { $extensionId }
  $wslDistroLabel = if ([string]::IsNullOrWhiteSpace($WslDistro)) { '(default)' } else { $WslDistro }

  if ($Runtime -eq 'windows') {
    $toolchain = Resolve-NodeToolchain
    if ($null -eq $toolchain) {
      Exit-WithCode -ExitCode 104 -Code 'LCH-004' -Message 'Node.js v24+ with npm is not available' -Details 'Install Node.js 24 or add it to PATH before launching Bridge'
    }

    if ($DryRun) {
      Exit-WithCode -ExitCode 0 -Code 'OK-DRYRUN' -Message 'Dry-run passed' -Details ("runtime=windows dir={0} port={1} node={2}" -f $windowsBridgeDir, $Port, $toolchain.NodeExe)
    }

    if (-not [string]::IsNullOrWhiteSpace($extensionId)) {
      $env:SIDEPILOT_EXTENSION_ID = $extensionId
    }
    $env:PORT = [string]$Port

    $process = Start-Process -FilePath $toolchain.NpmCmd -ArgumentList 'run', 'start' -WorkingDirectory $windowsBridgeDir -WindowStyle Hidden -PassThru
    if (-not (Wait-BridgeReady -HealthPort $Port -TimeoutSec $StartupTimeoutSec)) {
      Exit-WithCode -ExitCode 105 -Code 'LCH-005' -Message 'Bridge did not become ready in time' -Details ("runtime=windows dir={0} port={1}" -f $windowsBridgeDir, $Port)
    }

    $detail = "runtime=windows pid={0} dir={1} port={2} node={3} ext={4}" -f $process.Id, $windowsBridgeDir, $Port, $toolchain.NodeExe, $extensionIdLabel
    Exit-WithCode -ExitCode 0 -Code 'OK-STARTED' -Message 'Bridge launch command started' -Details $detail
  }

  $wslToolchain = Resolve-WslToolchain -LinuxBridgeDir $linuxBridgeDir -Distro $WslDistro
  if ($null -eq $wslToolchain) {
    $detail = if ([string]::IsNullOrWhiteSpace($WslDistro)) {
      "Install Node.js 24+ and npm in the default WSL distro"
    } else {
      "Install Node.js 24+ and npm in WSL distro '$WslDistro'"
    }
    Exit-WithCode -ExitCode 104 -Code 'LCH-004' -Message 'WSL Node.js v24+ with npm is not available' -Details $detail
  }

  if ($DryRun) {
    Exit-WithCode -ExitCode 0 -Code 'OK-DRYRUN' -Message 'Dry-run passed' -Details ("runtime=wsl distro={0} dir={1} port={2} node={3}" -f $wslDistroLabel, $linuxBridgeDir, $Port, $wslToolchain.NodeVersion)
  }

  $wslExe = Get-WslExePath
  $buildMode = 'cached'
  if (Test-WslBridgeBuildRequired -LinuxBridgeDir $linuxBridgeDir -Distro $WslDistro) {
    $buildMode = 'rebuilt'
    $buildArgs = @()
    if (-not [string]::IsNullOrWhiteSpace($WslDistro)) {
      $buildArgs += '-d'
      $buildArgs += $WslDistro
    }
    $buildArgs += '--cd'
    $buildArgs += $linuxBridgeDir
    $buildArgs += '--exec'
    $buildArgs += $wslToolchain.BuildArgs

    $buildOutput = & $wslExe @buildArgs 2>&1
    if ($LASTEXITCODE -ne 0) {
      $detail = [string]($buildOutput | Select-Object -First 20 | Out-String).Trim()
      if ([string]::IsNullOrWhiteSpace($detail)) {
        $detail = "runtime=wsl distro={0} dir={1} port={2}" -f $wslDistroLabel, $linuxBridgeDir, $Port
      }
      Exit-WithCode -ExitCode 105 -Code 'LCH-005' -Message 'WSL bridge build failed' -Details $detail
    }
  }

  $startArgs = @()
  if (-not [string]::IsNullOrWhiteSpace($WslDistro)) {
    $startArgs += '-d'
    $startArgs += $WslDistro
  }
  $startArgs += '--cd'
  $startArgs += $linuxBridgeDir
  $startArgs += '--exec'
  $startArgs += 'env'
  $startArgs += ("PORT={0}" -f $Port)
  if (-not [string]::IsNullOrWhiteSpace($extensionId)) {
    $startArgs += ("SIDEPILOT_EXTENSION_ID={0}" -f $extensionId)
  }
  $startArgs += $wslToolchain.StartArgs

  $process = Start-Process -FilePath $wslExe -ArgumentList $startArgs -WindowStyle Hidden -PassThru
  if (-not (Wait-BridgeReady -HealthPort $Port -TimeoutSec $StartupTimeoutSec)) {
    Exit-WithCode -ExitCode 105 -Code 'LCH-005' -Message 'Bridge did not become ready in time' -Details ("runtime=wsl distro={0} dir={1} port={2}" -f $wslDistroLabel, $linuxBridgeDir, $Port)
  }

  $detail = "runtime=wsl pid={0} distro={1} dir={2} port={3} node={4} build={5} ext={6}" -f $process.Id, $wslDistroLabel, $linuxBridgeDir, $Port, $wslToolchain.NodeVersion, $buildMode, $extensionIdLabel
  Exit-WithCode -ExitCode 0 -Code 'OK-STARTED' -Message 'Bridge launch command started' -Details $detail
} catch {
  Exit-WithCode -ExitCode 105 -Code 'LCH-005' -Message 'Failed to start bridge process' -Details $_.Exception.Message
} finally {
  if ($hasHandle) {
    $mutex.ReleaseMutex() | Out-Null
  }
  $mutex.Dispose()
}
