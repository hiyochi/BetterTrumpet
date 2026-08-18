---
name: BetterTrumpet Page
description: A compact, technical showcase for the BetterTrumpet Windows volume mixer.
colors:
  background-dark: "oklch(0.125 0.008 292)"
  surface-dark: "oklch(0.158 0.009 292)"
  surface-strong-dark: "oklch(0.195 0.012 292)"
  popover-dark: "oklch(0.17 0.012 292)"
  foreground-dark: "oklch(0.92 0.01 292)"
  muted-dark: "oklch(0.67 0.014 292)"
  quiet-dark: "oklch(0.61 0.012 292)"
  border-dark: "oklch(0.29 0.012 292)"
  border-soft-dark: "oklch(0.225 0.01 292)"
  accent-dark: "oklch(0.68 0.135 295)"
  accent-strong-dark: "oklch(0.77 0.11 295)"
  accent-foreground-dark: "oklch(0.14 0.01 292)"
  success-dark: "oklch(0.72 0.13 151)"
  star-dark: "oklch(0.88 0.17 92)"
  star-mauve-dark: "oklch(0.64 0.18 315)"
  background-light: "oklch(0.97 0.007 280)"
  surface-light: "oklch(0.94 0.009 280)"
  surface-strong-light: "oklch(0.9 0.013 280)"
  popover-light: "oklch(0.985 0.005 280)"
  foreground-light: "oklch(0.23 0.035 275)"
  muted-light: "oklch(0.46 0.025 275)"
  quiet-light: "oklch(0.44 0.02 275)"
  border-light: "oklch(0.77 0.018 280)"
  border-soft-light: "oklch(0.86 0.013 280)"
  accent-light: "oklch(0.53 0.18 292)"
  accent-strong-light: "oklch(0.46 0.19 292)"
  accent-foreground-light: "oklch(0.98 0.005 280)"
  success-light: "oklch(0.46 0.13 151)"
  star-light: "oklch(0.73 0.17 82)"
  star-mauve-light: "oklch(0.5 0.17 315)"
typography:
  display-home:
    fontFamily: "Departure Mono, JetBrains Mono, ui-monospace, monospace"
    fontSize: "clamp(3.15rem, 4.5vw, 4.35rem)"
    fontWeight: 400
    lineHeight: 1.04
    letterSpacing: "-0.025em"
  display-editorial:
    fontFamily: "Departure Mono, JetBrains Mono, ui-monospace, monospace"
    fontSize: "clamp(3.1rem, 6.4vw, 5.8rem)"
    fontWeight: 400
    lineHeight: 0.98
    letterSpacing: "-0.045em"
  headline:
    fontFamily: "Segoe UI Variable Display, Segoe UI Variable, Segoe UI, sans-serif"
    fontSize: "clamp(1.45rem, 2.7vw, 2.15rem)"
    fontWeight: 600
    lineHeight: 1.18
    letterSpacing: "-0.032em"
  body:
    fontFamily: "Segoe UI Variable Display, Segoe UI Variable, Segoe UI, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.55
  body-editorial:
    fontFamily: "Segoe UI Variable Display, Segoe UI Variable, Segoe UI, sans-serif"
    fontSize: "0.86rem"
    fontWeight: 400
    lineHeight: 1.78
  control:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.64rem"
    fontWeight: 500
    lineHeight: 1.5
  label:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.55rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.075em"
rounded:
  pixel: "1px"
  tag: "3px"
  control: "4px"
  compact-panel: "6px"
  dialog: "7px"
  mixer: "8px"
  stage: "12px"
  pill: "999px"
spacing:
  xxs: "2px"
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
  3xl: "48px"
  4xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.foreground-dark}"
    textColor: "{colors.background-dark}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "0 15px"
    height: "49px"
  button-secondary:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.foreground-dark}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "49px"
  icon-button:
    backgroundColor: "transparent"
    textColor: "{colors.muted-dark}"
    rounded: "{rounded.control}"
    size: "34px"
  field:
    backgroundColor: "{colors.background-dark}"
    textColor: "{colors.foreground-dark}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 11px"
    height: "44px"
  note-panel:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.muted-dark}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "13px 15px"
---

# Design System: BetterTrumpet Page

## Overview

**Creative North Star: "The Quiet Audio Workbench"**

BetterTrumpet's site should feel like a precise desktop utility opened on a developer's workbench: compact, direct, instrument-like, and made by a real person. The product and its measured behavior lead; the site frame stays restrained enough that the interactive Windows mixer remains the most vivid object in the composition.

