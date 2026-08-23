# 📊 Télémétrie BetterTrumpet - Intégration Complète

**Status:** ✅ Production  
**Date:** 2026-08-23  
**Version:** 3.2.3+

---

## 🎯 Résumé Exécutif

L'infrastructure de télémétrie anonyme est **entièrement déployée et fonctionnelle** :

- ✅ **Backend Cloudflare** : D1 database (EU), rate limiting, validation stricte
- ✅ **Client C#** : Service asynchrone, opt-out respecté, fail-safe
- ✅ **Dashboard privé** : Analytics temps réel, rétention, croissance
- ✅ **Privacy UI** : Toggle dans Settings → Privacy, lien vers privacy policy
- ✅ **Page publique** : https://bettertrumpet.com/privacy/telemetry

**Données collectées :** Anonymous ID (GUID), version app, OS version, timestamp  
**Données JAMAIS collectées :** Nom d'utilisateur, devices audio, apps, volumes, IP (hashé puis jeté)

---

## 📡 Infrastructure Backend

### Endpoints Production

**1. Ping Telemetry (app → serveur)**
```http
POST https://bettertrumpet.com/api/telemetry/ping
Content-Type: application/json

{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "version": "3.2.3",
  "os": "10.0.26200",
  "timestamp": "2026-08-23T15:30:00Z",
  "event": "app_start"
}
```
- **Réponse :** `204 No Content` (succès silencieux)
- **Rate limit :** 10 req/min par IP (hash SHA-256, jamais stocké)
- **Validation :** GUID valide, semver, ISO 8601, event whitelist
- **Payload max :** 4 KB (rejet silent si dépassé)
- **Fail-safe :** Payload invalide → 204 + log, jamais de crash app

**2. Endpoint de Test (validation sans stockage)**
```bash
curl -X POST https://bettertrumpet.com/api/telemetry/check \
  -H "Content-Type: application/json" \
  -d '{"id":"550e8400-e29b-41d4-a716-446655440000","version":"3.2.3","os":"10.0.26200","timestamp":"2026-08-23T15:30:00Z","event":"app_start"}'

# Réponse success
{"ok":true,"validated":{"id":"550e8400...","version":"3.2.3","os":"10.0.26200","timestamp":"2026-08-23T15:30:00Z","event":"app_start"}}

# Réponse erreur
{"ok":false,"errors":["Invalid GUID format","Invalid semver version"]}
```

**3. Dashboard Privé**
```
URL: https://bettertrumpet.com/admin/analytics?token=1DwzKKoJV8O2GFLJeHCgx_UX2n78htP3
Auth alternative: Header "Authorization: Bearer 1DwzKKoJV8O2GFLJeHCgx_UX2n78htP3"
```

**Métriques affichées :**
- Total installs (unique IDs)
- Actifs 24h / 7j / 30j
- Croissance cumulée 30j (graphique sparkline)
- Pings/jour (7 derniers jours)
- Nouvelles installs/jour
- Top versions (distribution)
- Windows 11 vs 10 + top builds
- Rétention D1 / D7 / D30
- Stickiness hebdomadaire (actifs semaine N-1 revenus en N)
- Activité par heure UTC (heatmap)

**Design :** HTML auto-contenu, pas de CDN, thème sombre OKLCH, responsive

**4. Page Privacy Publique**
```
URL: https://bettertrumpet.com/privacy/telemetry
Format: HTML statique, crawlable, dans sitemap
Contact: xmn@hiii.boo
```

### Stockage & Rétention

- **Base de données :** Cloudflare D1 (SQL, région WEUR/EU)
- **Rétention :** 90 jours (purge automatique)
  - Probabiliste : chaque ping a 1% chance de déclencher cleanup
  - Systématique : ouverture dashboard déclenche cleanup si >24h depuis dernier
- **Free tier :** ~30K pings/mois largement suffisant
- **Zero dépendance externe :** Tourne sur Pages Functions (déjà utilisé pour le site)

### Configuration Cloudflare

**Variables d'environnement :**
```bash
ADMIN_TOKEN=1DwzKKoJV8O2GFLJeHCgx_UX2n78htP3  # Déjà configuré
```

**Bindings :**
```toml
[[d1_databases]]
binding = "DB"
database_name = "bettertrumpet-telemetry"
database_id = "..." # Voir wrangler.toml
```

**Schéma :** `bettertrumpet-site/migrations/0001_telemetry.sql`

---

## 🔧 Client C# (App)

### Service TelemetryService.cs

**Localisation :** `EarTrumpet/Services/TelemetryService.cs`

**Fonctionnalités :**
- ✅ Respect opt-out (`IsTelemetryEnabled` setting)
- ✅ Génération ID anonyme (GUID) persisté en registry
- ✅ Envoi asynchrone au démarrage app
- ✅ Timeout 5s (fail-safe, jamais de freeze UI)
- ✅ Exceptions silencieuses (trace log seulement)
- ✅ Content-Type correct (`application/json`)

