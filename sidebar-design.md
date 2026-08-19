# Sidebar Design — Wafer-inspired Navigation

> Spécification dédiée à la sidebar noire visible dans la référence Wafer et adaptée à l’interface Passerelle.
>
> Ce document décrit la sidebar comme un composant indépendant : géométrie, hiérarchie, états, rythme vertical, icônes, responsive et règles de reproduction.

---

## 1. Lecture de la référence

La sidebar est une colonne noire autonome, très calme, qui sert de rail de navigation permanent.

Elle ne cherche pas à attirer l’attention par une bordure ou un effet lumineux. Son identité vient de :

- sa largeur étroite ;
- son contraste avec la surface sage à droite ;
- son grand espace négatif ;
- ses labels blancs très courts ;
- ses icônes outline ;
- un seul item actif présenté comme une capsule sombre ;
- une zone secondaire ancrée en bas.

La sidebar doit donner la sensation d’une application native posée à côté du contenu, et non celle d’un menu de site marketing.

---

## 2. Composition générale

```text
┌──────────────────────┐
│ logo                 │  zone haute
│                  ◫   │  bouton collapse
│                      │
│  ●  Models           │  navigation active
│  ▣  Usage            │
│  ▭  Dedicated        │
│  ▱  Billing          │
│  ⋮  Teams            │
│  ⚿  API Keys         │
│                      │
│                      │  espace négatif volontaire
│                      │
│  ◫  Docs          ↗  │  ressources secondaires
│  ▣  Balance Balance  │
│  ●  Nemmax        ⋮  │  identité utilisateur
└──────────────────────┘
```

### Zones fonctionnelles

1. **Header** : logo et contrôle de réduction.
2. **Navigation principale** : sections métier prioritaires.
3. **Espace flexible** : pousse la zone basse vers le bas.
4. **Footer navigation** : documentation et balance.
5. **Profil** : avatar, nom et menu secondaire.

La structure doit utiliser un layout vertical avec `margin-top: auto` sur le footer. Il ne faut pas positionner chaque élément avec des coordonnées absolues.

---

## 3. Géométrie

### Desktop ouvert

| Élément | Valeur de référence |
|---|---:|
| largeur sidebar | `248px` |
| padding horizontal | `8px` |
| padding vertical | `12px` |
| hauteur utile | `100dvh - 12px` |
| position supérieure | `6px` |
| largeur zone de contenu | flexible |
| gap sidebar/contenu | `8px` |
| fond | `#050706` ou noir pur |

Dans la capture de référence, la sidebar occupe environ `188px` visuellement. Dans Passerelle, la largeur fonctionnelle est `248px` afin de conserver les labels et les actions ; la composition visuelle reste la même.

### Desktop réduit

| Élément | Valeur |
|---|---:|
| largeur | `64px` |
| largeur icône | `20px` |
| zone de clic | `38px × 38px` minimum |
| label | masqué visuellement |
| état actif | conservé sous forme de capsule ou fond |

### Mobile

- sidebar transformée en overlay ;
- largeur : `248px` ;
- top offset : `58px` sous la barre mobile ;
- translation initiale : `translateX(-100%)` ;
- ouverture : `translateX(0)` ;
- z-index supérieur au contenu mais inférieur aux modales ;
- fermeture via bouton de la barre mobile.

---

## 4. Fond, bordure et contraste

### Fond

```css
background: #050706;
```

Le noir est volontairement proche du shell extérieur. La sidebar ne doit pas recevoir le gradient sage du contenu.

### Bordure

Il n’y a pas de bordure verticale forte entre sidebar et contenu.

La séparation vient de :

- la différence de couleur ;
- le gap de `8px` ;
- le rayon de la surface principale ;
- la profondeur atmosphérique du contenu.

Une bordure blanche ou grise visible sur toute la hauteur casserait l’effet de fenêtre flottante.

### Contraste

- logo : blanc ou blanc cassé ;
- navigation inactive : blanc à environ `64%` ;
- navigation active : blanc plein ;
- icônes inactives : même hiérarchie que le label ;
- texte secondaire : `rgba(255,255,255,.55)` ;
- accent mint uniquement pour le logo, les états positifs ou les éléments de confidentialité.

---

## 5. Logo et bouton de réduction

### Logo

Le logo occupe le coin supérieur gauche.

Dans la référence :

- wordmark blanc ;
- taille visuelle autour de `20px` ;
- tracking légèrement négatif ;
- poids medium/semi-bold ;
- aucune capsule autour du logo ;
- alignement optique avec les icônes de navigation.

Dans Passerelle, le logo est composé du symbole et du nom :

```text
[ symbole ] passerelle
```

En mode réduit, seul le symbole reste visible.

### Bouton de réduction

