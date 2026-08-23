# EarTrumpet vs BetterTrumpet — comparaison complète

> État de la comparaison : 13 juillet 2026
>
> BetterTrumpet : branche `master`, commit `0492ac40` — version publiée 3.2.0 plus le correctif CLI UTF-8 postérieur à la release.
>
> EarTrumpet : `upstream/master`, commit `7eee80e3`, récupéré depuis le dépôt officiel `File-New-Project/EarTrumpet`.

## Résumé rapide

BetterTrumpet est un fork étendu d'EarTrumpet. Il conserve le cœur qui fait la force d'EarTrumpet — mixage par application, vumètres, changement de périphérique et routage audio — puis ajoute une couche beaucoup plus large de personnalisation, d'automatisation, de contrôle média, de diagnostic et de distribution.

En pratique :

- **EarTrumpet** reste plus minimaliste, mature, largement traduit et principalement intégré à l'écosystème Microsoft Store.
- **BetterTrumpet** vise davantage les power users, streamers, joueurs, développeurs et configurations multi-périphériques.
- BetterTrumpet propose beaucoup plus de fonctions, mais son code, son interface et ses services d'arrière-plan sont aussi plus complexes.
- BetterTrumpet contient plusieurs optimisations ciblées, mais il ne faut pas conclure qu'il consomme toujours moins qu'EarTrumpet : il fait davantage de choses et son build autonome occupe plus d'espace disque.

## Méthode et limites de la comparaison

Cette liste a été construite à partir :

- du code actuellement présent dans BetterTrumpet ;
- de la documentation du dépôt ;
- de l'historique Git de BetterTrumpet ;
- d'une récupération récente du dernier `upstream/master` d'EarTrumpet ;
- d'une comparaison directe des deux arbres de sources.

Les historiques actuels n'ont plus de merge-base exploitable, notamment à cause de réécritures de branches en amont. Les chiffres ci-dessous sont donc une **comparaison de snapshots**, pas un décompte exact des commits créés depuis le fork.

À titre indicatif, sur les sources de l'application seulement et en excluant le vieux projet de sauvegarde ainsi que le fichier de ressources généré :

- 106 fichiers C#, XAML, projet ou ressources diffèrent ;
- environ 25 377 lignes sont présentes côté BetterTrumpet contre 1 196 lignes retirées ou remplacées dans la comparaison ;
- 43 fichiers C# et 6 fichiers XAML n'existent pas dans l'arbre EarTrumpet comparé ;
- 47 fichiers C# et 6 fichiers XAML hérités ont été modifiés.

Ces nombres illustrent l'ampleur du fork, mais ne constituent pas une mesure de qualité ou de performance.

## Ce que les deux applications partagent

BetterTrumpet reste fondamentalement construit sur EarTrumpet. Les deux partagent donc une grande partie du modèle audio et de l'expérience de base.

| Fonction de base | EarTrumpet | BetterTrumpet |
| --- | :---: | :---: |
| Réglage du volume par application | Oui | Oui, hérité et étendu |
| Volume principal par périphérique | Oui | Oui |
| Vumètres multicanaux | Oui | Oui, avec styles et FPS configurables |
| Mixeur compact depuis la zone de notification | Oui | Oui |
| Fenêtre de mixeur autonome | Oui | Oui |
| Changement du périphérique de sortie par défaut | Oui | Oui |
| Déplacement/routage d'une application vers une sortie | Oui | Oui, également accessible par CLI et profils |
| Raccourcis clavier configurables | Oui | Oui, avec raccourcis supplémentaires |
| Molette sur l'icône de la zone de notification | Oui | Oui |
| Menus contextuels modernes | Oui | Oui, fortement redessinés |
| Mode clair/sombre et couleur d'accent Windows | Oui | Oui, plus un moteur de thèmes complet |
| Système d'extensions/add-ons | Oui | Oui, conservé |
| Architecture Windows Core Audio / COM | Oui | Oui |
| Application WPF Windows | Oui | Oui |
| Architecture de processus x86 | Oui | Oui pour les builds publics actuels |