**Appel au startup :**
```csharp
// App.xaml.cs ligne ~300
var telemetry = new TelemetryService(Settings);
_ = telemetry.SendStartupPingAsync(); // Fire-and-forget
```

**Logs typiques :**
```
[2026-08-23 19:07:18.700] [INFO] Telemetry: Generated new anonymous ID: 02cce056...
[2026-08-23 19:07:18.716] [INFO] Telemetry: Sending startup ping (id: 02cce056..., version: 3.2.3)
[2026-08-23 19:07:19.271] [INFO] Telemetry: Ping sent successfully
```

**En cas d'opt-out :**
```
[INFO] Telemetry: Disabled by user settings
```

### Setting Registry

**Clé :** `HKCU:\Software\EarTrumpet\IsTelemetryEnabled`  
**Format :** XML serialized boolean (WPF standard)  
**Défaut :** `true` (opt-out, pas opt-in)

```xml
<?xml version="1.0" encoding="utf-16"?><boolean>true</boolean>
```

**ID anonyme :**
```
Clé: HKCU:\Software\EarTrumpet\TelemetryAnonymousId
Format: GUID string (ex: "02cce056-1a2b-3c4d-5e6f-7890abcdef12")
Persistance: Permanent jusqu'à réinstall ou clear registry
```

---

## 🎨 UI Privacy Settings

### Page Web Settings

**Localisation :** `EarTrumpet/SettingsWeb/src/pages/Privacy.tsx`

**Features :**
- Toggle `IsTelemetryEnabled` avec label + description
- Lien vers privacy policy externe
- Section "What we collect" avec détails transparents
- Section "What we DON'T collect" (emphase opt-out)
- Email contact : xmn@hiii.boo

**Backend binding :** `WebSettingsWindow.xaml.cs`
- Ligne 809 : Expose `isTelemetryEnabled` au payload initial
- Ligne 475 : Handle toggle change depuis webview
- Ligne 490 : `PostState()` broadcast changement à l'UI

**Type declaration :** `EarTrumpet/SettingsWeb/src/types.ts` ligne 38
```typescript
| "isTelemetryEnabled"
```

### Test UI

1. Lancer BetterTrumpet
2. Ouvrir Settings (tray icon → Settings)
3. Aller dans Privacy
4. Toggle "Help improve BetterTrumpet"
5. Vérifier registry change :
```powershell
Get-ItemProperty "HKCU:\Software\EarTrumpet" | Select-Object IsTelemetryEnabled
```

**Note :** Settings sont **cached en mémoire**. Modifier le registre directement sous instance running = silencieux. Toujours kill app avant edit manuel.

---

## 📈 Métriques & Analytics

### Données Actuelles (2026-08-23)

```
Total installs: 2
Active 24h: 2
Active 7d: 2
Active 30d: 2
New installs today: 2
Pings today: 3
```

**Versions :**
- 3.2.3: 100%

**OS :**
- Windows 11 (26200): 100%

### Métriques Clés à Surveiller

**Adoption :**
- Total installs (croissance cumulée)
- Nouvelles installs par jour
- Ratio nouvelles/totales

**Engagement :**
- Actifs 24h/7j/30j
- Rétention D1 (% revenus jour suivant)
- Rétention D7 (% revenus après 7j)
- Rétention D30 (% revenus après 30j)
- Stickiness hebdomadaire (fidélité)

**Distribution :**
- Top versions (détection adoption nouvelles releases)
- Windows 11 vs 10
- Top builds OS (bugs spécifiques builds)

**Comportement :**
- Activité par heure UTC (usage patterns)
- Pings/jour (stabilité app)

### Interprétation Saine

**✅ Bonnes métriques :**
- Rétention D7 > 40% (app utile)
- Stickiness > 60% (usage régulier)
- Nouvelles installs croissantes
- Adoption version latest > 80% après 30j

**⚠️ Signaux d'alerte :**
- Rétention D7 < 20% (onboarding problématique)
- Chute soudaine actifs 24h (bug critique)
- Version N-2 > 30% après 60j (update friction)
- Pings/jour < actifs (crashes silencieux)

---

## 🔒 Privacy & Compliance

### Données Collectées

**Seulement 5 champs :**
1. `id` : GUID anonyme généré localement
2. `version` : Version app (ex: "3.2.3")
3. `os` : Version OS (ex: "10.0.26200")
4. `timestamp` : ISO 8601 UTC
5. `event` : Type événement (actuellement seulement "app_start")

### Données JAMAIS Collectées

