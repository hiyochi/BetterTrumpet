# Global Design Direction — Sage Glass Control Surfaces (v2)

> Système visuel réutilisable pour créer des interfaces avec la même identité que les nouveaux settings BetterTrumpet, même lorsque le produit et les données changent.
>
> Ce document décrit une **grammaire de design**, pas une copie d'écran. Les libellés et modules métier peuvent changer ; le shell noir, la surface atmosphérique, l'échelle de rayons, la densité et le langage visuel restent cohérents.
>
> Version 2 : remplace la référence précédente (mint/sage type « Gateway »). La direction livrée dans `EarTrumpet/SettingsWeb` est **dark-only**, à accent **violet unique**, avec un **champ dither « Ink »** en fond de surface principale.

Sources de vérité dans le code :

| Fichier | Contenu |
|---|---|
| `EarTrumpet/SettingsWeb/src/App.tsx` | tokens (`ACCENT*`), styles Griffel du shell/sidebar/pages, thème Fluent surchargé |
| `EarTrumpet/SettingsWeb/src/polish.css` | affinages : focus, chrome de fenêtre, keycaps, badges, recherche, scrollbars |
| `EarTrumpet/SettingsWeb/src/styles.css` | base : typo, selection, scrollbars, keyframes, fallbacks globaux |
| `EarTrumpet/SettingsWeb/src/components/DitherField.tsx` | champ dither « Ink » variante 07 (canvas 2D) |
| `EarTrumpet/SettingsWeb/src/components/ElasticSlider(.tsx/.css)` | slider à valeur commit |

---

## 1. Positionnement de la direction

Cette direction convient aux produits qui doivent paraître :

- fiables et calmes ;
- premium sans être luxueux ;
- techniques mais humains ;
- utilisés régulièrement (outils de configuration, consoles, back-offices).

### Design read

> Une application native sombre posée dans un cadre quasi noir, avec deux panneaux flottants — une sidebar silencieuse et une surface atmosphérique indigo animée d'une trame de points — où le contenu vit sur des cartes de verre sombre et où une seule couleur violette signale ce qui est actif ou cliquable.

### Dials recommandés

```text
DESIGN_VARIANCE: 5/10
MOTION_INTENSITY: 3/10
VISUAL_DENSITY: 5/10
```

---

## 2. Principes non négociables

### 2.1 Un cadre noir extérieur, des panneaux flottants

L'app entière vit sur un sol quasi noir. Sidebar et surface principale sont **deux panneaux arrondis flottants** séparés par un fin canal du sol — pas des colonnes collées bord à bord.

```text
shell #050706 (sol, gap 8px, padding 6-8px)
├── sidebar   : panneau noir, rayon 18px
└── main      : panneau atmosphérique indigo, rayon 18px
```

Le canal entre les panneaux laisse voir le sol noir : c'est lui qui donne l'effet « app native flottante ». Ne jamais fusionner sidebar et contenu en une seule masse continue.

### 2.2 Une seule couleur d'accent

```text
accent        : #9b7bea  (violet)
accent fort   : #b196f1  (hover, texte accentué sur fond sombre)
accent faible : rgba(155,123,234,.16)  (fonds sélectionnés)
```

L'accent est réservé à :

- l'action primaire (boutons `primary`, remplissage de slider) ;
- la sélection active d'un contrôle (chip sélectionnée, option checked) ;
- le focus clavier (`outline 2px`) et la sélection de texte ;
- les micro-signaux (point de badge par défaut, marque de résultat actif).

Il n'est **pas** utilisé pour :

- l'état actif de la navigation (capsule **neutre** blanche translucide) ;
- la décoration de fond de page ;
- les titres ou le texte courant.

Une deuxième couleur d'action est interdite. Danger/warning restent sémantiques (rouge discret uniquement au survol destructeur).

### 2.3 Un seul langage de rayon

```css
--radius-control: 14px;   /* boutons, champs, chips, panneaux internes */
--radius-card:   18px;    /* cartes, sidebar, surface principale, dropdown */
--radius-shell:  24px;    /* modales, grandes surfaces */
--radius-pill:   999px;   /* badges, chips de statut, track de slider, scrollbar */
/* chrome micro : 6–10px toléré uniquement pour fenêtre/keycaps */
```