## 1. Contrôle audio et gestion du mixeur

### Fonctions ajoutées ou étendues dans BetterTrumpet

- **Masquage persistant des applications** : une application peut être retirée du mixeur pour un périphérique donné, puis restaurée individuellement ou globalement.
- **Masquage persistant des périphériques** : les sorties inutiles peuvent être cachées puis restaurées depuis le menu ou les paramètres.
- **Masquage rapide à la souris** : un clic du milieu sur le bouton de mute d'une application peut masquer sa ligne.
- **Solo rapide avec `Ctrl` + clic** : garde l'application ciblée audible et coupe les autres applications du même périphérique ; refaire l'action restaure les autres applications.
- **Hard mute persistant** : une application peut être marquée « toujours muette ». BetterTrumpet réapplique le mute dès qu'une nouvelle session audio de cet exécutable apparaît, y compris après redémarrage.
- **Identification du hard mute par exécutable** : le stockage utilise `ExeName`, plus stable entre les sessions que les identifiants WASAPI temporaires.
- **Annuler/rétablir** : `Ctrl+Z` et `Ctrl+Y` couvrent les changements de volume et de mute enregistrés par le service d'historique.
- **Flyout épinglable** : le mixeur compact peut rester ouvert et au premier plan au lieu de se fermer dès qu'il perd le focus.
- **Profils audio complets** : les volumes, mutes, périphériques et applications peuvent être capturés et restaurés.
- **Routage lors de l'application d'un profil** : BetterTrumpet tente de replacer les applications sur leur périphérique enregistré, puis réapplique leur état après stabilisation de la nouvelle session.
- **Gestion plus fine des sessions “Écouter ce périphérique”** : lorsque Windows fournit des paramètres de groupement distincts, les sessions de périphériques d'enregistrement surveillés ne sont plus toutes fusionnées dans une seule ligne de sons système.
- **Défilement du flyout renforcé** : défilement au pixel, plafond adapté au DPI et synchronisation de la hauteur WPF pour les configurations comportant beaucoup de périphériques ou d'applications.

### Limite commune liée à Windows

Une application sans session audio active n'expose pas encore de contrôle de volume par application à WASAPI. Le hard mute de BetterTrumpet ne peut donc pas créer à l'avance un objet audio inexistant ; il s'applique dès l'apparition de la session.

## 2. Interface, ergonomie et apparence

### EarTrumpet

EarTrumpet propose une interface compacte proche de Windows, des menus modernes, le mode clair/sombre, la couleur d'accent système et une expérience volontairement focalisée sur le mixage.

### BetterTrumpet

BetterTrumpet modifie beaucoup plus profondément la présentation et les interactions :

- identité visuelle, nom d'exécutable, icônes et assets BetterTrumpet ;
- interface dark-first plus proche d'une application Windows 11 moderne ;
- surfaces Acrylic/DWM sur le flyout, le popup média et le menu de la zone de notification ;
- menu de la zone de notification réorganisé par sections, avec glyphes Phosphor locaux, checks, chevrons, sous-menus et fallback sans Acrylic ;
- placement du menu limité à la zone de travail de l'écran pour éviter qu'il recouvre la barre des tâches, quelle que soit sa position ;
- animations d'ouverture, transitions de lignes, feedback de mute, solo, masquage et restauration ;
- animations conçues pour rester courtes et pour éviter les animations lourdes de hauteur dans la liste audio ;
- icône de zone de notification animée selon l'activité audio ;
- icônes de volume générées dynamiquement ;
- écran de paramètres largement réorganisé avec pages dédiées à l'animation, aux couleurs, au popup média, aux mises à jour et aux profils ;
- palette de commandes accessible depuis le mixeur complet avec `Ctrl+Shift+P`, permettant de rechercher des actions comme annuler, rétablir, ouvrir les paramètres, changer de sortie ou couper une application ;
- fenêtre de changelog post-mise à jour simplifiée : confirmation de version installée et lien vers le changelog web ;
- toast interne pour les mises à jour et confirmations QuickTrumpet ;
- accessibilité renforcée sur plusieurs boutons uniquement représentés par une icône.

