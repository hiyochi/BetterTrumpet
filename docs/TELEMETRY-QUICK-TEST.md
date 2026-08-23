# 🧪 Télémétrie - Guide de Test Rapide

## Test Complet en 5 Minutes

### 1️⃣ Vérifier le Build (30s)

```powershell
# Vérifier que TelemetryService.cs existe
Test-Path "EarTrumpet\Services\TelemetryService.cs"  # → True

# Vérifier version assemblée
& '.\Build\Debug\BetterTrumpet.exe' --version
# → BetterTrumpet 3.2.3
```

### 2️⃣ Test Ping au Démarrage (1min)

```powershell
# Kill instance actuelle
Get-Process BetterTrumpet -ErrorAction SilentlyContinue | Stop-Process -Force

# Vérifier opt-in (défaut = true)
Get-ItemProperty "HKCU:\Software\EarTrumpet" | Select-Object IsTelemetryEnabled
# → IsTelemetryEnabled : <?xml...><boolean>true</boolean>

# Lancer app
Start-Process ".\Build\Debug\BetterTrumpet.exe"

# Attendre 3 secondes
Start-Sleep -Seconds 3

# Vérifier logs
$log = Get-ChildItem "$env:APPDATA\BetterTrumpet\logs" -Filter '*.log' | 
    Sort-Object LastWriteTime -Descending | Select-Object -First 1
Get-Content $log.FullName -Tail 25 | Select-String "Telemetry"
```

**✅ Résultat attendu :**
```
[INFO] Telemetry: Generated new anonymous ID: 02cce056...
[INFO] Telemetry: Sending startup ping (id: 02cce056..., version: 3.2.3)
[INFO] Telemetry: Ping sent successfully
```

### 3️⃣ Test Dashboard (30s)

```powershell
# Ouvrir dashboard dans navigateur
Start-Process "https://bettertrumpet.com/admin/analytics?token=1DwzKKoJV8O2GFLJeHCgx_UX2n78htP3"
```

**✅ Vérifier :**
- Total installs >= 1
- Active 24h >= 1
- Version 3.2.3 listée
- OS version affichée

### 4️⃣ Test Opt-Out UI (2min)

```powershell
# Ouvrir settings
& '.\Build\Debug\BetterTrumpet.exe' settings

# Dans l'UI web :
# 1. Aller dans "Privacy"
# 2. Trouver toggle "Help improve BetterTrumpet"
# 3. Décocher le toggle
# 4. Fermer settings
```

**Vérifier changement registry :**
```powershell
Get-ItemProperty "HKCU:\Software\EarTrumpet" | Select-Object IsTelemetryEnabled
# → Doit contenir <boolean>false</boolean>
```

**Tester que ping est bloqué :**
```powershell
# Kill app
Get-Process BetterTrumpet -ErrorAction SilentlyContinue | Stop-Process -Force

# Relancer
Start-Process ".\Build\Debug\BetterTrumpet.exe"
Start-Sleep -Seconds 3

# Vérifier logs
$log = Get-ChildItem "$env:APPDATA\BetterTrumpet\logs" -Filter '*.log' | 
    Sort-Object LastWriteTime -Descending | Select-Object -First 1
Get-Content $log.FullName -Tail 25 | Select-String "Telemetry"
```

**✅ Résultat attendu :**
```
[INFO] Telemetry: Disabled by user settings
```

### 5️⃣ Test Validation Endpoint (1min)

**Payload valide :**
```powershell
curl.exe -X POST "https://bettertrumpet.com/api/telemetry/check" `
    -H "Content-Type: application/json" `
    -d '{"id":"550e8400-e29b-41d4-a716-446655440000","version":"3.2.3","os":"10.0.26200","timestamp":"2026-08-23T15:30:00Z","event":"app_start"}'
```

**✅ Résultat attendu :**
```json
{"ok":true,"validated":{...}}
```

**Payload invalide :**
```powershell
curl.exe -X POST "https://bettertrumpet.com/api/telemetry/check" `
    -H "Content-Type: application/json" `
    -d '{"id":"invalid","version":"bad","os":"10.0.26200","timestamp":"bad","event":"app_start"}'
```

**✅ Résultat attendu :**
```json
{"ok":false,"errors":["Invalid GUID format","Invalid semver version",...]}
```

---

## 🚨 Troubleshooting Rapide

### Problème : Pas de log "Telemetry"

**Causes possibles :**
1. ❌ TelemetryService pas appelé au startup
2. ❌ Exception silencieuse (pas de réseau)
3. ❌ Build ancien (pas de service)

**Fix :**
```powershell
# Vérifier que le service existe dans le build
Select-String -Path "EarTrumpet\App.xaml.cs" -Pattern "TelemetryService"
# → Doit montrer l'appel au startup

# Rebuild
& 'C:\Program Files\dotnet\dotnet.exe' build EarTrumpet\EarTrumpet.csproj `
    --configuration Debug --runtime win-x86 -p:Platform=x86 `
    -p:DisableGitVersionTask=true -p:GitVersion_MajorMinorPatch=3.2.3 `
    --no-restore --verbosity minimal
```

### Problème : Dashboard vide (0 installs)

**Causes possibles :**
1. ❌ Ping bloqué par firewall
2. ❌ Rate limited (trop de tests)
3. ❌ Database pas initialisée

**Fix :**
```powershell
# Test ping manuel
curl.exe -X POST "https://bettertrumpet.com/api/telemetry/ping" `
    -H "Content-Type: application/json" `
    -d '{"id":"550e8400-e29b-41d4-a716-446655440000","version":"3.2.3","os":"10.0.26200","timestamp":"2026-08-23T15:30:00Z","event":"app_start"}'

# Vérifier status code (doit être 204)
curl.exe -i -X POST "https://bettertrumpet.com/api/telemetry/ping" `
    -H "Content-Type: application/json" `
    -d '{"id":"550e8400-e29b-41d4-a716-446655440000","version":"3.2.3","os":"10.0.26200","timestamp":"2026-08-23T15:30:00Z","event":"app_start"}'
```

### Problème : Toggle UI ne change pas registry

**Causes possibles :**
1. ❌ App en cache (settings pas flush)
2. ❌ WebView pas connecté au backend

**Fix :**
```powershell
# Kill app complètement
Get-Process BetterTrumpet -ErrorAction SilentlyContinue | Stop-Process -Force

# Vérifier manuel
Set-ItemProperty -Path "HKCU:\Software\EarTrumpet" `
    -Name "IsTelemetryEnabled" `
    -Value '<?xml version="1.0" encoding="utf-16"?><boolean>false</boolean>'

# Relancer et vérifier que opt-out fonctionne
```

---

## ✅ Checklist Finale

Avant de considérer l'intégration validée :

- [ ] Ping envoyé au démarrage (log "Ping sent successfully")
- [ ] Dashboard affiche installs
- [ ] Opt-out UI fonctionne (toggle change registry)
- [ ] Ping bloqué après opt-out (log "Disabled by user settings")
- [ ] Endpoint /check valide payloads corrects
- [ ] Endpoint /check rejette payloads invalides
- [ ] Page privacy publique accessible
- [ ] Dashboard privé nécessite token

**Si tout ✅ → Télémétrie production ready ! 🚀**
