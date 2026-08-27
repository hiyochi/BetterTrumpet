# BetterTrumpet Release Script
# Automates the build, packaging, and release process for x86, x64, and arm64.

param(
    [switch]$SkipBuild,
    [switch]$SkipGit,
    [switch]$SkipGitHub,
    [switch]$SkipChocolatey
)

$ErrorActionPreference = "Stop"
$Version = "3.3.1"
$Architectures = @('x86', 'x64', 'arm64')

# Map architecture -> build output dir, installer suffix, and portable suffix.
$ArchMap = @{
    x86   = @{ BuildDir = 'Build\Release';       Suffix = '' }
    x64   = @{ BuildDir = 'Build\Release-x64';   Suffix = '-x64' }
    arm64 = @{ BuildDir = 'Build\Release-arm64'; Suffix = '-arm64' }
}

Write-Host "🚀 BetterTrumpet $Version Release Process" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# STEP 1: Build Release (all architectures)
# ============================================================================
if (-not $SkipBuild) {
    Write-Host "📦 Step 1: Building Release..." -ForegroundColor Yellow

    foreach ($arch in $Architectures) {
        $buildDir = $ArchMap[$arch].BuildDir
        Write-Host "  Building Release $arch..."
        & msbuild EarTrumpet.vs15.sln /t:Rebuild /p:Configuration=Release /p:Platform=$arch /m /v:minimal

        if ($LASTEXITCODE -ne 0 -and -not (Test-Path "$buildDir\BetterTrumpet.exe")) {
            Write-Host "❌ Build failed for $arch!" -ForegroundColor Red
            exit 1
        }
    }

    Write-Host "  ✅ Build successful!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "⏭️  Skipping build (using existing)" -ForegroundColor Gray
    Write-Host ""
}

# ============================================================================
# STEP 2: Create Installers with Inno Setup (all architectures)
# ============================================================================
Write-Host "📦 Step 2: Creating Installers..." -ForegroundColor Yellow

$InnoSetupPath = "C:\Program Files (x86)\Inno Setup 6\ISCC.exe"
if (-not (Test-Path $InnoSetupPath)) {
    Write-Host "❌ Inno Setup not found at: $InnoSetupPath" -ForegroundColor Red
    Write-Host "   Please install Inno Setup 6 or update the path in this script" -ForegroundColor Red
    exit 1
}

$Installers = @{}
foreach ($arch in $Architectures) {
    $suffix = $ArchMap[$arch].Suffix
    Write-Host "  Running Inno Setup Compiler for $arch..."
    & $InnoSetupPath "/DArch=$arch" installer.iss

    $InstallerPath = "dist\BetterTrumpet-$Version-setup$suffix.exe"
    if (-not (Test-Path $InstallerPath)) {
        Write-Host "❌ Installer not created for $arch!" -ForegroundColor Red
        exit 1
    }

    $Installers[$arch] = $InstallerPath
    $InstallerSize = [math]::Round((Get-Item $InstallerPath).Length / 1MB, 2)
    Write-Host "  ✅ Installer created: $InstallerPath ($InstallerSize MB)"
}
Write-Host ""

# ============================================================================
# STEP 3: Calculate Checksums
# ============================================================================
Write-Host "🔐 Step 3: Calculating Checksums..." -ForegroundColor Yellow

$Checksums = @{}
foreach ($arch in $Architectures) {
    $Checksums[$arch] = (Get-FileHash -Path $Installers[$arch] -Algorithm SHA256).Hash
    Write-Host "  $arch SHA256: $($Checksums[$arch])" -ForegroundColor Cyan
}

# Update Chocolatey checksum (x86 + x64 + arm64 installers)
Write-Host "  Updating chocolatey checksum..."
$chocoInstall = Get-Content "chocolatey\tools\chocolateyInstall.ps1" -Raw
$chocoInstall = $chocoInstall -replace 'PLACEHOLDER_CHECKSUM_TO_BE_CALCULATED', $Checksums['x86']
$chocoInstall = $chocoInstall -replace 'PLACEHOLDER_CHECKSUM_X64', $Checksums['x64']
$chocoInstall = $chocoInstall -replace 'PLACEHOLDER_CHECKSUM_ARM64', $Checksums['arm64']
Set-Content "chocolatey\tools\chocolateyInstall.ps1" $chocoInstall -NoNewline