## 3. Onboarding et première utilisation

EarTrumpet ne possède pas l'assistant BetterTrumpet décrit ci-dessous.

BetterTrumpet inclut un onboarding localisé de cinq pages :

1. choix de la sortie audio ;
2. apparence ;
3. confidentialité ;
4. écran de fin ;
5. aide à l'épinglage dans la zone de notification.

Différences importantes :

- choix du périphérique audio dès la première ouverture ;
- choix entre les couleurs système et la palette BetterTrumpet ;
- réglage du démarrage automatique et initialisation des notifications de mise à jour ;
- consentement télémétrique explicite et modifiable ;
- confirmation supplémentaire lors de la désactivation de la télémétrie dans l'onboarding ;
- animation GIF locale pour expliquer l'épinglage de l'icône ;
- possibilité de forcer l'onboarding avec `Ctrl gauche` au démarrage ;
- possibilité de forcer le changelog avec `Shift gauche` au démarrage.

## 4. Thèmes et personnalisation visuelle

EarTrumpet suit principalement le thème clair/sombre et l'accent Windows. BetterTrumpet ajoute un moteur de thèmes beaucoup plus poussé.

### Moteur BetterTrumpet

- **30 thèmes intégrés** répartis entre styles par défaut, marques, rétro, développeur, nature et accessibilité ;
- **7 canaux de couleur** : curseur, remplissage, fond de piste, vumètre, fond de fenêtre, texte et glow d'accent ;
- création, renommage, suppression, sauvegarde et chargement de thèmes personnalisés ;
- import/export de thèmes ;
- sélecteur de couleur, roue chromatique et pipette ;
- aperçu des couleurs dans les paramètres ;
- génération d'un thème aléatoire ;
- transitions animées entre thèmes ;
- mode de thème dynamique basé sur la couleur dominante de la pochette en cours ;
- fallback correct vers les couleurs du thème lorsque la valeur stockée est `Transparent` ;
- vumètre par défaut lié à la couleur d'accent au lieu d'un blanc WPF générique ;
- cinq styles de vumètre : Classic, Dotted, Blocks, Bars et Wave.

## 5. Popup média

Cette fonction est propre à BetterTrumpet dans les arbres comparés.

BetterTrumpet peut afficher un contrôleur média au survol de l'icône de la zone de notification :

- détection des sessions SMTC Windows ;
- titre, artiste et pochette ;
- play/pause, piste précédente et suivante ;
- shuffle et repeat quand le fournisseur les prend en charge ;
- barre de progression cliquable et glissable ;
- seek optimiste avec retry et protection contre les anciennes positions SMTC ;
- interpolation locale du temps toutes les 100 ms afin d'éviter un polling COM permanent ;
- version compacte et version étendue ;
- artwork étendu avec fallback pour les images de faible résolution ;
- accent et gradient de volume animés vers la couleur dominante de la pochette ;
- contrôle du volume de l'application média uniquement ;
- désactivation du volume quand aucune correspondance fiable avec une session audio d'application n'est disponible ;
- option permettant l'ouverture sur une session en pause afin de pouvoir la reprendre ;
- délai de survol réglable ;
- mémorisation possible de l'état étendu ;
- cache LRU des pochettes ;
- préchargement et décodage hors du thread UI ;
- annulation des chargements obsolètes lors de changements rapides de piste ;
- Acrylic basé sur les mêmes couleurs que le flyout principal.

Le vieux réglage `MediaPopupBlurRadius` est encore accepté dans les paramètres pour compatibilité, mais il n'est plus utilisé par l'interface actuelle.

### Limite connue

Windows peut choisir une session de navigateur au lieu de Spotify ou d'un autre lecteur lorsque plusieurs sessions SMTC sont actives. BetterTrumpet atténue plusieurs problèmes de synchronisation, mais ne contrôle pas totalement la sélection opérée par Windows.