Hiérarchie stricte : petit contrôle < carte < grande surface. Pas de `8px/12px/16px/20px` libres. La perception de qualité vient de la répétition.

### 2.4 Des surfaces calmes (calm surfaces)

L'interface se comporte comme une app native, pas comme un site :

- `user-select: none` global ; seuls `input`, `textarea`, `select` gardent la sélection ;
- **aucun hover** sur les rangées de réglage, listes, headers d'accordéon et cartes de section — pas de brightening, pas de translateX, pas de cursor games (seul `cursor: pointer` sur les headers cliquables) ;
- le hover existe uniquement sur ce qui est réellement un contrôle : boutons, chips de thème, selects, inputs, icônes de fenêtre ;
- pas d'ombres portées agressives : profondeur = highlight interne (`inset 0 1px 0 blanc`) + ombre douce basse.

### 2.5 Un seul niveau de verre

Le glassmorphism est réservé aux **cartes de section** et aux popovers flottants. Jamais sur chaque élément. En dehors du verre : fonds blancs translucides (`rgba(255,255,255,.04)` → `.10`) selon l'élévation.

---

## 3. Palette (dark-only)

| Rôle | Valeur | Usage |
|---|---|---|
| shell (sol) | `#050706` | cadre extérieur, sidebar, drawer mobile |
| surface base | `#11123f` | fond plat de la surface principale |
| atmosphère | `linear-gradient(145deg, #47336f 0%, #3b2d8c 35%, #202064 70%, #11123f 100%)` | fond vivant de la surface principale |
| halo | `radial-gradient(circle at 40% 10%, rgba(190,126,235,.46), transparent 30%)` | respiration haute de l'atmosphère |
| carte verre | `rgba(22,18,32,.68)` + `backdrop-filter: blur(16px)` | sections |
| popover | `#0b0d0c` + ombre `0 18px 44px rgba(5,7,6,.65)` | résultats de recherche |
| texte principal | `#F4F7F5` | titres, valeurs, labels actifs |
| texte secondaire | `rgba(244,247,245,.62)` | descriptions (`.58`–`.82` selon élévation) |
| hairline forte | `rgba(255,255,255,.14)` | bordures de contrôles |
| hairline | `rgba(255,255,255,.10)` | bordures de cartes |
| hairline faible | `rgba(255,255,255,.08)`–`.09` | séparateurs internes de listes |
| accent | `#9b7bea` / `#b196f1` | actions, focus, sélection |
| danger | voile rouge `rgba(150,34,26,.55)` | hover du bouton fermer uniquement |

Élévation par fonds blancs translucides (du plus bas au plus haut) :
`.02` (panneau interne inséré) → `.04` (chip repos) → `.06` (hover discret) → `.08` (contrôle repos) → `.10` (état actif neutre) → `.11` (hover contrôle).

Règle d'adaptation produit : remplacer le trio accent (`#9b7bea`/`#b196f1`/`.16`) par une autre teinte si la marque l'exige, mais conserver la structure indigo/noir et l'unicité de l'accent. Éviter le violet électrique saturé générique ; ici le violet est désaturé et froid, accordé à l'indigo du fond.

---

## 4. Fond atmosphérique : gradient + dither « Ink »

La surface principale n'est jamais un aplat plat ni une illustration. C'est un **dégradé indigo** recouvert d'un **champ de points ordonnés (dither Bayer)** qui dessine une crête organique descendante.

### Composition

```css
background:
  radial-gradient(circle at 40% 10%, rgba(190,126,235,.46), transparent 30%),
  linear-gradient(145deg, #47336f 0%, #3b2d8c 35%, #202064 70%, #11123f 100%);
```

### Champ dither (spécification de référence, variante « Ink » 07)

