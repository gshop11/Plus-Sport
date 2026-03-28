param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('dev', 'build', 'start', 'reset')]
  [string]$Mode
)

$ErrorActionPreference = 'Stop'

function Stop-NodeProcesses {
  $portProcessIds = @()

  try {
    $portProcessIds = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction Stop |
      Select-Object -ExpandProperty OwningProcess -Unique
  } catch {
    $portProcessIds = @()
  }

  foreach ($processId in $portProcessIds) {
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
  }

  $nextProcesses = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
    Where-Object {
      $_.Name -eq 'node.exe' -and
      $_.CommandLine -and
      (
        $_.CommandLine -like '*next dev*' -or
        $_.CommandLine -like '*next start*'
      )
    }

  foreach ($process in $nextProcesses) {
    Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
  }

  if ($portProcessIds.Count -gt 0 -or $nextProcesses) {
    Start-Sleep -Seconds 1
  }
}

function Remove-NextBuild {
  if (Test-Path '.next') {
    Remove-Item '.next' -Recurse -Force -ErrorAction SilentlyContinue
  }
}

function Run-Next {
  param(
    [Parameter(Mandatory = $true)]
    [string[]]$Arguments
  )

  & .\node_modules\.bin\next.cmd @Arguments

  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
}

Stop-NodeProcesses

switch ($Mode) {
  'dev' {
    Run-Next -Arguments @('dev', '--turbo')
  }
  'build' {
    Remove-NextBuild
    Run-Next -Arguments @('build')
  }
  'start' {
    Remove-NextBuild
    Run-Next -Arguments @('build')
    Run-Next -Arguments @('start')
  }
  'reset' {
    Remove-NextBuild
    Write-Host 'Next reset complete. You can now run npm run dev or npm run start.'
  }
}