## 6. QuickTrumpet, profils et automatisation

EarTrumpet propose des contrôles interactifs et des raccourcis. BetterTrumpet ajoute une vraie couche d'automatisation.

### Profils QuickTrumpet

- sauvegarde du périphérique courant ou de tous les périphériques ;
- capture des volumes et mutes des applications ;
- mode `apps-only` pour ne pas modifier le volume/mute des périphériques ;
- restauration des volumes, mutes et routages ;
- nom, identifiant, slug et version de schéma pour chaque profil ;
- renommage, suppression, import et export JSON ;
- raccourci clavier global propre à chaque profil ;
- alias direct, par exemple `bt focus` ;
- confirmation visuelle optionnelle après application.

### CLI BetterTrumpet

BetterTrumpet expose une CLI structurée autour d'un named pipe. Un second processus envoie la commande à l'instance déjà ouverte, qui exécute l'action sur le thread STA requis par l'audio Windows et renvoie du JSON.

Principales familles de commandes :

- lister les périphériques et applications ;
- lire ou modifier un volume absolu ou relatif ;
- mute, unmute et toggle-mute pour périphérique ou application ;
- lire ou changer la sortie par défaut ;
- router une application vers un périphérique ;
- lister, sauvegarder et appliquer des profils ;
- aliases conviviaux `volume`, `mute`, `unmute`, `toggle-mute`, `save`, `apply`, `mode` et `presets` ;
- exécution batch avec réponse JSON unique ;
- snapshot `watch` ;
- diagnostic `doctor` et test `ping` ;
- export/import des paramètres ;
- vérification de mise à jour ;
- résolution d'applications à partir d'un nom humain ;
- prévisualisation et application de règles ;
- création d'un preset à partir d'une règle.

Le protocole texte du pipe cadre les lignes au niveau des octets puis décode l'UTF-8. Cela préserve les noms non ASCII comme `Kopfhörer`, les accents français et les réponses JSON internationales.

### Exemples

```powershell
bt list-apps
bt volume discord 60
bt toggle-mute discord
bt save streaming --all-devices
bt focus
bt rule preview --keep valorant=100 --others 15 --apps-only
bt preset create "Valorant Focus" --keep valorant=100 --others 15 --apps-only
bt doctor
```

## 7. Sons et interactions supplémentaires

BetterTrumpet ajoute deux systèmes sonores absents d'EarTrumpet :

- un tick de volume optionnel, indépendant des autres sons ;
- un easter egg déverrouillable depuis la page À propos, remplaçant le tick par trois sons de singe selon la plage de volume.

Le lecteur du son easter egg :

- sélectionne un son bas, moyen ou haut selon le volume ;
- alterne deux canaux pour autoriser le chevauchement ;
- chevauche les répétitions de 75 ms ;
- réalise un crossfade de 40 ms lors d'un changement de plage ;
- limite la fréquence des déclenchements afin d'éviter une rafale sonore pendant un glissement rapide.

Les options correspondantes participent à l'export/import des paramètres.

## 8. Performances et optimisations

### Optimisations spécifiques à BetterTrumpet

