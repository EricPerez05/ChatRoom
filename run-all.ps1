param(
  [switch]$SkipInstall,
  [switch]$SkipTests,
  [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $root 'BackEnd'
$frontendPath = Join-Path $root 'FrontEnd'

function Invoke-Step {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][scriptblock]$Action
  )

  Write-Host "`n==> $Name" -ForegroundColor Cyan
  & $Action
  Write-Host "OK: $Name" -ForegroundColor Green
}

function Invoke-Npm {
  param(
    [Parameter(Mandatory = $true)][string]$WorkingDirectory,
    [Parameter(Mandatory = $true)][string]$Command
  )

  Push-Location $WorkingDirectory
  try {
    npm run $Command
  }
  finally {
    Pop-Location
  }
}

Write-Host 'ChatRoom full run script' -ForegroundColor Yellow
Write-Host "Root: $root"

if (-not (Test-Path $backendPath)) {
  throw "BackEnd folder not found at: $backendPath"
}
if (-not (Test-Path $frontendPath)) {
  throw "FrontEnd folder not found at: $frontendPath"
}

if (-not $SkipInstall) {
  Invoke-Step -Name 'Install backend dependencies' -Action {
    Push-Location $backendPath
    try { npm install } finally { Pop-Location }
  }

  Invoke-Step -Name 'Install frontend dependencies' -Action {
    Push-Location $frontendPath
    try { npm install } finally { Pop-Location }
  }
}

if (-not $SkipTests) {
  Invoke-Step -Name 'Run backend tests' -Action {
    Invoke-Npm -WorkingDirectory $backendPath -Command 'test'
  }
}

if (-not $SkipBuild) {
  Invoke-Step -Name 'Build backend' -Action {
    Invoke-Npm -WorkingDirectory $backendPath -Command 'build'
  }

  Invoke-Step -Name 'Build frontend' -Action {
    Invoke-Npm -WorkingDirectory $frontendPath -Command 'build'
  }
}

Invoke-Step -Name 'Start backend dev server in new terminal' -Action {
  $backendCmd = "Set-Location '$backendPath'; npm run dev"
  Start-Process powershell -ArgumentList @('-NoExit', '-Command', $backendCmd) | Out-Null
}

Start-Sleep -Seconds 3

Invoke-Step -Name 'Backend health check' -Action {
  $health = Invoke-RestMethod -Method Get -Uri 'http://localhost:4000/health'
  if (-not $health.ok) {
    throw 'Backend health endpoint did not return ok=true.'
  }
  Write-Host "Backend health: $($health.service)"
}

Invoke-Step -Name 'Start frontend dev server in new terminal' -Action {
  $frontendCmd = "Set-Location '$frontendPath'; npm run dev"
  Start-Process powershell -ArgumentList @('-NoExit', '-Command', $frontendCmd) | Out-Null
}

Write-Host "`nAll done. Open http://localhost:5173" -ForegroundColor Green
Write-Host 'Tip: use -SkipInstall for faster reruns.' -ForegroundColor DarkGray
