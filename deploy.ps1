param(
  [string]$Message = ""
)

$ErrorActionPreference = "Stop"

function Require-Ok($ExitCode, $What) {
  if ($ExitCode -ne 0) { throw "Failed: $What (exit $ExitCode)" }
}

git rev-parse --is-inside-work-tree | Out-Null
Require-Ok $LASTEXITCODE "git rev-parse"

git status --porcelain | Out-Null
Require-Ok $LASTEXITCODE "git status"

$branch = (git branch --show-current).Trim()
Require-Ok $LASTEXITCODE "git branch --show-current"

if ([string]::IsNullOrWhiteSpace($branch)) { throw "Cannot detect current branch" }
if ($branch -ne "main") {
  Write-Host "Switching to main..."
  git checkout main
  Require-Ok $LASTEXITCODE "git checkout main"
}

# Ensure we are up to date before pushing
git pull --rebase --autostash
Require-Ok $LASTEXITCODE "git pull --rebase --autostash"

$changes = git status --porcelain
Require-Ok $LASTEXITCODE "git status --porcelain"

if (-not $changes) {
  Write-Host "No changes to deploy."
  exit 0
}

git add -A
Require-Ok $LASTEXITCODE "git add -A"

if ([string]::IsNullOrWhiteSpace($Message)) {
  $Message = "chore: deploy $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
}

git commit -m "$Message"
Require-Ok $LASTEXITCODE "git commit"

git push
Require-Ok $LASTEXITCODE "git push"

Write-Host "Pushed to main. GitHub Pages workflow should deploy automatically."