- rendu **canvas 2D** (pas de WebGL), trame Bayer 4×4 ordonnée, cellule 2 px device, plafond 960×600 cellules ;
- couleur d'encre unique : `rgb(210,202,255)` (périwinkle), opacité globale `.78` ;
- forme : crête horizontale ondulante dont la limite supérieure dérive lentement (`sin(progrès × 9.2 + t) × .028` + respiration lente) ; densité croissante vers le bas, zone haute vide ;
- étoiles : ~largeur/26 points déterministes qui scintillent (`sin((frame + phase) × .16)`), glint en croix quand twinkle > `.9` ;
- couche **bloom** : copie du canvas floutée (`blur(6px) brightness(1.55) saturate(1.45)`, opacité `.52`, `mix-blend-mode: plus-lighter`) ;
- cadence : tick `setTimeout` 140 ms (pas de rAF), peinture incrémentale via ImageData ;
- **pause obligatoire** : mode éco, `prefers-reduced-motion`, et hors-écran (IntersectionObserver, rootMargin 80px).

### Règles

- le champ est `pointer-events: none`, derrière tout le contenu (`z-index: 0`) ;
- contraste toujours inférieur au contenu : il soutient les cartes, il ne concurrence pas ;
- fallback `prefers-reduced-transparency` : dégradé sourd sans halo `linear-gradient(145deg, #3d3750, #2a2540)`.

---

## 5. Shell et navigation

### Grille desktop

```css
display: grid;
grid-template-columns: 248px minmax(0, 1fr);
gap: 8px;
padding: 6px 8px 8px;
transition: grid-template-columns 220ms cubic-bezier(.33,1,.68,1);
```

Réduite : colonne `56px`.

### Sidebar

- fond `#050706`, rayon `18px`, padding `12px 8px` ; aucun trait vertical ;
- header : logo 28px (bouton 40×40, rayon 14px) + wordmark `14px semibold, letter-spacing -.01em` + toggle (36×36) ;
- recherche sous le header (voir §6.9) ;
- nav : rangées `42px`, rayon `14px`, padding horizontal `12px`, icône 20px + label 13px ;
  - repos : texte `rgba(244,247,245,.64)` ;
  - hover : fond `rgba(255,255,255,.06)` ;
  - **actif : capsule neutre** `rgba(255,255,255,.10)` + hairline interne `inset 0 0 0 1px rgba(255,255,255,.04)` + `semibold`. Pas d'accent violet ;
- titres de catégorie : `11px semibold, uppercase, letter-spacing .5px`, couleur `.48` ;
- footer épinglé (`margin-top: auto`) derrière une hairline `.08` : liens secondaires avec chevron externe ;
- fondu bas de liste : dégradé `rgba(5,7,6,0) → #050706` sur 56px ;
- réduite : icônes centrées, labels masqués par opacité (pas de re-layout brutal), tooltips `title`, état actif toujours identifiable.

### Mobile (≤ 680px)

- barre fixe `58px`, fond `rgba(5,7,6,.92)` + `backdrop-filter: blur(16px)` + hairline basse ;
- rail caché ; drawer overlay `248px` (`translateX(-100%) → 0`, 220ms `cubic-bezier(.2,0,0,1)`, ombre `8px 0 24px rgba(0,0,0,.4)`) ;
- backdrop `rgba(5,7,6,.55)` ; fermeture par Escape, clic backdrop, ou navigation.

---

## 6. Système de composants

### 6.1 Cartes de section

```css
border: 1px solid rgba(255,255,255,.10);
border-radius: 18px;
background: rgba(22,18,32,.68);
backdrop-filter: blur(16px);
box-shadow: inset 0 1px 0 rgba(255,255,255,.05),
            0 10px 28px rgba(10,8,15,.22);
margin-bottom: 20px;
```

- header interne : padding `20px 24px 16px` ; titre `h2` taille corps, `semibold` ; description `200`, `.62`, `max-width: 72ch` ;
- **statiques** : aucun hover, aucune transformation ;
- fallback `prefers-reduced-transparency` : fond opaque `#1d1928`, blur retiré.

### 6.2 Rangées de réglage

```css
display: grid; grid-template-columns: minmax(0,1fr) auto;
gap: 28px; align-items: center;
min-height: 64px; padding: 0 22px;
```

- séparées par hairline `.09` (`& + &`) ;
- label `semibold`, description `200` `.62` dessous (`margin-top: 4px`) ;
- contrôle aligné à droite ; en mobile : une colonne, contrôle sous le texte.