- placé en haut à droite de la sidebar ouverte ;
- taille : `38px × 38px` ;
- icône : `SidebarSimple` ou équivalent ;
- fond transparent au repos ;
- hover : fond blanc `8%` ;
- active : `scale(.96)` ;
- label accessible obligatoire : « Réduire la navigation » ou « Agrandir la navigation ».

Le bouton doit être aligné sur le header, pas placé dans la liste de navigation.

---

## 6. Navigation principale

### Liste de référence

La référence montre six entrées :

1. Models
2. Usage
3. Dedicated
4. Billing
5. Teams
6. API Keys

Dans Passerelle, les entrées métier sont :

1. Vue d’ensemble
2. Modèles
3. Utilisation
4. Providers
5. Routes
6. Clés API
7. Audit
8. Réglages

Le nombre peut varier selon le produit. La règle importante est de séparer les priorités métier des ressources secondaires et du profil.

### Item de navigation

```css
height: 42px;
padding-inline: 12px;
gap: 13px;
border-radius: 14px;
```

Le bouton est une ligne horizontale :

```text
[20px icon] [label]
```

### Espacement

- gap entre items : `4px` dans Passerelle ;
- la capture donne visuellement un rythme d’environ `14–18px` entre les lignes ;
- ne pas compenser avec des marges arbitraires item par item ;
- la régularité verticale est plus importante que la taille exacte.

### État par défaut

- fond transparent ;
- texte blanc `64%` ;
- icône outline ;
- curseur pointer ;
- transition de couleur et de fond de `150ms`.

### État hover

```css
background: rgba(255,255,255,.06);
color: #fff;
```

Le hover doit rester très discret. La sidebar ne doit pas devenir une colonne de tuiles brillantes.

### État actif

Dans la référence, l’item actif est une capsule sombre légèrement plus claire que le fond :

```css
background: rgba(255,255,255,.10);
color: #fff;
box-shadow: inset 0 0 0 1px rgba(255,255,255,.04);
```

L’icône active passe en `weight="fill"` lorsque la famille d’icônes le permet.

Le fond actif doit entourer uniquement la zone de l’item, jamais toute la colonne.

### États clavier

Ajouter un focus visible qui ne ressemble pas à l’état actif :

```css
:focus-visible {
  outline: 2px solid #38D6A0;
  outline-offset: 2px;
}
```

Ne pas supprimer le focus natif sans le remplacer.

---

## 7. Icônes

### Famille

Utiliser une seule famille d’icônes sur toute la sidebar. Dans Passerelle :

```text
@phosphor-icons/react
```

### Style

- outline par défaut ;
- fill uniquement pour l’état actif ;
- taille nominale : `20px` ;
- stroke visuel uniforme ;
- couleur héritée via `currentColor` ;
- largeur minimale conservée dans une sidebar réduite.

### Principes d’association

| Fonction | Type d’icône recommandé |
|---|---|
| dashboard | gauge / squares |
| catalogue | stack / squares |
| usage | chart line |
| provider | plugs / database |
| route | branch / git branch |
| clé | key |
| audit | shield check |
| réglages | gear |
| docs | book open |
| balance | wallet / briefcase |
| profil | avatar ou initiales |
| collapse | sidebar simple |
| menu profil | dots three vertical |

L’icône doit être comprise comme un repère secondaire. Le label reste la source de vérité lorsque la sidebar est ouverte.

---

## 8. Footer de navigation

### Position

Le footer est poussé en bas avec :

```css
.side-foot {
  margin-top: auto;
}
```

Il ne doit pas être simplement placé après la dernière entrée avec une grande marge fixe : il doit rester collé au bas quelle que soit la hauteur de fenêtre.

### Séparateur

La référence utilise un changement de rythme plutôt qu’une grosse ligne. Dans Passerelle, un séparateur très discret peut être utilisé :

```css
border-top: 1px solid rgba(255,255,255,.10);
padding-top: 10px;
```

### Documentation

- icône livre ;
- label `Docs` ;
- lien externe discret `↗` aligné à droite ;
- ne pas faire de ce lien un bouton primaire.

### Balance

- icône portefeuille ;
- label principal `Balance` ;
- valeur ou second label aligné à droite ;
- réserver cet emplacement aux informations globales très courtes.

### Profil

La ligne de profil contient :

```text
[avatar] [nom]                         [⋮]
```

- avatar circulaire de `24–28px` ;
- nom tronqué si nécessaire ;
- menu trois points ;
- zone de clic complète sur la ligne ;
- ne pas utiliser un avatar géant ou une carte de profil complète dans la sidebar.

Dans Passerelle, cette zone peut inclure la confidentialité et la déconnexion, mais elle doit conserver la même logique basse et compacte.

---