❌ Nom d'utilisateur ou compte Microsoft  
❌ Adresse IP (hashé SHA-256 pour rate limit, puis jeté)  
❌ Devices audio (noms, IDs)  
❌ Applications avec audio (noms, processus)  
❌ Volumes ou réglages audio  
❌ Fichiers media ou métadonnées  
❌ Raccourcis clavier ou hotkeys  
❌ Settings utilisateur  
❌ Aucune donnée personnelle identifiable

### Opt-Out

**Méthode 1 : UI Settings**
1. Ouvrir Settings
2. Aller dans Privacy
3. Décocher "Help improve BetterTrumpet"

**Méthode 2 : Registry manuel**
```powershell
Set-ItemProperty -Path "HKCU:\Software\EarTrumpet" -Name "IsTelemetryEnabled" -Value '<?xml version="1.0" encoding="utf-16"?><boolean>false</boolean>'
```

**Méthode 3 : Bloquer réseau**
```
Firewall rule: Block outbound to bettertrumpet.com/api/telemetry/*
```

**Effet immédiat :** Prochain démarrage app = pas de ping

### GDPR / CCPA Compliance

✅ **Anonyme par design** : Aucune donnée personnelle  
✅ **Opt-out facile** : Toggle UI + registry + firewall  
✅ **Transparence totale** : Code open-source + privacy policy publique  
✅ **Rétention limitée** : 90 jours auto-purge  
✅ **Pas de partage tiers** : Stockage EU, aucun tracker  
✅ **Fail-safe** : Jamais de crash si telemetry échoue

---

## 🧪 Tests de Validation

### Test 1 : Ping au Démarrage

```powershell
# 1. Kill app
Get-Process BetterTrumpet -ErrorAction SilentlyContinue | Stop-Process -Force

# 2. Vérifier opt-in
Get-ItemProperty "HKCU:\Software\EarTrumpet" | Select-Object IsTelemetryEnabled

# 3. Lancer app
Start-Process ".\Build\Debug\BetterTrumpet.exe"

# 4. Vérifier logs (attendre 2-3s)
$latestLog = Get-ChildItem "$env:APPDATA\BetterTrumpet\logs" -Filter 'bettertrumpet-*.log' |
    Sort-Object LastWriteTime -Descending | Select-Object -First 1
Get-Content $latestLog.FullName -Tail 20 | Select-String "Telemetry"
```

**Résultat attendu :**
```
[INFO] Telemetry: Generated new anonymous ID: ...
[INFO] Telemetry: Sending startup ping (id: ..., version: 3.2.3)
[INFO] Telemetry: Ping sent successfully
```

### Test 2 : Opt-Out

```powershell
# 1. Kill app
Get-Process BetterTrumpet -ErrorAction SilentlyContinue | Stop-Process -Force

# 2. Désactiver telemetry
Set-ItemProperty -Path "HKCU:\Software\EarTrumpet" -Name "IsTelemetryEnabled" -Value '<?xml version="1.0" encoding="utf-16"?><boolean>false</boolean>'

# 3. Lancer app
Start-Process ".\Build\Debug\BetterTrumpet.exe"

# 4. Vérifier logs
$latestLog = Get-ChildItem "$env:APPDATA\BetterTrumpet\logs" -Filter 'bettertrumpet-*.log' |
    Sort-Object LastWriteTime -Descending | Select-Object -First 1
Get-Content $latestLog.FullName -Tail 20 | Select-String "Telemetry"
```

**Résultat attendu :**
```
[INFO] Telemetry: Disabled by user settings
```

### Test 3 : Validation Endpoint

```bash
# Payload valide
curl -X POST https://bettertrumpet.com/api/telemetry/check \
  -H "Content-Type: application/json" \
  -d '{"id":"550e8400-e29b-41d4-a716-446655440000","version":"3.2.3","os":"10.0.26200","timestamp":"2026-08-23T15:30:00Z","event":"app_start"}'

# → {"ok":true,"validated":{...}}

# Payload invalide
curl -X POST https://bettertrumpet.com/api/telemetry/check \
  -H "Content-Type: application/json" \
  -d '{"id":"invalid","version":"not-semver","os":"10.0.26200","timestamp":"bad-date","event":"app_start"}'

# → {"ok":false,"errors":["Invalid GUID format","Invalid semver version","Invalid ISO 8601 timestamp"]}
```

### Test 4 : Dashboard Access

```powershell
# Accès avec token
$response = curl.exe -s "https://bettertrumpet.com/admin/analytics?token=1DwzKKoJV8O2GFLJeHCgx_UX2n78htP3"
$response | Select-String -Pattern "total-installs"

# Ou avec header
curl -H "Authorization: Bearer 1DwzKKoJV8O2GFLJeHCgx_UX2n78htP3" https://bettertrumpet.com/admin/analytics
```

### Test 5 : Rate Limiting