- **Accélération GPU WPF réactivée** : suppression d'un ancien forçage `SoftwareOnly` qui augmentait l'utilisation CPU et rendait les animations moins fluides.
- **Démarrage en phases** : initialisation Core, UI puis Features, avec isolation des fonctions non critiques.
- **Travail d'arrière-plan** : add-ons, média, monitoring, mises à jour et serveur CLI sont initialisés sans bloquer tout le démarrage de l'interface.
- **Initialisation conditionnelle** : le popup média n'est pas initialisé si la fonction est désactivée ; son timer de survol est créé au premier besoin.
- **Cache LRU des pochettes** : évite de redécoder constamment les mêmes miniatures.
- **Traitement événementiel du média** : réduction du polling et des rafraîchissements complets lors d'un changement de piste.
- **Décodage hors UI** : les images et couleurs dominantes sont préparées en arrière-plan puis figées pour être utilisées sans erreur entre threads WPF.
- **Annulation des tâches obsolètes** : des `CancellationTokenSource` empêchent un vieux chargement de remplacer le contenu d'une piste plus récente.
- **Interpolation locale du timecode** : réduit les appels COM SMTC, qui ne publie souvent une position que toutes les quelques secondes.
- **Vumètre limité en FPS** : choix de 5, 20, 30 ou 60 FPS.
- **Arrêt automatique du rendu du vumètre** : désabonnement de `CompositionTarget.Rendering` lorsque le niveau est retombé et qu'aucune animation n'est nécessaire.
- **Mode Éco** : réduit les animations et force un niveau de rafraîchissement plus bas.
- **Mode Éco automatique sur batterie** : applique le profil allégé quand l'ordinateur n'est plus alimenté sur secteur.
- **Debounce du thème album art** : évite de recalculer immédiatement les couleurs pour chaque événement rapproché.
- **Caches d'objets UI du popup média** : storyboards, géométries et brushes réutilisés.
- **Ombre média légère** : remplacement d'un `DropShadowEffect` plus coûteux par une couche translucide plate.
- **Animations de liste prudentes** : pas d'animation lourde de hauteur pour masquer une application ; priorité au fade, slide et micro-scale.
- **Corrections de défilement et DPI** : moins de zones blanches et de recalculs incohérents dans les grands mixeurs.
- **Animation de l'icône de tray ajustée** : meilleure réactivité sans timer inutilement agressif.

### Ce que cela ne signifie pas

BetterTrumpet embarque aussi un popup média, un serveur IPC, un service de mise à jour, un moniteur de santé, davantage d'animations et davantage de paramètres. Même optimisés, ces composants représentent plus de code et potentiellement plus de travail qu'une installation EarTrumpet utilisée uniquement comme mixeur.

Il n'existe pas dans le dépôt de benchmark reproductible démontrant que BetterTrumpet utilise toujours moins de CPU ou de mémoire qu'EarTrumpet. La comparaison honnête est donc :

- EarTrumpet a un périmètre plus petit ;
- BetterTrumpet ajoute des optimisations ciblées pour conserver une bonne fluidité malgré un périmètre plus large ;
- le mode Éco permet à l'utilisateur d'arbitrer fluidité contre consommation.

## 9. Fiabilité, diagnostics et confidentialité

### EarTrumpet comparé

- buffer de trace en mémoire ;
- export de données de diagnostic ;
- Bugsnag conditionné par le réglage de télémétrie ;
- stockage Registry ou Windows Storage selon l'identité du package.

### BetterTrumpet

- remplacement de Bugsnag par Sentry ;
- Sentry activé uniquement après consentement utilisateur ;
- `SendDefaultPii=false` ;
- réinitialisation immédiate de Sentry lorsque le consentement change ;
- gestion globale des exceptions UI, AppDomain et tâches en arrière-plan ;
- isolation des erreurs d'une fonction non critique pour éviter qu'elle fasse tomber toute l'application ;
- logs structurés sur disque avec rotation ;
- cinq fichiers maximum de 5 Mo ;
- moniteur de santé pour mémoire, handles GDI, handles USER, threads et uptime ;
- export manuel d'un bundle ZIP de support ;
- inclusion des logs et d'un snapshot de diagnostic dans le bundle manuel ;
- bundle d'exception au crash sans snapshot audio live, afin d'éviter une panne en cascade ;
- ouverture du dossier du bundle et copie de son chemin dans le presse-papiers ;
- commande CLI `doctor` pour vérifier l'état de l'application et de l'audio ;
- null-safety renforcée autour de l'icône de tray avant que sa première frame animée soit disponible ;
- garde-fous contre les storyboards obsolètes, les pochettes arrivant en retard et les positions SMTC périmées ;
- retry du seek média lorsqu'un fournisseur refuse temporairement la commande ;
- correction du démarrage automatique sous .NET 8 avec `Environment.ProcessPath`, afin d'enregistrer `BetterTrumpet.exe` et non `BetterTrumpet.dll`.

