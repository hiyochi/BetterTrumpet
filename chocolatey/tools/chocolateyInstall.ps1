$ErrorActionPreference = 'Stop'

$packageArgs = @{
  packageName    = $env:ChocolateyPackageName
  softwareName   = 'BetterTrumpet*'
  fileType       = 'exe'
  url            = 'https://github.com/xammen/BetterTrumpet/releases/download/v3.3.0/BetterTrumpet-3.3.0-setup.exe'
  checksum       = 'FE9679E82E30658D421C2A0EBAEE6C43C441CA8868F0DF4C9C9EB466F81ADE7D'
  checksumType   = 'sha256'
  silentArgs     = '/VERYSILENT /SUPPRESSMSGBOXES /NORESTART /SP-'
  validExitCodes = @(0)
}

# Kill running instance before install
Get-Process -Name 'BetterTrumpet' -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 1

Install-ChocolateyPackage @packageArgs