The visual system is dark-first, monospace-led, and quietly playful. Near-black violet neutrals create a technical atmosphere, while a scarce violet accent marks state, focus, data, and important detail. Light mode is a true tonal counterpart rather than a white repaint. Small handmade notes, the ASCII face, dithered data, and carefully bounded sparkle effects add personality without turning the site into a game or a generic startup page.

The home page operates in **Persuade** mode, but does so through product evidence: concise copy, direct download actions, a fully interactive demo, factual download history, and a compact feature rail. Changelog and resource routes operate in **Read** mode with one editorial feed, clear separators, and a sticky reading index.

**Key Characteristics:**

- Dark-first, technical, and compact rather than cinematic or promotional.
- Departure Mono display type, Segoe UI reading type, and JetBrains Mono controls.
- Restrained violet state color against violet-neutral surfaces.
- Flat editorial bands and separators; elevated depth is reserved for floating UI.
- One real interactive product scene, with dither used only where it carries meaning.
- Short, purposeful motion with immediate first render and full reduced-motion support.

## Colors

The palette is a cool violet-neutral system with high legibility and one deliberately scarce accent. Dark and light values are paired by semantic role in the frontmatter; implementations should continue to expose those roles through the existing CSS custom properties rather than using raw one-off colors.

### Primary

- **Tray Violet** (`accent-dark` / `accent-light`): the controlled accent for active navigation, progress, chart data, focus, icons, and small emphasis.
- **Signal Violet** (`accent-strong-dark` / `accent-strong-light`): the higher-contrast accent for interactive state and short labels. It should not become a broad surface fill.

### Secondary

- **Star Signal** (`star-dark` / `star-light`): a warm yellow reserved for the GitHub star interaction and its proximity response.
- **Mauve Spark** (`star-mauve-dark` / `star-mauve-light`): supports the star effect and isolated sparkle details; it is not a second general-purpose brand color.

### Tertiary

- **Success Green** (`success-dark` / `success-light`): completion, confirmation, and finished quest state only.

### Neutral

- **Workbench Background** (`background-dark` / `background-light`): the page canvas and the reverse color for solid actions.
- **Bench Surface** (`surface-dark` / `surface-light`): quiet control fills, note backgrounds, and subtle hover layers.
- **Raised Bench Surface** (`surface-strong-dark` / `surface-strong-light`): stronger hover state and local segmentation.
- **Popover Surface** (`popover-dark` / `popover-light`): floating menus and dialogs.
- **Primary Ink** (`foreground-dark` / `foreground-light`): headings, primary text, and solid action fills.
- **Muted Ink** (`muted-dark` / `muted-light`): supporting copy and inactive navigation.
- **Quiet Ink** (`quiet-dark` / `quiet-light`): metadata, captions, and tertiary labels only.
- **Structural Border** (`border-dark` / `border-light`): visible control boundaries.
- **Soft Divider** (`border-soft-dark` / `border-soft-light`): feed separators, rails, tables, and unobtrusive grouping.

**The One Violet Voice Rule.** Violet should occupy a small fraction of any page and communicate state, focus, or measured data. Its rarity is part of the identity.

**The Theme Pair Rule.** Every page-level semantic color must map cleanly to both themes. The simulated Windows wallpaper changes with the site theme, but the product mixer remains dark for product contrast.

**The Meaningful Dither Rule.** Use dither for the download chart, the thin topbar atmosphere, and the demo's pixel-aware boundary. Do not spread it across decorative cards or unrelated backgrounds.

## Typography

**Display Font:** Departure Mono, backed by JetBrains Mono and the platform monospace.

**Body Font:** Segoe UI Variable Display, backed by Segoe UI and the platform sans-serif.

**Label/Mono Font:** JetBrains Mono, backed by the platform monospace.

**Character:** Display typography makes the page unmistakably technical and independent, while Segoe keeps longer copy native to the Windows subject matter. JetBrains Mono provides the interface voice for commands, metadata, controls, versions, and navigation.

### Hierarchy

- **Home Display** (400, responsive 3.15rem to 4.35rem, 1.04): the product name only; use the tighter mobile scale already defined in CSS.
- **Editorial Display** (400, responsive up to 5.8rem or 6.6rem on changelog, 0.93-0.98): one route title per resource or changelog page.
- **Section Headline** (600, responsive 1.45rem to 2.15rem, 1.18): major editorial sections and release titles.
- **Body** (400, 0.9375rem, 1.55): default page copy; longer editorial paragraphs expand to roughly 1.7-1.78 line height and stay near 60-74ch.
- **Control** (500, about 0.64rem, 1.5): buttons, navigation, commands, chart controls, and source links.
- **Label** (500, about 0.55rem, 0.075em tracking): short eyebrows, index captions, and metadata. Uppercase is reserved for terse utility labels, never body copy.

