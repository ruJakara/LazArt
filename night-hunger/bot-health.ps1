param(
    [string]$EnvFile = ".env",
    [string]$ComposeFile = "docker/docker-compose.prod.yml",
    [int]$LocalHeartbeatStaleAfterSeconds = 120
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Continue"
if ($null -ne (Get-Variable -Name PSNativeCommandUseErrorActionPreference -ErrorAction SilentlyContinue)) {
    $PSNativeCommandUseErrorActionPreference = $false
}

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

function Write-Status([string]$Name, [string]$Value) {
    Write-Output ("{0}: {1}" -f $Name, $Value)
}

if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Status "docker-compose" "NOT_FOUND"
} else {
    docker info 1>$null 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Status "docker_engine" "DOWN"
    } else {
        Write-Status "docker_engine" "UP"
        $composeArgs = @("--env-file", $EnvFile, "-f", $ComposeFile)

        $containerId = (& docker-compose @composeArgs ps -q bot 2>$null).Trim()
        if (-not $containerId) {
            Write-Status "bot_container" "NOT_RUNNING"
        } else {
            Write-Status "bot_container" "RUNNING ($containerId)"
            $health = (& docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' $containerId 2>$null).Trim()
            Write-Status "bot_health" $health
            $state = (& docker inspect --format '{{.State.Status}}' $containerId 2>$null).Trim()
            Write-Status "bot_state" $state
            $restartCount = (& docker inspect --format '{{.RestartCount}}' $containerId 2>$null).Trim()
            Write-Status "bot_restart_count" $restartCount
        }
    }
}

$localHeartbeat = Join-Path $root "apps/bot/.tmp/bot-heartbeat.txt"
if (Test-Path $localHeartbeat) {
    $age = [int]((Get-Date) - (Get-Item $localHeartbeat).LastWriteTime).TotalSeconds
    if ($age -le $LocalHeartbeatStaleAfterSeconds) {
        Write-Status "local_bot_heartbeat" "FRESH (${age}s)"
    } else {
        Write-Status "local_bot_heartbeat" "STALE (${age}s)"
    }
} else {
    Write-Status "local_bot_heartbeat" "MISSING"
}