### Contenu potentiellement sensible des diagnostics

Un bundle BetterTrumpet peut contenir des noms d'applications et de périphériques, des PID, des identifiants d'endpoints, l'état de certains paramètres et des logs récents. Il doit être traité comme une archive de support, pas comme un fichier public anodin.

## 10. Stockage et portabilité

| Sujet | EarTrumpet | BetterTrumpet |
| --- | --- | --- |
| Mode installé sans identité Store | Registre utilisateur | Registre utilisateur `HKCU\Software\EarTrumpet` |
| Mode package Store/MSIX | Windows Storage | Windows Storage pour le chemin Store |
| Mode portable | Non dans l'arbre comparé | Oui, détecté par `portable.marker` ou `.portable` |
| Paramètres portables | — | JSON local dans `config/settings.json` |
| Logs portables | — | `config/logs` |
| Export/import global | Diagnostic seulement | Fichier `.btsettings` versionné |
| Profils exportables | Non | Oui, JSON |
| Thèmes exportables | Non | Oui |

L'export BetterTrumpet couvre notamment les raccourcis, thèmes, couleurs, animations, vumètres, popup média, mises à jour, profils, hard mutes, applications/périphériques cachés et sons de volume.

## 11. Mises à jour et distribution

### EarTrumpet

- distribution et mises à jour principalement pensées autour du Microsoft Store ;
- disponibilité historique via d'autres gestionnaires, mais le README officiel met en avant la mise à jour Store ;
- package officiel avec l'identité `40459File-New-Project.EarTrumpet` dans l'arbre comparé.

### BetterTrumpet

- GitHub Releases comme source canonique des installeurs et ZIP portables ;
- Inno Setup pour l'installeur classique ;
- archive portable ;
- package Chocolatey ;
- manifestes Winget ;
- chemin Microsoft Store séparé avec sa propre identité Partner Center ;
- détection des releases GitHub au démarrage après un délai, puis toutes les six heures ;
- canaux de notification : toutes les versions, minor/major, major uniquement ou aucune notification ;
- téléchargement de l'installeur puis lancement silencieux ;
- fallback vers la page GitHub si le téléchargement ou l'installation ne peut pas démarrer ;
- changelog web lié depuis l'application ;
- GitVersion pour synchroniser les versions d'assembly et de produit ;
- build public `Release|x86` autonome afin de ne pas exiger l'installation séparée du runtime .NET Desktop x86.

### Différence de confiance et de signature

Les binaires publics BetterTrumpet ne sont pas encore signés avec un certificat Authenticode de confiance. Les checksums de release sont publiés pour les artefacts, mais le code actuel de l'updater interne ne réalise pas une validation séparée de checksum ou de signature avant de lancer l'installeur téléchargé.

Une installation EarTrumpet via le Microsoft Store bénéficie du modèle de signature et de distribution du Store. Pour BetterTrumpet, la signature publique reste donc un axe d'amélioration important.

## 12. Architecture et différences de code

| Élément | EarTrumpet `upstream/master` | BetterTrumpet actuel |
| --- | --- | --- |
| Framework | .NET Framework 4.6.2 | `net8.0-windows10.0.19041.0` |
| Format du projet | Ancien `.csproj` non SDK | Projet SDK-style |
| Assembly | `EarTrumpet` | `BetterTrumpet` |
| Namespace principal | `EarTrumpet` | `EarTrumpet`, conservé pour compatibilité |
| Architecture publique | x86 | x86 |
| Runtime distribué | Framework système/package | Self-contained en `Release|x86` |
| Sérialisation applicative | Newtonsoft.Json | Newtonsoft.Json, avec davantage de schémas JSON |
| Crash reporting | Bugsnag | Sentry 4.12.1 avec opt-in |
| GIF WPF | XamlAnimatedGif | XamlAnimatedGif |
| Versioning | GitVersionTask ancien format | GitVersion.MsBuild 5.12.0 |
| IPC CLI | Aucun serveur CLI comparable | Named pipe JSON UTF-8 |
| Stockage portable | Non | Backend `JsonFileSettingsBag` |
| Services média | Non dans l'arbre comparé | SMTC + fallback legacy + cache album art |
| Diagnostics disque | Limité | Logs rotatifs, santé et bundles ZIP |
| Packaging classique | Package Store | Store séparé + Inno + portable + Choco + Winget |