### 6.3 Accordéons (listes riches : profils, règles)

- item : hairline `.09`, premier sans trait ; header flex `min-height: 62px`, padding `12px 24px`, `cursor: pointer` uniquement (pas de brightening) ;
- ligne repliée auto-portante : titre `semibold` + chips résumé à droite + chevron (rotation 180°, 200ms) ;
- panneau déplié **inséré** dans la carte : marge `0 8px 8px`, rayon `14px`, fond `rgba(255,255,255,.02)`, hairline `.07` ; les contrôles s'empilent verticalement dedans.

### 6.4 Boutons

| Variante | Aspect | Usage |
|---|---|---|
| primary | accent plein `#9b7bea` (hover `#b196f1`), texte contrasté | **une** action principale par zone (Save, Add, Install, Export diagnostics) |
| secondary | contour hairline, fond translucide léger | actions complémentaires (Browse, Restore all, Check) |
| subtle | transparent, icône seule ou texte discret | actions de rangée, icônes (trash, import/export), chrome |

- rayon `14px` partout ; pressed : `scale(.96)`–`.98` bref (60–80ms) ;
- focus visible : `outline: 2px solid #9b7bea; outline-offset: 2px; box-shadow: 0 0 0 4px rgba(155,123,234,.15)` — un seul cadre, jamais double frame ;
- bouton transient (enregistrement de raccourci) : passe `secondary → primary` pendant l'état actif.

### 6.5 Champs et sélecteurs

- select natif stylé : `min-height: 40px`, rayon `14px`, fond blanc `.08`, hairline `.14`, hover `.11`/`.18`, pressed `scale(.98)` ;
- popup `<option>` forcée dark (`#221d31`), option cochée sur voile accent `.35` ;
- inputs : fond transparent ou blanc `.07`, hairline `.12`, focus-within = bordure accent `.55` + halo `0 0 0 3px rgba(155,123,234,.13)` + icône accentuée ;
- placeholder `.42` ; aide sous le champ si elle évite une erreur.

### 6.6 Slider (référence ElasticSlider)

- track pilule `999px`, fond neutrall `.32`, ombre interne `inset 0 1px 2px rgba(0,0,0,.15)` ;
- remplissage : dégradé `135deg` accent → accent fort, glow violet `0 1px 3px rgba(155,123,234,.3)` (renforcé `.5` en drag) ;
- interaction : curseur `grab/grabbing`, hover `scale(1.02)`, drag `scale(.99)` ;
- valeur : monospace `Cascadia Mono` 13px, `tabular-nums`, alignée à droite ; icônes −/+ 20px qui grossissent au hover ;
- engagement explicite : preview locale pendant le drag, **un seul commit** au relâcher.

### 6.7 Chips, badges, keycaps, valeurs techniques

- chip/badge : pilule `999px`, `11px semibold`, fond blanc `.08`–`.10`, hairline `.10`, padding `2px 9px 3px` ; point d'état possible (5px rond accent) ;
- keycap raccourci : `kbd` monospace `11px/600 uppercase`, fond blanc `.09`, hairline `.16` avec **bas assombri** `rgba(0,0,0,.45)` (relief), rayon `7px` ;
- valeur hex/couleur : même famille mono `11px`, fond `.05`, rayon `7px` ;
- règle : toute donnée technique (chemin, raccourci, hex, nombre) sort de la typo courante et passe en monospace discret.

### 6.8 Chrome de fenêtre

- boutons fantômes 36×28, rayon `10px`, glyphe atténué (`.38`), hover : texte `.85` + fond `.07` ;
- fermer : voile rouge **uniquement au hover** `rgba(150,34,26,.55)` — jamais de bloc système plein ;
- zone de drag dédiée en haut (hors boutons), `user-select: none`.

### 6.9 Recherche globale (sidebar)

