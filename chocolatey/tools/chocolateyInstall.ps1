$ErrorActionPreference = 'Stop'

# Chocolatey has no native arm64 distinction (it treats arm64 as 64-bit and would
# pick url64bit). Detect the native architecture explicitly so arm64 machines get
# the native arm64 installer instead of the x64 one.
$arch = $env:PROCESSOR_ARCHITECTURE
if ($arch -eq 'ARM64') {
  $packageArgs = @{
    packageName    = $env:ChocolateyPackageName
    softwareName   = 'BetterTrumpet*'
    fileType       = 'exe'
    url            = 'https://github.com/xammen/BetterTrumpet/releases/download/v3.3.1/BetterTrumpet-3.3.1-setup-arm64.exe'
    checksum       = 'PLACEHOLDER_CHECKSUM_ARM64'
    checksumType   = 'sha256'
    silentArgs     = '/VERYSILENT /SUPPRESSMSGBOXES /NORESTART /SP-'
    validExitCodes = @(0)
  }
} else {
  $packageArgs = @{
    packageName    = $env:ChocolateyPackageName
    softwareName   = 'BetterTrumpet*'
    fileType       = 'exe'
    url            = 'https://github.com/xammen/BetterTrumpet/releases/download/v3.3.1/BetterTrumpet-3.3.1-setup.exe'
    checksum       = 'PLACEHOLDER_CHECKSUM_TO_BE_CALCULATED'
    checksumType   = 'sha256'
    url64bit       = 'https://github.com/xammen/BetterTrumpet/releases/download/v3.3.1/BetterTrumpet-3.3.1-setup-x64.exe'
    checksum64     = 'PLACEHOLDER_CHECKSUM_X64'
    checksumType64 = 'sha256'
    silentArgs     = '/VERYSILENT /SUPPRESSMSGBOXES /NORESTART /SP-'
    validExitCodes = @(0)
  }
}

# Kill running instance before install
Get-Process -Name 'BetterTrumpet' -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 1

Install-ChocolateyPackage @packageArgs