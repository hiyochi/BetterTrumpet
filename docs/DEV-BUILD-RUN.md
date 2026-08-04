# Fermer, compiler et relancer BetterTrumpet en mode dev

Ce guide décrit la procédure utilisée pour fermer l'instance installée de BetterTrumpet, compiler le projet en `Debug|x86`, puis lancer et vérifier la version de développement.

Toutes les commandes sont à exécuter depuis la racine du dépôt :

```powershell
cd C:\Users\xammen\orca\workspaces\ear\CLI
```

## 1. Identifier et fermer BetterTrumpet

Lister toutes les instances, avec leur chemin réel :

```powershell
Get-CimInstance Win32_Process -Filter "Name='BetterTrumpet.exe'" |
    Select-Object ProcessId, ExecutablePath, CommandLine
```

Fermer les instances trouvées :

```powershell
Get-CimInstance Win32_Process -Filter "Name='BetterTrumpet.exe'" |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
```

Dans le cas rencontré, l'instance installée était lancée depuis :

```text
C:\Users\xammen\AppData\Local\Programs\BetterTrumpet\BetterTrumpet.exe
```

`Get-CimInstance` est utile ici, car il permet de voir le chemin et la ligne de commande avant de fermer le processus. Cela évite de confondre la version installée avec `Build\Debug\BetterTrumpet.exe`.

## 2. Compiler la version Debug x86

Le SDK .NET 8 est installé dans `C:\Program Files\dotnet`, mais il n'était pas disponible dans le `PATH`. La commande normale est donc :

```powershell
& 'C:\Program Files\dotnet\dotnet.exe' build `
    EarTrumpet\EarTrumpet.csproj `
    --configuration Debug `
    --runtime win-x86 `
    -p:Platform=x86 `
    --verbosity minimal
```

La sortie attendue est :

```text
Build\Debug\BetterTrumpet.exe
Build\Debug\BetterTrumpet.dll
```

### Contournement GitVersion utilisé dans ce worktree

Dans ce worktree, GitVersion échouait sur une référence `upstream/master` dont un objet Git était absent. Pour un build local uniquement, GitVersion a été désactivé et une version de développement cohérente a été fournie manuellement :

```powershell
& 'C:\Program Files\dotnet\dotnet.exe' build `
    EarTrumpet\EarTrumpet.csproj `
    --configuration Debug `
    --runtime win-x86 `
    -p:Platform=x86 `
    -p:DisableGitVersionTask=true `
    -p:GitVersion_MajorMinorPatch=3.2.2 `
    -p:GitVersion_InformationalVersion=3.2.2-dev `
    -p:Version=3.2.2-dev `
    -p:FileVersion=3.2.2.0 `
    -p:AssemblyVersion=3.2.2.0 `
    -p:InformationalVersion=3.2.2-dev `
    -p:GenerateAssemblyInfo=true `
    -p:GenerateAssemblyTitleAttribute=false `
    -p:GenerateAssemblyCompanyAttribute=false `
    -p:GenerateAssemblyProductAttribute=false `
    --no-restore `
    --verbosity minimal
```

Les propriétés `GenerateAssemblyInfo` sont importantes dans ce mode. Sans elles, WPF peut chercher `BetterTrumpet, Version=3.2.2.0` alors que l'assembly généré n'a pas cette version, puis quitter avec une `FileNotFoundException` pendant `App.InitializeComponent()`.

Ce contournement ne doit pas être utilisé pour produire une release publique. Les builds de release doivent continuer à utiliser GitVersion et la procédure décrite dans `AGENTS.md`.

## 3. Lancer la version de développement

```powershell
$devExe = (Resolve-Path 'Build\Debug\BetterTrumpet.exe').Path

Start-Process `
    -FilePath $devExe `
    -WorkingDirectory (Split-Path -Parent $devExe) `
    -WindowStyle Hidden
```

Si BetterTrumpet se ferme immédiatement avec le code `0`, une autre instance détient probablement encore le mutex d'instance unique. Reprendre l'étape 1 et vérifier toutes les instances avec `Get-CimInstance`.

## 4. Vérifier que la bonne version tourne

Afficher le PID et le chemin du processus actif :

```powershell
Get-CimInstance Win32_Process -Filter "Name='BetterTrumpet.exe'" |
    Select-Object ProcessId, ExecutablePath, CommandLine
```

Le chemin doit être :

```text
C:\Users\xammen\orca\workspaces\ear\CLI\Build\Debug\BetterTrumpet.exe
```

Tester le serveur CLI de l'instance :

```powershell
& '.\Build\Debug\BetterTrumpet.exe' --ping
```

Puis consulter les dernières lignes du log :

```powershell
$latestLog = Get-ChildItem "$env:APPDATA\BetterTrumpet\logs" -Filter 'bettertrumpet-*.log' |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

Get-Content $latestLog.FullName -Tail 30
```

Les lignes suivantes confirment que l'application et la CLI sont prêtes :

```text
Startup: UI components ready
PipeServer: Started
Startup: Complete
PipeServer: Received 'ping'
```

## À propos de `bt.cmd`

`bt.cmd` n'est pas un script de build. C'est le wrapper de la CLI BetterTrumpet. Il recherche principalement un binaire à la racine, dans `Build\Release`, ou dans les dossiers d'installation. Pour tester précisément la version Debug, utiliser explicitement :

```powershell
& '.\Build\Debug\BetterTrumpet.exe' <commande>
```