- input natif (pas le composant Fluent : ses doubles cadres sont interdits), hauteur 40px, rayon `14px`, même traitement que les champs ;
- dropdown : rayon `18px`, fond `#0b0d0c`, ombre profonde + highlight interne, items rayon `14px` ;
- item actif (clavier) : voile accent `.14` + hairline accent `.28` — ici l'accent est légitime (sélection) ;
- correspondances surlignées en `#b196f1 bold` ; hint clavier en kbd ;
- atteindre un résultat : scroll vers l'ancre + **flash** `outline` accent qui pulse et disparaît (1.8s ease-out) ;
- matching exigeant : ET logique entre tokens, préfixe > substring > fuzzy borné, garde-fous anti-bruit.

### 6.10 Scrollbars

- fines (6px pane principal, 8px global), track transparent, pouce pilule accent translucide `.32`–`.38`, hover `rgb(177,150,241,.55)` ;
- sidebar : scrollbar masquée (nav non scrollable visuellement).

---

## 7. Layout et densité

- largeur de lecture : `820px` max, centrée ;
- padding desktop : `40px 32px 80px` ; mobile : `76px 16px 48px` (76 = barre fixe 58px + air) ;
- header de page : titre `size 700 semibold`, `letter-spacing -.02em`, `line-height 1.15`, puis description `.62` `max-width: 62ch` ; marge basse `28px` ; **pas de glyph décoratif** ;
- sections empilées, marge `20px` ; gap interne standard `8–12px` ;
- hiérarchie : header de page → blocs de section → états (vide/erreur) ; une action primaire par zone, secondaires groupées à droite (`rowActions`).

---

## 8. Motion

Fonctionnelle, jamais spectaculaire. Deux courbes seulement :

```css
--ease-standard: cubic-bezier(.2, 0, 0, 1);     /* contrôles, états */
--ease-decel:    cubic-bezier(.33, 1, .68, 1);  /* sidebar, chrome, chevrons */
--duration-fast: 120–160ms;   /* hovers, couleurs */
--duration-ui:   180–240ms;   /* ouvertures, transformations */
```

Autorisé : morphing de sidebar (grid-template-columns), expansion d'accordéon, rotation de chevron, apparition de page (opacity + translateY 8–10px), shimmer skeleton, pulse du logo de splash (scale 1 → 1.07, 1.5s), flash de recherche, press-scale bref.

Interdit : hover sur rangées/cartes statiques, parallax, gradients animés, transitions `all`, scroll hijacking, animations perpétuelles hors skeleton/splash.

Fallback obligatoire :

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;
    transition-duration: .01ms !important;
    animation-iteration-count: 1 !important;
  }
}
```

---

## 9. Accessibilité

- contraste AA sur tous les textes courants (le texte `.48` est réservé aux micro-labels) ;
- focus visible systématique : `outline 2px accent` (+ halo 4px `.15`), `offset` adapté (2px dehors, −2px pour rangées pleines) ; **un seul cadre** — ne jamais cumuler outline natif + underline composant ;
- zones de clic ≥ 38px ; navigation clavier complète (flèches + Enter/Escape dans la recherche, `aria-expanded`, `aria-current="page"`, `aria-modal`) ;
- état jamais porté par la couleur seule (check mark + point + texte) ;
- fallbacks `prefers-reduced-transparency` : verre → opaque (`#1d1928`, `#12140f`), halo retiré, blur coupé ;
- l'encre du dither est décorative : conteneur `aria-hidden`.

---

## 10. États obligatoires

- **Chargement** : skeleton qui reprend exactement la géométrie finale (sidebar + blocs `rgba(255,255,255,.06)` rayon 18px, shimmer 1.6s) ; côté hôte natif, splash de marque sur `#050706` (logo pulsant + barre indéterminée) pendant le cold start, fondu à la réception du signal « rendered » ;
- **Vide** : message court `.58` + action de démarrage ; la barre de création peut servir d'empty state ;
- **Erreur** : contextualisée, réessayable si pertinent ;
- **Succès** : toast/bannière discrète (rayon 16px toléré ici) ou changement d'état local ;
- **Désactivé** : opacité réduite mais cause compréhensible ;
- **Destructif** : confirmation ; icône poubelle `subtle`, jamais de bouton rouge permanent.

---

## 11. Typographie

