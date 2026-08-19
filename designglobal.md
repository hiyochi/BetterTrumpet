# Global Design Direction — Sage Glass Control Surfaces

> Système visuel réutilisable pour créer d’autres applications avec la même identité que Passerelle, même lorsque le produit, le métier et les données n’ont rien à voir.
>
> Ce document décrit une **grammaire de design**, pas une copie de l’interface Gateway. Les couleurs, labels et modules peuvent changer ; la structure, les rayons, la densité et le langage visuel restent cohérents.

---

## 1. Positionnement de la direction

Cette direction convient aux produits qui doivent paraître :

- fiables ;
- calmes ;
- premium sans être luxueux ;
- techniques mais humains ;
- privés ou administratifs ;
- utilisés régulièrement par des professionnels.

Elle fonctionne particulièrement bien pour :

- consoles d’infrastructure ;
- outils internes ;
- back-offices ;
- produits data ;
- dashboards d’administration ;
- outils créatifs avec beaucoup de navigation ;
- logiciels self-hosted ;
- interfaces de configuration.

### Design read

> Une application native flottante, posée dans un cadre noir, avec une surface atmosphérique sage et des panneaux de verre sombre qui organisent les tâches sans transformer l’écran en cockpit.

### Dials recommandés

```text
DESIGN_VARIANCE: 5/10
MOTION_INTENSITY: 3/10
VISUAL_DENSITY: 5/10
```

- variance moyenne : structure solide, quelques respirations asymétriques ;
- motion faible à moyenne : l’interface répond vite, elle ne se donne pas en spectacle ;
- densité moyenne : assez de données pour travailler, assez d’espace pour respirer.

---

## 2. Principes non négociables

### 2.1 Un cadre noir extérieur

L’application est contenue dans un shell sombre qui crée une séparation nette avec la surface principale.

```text
body / shell extérieur : presque noir
  └── contenu avec grand rayon
        ├── sidebar noire
        └── surface colorée atmosphérique
```

Le cadre extérieur donne une impression de fenêtre native et empêche l’application de se confondre avec une simple page web.

### 2.2 Une sidebar persistante

La navigation principale vit dans une sidebar noire, stable et réductible.

- ouverte : `248px` ;
- réduite : `64px` ;
- mobile : panneau overlay de `248px` ;
- labels masqués en mode réduit ;
- icônes toujours centrées dans une vraie zone de clic ;
- l’état actif doit être visible même sans texte.

### 2.3 Un seul langage de rayon

Les arrondis sont généreux mais contrôlés.

```css
--radius-control: 14px;
--radius-card: 18px;
--radius-shell: 24px;
```

La règle est hiérarchique :

- les petits contrôles ont le plus petit rayon ;
- les cartes ont un rayon intermédiaire ;
- les grandes surfaces ont le plus grand rayon ;
- les statuts sont des pilules ;
- les indicateurs sont circulaires.

Ne pas utiliser simultanément `8px`, `10px`, `12px`, `14px`, `16px`, `18px`, `20px` et `24px` sans système clair. La perception de qualité vient ici de la répétition.

### 2.4 Une seule couleur d’accent

Choisir une couleur d’accent et la réserver aux actions ou aux états importants.

Dans la direction de référence :

```text
mint : #38D6A0
```

Elle sert à :

- l’action principale ;
- l’état actif ;
- la santé du système ;
- les liens techniques importants ;
- les indicateurs positifs.

Elle ne doit pas être utilisée comme décoration sur chaque élément.

### 2.5 Des surfaces, pas des boîtes partout

Les cartes servent à grouper ou hiérarchiser une information. Un écran ne doit pas devenir une grille de boîtes identiques.

Préférer :

- une surface principale ;
- quelques panneaux forts ;
- des groupes avec espace négatif ;
- des séparateurs subtils pour les listes.

---

## 3. Palette adaptable

La palette peut être adaptée à un autre produit, mais elle doit conserver la relation suivante :

1. extérieur presque noir ;
2. surface principale colorée mais peu saturée ;
3. surfaces internes plus sombres ;
4. texte clair ;
5. accent unique très lisible.

### Palette de référence

| Rôle | Valeur de référence | Fonction |
|---|---|---|
| shell | `#050706` | cadre, sidebar, ancrage |
| sage surface | `#829790` à `#95A9A2` | fond principal |
| glass | `rgba(31,43,40,.74)` | cartes et panneaux |
| glass strong | `rgba(22,31,29,.90)` | modales, zones sensibles |
| text | `#F4F7F5` | contenu principal |
| muted | `rgba(244,247,245,.58)` | métadonnées |
| line | `rgba(255,255,255,.10)` | séparation |
| accent | `#38D6A0` | action et statut positif |
| danger | `#FF8D83` | suppression et erreur |

### Règle d’adaptation

Si le prochain produit a une couleur de marque différente, remplacer `--accent`, mais ne pas introduire une deuxième couleur d’action principale. Les états danger et warning restent sémantiques.

Exemples d’accents compatibles :

