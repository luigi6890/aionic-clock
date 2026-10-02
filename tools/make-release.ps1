<#
.SYNOPSIS
  Cuts a release for Aionic Clock: verify, tag, push, and publish release notes.

.DESCRIPTION
  Reads the version from the badge in index.html (or -Version), takes the release
  title from the tagged commit's subject and the notes from the matching
  CHANGELOG section, then creates the annotated tag, pushes, and creates the
  GitHub release.

  There is nothing to maintain per release: the tag, the commit subject, and the
  changelog already carry everything needed.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\tools\make-release.ps1

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\tools\make-release.ps1 -DryRun
#>
[CmdletBinding()]
param(
  [string]$Version,
  [switch]$Force,
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
$root    = Split-Path -Parent $PSScriptRoot
$enc     = New-Object System.Text.UTF8Encoding $false
$notesFile = $null

function Fail($msg) { Write-Host "FAIL  $msg" -ForegroundColor Red; exit 1 }
function Ok($msg)   { Write-Host "OK    $msg" -ForegroundColor Green }
function Info($msg) { Write-Host "      $msg" }

# --- Locate the git repository and the gh CLI -------------------------------
Push-Location $root
try {
  $remote = (& git remote get-url origin) 2>$null
  if (-not $remote) { Fail "no 'origin' remote found in $root" }
  if ($remote -notmatch '[:/](?<owner>[^/]+)/(?<name>[^/.]+)(\.git)?$') {
    Fail "could not read owner/name from remote '$remote'"
  }
  $repo = "$($Matches.owner)/$($Matches.name)"

  $gh = (Get-Command gh -ErrorAction SilentlyContinue).Source
  if (-not $gh) {
    $gh = 'C:\Program Files\GitHub CLI\gh.exe'
    if (-not (Test-Path -LiteralPath $gh)) { Fail "GitHub CLI (gh) not found" }
  }

  # --- Work out which version we are releasing -------------------------------
  $html = [System.IO.File]::ReadAllText((Join-Path $root 'index.html'), $enc)
  if ($html -notmatch 'class="ver">v(?<ver>[0-9]+\.[0-9]+\.[0-9]+)<') {
    Fail "could not read the version badge from index.html"
  }
  $badge = $Matches['ver']
  $ver   = if ($Version) { $Version -replace '^v', '' } else { $badge }
  $tag   = "v$ver"
  Info "repository $repo"

  # --- Preflight checks ------------------------------------------------------
  $dirty = & git status --porcelain
  if ($dirty) { Fail "worktree is not clean; commit or stash first" }

  if (-not (& $gh auth status 2>&1) -or ($LASTEXITCODE -ne 0)) {
    Fail "gh is not authenticated - run 'gh auth login'"
  }

  $head = (& git rev-parse --short HEAD).Trim()
  $changelog = [System.IO.File]::ReadAllText((Join-Path $root 'CHANGELOG.md'), $enc)

  $existingTag = & git tag --list $tag
  if ($existingTag -and -not $Force) {
    Fail "$tag already exists (pass -Force to retag)"
  }
  if ($badge -ne $ver) {
    Fail "index.html says v$badge but you asked for v$ver - bump the badge and the credit line first"
  }
  if ($badge -eq (& git describe --tags --abbrev=0 2>$null)) {
    Info "warning: v$ver is already the newest tag; this would retag the same commit"
  }

  $m = [regex]::Matches($changelog, '(?m)^## \[(?<ver>[0-9]+\.[0-9]+\.[0-9]+)\][^\r\n]*') |
       Where-Object { $_.Groups['ver'].Value -eq $ver } | Select-Object -First 1
  if (-not $m) { Fail "CHANGELOG.md has no '## [$ver]' section" }

  # --- Derive the title from the commit that added this changelog section ----
  # Using CHANGELOG.md rather than HEAD means a documentation commit made after
  # the release cannot hijack the title.
  $subject = (& git log -1 --format=%s -- CHANGELOG.md).Trim()
  if (-not $subject) { $subject = (& git log -1 --format=%s).Trim() }
  $title = ($subject -replace '^(feat|fix|docs|chore|refactor|perf|test|build|ci|style)(\([^)]*\))?!?:\s*', '').Trim()
  $title = $title.TrimEnd('.')
  $title = $title.Substring(0, 1).ToUpper() + $title.Substring(1)

  # --- Derive the notes from the changelog section --------------------------
  $start = $m.Index + $m.Length
  $end   = if ($m.NextMatch().Success) { $m.NextMatch().Index } else { $changelog.Length }
  $body  = $changelog.Substring($start, $end - $start).Trim()
  $notes = "$title`r`n`r`n$body`r`n"

  $notesFile = Join-Path $env:TEMP "aionic-release-$ver.md"
  [System.IO.File]::WriteAllText($notesFile, $notes, $enc)

  Write-Host ''
  Write-Host "  tag    $tag" -ForegroundColor Cyan
  Write-Host "  title  $title" -ForegroundColor Cyan
  Write-Host "  commit $head" -ForegroundColor Cyan
  Write-Host "  notes  $notesFile" -ForegroundColor Cyan
  Write-Host ''

  if ($DryRun) { Ok 'dry run - nothing was tagged, pushed, or published'; return }

  # --- Release ---------------------------------------------------------------
  & git tag -f -a $tag $head -m $title
  if ($LASTEXITCODE -ne 0) { Fail "could not create $tag" }
  Ok "tagged $tag"

  & git push origin ($root -replace '\\', '/') 2>&1 | Out-Null
  & git push origin $tag 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) { Fail "push failed - the local tag exists but is not on the remote" }
  Ok 'pushed main and tag'

  & $gh release create $tag --repo $repo --title "$tag - $title" --notes-file $notesFile
  if ($LASTEXITCODE -ne 0) { Fail "gh release create failed" }
  Ok "published $tag"
  Write-Host ''
  Write-Host "  https://github.com/$repo/releases/tag/$tag"
}
finally {
  Pop-Location
  if ($notesFile -and (Test-Path -LiteralPath $notesFile)) { Remove-Item -LiteralPath $notesFile -Force }
}
