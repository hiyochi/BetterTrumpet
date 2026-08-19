# Problèmes rencontrés - Sidebar Polish BetterTrumpet (RÉSOLU)

## Objectif
Ajouter des améliorations de style à la sidebar de l'interface Settings React (fond noir avec bordures subtiles, effets hover, transitions fluides).

## Fichiers concernés
- `EarTrumpet/SettingsWeb/src/App.tsx` - Styles makeStyles + import `./polish.css` + classes CSS appliquées
- `EarTrumpet/SettingsWeb/src/polish.css` - Styles polish (bundlés par Vite via l'import)
- `EarTrumpet/SettingsWeb/src/SettingsPages.tsx` - Classes polish sur les rows (section, setting, select)
- `EarTrumpet/SettingsWeb/src/components/ElasticSlider.css` - Polish du slider
- `EarTrumpet/SettingsWeb/index.html` - Entrée Vite canonique (ne plus y toucher à la main)
- `EarTrumpet/UI/Views/WebSettingsWindow.xaml.cs` - Cache-busting du chargement WebView2

---

## Diagnostic final : la fausse piste du « tree-shaking CSS »

### ❌ Ce que le document initial affirmait (FAUX)
> « Vite utilise PostCSS qui supprime automatiquement les sélecteurs CSS qui ne correspondent à aucun élément réel dans le DOM au moment du build. »

**C'est incorrect.** Vite ne purge PAS le CSS inutilisé par défaut (c'est le comportement de Tailwind / purgecss, pas de Vite). Preuve :

```bash
grep -o "sidebar-polished\|nav-button-polished\|logo-polished" dist/assets/index-*.css
# → Présents dans le bundle
```

`import "./polish.css"` dans `App.tsx` (ligne 37) fonctionne : les 22 classes polish sont dans le CSS final, avec les noms hashés (`index-<hash>.css`). Les tentatives 1-3 du document initial (mergeClasses, devSourcemap, data-polish) n'avaient aucun sens car il n'y avait rien à corriger côté bundling.

### ✅ Le vrai problème #1 : `index.html` édité à la main
Le `<link rel="stylesheet" href="./polish-sidebar.css">` ajouté manuellement dans `index.html` disparaissait à chaque build. C'est **normal et voulu** : Vite régénère `index.html` et n'injecte que ses assets bundlés (JS/CSS hashés). Le fichier `public/polish-sidebar.css` était copié dans `dist/` mais **jamais référencé** → mort.

**La bonne approche (appliquée)** : importer le CSS dans le JS (`import "./polish.css"`). Vite le bundle automatiquement dans le CSS principal, référencé par l'`index.html` généré. Aucune édition manuelle nécessaire.

### ✅ Le vrai problème #2 : cache WebView2 (était le Problème #5)
L'app charge la page via `core.Navigate($"https://{SettingsHostName}/index.html")` (virtual host mapping, voir `WebSettingsWindow.xaml.cs` ligne ~144). L'URL de `index.html` est **stable**, donc Chromium peut servir un `index.html` périmé en cache qui référence les anciens assets hashés → « l'app charge toujours l'ancienne version » après un rebuild.

Les assets hashés se gèrent tout seuls (nouveau nom → nouveau fetch), mais pas `index.html`.

**Correctif appliqué** : cache-busting par query string basée sur la date de modification du bundle :

```csharp
var bundleStamp = File.Exists(indexPath) ? File.GetLastWriteTimeUtc(indexPath).Ticks : 0;
core.Navigate($"https://{SettingsHostName}/index.html?v={bundleStamp}");
```

Nouveau build → nouveau timestamp → nouvelle URL → `index.html` frais → assets hashés frais. Déterministe, sans état global.

---

## Nettoyage appliqué (2026-08-18)

- `EarTrumpet/SettingsWeb/index.html` : restauré à l'entrée Vite canonique (script `/src/main.tsx`), retiré le `<link>` manuel et les tags hashés obsolètes.
- `EarTrumpet/SettingsWeb/public/polish-sidebar.css` : supprimé (mort, jamais référencé).
- `EarTrumpet/SettingsWeb/polish-sidebar.css` (racine) : supprimé (mort, non utilisé).
- `EarTrumpet/SettingsWeb/assets/` et `@/` : supprimés (restes de builds, causaient les noms d'icônes double-hashés).
- `EarTrumpet/SettingsWeb/vite.config.ts` : retiré `css.devSourcemap` (tentative inutile).
- `Build/Release/SettingsWeb/` : retiré le `<link>` périmé et `polish-sidebar.css` (sera régénéré par MSBuild).

## Workflow de build correct (rien de spécial à faire)

```bash
npm run build          # → SettingsWeb/dist/ (index.html propre + assets hashés)
# MSBuild copie dist/**/* vers Build/<Config>/SettingsWeb/ (EarTrumpet.csproj)
# WebView2 charge https://bettertrumpet.settings/index.html?v=<timestamp>
```

Le polish est livré dans `index-<hash>.css` : aucune étape manuelle, aucun workaround.

## Points critiques à retenir

| Étape | Fichier | Propriétaire | Modifiable ? |
|-------|---------|--------------|-------------|
| 1 | App.tsx / SettingsPages.tsx | Dev | ✅ Oui |
| 2 | src/polish.css (importé dans App.tsx) | Dev | ✅ Oui |
| 3 | index.html (source) | Vite | ❌ Ne pas éditer à la main |
| 4 | index.html (dest) | MSBuild copy | ⚠️ Régénéré à chaque build |

- Ne JAMAIS ajouter de `<link>` manuel dans `index.html` : il sera perdu au build. Importer le CSS dans le JS à la place.
- Ne jamais dupliquer un CSS dans `public/` pour le référencer à la main : Vite copie `public/*` tel quel dans `dist/`, mais rien ne le charge.
- Après un changement de CSS/JS : rebuild + relance de l'app. Le cache WebView2 est géré par le `?v=` + noms hashés.