- bleu glacier ;
- jaune doux ;
- orange corail ;
- lavande grisée ;
- vert olive clair.

Éviter le violet électrique par défaut : il ramène immédiatement à une esthétique AI générique.

---

## 4. Fond atmosphérique

Le fond ne doit pas être un simple aplat. Il doit donner une profondeur calme et légèrement organique.

### Composition recommandée

```css
background:
  radial-gradient(ellipse ... at top-center, halo clair, transparent),
  radial-gradient(ellipse ... at bottom-left, chaleur désaturée, transparent),
  radial-gradient(ellipse ... at bottom-right, profondeur sombre, transparent),
  linear-gradient(..., surface-base ...);
```

### Règles

- halos très larges ;
- aucune forme dure ;
- contraste inférieur à celui du contenu ;
- trame de points ou grain à faible opacité ;
- pseudo-élément `pointer-events: none` ;
- ne pas appliquer de filtre lourd au container scrollable ;
- prévoir un fallback opaque si la transparence est réduite.

Le fond doit soutenir les cartes, pas devenir une illustration concurrente.

---

## 5. Shell et navigation réutilisables

### HTML recommandé

```html
<div class="app-shell">
  <aside class="sidebar">
    <div class="sidebar-header">…</div>
    <nav class="sidebar-nav">…</nav>
    <div class="sidebar-footer">…</div>
  </aside>

  <main class="content-surface">
    <div class="atmosphere"></div>
    <div class="content-page">…</div>
  </main>
</div>
```

### Sidebar ouverte

- logo en haut ;
- navigation primaire au milieu ;
- état actif avec surface blanche translucide ;
- informations secondaires en bas ;
- déconnexion ou profil dans la zone basse.

### Sidebar réduite

- conserver la hiérarchie verticale ;
- ne pas déplacer les items ;
- ne pas transformer les icônes en petits boutons disparates ;
- utiliser des tooltips pour les labels si nécessaire ;
- garder les zones de clic de `38px` minimum.

### Mobile

À `680px` environ :

- barre supérieure de `58px` ;
- sidebar en overlay ;
- contenu edge-to-edge ;
- fermeture après navigation ou via bouton explicite ;
- aucun hover requis.

---

## 6. Système de composants

### Tokens de forme

```css
:root {
  --radius-control: 14px;
  --radius-card: 18px;
  --radius-shell: 24px;
  --control-height: 40px;
  --sidebar-open: 248px;
  --sidebar-collapsed: 64px;
}
```

### Boutons

#### Primaire

- accent plein ;
- texte très contrasté ;
- une intention unique ;
- largeur suffisante pour tenir sur une ligne ;
- feedback `scale(.96)` à l’appui.

#### Secondaire / ghost

- surface blanche `8%` ;
- bordure très discrète ;
- réservé aux actions complémentaires.

#### Danger

- utilisé pour la suppression ou révocation ;
- nécessite une confirmation si l’action est irréversible ;
- ne pas en faire l’équivalent visuel du bouton primaire.

### Champs

- label au-dessus ;
- rayon `14px` ;
- fond sombre ;
- focus mint ;
- aide sous le champ si elle évite une erreur ;
- message d’erreur directement sous le champ.

### Cartes

- rayon `18px` ;
- profondeur par highlight interne et ombre douce ;
- pas de bordure épaisse ;
- contenu aligné sur une grille ;
- padding de référence : `16–24px`.

### Panneaux

Un panneau est une carte dont le contenu a une structure interne plus forte :

- header ;
- séparateur ;
- contenu ;
- footer ou action.

Le rayon s’applique au panneau extérieur ; les sous-sections utilisent principalement des séparateurs.

### Badges

- rayon `999px` ;
- court ;
- toujours sémantique ;
- texte et couleur doivent rester compréhensibles sans la couleur seule.

### Modales

- rayon `24px` ;
- backdrop sombre ;
- largeur standard `520px` ;
- largeur large `760px` ;
- header sticky ;
- boutons alignés à droite ;
- fermeture explicite ;
- comportement clavier prévu.

### Tables

Les tables doivent rester calmes :

- pas de rayons sur chaque ligne ;
- ligne de titre avec texte muted ;
- séparateurs fins ;
- hover très faible ;
- scroll horizontal sur mobile ;
- utiliser une carte ou un panneau autour de la table si nécessaire.

---

## 7. Layout et densité

### Grille principale

- largeur maximale de lecture : `1280px` ;
- padding desktop : `52px 54px` ;
- padding tablette : `40px 30px` ;
- padding mobile : `28px 16px` ;
- gap standard : `12–18px` ;
- gap de section : `24–45px`.

### Hiérarchie de page

```text
Page head
  titre + description + action principale

Status ou contexte

Bloc principal
  contenu le plus important de la page

Blocs secondaires

Empty/error state si nécessaire
```

### Anti-clutter

- une action primaire par zone ;
- pas plus de deux actions fortes dans un header ;
- grouper les actions secondaires ;
- préférer un panneau clair à quatre cartes de métriques si les chiffres ne sont pas essentiels ;
- ne jamais inventer de métriques pour remplir l’espace.