### Modernisation .NET 8

La migration BetterTrumpet a notamment :

- converti le projet en SDK-style avec inclusion automatique des sources ;
- remplacé `packages.config` par `PackageReference` ;
- supprimé plusieurs packages devenus intégrés au runtime moderne ;
- retiré l'ancien `App.config` .NET 4.6.2 et ses binding redirects ;
- conservé la sortie historique `Build\Release` pour ne pas casser le packaging ;
- conservé l'architecture x86, requise par le projet et sa chaîne de distribution ;
- ajouté les appels DWM nécessaires aux backdrops modernes ;
- conservé le namespace `EarTrumpet` pour limiter une réécriture risquée du fork.

### Nouveaux composants majeurs BetterTrumpet

Parmi les classes ou services absents de l'arbre EarTrumpet comparé :

- `CliEntryPoint`, `CliHandler`, `PipeClient`, `PipeServer` et le protocole texte UTF-8 ;
- `UpdateService` ;
- `VolumeProfileService` ;
- `VolumeUndoService` ;
- `SettingsExportService` ;
- `MediaSessionService`, `LegacyMediaPlayerService` et `AlbumArtCache` ;
- `CrashHandler`, `FileTraceListener` et `HealthMonitor` ;
- `JsonFileSettingsBag` ;
- `MediaPopupWindow`, `OnboardingWindow`, `ChangelogWindow` et `ToastNotification` ;
- `ColorTheme`, `ThemeRegistry` et les pages de paramètres spécialisées ;
- roue chromatique, picker, pipette, rendu Unicode des vumètres et lecteur des sons de volume ;
- helpers de palette de commandes, undo/redo, icônes Phosphor et icônes de volume dynamiques.

## 13. Localisation

EarTrumpet conserve ici un avantage important : son projet officiel annonce plus de vingt langues et s'appuie sur une communauté Crowdin active.

BetterTrumpet conserve les nombreux fichiers de ressources hérités, mais les nouvelles fonctions propres au fork sont maintenues en priorité en anglais et en français. En conséquence :

- les fonctions historiques peuvent rester traduites dans de nombreuses langues ;
- les nouvelles pages et nouveaux labels BetterTrumpet ne sont garantis complets qu'en anglais et en français ;
- certains éléments avancés, comme la palette de commandes, contiennent encore du texte anglais en dur.

Pour un utilisateur non anglophone ou non francophone, EarTrumpet peut donc offrir une expérience plus homogène.

## 14. Compatibilité Windows

| Sujet | EarTrumpet comparé | BetterTrumpet |
| --- | --- | --- |
| Manifest minimum | Windows 10 build 14393 | Windows 10 build 17763 |
| API Windows ciblée par le projet | SDK historique 14393 | Windows 10 build 19041 via le TFM |
| MaxVersionTested du manifest | 14393 dans l'arbre comparé | 26100 |
| Windows 11 | Oui | Oui, avec intégration visuelle plus poussée |
| Périphériques audio multiples | Oui | Oui |
| Sessions SMTC | Pas de popup comparable | Oui, avec limites imposées par Windows |

BetterTrumpet demande donc une base Windows plus récente que le manifest historique d'EarTrumpet.

## 15. Contreparties de BetterTrumpet

BetterTrumpet apporte beaucoup plus de fonctions, mais il faut aussi prendre en compte les points suivants :

