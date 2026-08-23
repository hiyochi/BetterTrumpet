@echo off
setlocal
rem Dev loop: close the running BetterTrumpet, rebuild Release^|x86, relaunch it.
rem Usage: dev-rebuild.cmd [--no-run]

cd /d "%~dp0"

echo [1/3] Closing BetterTrumpet...
taskkill /IM BetterTrumpet.exe /F >nul 2>&1
rem Give Windows a moment to release the file locks on Build\Release.
powershell.exe -NoProfile -Command "Start-Sleep -Milliseconds 600" >nul 2>&1

echo [2/3] Building Release^|x86...
dotnet build EarTrumpet\EarTrumpet.csproj -c Release -p:Platform=x86 -v:minimal
if errorlevel 1 (
    echo BUILD FAILED - not relaunching.
    exit /b 1
)

if /i "%~1"=="--no-run" (
    echo [3/3] Skipped relaunch ^(--no-run^).
    exit /b 0
)

echo [3/3] Relaunching...
rem Redirect here so the detached GUI process does not inherit our stdout/stderr.
rem Without this, piping dev-rebuild.cmd into another command hangs: the pipe
rem never reaches EOF while BetterTrumpet is alive.
start "" "%~dp0Build\Release\BetterTrumpet.exe" >nul 2>&1
powershell.exe -NoProfile -Command "Start-Sleep -Milliseconds 1500" >nul 2>&1
call "%~dp0bt.cmd" ping

exit /b 0
