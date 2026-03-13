param(
  [string]$ProjectRoot = '',
  [ValidateSet('auto', 'windows', 'wsl')]
  [string]$Runtime = 'auto',
  [string]$WslDistro = '',
  [string]$WslBridgeDir = '',
  [int]$Port = 31031,
  [int]$StartupTimeoutSec = 45,
  [string]$ExtensionId = '',
  [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$isDryRun = [bool]$DryRun
if (-not $isDryRun) {
  $envDryRun = [string]$env:SIDEPILOT_BOOTSTRAP_DRY_RUN
  if ($envDryRun -match '^(1|true|yes)$') {
    $isDryRun = $true
  }
}
if (-not $isDryRun) {
  $isDryRun = @($args | Where-Object {
      [string]$_ -match '^-DryRun(?::(?:\$?true|1))?$'
    }).Count -gt 0
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$installLauncherScript = Join-Path $scriptDir 'install-launcher.ps1'
$launcherRoot = Join-Path $env:LOCALAPPDATA 'SidePilot\BridgeLauncher'
$launcherScript = Join-Path $launcherRoot 'sidepilot-bridge-launcher.ps1'

function Write-Step {
  param([string]$Message)
  Write-Host ("[bootstrap] {0}" -f $Message)
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
    Invoke-WslBash -Distro $Distro -CommandText ("test -d '{0}'" -f $LinuxPath.Replace("'", "'""'""'")) | Out-Null
    return $LASTEXITCODE -eq 0
  } catch {
    return $false
  }
}

function Test-WslFile {
  param(
    [string]$LinuxPath,
    [string]$Distro = ''
  )

  if ([string]::IsNullOrWhiteSpace($LinuxPath)) {
    return $false
  }

  try {
    Invoke-WslBash -Distro $Distro -CommandText ("test -f '{0}'" -f $LinuxPath.Replace("'", "'""'""'")) | Out-Null
    return $LASTEXITCODE -eq 0
  } catch {
    return $false
  }
}

function Get-NodeMajorVersion {
  param([string]$NodeExe)

  try {
    $raw = [string](& $NodeExe --version 2>$null | Select-Object -First 1)
    $match = [regex]::Match($raw.Trim(), '^v(\d+)')
    if ($match.Success) {
      return [int]$match.Groups[1].Value
    }
  } catch {
    return 0
  }

  return 0
}

function Resolve-WindowsNodeToolchain {
  $dirs = New-Object 'System.Collections.Generic.List[string]'
  $npmCmdInfo = Get-Command npm.cmd -ErrorAction SilentlyContinue
  $nodeExeInfo = Get-Command node.exe -ErrorAction SilentlyContinue
  $npmDir = if ($null -ne $npmCmdInfo -and -not [string]::IsNullOrWhiteSpace([string]$npmCmdInfo.Source)) {
    Split-Path -Parent ([string]$npmCmdInfo.Source)
  } else {
    ''
  }
  $nodeDir = if ($null -ne $nodeExeInfo -and -not [string]::IsNullOrWhiteSpace([string]$nodeExeInfo.Source)) {
    Split-Path -Parent ([string]$nodeExeInfo.Source)
  } else {
    ''
  }

  foreach ($candidate in @(
      $npmDir,
      $nodeDir,
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
    if ([string]::IsNullOrWhiteSpace($dir) -or $seen.ContainsKey($dir)) {
      continue
    }
    $seen[$dir] = $true
    $nodeExe = Join-Path $dir 'node.exe'
    $npmCmd = Join-Path $dir 'npm.cmd'
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
        Major = $major
      }
    }
  }

  return $null
}

function Resolve-WslNodeVersion {
  param([string]$LinuxBridgeDir, [string]$Distro = '')

  if (-not (Test-WslDirectory -LinuxPath $LinuxBridgeDir -Distro $Distro)) {
    return $null
  }

  try {
    $nodeVersion = [string](Invoke-WslBash -Distro $Distro -CommandText ("cd '{0}' && node --version 2>/dev/null | head -n 1" -f $LinuxBridgeDir.Replace("'", "'""'""'")))
    $npmPath = [string](Invoke-WslBash -Distro $Distro -CommandText ("cd '{0}' && command -v npm 2>/dev/null | head -n 1" -f $LinuxBridgeDir.Replace("'", "'""'""'")))
  } catch {
    return $null
  }

  $match = [regex]::Match($nodeVersion.Trim(), '^v(\d+)')
  $major = if ($match.Success) { [int]$match.Groups[1].Value } else { 0 }
  if ($major -ge 24 -and -not [string]::IsNullOrWhiteSpace($npmPath)) {
    return @{
      NodeVersion = $nodeVersion.Trim()
      NpmPath = $npmPath.Trim()
    }
  }

  return $null
}

function Get-WslNodeSetupScriptPath {
  param(
    [string]$WindowsProjectRoot = '',
    [string]$LinuxProjectRoot = ''
  )

  if (-not [string]::IsNullOrWhiteSpace($LinuxProjectRoot)) {
    return Join-LinuxPath -BasePath $LinuxProjectRoot -ChildPath 'scripts/bridge-launcher/wsl/ensure-node24.sh'
  }

  if (-not [string]::IsNullOrWhiteSpace($WindowsProjectRoot)) {
    $windowsScriptPath = Join-Path $WindowsProjectRoot 'scripts\bridge-launcher\wsl\ensure-node24.sh'
    return Convert-WindowsPathToWslPath -WindowsPath $windowsScriptPath
  }

  return ''
}

function Test-BridgeReady {
  param([int]$HealthPort)

  $healthUrl = "http://localhost:{0}/health" -f $HealthPort
  try {
    $health = Invoke-RestMethod -Uri $healthUrl -Method Get -TimeoutSec 3
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

if (-not (Test-Path -Path $installLauncherScript -PathType Leaf)) {
  throw "install-launcher.ps1 not found: $installLauncherScript"
}

if ([string]::IsNullOrWhiteSpace($ProjectRoot)) {
  $ProjectRoot = (Resolve-Path (Join-Path $scriptDir '..\..\..')).Path
}

$runtimeMode = $Runtime
$windowsProjectRoot = ''
$linuxProjectRoot = ''
$windowsBridgeDir = ''
$linuxBridgeDir = $WslBridgeDir

if (Test-IsLinuxPath $ProjectRoot) {
  $linuxProjectRoot = $ProjectRoot
  if ($runtimeMode -eq 'auto') {
    $runtimeMode = 'wsl'
  }
  if ([string]::IsNullOrWhiteSpace($linuxBridgeDir)) {
    $linuxBridgeDir = Join-LinuxPath -BasePath $linuxProjectRoot -ChildPath 'scripts/copilot-bridge'
  }
} else {
  if (-not (Test-IsWindowsPath $ProjectRoot)) {
    throw "ProjectRoot must be a Windows path or Linux path: $ProjectRoot"
  }
  $windowsProjectRoot = $ProjectRoot
  if ($runtimeMode -eq 'auto') {
    $runtimeMode = 'windows'
  }
  $windowsBridgeDir = Join-Path $windowsProjectRoot 'scripts\copilot-bridge'
  if ($runtimeMode -eq 'wsl' -and [string]::IsNullOrWhiteSpace($linuxBridgeDir)) {
    $linuxBridgeDir = Convert-WindowsPathToWslPath -WindowsPath $windowsBridgeDir
  }
}

if ($runtimeMode -eq 'windows' -and [string]::IsNullOrWhiteSpace($windowsBridgeDir)) {
  if ([string]::IsNullOrWhiteSpace($windowsProjectRoot)) {
    throw 'Windows runtime requires a Windows ProjectRoot.'
  }
  $windowsBridgeDir = Join-Path $windowsProjectRoot 'scripts\copilot-bridge'
}

if ($runtimeMode -eq 'wsl' -and [string]::IsNullOrWhiteSpace($linuxBridgeDir)) {
  if ([string]::IsNullOrWhiteSpace($linuxProjectRoot)) {
    throw 'WSL runtime requires a Linux ProjectRoot or WslBridgeDir.'
  }
  $linuxBridgeDir = Join-LinuxPath -BasePath $linuxProjectRoot -ChildPath 'scripts/copilot-bridge'
}

Write-Step ("Runtime: {0}" -f $runtimeMode)
if (-not [string]::IsNullOrWhiteSpace($windowsProjectRoot)) {
  Write-Step ("Windows project root: {0}" -f $windowsProjectRoot)
}
if (-not [string]::IsNullOrWhiteSpace($linuxProjectRoot)) {
  Write-Step ("WSL project root: {0}" -f $linuxProjectRoot)
}
if (-not [string]::IsNullOrWhiteSpace($windowsBridgeDir)) {
  Write-Step ("Windows bridge dir: {0}" -f $windowsBridgeDir)
}
if (-not [string]::IsNullOrWhiteSpace($linuxBridgeDir)) {
  Write-Step ("WSL bridge dir: {0}" -f $linuxBridgeDir)
}

if ($runtimeMode -eq 'windows') {
  if (-not (Test-Path -Path $windowsBridgeDir -PathType Container)) {
    throw "Windows bridge directory not found: $windowsBridgeDir"
  }
  $toolchain = Resolve-WindowsNodeToolchain
  if ($null -eq $toolchain) {
    throw 'Node.js 24+ with npm is not available on Windows.'
  }
  Write-Step ("Windows Node.js: {0}" -f (& $toolchain.NodeExe --version))
  if ($isDryRun) {
    Write-Step 'Dry-run mode enabled.'
    return
  }
  Write-Step 'Installing bridge dependencies on Windows...'
  Push-Location $windowsBridgeDir
  try {
    & $toolchain.NpmCmd 'install' '--no-fund' '--no-audit' | Out-Host
    if ($LASTEXITCODE -ne 0) {
      throw 'npm install failed on Windows bridge runtime.'
    }
  } finally {
    Pop-Location
  }
} else {
  if (-not (Test-WslDirectory -LinuxPath $linuxBridgeDir -Distro $WslDistro)) {
    throw "WSL bridge directory not found: $linuxBridgeDir"
  }
  $wslNodeSetupScript = Get-WslNodeSetupScriptPath -WindowsProjectRoot $windowsProjectRoot -LinuxProjectRoot $linuxProjectRoot
  $wslNode = Resolve-WslNodeVersion -LinuxBridgeDir $linuxBridgeDir -Distro $WslDistro
  if ($null -eq $wslNode) {
    if ($isDryRun) {
      Write-Step 'WSL Node.js 24+ is missing. Quick Setup would install user-local nvm + Node 24 in the selected distro.'
      Write-Step 'Dry-run mode enabled.'
      return
    }
    if ([string]::IsNullOrWhiteSpace($wslNodeSetupScript) -or -not (Test-WslFile -LinuxPath $wslNodeSetupScript -Distro $WslDistro)) {
      throw 'Node.js 24+ with npm is not available in the selected WSL distro, and the WSL setup helper could not be resolved.'
    }
    Write-Step 'WSL Node.js 24+ is missing. Installing user-local nvm + Node 24...'
    $escapedSetupScript = $wslNodeSetupScript.Replace("'", "'""'""'")
    $setupOutput = Invoke-WslBash -Distro $WslDistro -CommandText ("bash '{0}'" -f $escapedSetupScript)
    $setupOutput | Out-Host
    if ($LASTEXITCODE -ne 0) {
      throw 'Automatic WSL Node.js setup failed.'
    }
    $wslNode = Resolve-WslNodeVersion -LinuxBridgeDir $linuxBridgeDir -Distro $WslDistro
  }
  if ($null -eq $wslNode) {
    throw 'Node.js 24+ with npm is still not available in the selected WSL distro after automatic setup.'
  }
  Write-Step ("WSL Node.js: {0}" -f $wslNode.NodeVersion)
  if ($isDryRun) {
    Write-Step 'Dry-run mode enabled.'
    return
  }
  Write-Step 'Installing bridge dependencies in WSL...'
  $escapedBridgeDir = $linuxBridgeDir.Replace("'", "'""'""'")
  $installOutput = Invoke-WslBash -Distro $WslDistro -CommandText ("cd '{0}' && npm install --no-fund --no-audit" -f $escapedBridgeDir)
  $installOutput | Out-Host
  if ($LASTEXITCODE -ne 0) {
    throw 'npm install failed in WSL bridge runtime.'
  }
}

Write-Step 'Registering SidePilot launcher...'
& $installLauncherScript `
  -ProjectRoot $ProjectRoot `
  -Runtime $runtimeMode `
  -WslDistro $WslDistro `
  -WslBridgeDir $linuxBridgeDir

if (-not (Test-Path -Path $launcherScript -PathType Leaf)) {
  throw "Launcher script not found after installation: $launcherScript"
}

$protocolUri = "sidepilot://start-bridge?source=bootstrap&v=1"
if (-not [string]::IsNullOrWhiteSpace($ExtensionId)) {
  $protocolUri = "{0}&ext={1}" -f $protocolUri, $ExtensionId
}

Write-Step 'Starting bridge through launcher...'
& $launcherScript `
  -Uri $protocolUri `
  -Runtime $runtimeMode `
  -BridgeDir $windowsBridgeDir `
  -WslBridgeDir $linuxBridgeDir `
  -WslDistro $WslDistro `
  -Port $Port `
  -StartupTimeoutSec $StartupTimeoutSec

if (-not (Test-BridgeReady -HealthPort $Port)) {
  throw ("Bridge did not pass localhost smoke test on port {0}" -f $Port)
}

$health = Invoke-RestMethod -Uri ("http://localhost:{0}/health" -f $Port) -Method Get -TimeoutSec 3
Write-Step ("Bridge is ready at http://localhost:{0}/health" -f $Port)
$sdkState = if ($null -ne $health -and -not [string]::IsNullOrWhiteSpace([string]$health.sdk)) {
  [string]$health.sdk
} else {
  'unknown'
}
$backendType = if ($null -ne $health -and $null -ne $health.backend -and -not [string]::IsNullOrWhiteSpace([string]$health.backend.type)) {
  [string]$health.backend.type
} else {
  'unknown'
}
Write-Step ("SDK state: {0}" -f $sdkState)
Write-Step ("Backend: {0}" -f $backendType)