**The Three-Voice Rule.** Departure Mono names the experience, Segoe explains it, and JetBrains Mono operates it. Do not swap those roles casually.

**The Compact-Control Rule.** Small monospace is intentional, but interactive text must remain readable and touch targets must grow independently on mobile.

## Layout

The landing shell is centered at a maximum width of 1320px with 24px desktop side gutters and a compact 40px topbar. Its desktop hero is a two-column grid: a 360px-minimum copy column and a 600px-minimum demo column, with a fluid 52-80px gap. The composition collapses to one column at 1080px so the interactive desktop remains sharp and uncompressed.

The home page reads as one continuous surface. Hero, chart, and feature rail are separated by whitespace and one-pixel rules, not wrapper cards. The chart uses a 178px facts column beside the plot. The feature rail uses one intro column plus four equal feature columns, becomes two columns below 1080px, and keeps its grouping through dividers.

Editorial pages use a 1160px shell and a narrow reading architecture: a 148px sticky index beside a feed no wider than 760px, separated by a fluid 48-112px gap. At 820px the index moves into normal flow and the page becomes one column. Lines of body text remain around 60-74ch.

At 720px, page gutters become 15px plus safe-area insets, topbar targets grow to 44px, secondary brand text is hidden, and home actions stack. The hero centers its copy but the editorial feed remains left-aligned. The desktop demo keeps a stable format: 16:10 on wider screens and a tall 4:5.85 stage below 650px so the mixer fits without horizontal overflow.

**The No Layout Swap Rule.** Critical hero composition, the interactive demo, metadata, and chart structure exist on the first render. Do not introduce deferred component swaps, timed skeletons, or page-entry staging.

**The Product Stays Sharp Rule.** The compact demo reveals the rightmost roughly 420px with clipping. Expansion reveals the left side; it does not scale or vertically crop the simulated desktop.

## Elevation & Depth

The page is flat by default. Depth comes first from tonal layering and fine borders, then from shadow only when an element genuinely floats: menus, dialogs, the simulated desktop, the mixer flyout, media popup, and quest overlay. Page sections, feature rows, changelog entries, and FAQ rows do not float.

### Shadow Vocabulary

- **Control hairline** (`0 0 0 1px rgb(255 255 255 / 0.09)` in dark mode): gives compact controls definition without lifting them off the page.
- **Control hover hairline** (`0 0 0 1px rgb(255 255 255 / 0.14)` in dark mode): a small response, not a glow.
- **Menu lift** (`0 16px 36px -20px rgb(0 0 0 / 0.48), 0 5px 14px -10px rgb(0 0 0 / 0.38)`): installation options and similarly small floating surfaces.
- **Dialog lift** (`0 24px 80px rgb(0 0 0 / 0.34)` plus a faint inner border): modal confirmation only.
- **Product stage** (`0 30px 76px rgba(7, 5, 20, 0.4)`): isolates the simulated desktop as the hero's principal visual object.
- **Mixer flyout** (`0 18px 44px rgba(8, 6, 34, 0.36)` plus an inset highlight): Windows-like acrylic depth inside the demo.

**The Flat-by-Default Rule.** If a surface does not overlap content or represent a Windows flyout, prefer a divider and tonal change over a shadow.

**The Acrylic Boundary Rule.** Blur and translucency belong inside product simulation and true overlays. They are not a general page material.

## Shapes

The form language is compact and lightly machined. Standard controls use a 4px radius, small tags use 3px, segmented popovers use 6px, dialogs use 7px, and Windows flyouts use 8px. The simulated desktop and media card may use 12px because they are larger contained objects. Pills are reserved for the version badge, tracks, and genuinely circular controls.

One-pixel borders and square separator marks provide structure. Dithered canvas edges, segmented progress bars, thin meter tracks, and the arcing reading-index dot reinforce the instrument-panel character without becoming ornamental geometry.

**The Small-Radius Rule.** Default to 4px. Larger radii must correspond to a larger contained object or a platform-native flyout, never a generic marketing card.

**The No Card Stack Rule.** Do not put cards inside cards or turn page bands into floating rounded containers.

## Components

### Topbar and Navigation