- davantage de code à maintenir et de chemins d'exécution à tester ;
- divergence croissante par rapport à l'upstream EarTrumpet ;
- intégration manuelle plus difficile des nouveaux correctifs upstream ;
- build autonome plus volumineux sur disque ;
- davantage de services optionnels en mémoire lorsque média, mise à jour, monitoring ou CLI sont actifs ;
- nouvelles traductions principalement limitées à l'anglais et au français ;
- installeur public pas encore signé Authenticode ;
- comportement du popup média dépendant de la qualité de l'implémentation SMTC des applications ;
- profils et hard mute limités aux sessions audio que Windows expose réellement ;
- certaines données de diagnostic peuvent être sensibles ;
- le projet reste x86, même sur un Windows x64 ;
- certaines pages de documentation historiques du dépôt peuvent être en retard sur le code actuel.

## 16. Quel choix selon l'utilisateur ?

### Choisir EarTrumpet si

- le besoin principal est un excellent mixeur par application, sans fonctions annexes ;
- la priorité est une expérience très proche du projet officiel et du Microsoft Store ;
- une traduction complète dans une langue autre que l'anglais ou le français est importante ;
- la simplicité du périmètre compte davantage que la personnalisation et l'automatisation ;
- l'utilisateur préfère réduire au minimum le nombre de services additionnels.

### Choisir BetterTrumpet si

- l'utilisateur veut des thèmes poussés et une interface plus personnalisable ;
- il utilise plusieurs sorties, beaucoup d'applications ou des setups de streaming/gaming ;
- il veut sauvegarder des profils audio et les rappeler par raccourci ;
- il veut automatiser Windows audio depuis PowerShell, un launcher, Stream Deck ou un agent IA ;
- il veut un popup média au survol de l'icône ;
- il a besoin d'un mode portable ;
- il veut des diagnostics plus complets ;
- il souhaite masquer des lignes, conserver certaines applications muettes ou utiliser le solo rapide ;
- il préfère disposer de réglages explicites de fluidité et de consommation.

## Conclusion

EarTrumpet reste le socle : un mixeur Windows efficace, reconnu, concentré sur l'audio par application et largement traduit.

BetterTrumpet transforme ce socle en une suite de contrôle audio plus large. Les plus grandes différences ne sont pas seulement visuelles : elles se trouvent dans QuickTrumpet, la CLI JSON, les profils, le hard mute, le popup média, le mode portable, le moteur de thèmes, les diagnostics, l'updater GitHub et la migration .NET 8.

La formulation la plus juste est donc : **BetterTrumpet offre davantage de contrôle, de personnalisation et d'automatisation ; EarTrumpet offre un périmètre plus simple, plus officiel et plus homogène internationalement.**

## Références principales dans le dépôt

- [`AGENTS.md`](../AGENTS.md)
- [`README.md`](../README.md)
- [`docs/CLI.md`](CLI.md)
- [`EarTrumpet/App.xaml.cs`](../EarTrumpet/App.xaml.cs)
- [`EarTrumpet/AppSettings.cs`](../EarTrumpet/AppSettings.cs)
- [`EarTrumpet/EarTrumpet.csproj`](../EarTrumpet/EarTrumpet.csproj)
- [`EarTrumpet/DataModel/VolumeProfileService.cs`](../EarTrumpet/DataModel/VolumeProfileService.cs)
- [`EarTrumpet/DataModel/UpdateService.cs`](../EarTrumpet/DataModel/UpdateService.cs)
- [`EarTrumpet/DataModel/SettingsExportService.cs`](../EarTrumpet/DataModel/SettingsExportService.cs)
- [`EarTrumpet/DataModel/MediaSessionService.cs`](../EarTrumpet/DataModel/MediaSessionService.cs)
- [`EarTrumpet/Diagnosis/ErrorReporter.cs`](../EarTrumpet/Diagnosis/ErrorReporter.cs)
- [`EarTrumpet/UI/Controls/VolumeSlider.cs`](../EarTrumpet/UI/Controls/VolumeSlider.cs)
- [`EarTrumpet/UI/ViewModels/ThemeRegistry.cs`](../EarTrumpet/UI/ViewModels/ThemeRegistry.cs)
- [`EarTrumpet/UI/Views/MediaPopupWindow.xaml.cs`](../EarTrumpet/UI/Views/MediaPopupWindow.xaml.cs)