---

## 8. Responsive rules

| Zone | Desktop | Tablette | Mobile |
|---|---|---|---|
| sidebar | 248px ouverte | 64px réduite | overlay 248px |
| content | shell arrondi | shell arrondi | edge-to-edge |
| stats | 4 colonnes | 2 colonnes | 2 colonnes |
| form grid | 2 colonnes | 2 si possible | 1 colonne |
| page action | inline | inline ou dessous | pleine largeur |
| table | largeur naturelle | scroll si nécessaire | scroll horizontal |
| cards | une ligne | wrap mesuré | multi-lignes |

Les breakpoints ne doivent pas seulement réduire les tailles : ils doivent modifier le regroupement et l’ordre de lecture.

---

## 9. Motion

La motion est de niveau fonctionnel, jamais spectaculaire.

```css
--ease-ui: cubic-bezier(.2,0,0,1);
--duration-fast: 150ms;
--duration-ui: 220ms;
```

Autorisé :

- ouverture sidebar ;
- expansion d’une carte ;
- hover de bouton ;
- apparition d’un toast ;
- shimmer skeleton ;
- rotation de chevron.

Interdit par défaut :

- animation perpétuelle de toutes les cartes ;
- parallax décoratif ;
- gradients animés ;
- transitions de `all` ;
- scroll hijacking ;
- effets qui retardent une action administrative.

Toujours gérer :

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;
    transition-duration: .01ms !important;
  }
}
```

---

## 10. Accessibilité

- contraste minimum WCAG AA pour les textes courants ;
- accent mint utilisé avec du texte sombre, jamais texte blanc illisible ;
- focus visible ;
- labels explicites ;
- zones de clic de `38px` minimum ;
- navigation clavier complète ;
- `aria-expanded` pour les disclosures ;
- `aria-modal` pour les modales ;
- ne pas communiquer un état uniquement par la couleur ;
- les tooltips ne remplacent pas un nom accessible ;
- respecter `prefers-reduced-transparency`.

---

## 11. États produit obligatoires

Tout nouveau projet basé sur cette DA doit prévoir au minimum :

### Chargement

Skeleton qui reprend les dimensions du composant final.

### Vide

Message court, cause de l’absence, action de démarrage.

### Erreur

Erreur contextualisée, sans jargon inutile, avec possibilité de réessayer si pertinent.

### Succès

Feedback visuel discret, généralement toast ou changement d’état local.

### Désactivé

Opacité réduite mais contraste suffisant pour comprendre pourquoi l’action n’est pas disponible.

### Destructif

Confirmation claire et texte expliquant l’irréversibilité.

---

## 12. Typographie et écriture

- sans-serif neutre et lisible ;
- une seule famille principale ;
- monospace uniquement pour identifiants, endpoints, valeurs techniques et code ;
- titres courts ;
- labels fonctionnels ;
- pas de jargon marketing dans les paramètres ;
- pas de phrases trop longues dans les empty states ;
- les nombres sont alignés et formatés de manière stable.

Le ton doit être :

```text
calme · précis · direct · professionnel · jamais dramatique
```

---

## 13. Checklist d’implémentation

Avant de considérer un nouvel écran comme terminé :

- [ ] Le shell noir et la surface principale sont présents.
- [ ] La sidebar fonctionne ouverte, réduite et mobile.
- [ ] Les rayons utilisent les trois tokens globaux.
- [ ] Aucun rayon local incohérent n’a été ajouté.
- [ ] Une seule couleur d’accent est utilisée.
- [ ] Les actions primaires et secondaires sont hiérarchisées.
- [ ] Les états loading, vide, erreur et succès existent.
- [ ] Le responsive a été vérifié sous `680px`, autour de `768px` et au-dessus de `980px`.
- [ ] Les boutons ont un état focus et pressed.
- [ ] Les modales ont une fermeture accessible.
- [ ] Les contrastes ont été vérifiés.
- [ ] La réduction de mouvement et de transparence fonctionne.
- [ ] Aucun contenu de démonstration ne se fait passer pour une donnée réelle.
- [ ] L’écran reste identifiable même lorsque la sidebar est réduite.

---

## 14. Adaptation à un projet sans rapport

Pour réutiliser la DA sans copier le produit Gateway :

1. conserver le shell noir ;
2. conserver la sidebar réductible ;
3. conserver les tokens de rayon ;
4. conserver la hiérarchie surface principale / panneaux ;
5. choisir une nouvelle couleur d’accent si la marque l’exige ;
6. remplacer les pages et composants métier ;
7. conserver le ton calme et les états complets ;
8. adapter la densité selon le produit ;
9. ne pas reprendre les libellés « Gateway », « Providers » ou « Clés API » ;
10. ne pas ajouter de glassmorphism sur chaque élément uniquement parce que cette direction l’autorise.

La DA est réussie lorsque l’on reconnaît la famille visuelle, pas lorsque chaque écran est une copie de l’écran précédent.
