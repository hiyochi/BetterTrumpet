#!/usr/bin/env bash
# Portable BetterTrumpet checks for the Linux cloud-agent VM.
# Covers GitHub #37 marshalling contracts, #41 path sanitizing, and #43 disconnect gating.
# Does not run WASAPI, WPF, or the tray.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export DOTNET_ROOT="${DOTNET_ROOT:-$HOME/.dotnet}"
export PATH="${DOTNET_ROOT}:${PATH}"

if ! command -v dotnet >/dev/null 2>&1; then
  echo "dotnet SDK not found. Install .NET 8 or set DOTNET_ROOT." >&2
  exit 127
fi

dotnet run --project "$ROOT/tools/linux-self-test/linux-self-test.csproj" -c Release -- "$ROOT"