# Update Winget checksums (per-architecture installer entries)
Write-Host "  Updating winget checksums..."
$wingetFiles = @(
    "winget-manifest\xmn.BetterTrumpet.installer.yaml",
    "winget-manifest\manifests\x\xmn\BetterTrumpet\$Version\xmn.BetterTrumpet.installer.yaml"
)
foreach ($wingetFile in $wingetFiles) {
    $wingetInstaller = Get-Content $wingetFile -Raw
    foreach ($arch in $Architectures) {
        $wingetInstaller = $wingetInstaller -replace "PLACEHOLDER_CHECKSUM_$($arch.ToUpper())", $Checksums[$arch]
    }
    Set-Content $wingetFile $wingetInstaller -NoNewline
}

Write-Host "  ✅ Checksums updated!" -ForegroundColor Green
Write-Host ""

# ============================================================================
# STEP 4: Git Commit & Tag
# ============================================================================
if (-not $SkipGit) {
    Write-Host "📝 Step 4: Git Commit & Tag..." -ForegroundColor Yellow

    # Show status
    Write-Host "  Git status:"
    git status --short
    Write-Host ""

    # Confirm
    $confirm = Read-Host "  Commit and tag? (y/n)"
    if ($confirm -ne 'y') {
        Write-Host "  ⏭️  Skipping git operations" -ForegroundColor Gray
    } else {
        # Stage all
        git add -A

        # Commit
        $commitMsg = @"
release: bump version to $Version

- Added x64 and arm64 builds
- Added per-architecture installers and portable packages

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
"@
        git commit -m $commitMsg

        # Tag
        git tag -a "v$Version" -m "BetterTrumpet $Version"

        # Push
        Write-Host "  Pushing to origin..."
        git push origin master
        git push origin "v$Version"

        Write-Host "  ✅ Git commit & tag pushed!" -ForegroundColor Green
    }
    Write-Host ""
} else {
    Write-Host "⏭️  Skipping git operations" -ForegroundColor Gray
    Write-Host ""
}

# ============================================================================
# STEP 5: Create GitHub Release
# ============================================================================
if (-not $SkipGitHub) {
    Write-Host "🐙 Step 5: Creating GitHub Release..." -ForegroundColor Yellow

    $confirm = Read-Host "  Create GitHub release? (y/n)"
    if ($confirm -ne 'y') {
        Write-Host "  ⏭️  Skipping GitHub release" -ForegroundColor Gray
    } else {
        Write-Host "  Uploading installers and creating release..."

        # Collect all installer + portable assets
        $Assets = @()
        foreach ($arch in $Architectures) {
            $suffix = $ArchMap[$arch].Suffix
            $Assets += $Installers[$arch]
            $Assets += "dist\BetterTrumpet-$Version-portable$suffix.zip"
        }

        gh release create "v$Version" `
            $Assets `
            --title "BetterTrumpet $Version" `
            --notes-file ".claude\release-$Version-notes.md"

        Write-Host "  ✅ GitHub release created!" -ForegroundColor Green
        Write-Host "  🔗 https://github.com/xammen/BetterTrumpet/releases/tag/v$Version" -ForegroundColor Cyan
    }
    Write-Host ""
} else {
    Write-Host "⏭️  Skipping GitHub release" -ForegroundColor Gray
    Write-Host ""
}

# ============================================================================
# STEP 6: Chocolatey Package
# ============================================================================
if (-not $SkipChocolatey) {
    Write-Host "🍫 Step 6: Chocolatey Package..." -ForegroundColor Yellow

    $confirm = Read-Host "  Build and push Chocolatey package? (y/n)"
    if ($confirm -ne 'y') {
        Write-Host "  ⏭️  Skipping Chocolatey" -ForegroundColor Gray
    } else {
        Push-Location chocolatey

        # Pack
        Write-Host "  Packing Chocolatey package..."
        choco pack

        # Push
        $pushConfirm = Read-Host "  Push to Chocolatey.org? (y/n)"
        if ($pushConfirm -eq 'y') {
            Write-Host "  Pushing to Chocolatey.org..."
            choco push "bettertrumpet.$Version.nupkg" --source https://push.chocolatey.org/
            Write-Host "  ✅ Chocolatey package pushed!" -ForegroundColor Green
        }

        Pop-Location
    }
    Write-Host ""
} else {
    Write-Host "⏭️  Skipping Chocolatey" -ForegroundColor Gray
    Write-Host ""
}

# ============================================================================
# DONE!
# ============================================================================
Write-Host "🎉 Release $Version Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Verify GitHub release: https://github.com/xammen/BetterTrumpet/releases/tag/v$Version"
Write-Host "  2. Test auto-update from previous version → $Version"
Write-Host "  3. Close release issue with release link"
Write-Host "  4. Submit Winget PR from winget-manifest/manifests/x/xmn/BetterTrumpet/$Version/"
Write-Host ""