## 9. Mode réduit

Le mode réduit ne doit pas être une sidebar différente : c’est la même structure avec les labels masqués.

### Règles

- largeur `64px` ;
- icônes centrées ;
- les boutons gardent une zone de clic complète ;
- labels masqués via opacité et non supprimés brutalement si cela permet une transition propre ;
- pas de changement d’ordre ;
- pas de disparition de l’état actif ;
- logo remplacé par le symbole ;
- footer conservé sous forme d’icônes essentielles.

### Tooltip

Si les labels sont nécessaires à la compréhension :

- afficher un tooltip au hover/focus ;
- tooltip à droite de la sidebar ;
- fond sombre opaque ;
- rayon `12–14px` ;
- texte court ;
- délai léger, environ `150–250ms` ;
- jamais d’information uniquement disponible au hover sur mobile.

---

## 10. Responsive et mobile

### Barre mobile

La sidebar desktop devient une barre supérieure :

```text
┌─────────────────────────────────┐
│ [symbole] produit       [menu]  │
└─────────────────────────────────┘
```

- hauteur : `58px` ;
- fond noir translucide ;
- blur modéré ;
- logo compact ;
- bouton menu à droite ;
- position sticky ;
- rayon nul car elle est edge-to-edge.

### Drawer mobile

- fond noir opaque ;
- commence sous la barre ;
- couvre la hauteur restante ;
- entrée/sortie par translation ;
- prévoir un backdrop si le contenu reste visible derrière ;
- empêcher les clics accidentels sur le contenu lorsque le drawer est ouvert.

### Accessibilité mobile

- le bouton menu doit avoir `aria-expanded` ;
- le drawer doit avoir un nom ;
- le focus doit entrer dans le drawer à l’ouverture si un gestionnaire de focus est présent ;
- fermeture avec `Escape` ;
- les labels restent toujours visibles dans le drawer mobile.

---

## 11. Motion de la sidebar

### Réduction / expansion

Animer uniquement :

- largeur de la grille shell ;
- opacité des labels ;
- opacité du texte du logo ;
- position des éléments si nécessaire.

```css
transition:
  grid-template-columns 220ms cubic-bezier(.2,0,0,1),
  opacity 150ms ease,
  background-color 150ms ease,
  color 150ms ease;
```

### Interactions fréquentes

- hover : transition courte, sans déplacement ;
- active : `scale(.96)` ;
- état actif : changement immédiat de fond et couleur ;
- pas de bounce ;
- pas de pulse permanent sur l’item actif.

### Réduction de mouvement

Sous `prefers-reduced-motion: reduce` :

- désactiver la translation animée ;
- réduire la transition à un changement instantané ;
- conserver les changements de couleur et de fond comme feedback statique.

---

## 12. Structure React de référence

```tsx
<aside className="sidebar">
  <div className="sidebar-header">
    <BrandMark />
    <button
      className="icon-button"
      aria-label={collapsed ? 'Agrandir la navigation' : 'Réduire la navigation'}
      aria-pressed={collapsed}
      onClick={toggleCollapsed}
    >
      <SidebarSimple />
    </button>
  </div>

  <nav aria-label="Navigation principale">
    {primaryItems.map((item) => (
      <NavItem key={item.id} {...item} active={current === item.id} />
    ))}
  </nav>

  <div className="sidebar-footer">
    <SecondaryLinks />
    <ProfileRow />
  </div>
</aside>
```

Le composant `NavItem` doit centraliser :

- l’icône ;
- le label ;
- l’état actif ;
- le tooltip réduit ;
- l’accessibilité ;
- la classe responsive.

Éviter de dupliquer les règles visuelles page par page.

---

## 13. Checklist de reproduction

- [ ] Sidebar noire indépendante du fond principal.
- [ ] Largeur ouverte stable autour de `248px`.
- [ ] Largeur réduite stable autour de `64px`.
- [ ] Logo placé en haut à gauche.
- [ ] Bouton collapse aligné en haut à droite.
- [ ] Navigation principale alignée sur une grille verticale régulière.
- [ ] Item actif en capsule sombre, pas en ligne pleine largeur.
- [ ] Icônes outline au repos, fill actif.
- [ ] Un seul rayon de contrôle cohérent : `14px`.
- [ ] Footer poussé en bas par flex.
- [ ] Docs, balance et profil visuellement séparés de la navigation principale.
- [ ] Sidebar mobile en drawer sous une barre de `58px`.
- [ ] Focus clavier visible.
- [ ] Labels accessibles même lorsque visuellement masqués.
- [ ] Aucun hover nécessaire pour comprendre ou utiliser le produit.
- [ ] Motion réduite correctement prise en charge.
- [ ] Aucun séparateur opaque ou effet décoratif superflu.