```bash
# Envoyer 15 requêtes rapidement (limit = 10/min)
for i in {1..15}; do
  curl -w "\n%{http_code}\n" -X POST https://bettertrumpet.com/api/telemetry/ping \
    -H "Content-Type: application/json" \
    -d '{"id":"550e8400-e29b-41d4-a716-446655440000","version":"3.2.3","os":"10.0.26200","timestamp":"2026-08-23T15:30:00Z","event":"app_start"}'
done

# Résultat attendu: 10x 204, puis 5x 429 Too Many Requests
```

---

## 🚀 Déploiement & Maintenance

### Checklist Déploiement

- [x] Endpoint `/api/telemetry/ping` production
- [x] Endpoint `/api/telemetry/check` validation
- [x] Dashboard `/admin/analytics` privé
- [x] Page `/privacy/telemetry` publique
- [x] Cloudflare D1 database configurée
- [x] Secret `ADMIN_TOKEN` configuré
- [x] Schéma SQL appliqué (`0001_telemetry.sql`)
- [x] Service `TelemetryService.cs` intégré
- [x] Appel startup dans `App.xaml.cs`
- [x] UI Privacy page avec toggle
- [x] Type `isTelemetryEnabled` dans `types.ts`
- [x] Backend binding dans `WebSettingsWindow.xaml.cs`
- [x] Setting registry `IsTelemetryEnabled` défaut `true`
- [x] Tests validation payloads
- [x] Tests opt-out fonctionnel
- [x] Tests rate limiting
- [x] Documentation `CLOUDFLARE.md` mise à jour

### Monitoring Production

**Quotidien :**
- Dashboard analytics : tendances anormales (chute actifs 24h)
- Logs Cloudflare : erreurs 5xx ou timeouts

**Hebdomadaire :**
- Rétention D7 : détection early churn
- Adoption versions : migration users vers latest
- Distribution OS : support futurs Windows builds

**Mensuel :**
- Croissance installs : trajectoire produit
- Stickiness : engagement long terme
- Nettoyage database : vérifier purge 90j fonctionne

**Alertes à Créer :**
1. Actifs 24h chute >30% en 24h → bug critique probable
2. Erreurs 5xx >1% requêtes → problème backend
3. Database size >500 MB → purge défaillante
4. Rate limit hits >100/jour → attaque ou bug client

### Maintenance Database

**Purge automatique :** Déjà configurée (probabiliste + dashboard trigger)

**Purge manuelle si besoin :**
```sql
-- Via wrangler CLI
wrangler d1 execute bettertrumpet-telemetry --remote --command="DELETE FROM telemetry_pings WHERE created_at < datetime('now', '-90 days')"

-- Vérifier taille
wrangler d1 execute bettertrumpet-telemetry --remote --command="SELECT COUNT(*) as total, MIN(created_at) as oldest, MAX(created_at) as newest FROM telemetry_pings"
```

**Backup (optionnel) :**
```bash
wrangler d1 export bettertrumpet-telemetry --remote --output=backup-$(date +%Y%m%d).sql
```

---

## 📚 Références

### Documentation Projet

- **Setup Cloudflare :** `bettertrumpet-site/CLOUDFLARE.md` (section Telemetry)
- **Schema SQL :** `bettertrumpet-site/migrations/0001_telemetry.sql`
- **Service C# :** `EarTrumpet/Services/TelemetryService.cs`
- **UI Privacy :** `EarTrumpet/SettingsWeb/src/pages/Privacy.tsx`
- **Types TS :** `EarTrumpet/SettingsWeb/src/types.ts`

### Endpoints Production

- **Ping :** `https://bettertrumpet.com/api/telemetry/ping`
- **Check :** `https://bettertrumpet.com/api/telemetry/check`
- **Dashboard :** `https://bettertrumpet.com/admin/analytics?token=1DwzKKoJV8O2GFLJeHCgx_UX2n78htP3`
- **Privacy :** `https://bettertrumpet.com/privacy/telemetry`

### Contact

**Telemetry questions :** xmn@hiii.boo  
**Privacy concerns :** xmn@hiii.boo

---

## ✅ Conclusion

L'infrastructure de télémétrie est **production-ready** et respecte les meilleures pratiques :

✅ **Privacy-first** : Anonyme, opt-out facile, transparent  
✅ **Fail-safe** : Jamais de crash app, timeouts courts  
✅ **Performance** : Asynchrone, rate limited, léger (<5s overhead startup)  
✅ **Scalable** : Cloudflare infra, free tier large, auto-cleanup  
✅ **Actionable** : Dashboard metrics claires, retention trackée

**Prochaines étapes suggérées :**
1. Monitorer dashboard quotidiennement première semaine
2. Analyser rétention D7 après 10 jours
3. Ajuster marketing selon adoption rates
4. Ajouter events optionnels futurs (ex: `feature_used`, `crash`, `update_installed`)