- Keep the ASCII face as the strongest brand mark in the compact topbar; the wordmark may disappear on mobile while the version badge remains visible.
- Use a thin mauve dither band behind the topbar at low opacity. It is atmosphere, not a hero graphic.
- Navigation uses tiny JetBrains Mono labels, muted by default and promoted to primary ink on hover or active state.
- Icon-only controls use Lucide icons, 34px targets on desktop and 44px targets on mobile, with visible tooltips or accessible labels where meaning is not obvious.

### Buttons

- **Primary download:** a 49px solid foreground-on-background control with 4px outer corners, compact mono type, and an attached square menu trigger. Its animated multicolor edge remains thin and secondary to the label.
- **Secondary actions:** surface-filled or transparent, hairline-defined controls with primary text and restrained state change. They do not become bright violet blocks.
- **Star action:** may use yellow, pink, mauve, dither, and sparks, but only inside its two proximity zones. The button never translates or scales toward the cursor.
- **States:** hover changes tone or border; active may scale to 0.96-0.98; focus-visible uses a 2px violet outline with positive offset.

### Download Menu and Dialog

- The install menu is one flat segmented surface with a small Windows-only metadata segment and Winget, Chocolatey, and Portable options.
- It is absolutely positioned below the actions so opening it never shifts the hero.
- The download support dialog is a true centered overlay, limited to 470px, with a 7px radius, one accent line, direct copy, and two clear actions.

### Interactive Product Demo

- The desktop stage is the signature component: a theme-aware violet or pale blue/lilac Windows wallpaper, a dark acrylic mixer, live meters, taskbar interactions, media popup, and optional quest overlay.
- Initial compact mode clips horizontally to the rightmost approximately 420px while retaining full desktop height. Expansion uses clip-path and transform-friendly motion.
- The walkthrough is a segmented checklist with flat rows and `kbd` hints, not a nested card system. Compact-mode interactions never complete or persist quests.
- Media audio is silent until the pointer enters the actually visible stage. Touch uses long press for the media popup.

### Download Growth Chart

- Treat data as evidence. The chart is present on initial render with bundled history and uses the mauve dither palette for fill, line, and sparkle.
- Period controls form one 4px segmented control. Active state uses a low-opacity violet surface and brighter violet text.
- Labels and values are tabular JetBrains Mono; captions are quiet but remain legible.

### Feature Rail

- Feature highlights are flat columns separated by one-pixel rules. Icons are 16px violet strokes; titles and descriptions remain compact enough for rapid scanning.
- Changelog and FAQ links sit in the intro column and preserve the internal path into the editorial resource pages.

### Editorial Feed, Index, and FAQ

- Changelog and resource routes use one readable feed, generous vertical rhythm, flat separators, and a sticky version or content index.
- The index's 6px violet dot may travel with a short arcing motion. Honor reduced motion in both React and generated static HTML.
- FAQ rows use native `details`, one divider per row, a plus that rotates into a close mark, and answers present in initial HTML.
- Notes and command groups use 4px containers only when their boundary is functional; tables remain flat with horizontal rules and overflow scrolling.

## Do's and Don'ts

### Do:

- **Do** lead with the product name, plain-language value, direct download action, and the live mixer.
- **Do** preserve the dark-first developer-tool character and the complete light-theme counterpart.
- **Do** use flat sections, narrow reading measures, one-pixel dividers, and small radii.
- **Do** reserve violet for state, focus, measured data, and concise emphasis.
- **Do** keep motion short, purposeful, transform-friendly, and disabled or reduced under `prefers-reduced-motion`.
- **Do** keep the product demo interactive, synchronous, sharp, and stable on first render.
- **Do** use actual product assets and official app icons; retain the real BetterTrumpet mark.
- **Do** keep changelog and guide copy editorial, specific, and easy to scan.

### Don't:

- **Don't** turn the site into a generic SaaS landing page with oversized marketing copy, repeated card grids, feature icon walls, or invented claims.
- **Don't** add neon gradient backgrounds, gradient orbs, decorative bokeh, glass cards, or violet-filled surfaces across the page.
- **Don't** replace the interactive demo with a screenshot, video, loading fallback, or scaled preview.
- **Don't** defer the hero, demo, chart, metadata, or history behind lazy loading, idle callbacks, timed skeletons, page fades, or staggered reveals.
- **Don't** use dither as wallpaper everywhere; it must indicate data, brand atmosphere, or the demo boundary.
- **Don't** make the changelog, guides, or FAQ into dashboards or repeated card layouts.
- **Don't** hide media interaction behind hover on touch devices; preserve long press.
- **Don't** let theme switching recolor the product mixer into a light panel; only the simulated desktop wallpaper and site chrome change.