- pile unique : `"Segoe UI Variable Display", "Segoe UI Variable", "Segoe UI", sans-serif` ; `font-synthesis: none`, `-webkit-font-smoothing: antialiased`, `letter-spacing: 0` global ;
- échelle : titre de page 700/semibold ; titres de section = corps/semibold ; descriptions 200 ; labels de nav 13px ; micro-labels 11px/600 ;
- monospace (`ui-monospace, "Cascadia Mono", "Consolas"`) : keycaps, hex, valeurs de slider (`tabular-nums`), identifiants ;
- ton : calme · précis · direct · professionnel · jamais dramatique ; pas de jargon marketing dans les paramètres.

---

## 12. Notes d'implémentation (réutilisation)

- **CSS** : livré via imports TS (`import "./polish.css"` dans le composant racine) pour être bundlé et hashé par Vite. Ne jamais poser de CSS dans `public/` ni éditer le HTML généré pour un `<link>` manuel.
- **Griffel** : `borderColor` seul ne compile pas — écrire la propriété `border` complète. Préférer des classes d'affinage en CSS statique (`*-polished`) plutôt que multiplier les styles Griffel.
- **Thème Fluent** : surcharger les tokens (`colorBrandBackground*`, `colorCompoundBrandStroke*`, `colorStrokeFocus2` → accent ; foregrounds → `#F4F7F5` à `.82/.58` ; strokes → blanc `.14/.10/.08`; backgrounds neutres → translucides) pour que tous les composants Fluent héritent de la DA sans style ad hoc.
- **Translucence native** : l'acrylique DWM est activée côté hôte (tinte `~0xC8` sur la couleur du shell) derrière une fenêtre **non** `AllowsTransparency` ; le web reste maître de son propre fond opaque. Ne jamais combiner WebView2 HWND standard avec `AllowsTransparency=True`.
- **Surfaces calmes** : si un hover semble manquer sur une rangée, c'est voulu. Seuls les vrais contrôles réagissent.
- **Un accent** : avant d'ajouter du violet quelque part, vérifier qu'il ne s'agit pas plutôt d'un cas de capsule neutre (navigation) ou de simple élévation blanche.

---

## 13. Checklist d'implémentation

- [ ] Sol noir + deux panneaux flottants rayon 18px (canal visible entre eux).
- [ ] Rayons : uniquement 14 / 18 / 24 (+999 pilules, micro-chrome ≤ 10).
- [ ] Une seule couleur d'accent ; nav active en capsule neutre.
- [ ] Fond atmosphérique = gradient + dither (canvas 2D), pausé en éco/reduced-motion/offscreen.
- [ ] Cartes de section en verre unique, statiques, hairlines `.10`/`.09`.
- [ ] Rangées de réglage 64px, grille 1fr/auto, sans hover.
- [ ] Focus visible uniforme (outline 2px accent + halo), une seule frame.
- [ ] Données techniques en monospace (keycaps, hex, valeurs).
- [ ] Fallbacks `prefers-reduced-motion` et `prefers-reduced-transparency`.
- [ ] Skeleton + splash de marque + états vide/erreur/présents.
- [ ] Responsive ≤ 680px : barre 58px, drawer 248px, contenu edge-to-edge.
- [ ] Scrollbars fines pilules accent translucide.
- [ ] Aucune démo factice qui se prend pour une donnée réelle.

---

## 14. Adapter à un autre produit

1. Conserver le sol noir et les panneaux flottants.
2. Conserver l'échelle de rayons et la discipline de hairlines.
3. Conserver l'atmosphère gradient + dither ; changer la teinte du dégradé et l'encre du champ si la marque l'exige (garder encre claire sur fond profond, bloom plus-lighter).
4. Choisir UN accent (désaturé, froid de préférence) et le réserver aux actions/focus/sélection.
5. Reprendre le composant slider, la recherche à flash, les keycaps tels quels.
6. Remplacer pages et modules métier ; ne pas copier les libellés BetterTrumpet.
7. Conserver calm surfaces, états complets, fallbacks accessibilité.
8. Ne pas généraliser le glassmorphism au-delà des cartes et popovers.

La DA est réussie lorsque l'on reconnaît la famille visuelle — pas lorsque chaque écran est une copie du précédent.
