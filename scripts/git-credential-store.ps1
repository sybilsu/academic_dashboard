# Store a GitHub PAT in the Windows Git Credential Manager for future git push/pull auth.
# Usage: powershell -NoProfile -File ".\scripts\git-credential-store.ps1" -Token <PAT>
param(
  [Parameter(Mandatory = $true)]
  [string]$Token,
  [string]$Username = "sybilsu"
)

$gitExe = "$env:ProgramFiles\Git\bin\git.exe"
if (-not (Test-Path $gitExe)) {
  $cmd = Get-Command git -ErrorAction SilentlyContinue
  if ($cmd) { $gitExe = $cmd.Source }
}

$lines = "protocol=https`nhost=github.com`nusername=$Username`npassword=$Token`n`n"
$tmpFile = [System.IO.Path]::GetTempFileName()
[System.IO.File]::WriteAllText($tmpFile, $lines, [System.Text.Encoding]::ASCII)

cmd /c "`"$gitExe`" credential approve < `"$tmpFile`""
$exitCode = $LASTEXITCODE
Remove-Item $tmpFile -Force

if ($exitCode -eq 0) {
  Write-Output "Stored in Git Credential Manager."
} else {
  Write-Output "git credential approve exited with code $exitCode"
}
