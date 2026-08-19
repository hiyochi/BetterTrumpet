import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Button,
  FluentProvider,
  Input,
  MessageBar,
  MessageBarBody,
  Spinner,
  Text,
  makeStyles,
  mergeClasses,
  tokens,
  webDarkTheme,
  webLightTheme,
} from "@fluentui/react-components";
import {
  AArrowDownIcon,
  ActivityIcon,
  ArrowUpRightIcon,
  BlendIcon,
  GithubIcon,
  InfoIcon,
  KeyboardIcon,
  ListChecksIcon,
  MenuIcon,
  MouseIcon,
  MusicIcon,
  IndentIncreaseIcon,
  RefreshCwIcon,
  SaveIcon,
  SearchIcon,
  SettingsIcon,
  ShieldCheckIcon,
} from "@animateicons/react/lucide";
import { Dismiss16Regular } from "@fluentui/react-icons/svg/dismiss";
import { Subtract16Regular } from "@fluentui/react-icons/svg/subtract";
import appIcon from "../../Assets/icon.png";
import { DitherField } from "./components/DitherField";
import { SettingsPage } from "./SettingsPages";
import type { HostMessage, SettingKey, SettingsPageDescriptor, SettingsPayload, SettingValue } from "./types";
import "./polish.css";

// ── Design tokens: Sage Glass Control Surfaces ──────────────────────────────
// One accent (violet), one radius scale (14 / 18 / 24), native Windows
// translucency through DWM acrylic behind the window.
const ACCENT = "#9b7bea";
const ACCENT_STRONG = "#b196f1";
const ACCENT_DIM = "rgba(155, 123, 234, 0.16)";

const useStyles = makeStyles({
  // Outer shell: near-black frame around the whole window, as a native app.
  provider: {
    position: "relative", isolation: "isolate", height: "100%", overflow: "hidden",
    backgroundColor: "#050706", color: "#F4F7F5",
  },

  // ── Shell frame: floating sidebar + content surface on a near-black floor ──
  shell: {
    position: "relative", zIndex: 1, display: "grid",
    gridTemplateColumns: "248px minmax(0, 1fr)",
    gap: "8px", padding: "6px 8px 8px",
    height: "100%", minWidth: 0,
    transitionProperty: "grid-template-columns", transitionDuration: "220ms",
    transitionTimingFunction: "cubic-bezier(.33,1,.68,1)",
    "@media (max-width: 680px)": { display: "block" },
  },
  shellCollapsed: {
    gridTemplateColumns: "56px minmax(0, 1fr)",
  },

  // ── Sidebar: quiet near-black rail, reads as a native app panel ──
  sidebar: {
    display: "flex", minHeight: 0, flexDirection: "column",
    padding: "12px 8px", backgroundColor: "#050706", borderRadius: "18px",
    "@media (max-width: 680px)": { display: "none" },
  },
  sidebarCollapsed: { overflow: "hidden", minWidth: 0, padding: "12px 8px" },
  sidebarHeader: { display: "flex", alignItems: "center", gap: "10px", minHeight: "40px", padding: "0 4px 12px", marginBottom: "8px", flexShrink: 0 },
  sidebarHeaderCollapsed: { padding: "0 0 12px" },
  wordmark: { display: "block", overflow: "hidden", whiteSpace: "nowrap", fontSize: "14px", fontWeight: tokens.fontWeightSemibold, letterSpacing: "-0.01em", lineHeight: "1.2", color: "#F4F7F5" },
  navLabel: { display: "inline-block", overflow: "hidden", whiteSpace: "nowrap", verticalAlign: "middle" },
  navLabelCollapsed: { opacity: 0, pointerEvents: "none" },
  logo: { width: "28px", height: "28px", objectFit: "contain", flexShrink: 0, filter: "drop-shadow(0 1px 5px rgba(0,0,0,.45))", transitionProperty: "filter, transform", transitionDuration: "240ms", pointerEvents: "none" },
  logoButton: {
    display: "grid", placeItems: "center", flexShrink: 0, width: "40px", height: "40px", padding: 0,
    border: "none", backgroundColor: "transparent", cursor: "pointer", borderRadius: "14px",
    transitionProperty: "background-color", transitionDuration: "160ms",
    ":hover": { backgroundColor: "rgba(255,255,255,.06)" },
    ":focus-visible": { outline: `2px solid ${ACCENT}`, outlineOffset: "2px" },
  },
  sidebarToggle: {
    marginLeft: "auto", flexShrink: 0, minWidth: "36px", width: "36px", height: "36px", padding: 0,
    color: "rgba(244,247,245,.6)", borderRadius: "14px", zIndex: 21,
    transitionProperty: "color, background-color, transform", transitionDuration: "180ms",
  },
  search: { marginBottom: 0, flexShrink: 0 },
  searchHidden: { visibility: "hidden", height: 0, marginBottom: 0, pointerEvents: "none" },
  navWrap: { position: "relative", flex: "1 1 auto", minHeight: 0, display: "flex", flexDirection: "column" },
  nav: {
    flex: "1 1 auto", minHeight: 0, overflowY: "auto", overscrollBehavior: "contain",
    scrollbarWidth: "none", msOverflowStyle: "none",
    "::-webkit-scrollbar": { display: "none", width: 0, height: 0 },
  },
  navFade: {
    position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 1, height: "56px", pointerEvents: "none",
    backgroundImage: "linear-gradient(180deg, rgba(5,7,6,0) 0%, #050706 88%)",
  },
  category: { marginBottom: "16px" },
  categoryTitle: { display: "block", padding: "0 12px 8px", color: "rgba(244,247,245,.48)", fontSize: "11px", fontWeight: tokens.fontWeightSemibold, whiteSpace: "nowrap", overflow: "hidden", transitionProperty: "opacity", transitionDuration: "180ms" },
  categoryTitleCollapsed: { opacity: 0, height: 0, padding: 0, margin: 0, overflow: "hidden" },
  navButton: {
    position: "relative", width: "100%", height: "42px", justifyContent: "flex-start", marginBottom: "4px",
    paddingLeft: "12px", paddingRight: "12px", overflow: "hidden", whiteSpace: "nowrap",
    borderRadius: "14px", fontWeight: tokens.fontWeightRegular,
    color: "rgba(244,247,245,.64)",
    transitionProperty: "background-color, color, transform", transitionDuration: "160ms",
  },
  navButtonCollapsed: {
    width: "100%", height: "40px",
    padding: 0, paddingLeft: "10px", paddingRight: 0, paddingInline: 0,
    minWidth: 0,
    overflow: "hidden",
    alignItems: "center",
    "& .fui-Button__icon": { margin: 0 },
  },
  navIcon: { display: "inline-grid", flex: "0 0 20px", width: "20px", height: "20px", placeItems: "center", marginRight: "13px", color: "inherit", overflow: "hidden", transitionProperty: "margin, transform", transitionDuration: "200ms", "& > svg": { display: "block" } },
  navIconCollapsed: { marginRight: 0 },
  navButtonSelected: { backgroundColor: "rgba(255,255,255,.10)", color: "#fff", fontWeight: tokens.fontWeightSemibold, boxShadow: "inset 0 0 0 1px rgba(255,255,255,.04)" },
  sidebarFooter: { flexShrink: 0, borderTop: "1px solid rgba(255,255,255,.08)", paddingTop: "10px", marginTop: "10px" },
  classicButton: { justifyContent: "flex-start", borderRadius: "14px", color: "rgba(244,247,245,.64)", transitionProperty: "color, background-color, transform", transitionDuration: "160ms" },
  externalMark: { marginLeft: "auto", display: "inline-flex", alignItems: "center", color: "rgba(244,247,245,.4)" },

  // ── Main: atmospheric sage surface ──
  main: { position: "relative", display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0, overflow: "hidden", contain: "layout paint", borderRadius: "18px", backgroundColor: "#11123f" },
  mainScroll: { position: "relative", zIndex: 1, flex: "1 1 auto", minHeight: 0, overflowY: "auto", overscrollBehavior: "contain", scrollBehavior: "smooth" },
  // Soft scrims at the top and bottom edges of the scrollable main pane.
  // A plain gradient only (no backdrop-filter): re-blurring every scroll frame
  // in Chromium is expensive and makes the wheel feel heavy.
  mainFade: {
    position: "absolute", left: 0, right: 0, zIndex: 2, height: "56px",
    pointerEvents: "none",
    opacity: 0, transitionProperty: "opacity", transitionDuration: "240ms",
  },
  mainFadeTop: {
    top: 0,
    backgroundImage: "linear-gradient(180deg, rgba(17,18,63,0.42) 0%, rgba(17,18,63,0) 100%)",
  },
  mainFadeBottom: {
    bottom: 0,
    backgroundImage: "linear-gradient(0deg, rgba(17,18,63,0.42) 0%, rgba(17,18,63,0) 100%)",
  },
  mainFadeVisible: { opacity: 1 },
  // Ink dither stage (lab variant 07). Gradient base + canvas field.
  atmosphere: {
    position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden",
    backgroundImage: [
      "radial-gradient(circle at 40% 10%, rgba(190, 126, 235, 0.46), transparent 30%)",
      "linear-gradient(145deg, #47336f 0%, #3b2d8c 35%, #202064 70%, #11123f 100%)",
    ].join(", "),
    "@media (prefers-reduced-transparency: reduce)": { backgroundImage: "linear-gradient(145deg, #3d3750, #2a2540)" },
  },

  content: { position: "relative", zIndex: 1, width: "100%", maxWidth: "820px", boxSizing: "border-box", margin: "0 auto", padding: "40px 32px 80px", "@media (max-width: 680px)": { padding: "76px 16px 48px" } },

  // ── Page header: title + subtitle only. No decorative page glyph. ──
  pageHeader: { marginBottom: "28px" },
  pageIcon: { display: "none" },
  pageTitle: { display: "block", marginBottom: "6px", letterSpacing: "-0.02em", lineHeight: "1.15" },
  pageSubtitle: { display: "block", maxWidth: "62ch", color: "rgba(244,247,245,.62)", lineHeight: "1.5" },

  // ── Cards / sections ──
  section: {
    marginBottom: "20px", overflow: "hidden",
    border: "1px solid rgba(255,255,255,.10)", borderRadius: "18px",
    backgroundColor: "rgba(22, 18, 32, 0.68)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,.05), 0 10px 28px rgba(10, 8, 15, 0.22)",
    transitionProperty: "transform, box-shadow, border-color", transitionDuration: "240ms",
    "@media (prefers-reduced-transparency: reduce)": { backgroundColor: "#1d1928" },
  },
  sectionHeader: { padding: "20px 24px 16px" },
  sectionTitle: { display: "block", lineHeight: "1.3" },
  sectionDescription: { display: "block", marginTop: "5px", color: "rgba(244,247,245,.62)", maxWidth: "72ch", lineHeight: "1.5" },

  // ── Setting rows ──
  settingList: { borderTop: "1px solid rgba(255,255,255,.10)" },
  settingRow: {
    display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: "28px", alignItems: "center",
    minHeight: "64px", padding: "0 22px",
    transitionProperty: "background-color, transform", transitionDuration: "200ms",
    "& + &": { borderTop: "1px solid rgba(255,255,255,.09)" },
    "@media (max-width: 680px)": { gridTemplateColumns: "minmax(0, 1fr)", gap: "12px", padding: "16px 20px" },
  },
  settingCopy: { minWidth: 0, padding: "14px 0", "@media (max-width: 680px)": { padding: 0 } },
  settingDescription: { display: "block", marginTop: "4px", color: "rgba(244,247,245,.62)", maxWidth: "72ch", lineHeight: "1.5" },
  controlRow: { display: "flex", alignItems: "center", gap: "12px", padding: "16px 24px", minHeight: "62px", transitionProperty: "background-color", transitionDuration: "200ms" },
  controlGrow: { flex: 1, minWidth: 0 },
  range: { width: "260px", maxWidth: "100%" },
  select: { minWidth: "200px", minHeight: "40px", padding: "0 12px", color: "#F4F7F5", backgroundColor: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.14)", borderRadius: "14px", colorScheme: "dark", transitionProperty: "background-color, border-color, transform", transitionDuration: "180ms" },
  actionRow: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px", padding: "16px 24px", transitionProperty: "background-color", transitionDuration: "200ms", "& + &": { borderTop: "1px solid rgba(255,255,255,.09)" } },
  rowActions: { display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "flex-end", gap: "10px" },
  inlineRange: { width: "240px", maxWidth: "100%" },
  list: { display: "grid", gap: 0, padding: 0 },
  listRow: { display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: "16px", alignItems: "center", padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,.09)", transitionProperty: "background-color, transform", transitionDuration: "200ms", "@media (max-width: 680px)": { gridTemplateColumns: "minmax(0, 1fr)", alignItems: "start" } },
  listMeta: { display: "block", marginTop: "3px", color: "rgba(244,247,245,.60)" },
  empty: { padding: "20px 24px", color: "rgba(244,247,245,.58)" },

  // ── Theme presets ──
  themeGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "12px", padding: "16px 20px" },
  themeItem: { position: "relative", minWidth: 0 },
  themeButton: { display: "grid", width: "100%", gap: "10px", justifyItems: "start", padding: "14px 44px 14px 14px", minHeight: "84px", border: "1px solid rgba(255,255,255,.12)", borderRadius: "18px", color: "#F4F7F5", backgroundColor: "rgba(255,255,255,.05)", transitionProperty: "background-color, border-color, transform", transitionDuration: "200ms" },
  themeSelected: { border: `2px solid ${ACCENT}`, backgroundColor: ACCENT_DIM },
  themeDelete: { position: "absolute", top: "10px", right: "10px", minWidth: "30px", width: "30px", height: "30px", padding: 0, borderRadius: "14px", transitionProperty: "transform, background-color", transitionDuration: "180ms" },
  swatches: { display: "flex", gap: "5px" },
  swatch: { width: "26px", height: "11px", borderRadius: "999px", border: "1px solid rgba(0,0,0,.15)", boxShadow: "inset 0 1px 2px rgba(0,0,0,.1)" },
  colorInput: { width: "42px", height: "34px", padding: "3px", border: "1px solid rgba(255,255,255,.14)", borderRadius: "14px", backgroundColor: "rgba(255,255,255,.06)", transitionProperty: "transform, border-color", transitionDuration: "180ms" },

  // ── Window chrome ──
  windowControls: { position: "fixed", top: "8px", right: "10px", zIndex: 30, display: "flex", alignItems: "center", gap: "4px" },
  dragRegion: { position: "fixed", top: 0, right: "104px", left: "264px", zIndex: 19, height: "44px", touchAction: "none", userSelect: "none", "@media (max-width: 680px)": { left: 0 } },
  dragRegionCollapsed: { left: "80px" },
  windowButton: {
    width: "44px", height: "32px", minWidth: "44px", minHeight: "32px", padding: 0,
    borderRadius: "6px",
    color: "rgba(244,247,245,.55)", backgroundColor: "transparent", border: "none",
    transitionProperty: "color, background-color", transitionDuration: "160ms",
  },
  closeButton: {},
  windowIcon: { display: "grid", placeItems: "center", width: "20px", height: "20px" },

  // ── Mobile ──
  mobileHeader: { display: "none", "@media (max-width: 680px)": { display: "flex", position: "fixed", inset: "0 0 auto 0", zIndex: 10, alignItems: "center", gap: "12px", height: "58px", padding: "0 96px 0 18px", backgroundColor: "rgba(5, 7, 6, 0.92)", borderBottom: "1px solid rgba(255,255,255,.08)" } },
  mobileMenuButton: { marginLeft: "auto", flexShrink: 0, minWidth: "36px", width: "36px", height: "36px", padding: 0, color: "rgba(244,247,245,.7)", borderRadius: "14px", transitionProperty: "color, background-color, transform", transitionDuration: "160ms" },
  drawerBackdrop: { position: "fixed", inset: "58px 0 0 0", zIndex: 14, display: "none", backgroundColor: "rgba(5, 7, 6, 0.55)", opacity: 0, pointerEvents: "none", transitionProperty: "opacity", transitionDuration: "200ms", "@media (max-width: 680px)": { display: "block" } },
  drawerBackdropOpen: { opacity: 1, pointerEvents: "auto" },
  mobileDrawer: { position: "fixed", top: "58px", left: 0, bottom: 0, width: "248px", zIndex: 15, display: "none", flexDirection: "column", padding: "12px 8px", backgroundColor: "#050706", transform: "translateX(-100%)", transitionProperty: "transform", transitionDuration: "220ms", transitionTimingFunction: "cubic-bezier(.2,0,0,1)", boxShadow: "8px 0 24px rgba(0,0,0,.4)", "@media (max-width: 680px)": { display: "flex" } },
  mobileDrawerOpen: { transform: "translateX(0)" },
  message: { marginBottom: "20px", borderRadius: "16px", border: "1px solid rgba(255,255,255,.12)", boxShadow: "0 8px 20px rgba(10, 8, 15, 0.25)" },
  searchEmpty: { display: "grid", minHeight: "320px", placeItems: "center", color: "rgba(244,247,245,.58)" },

  // ── Loading skeleton (replaces the WPF progress bar) ──
  skeletonShell: { display: "grid", gridTemplateColumns: "248px minmax(0, 1fr)", gap: "8px", padding: "6px 8px 8px", height: "100%", "@media (max-width: 680px)": { display: "block" } },
  skeletonSidebar: { backgroundColor: "#050706", borderRadius: "18px", padding: "12px 8px", display: "flex", flexDirection: "column", gap: "10px", "@media (max-width: 680px)": { display: "none" } },
  skeletonMain: { position: "relative", overflow: "hidden", padding: "48px 0", borderRadius: "18px" },
  skeletonBlock: { backgroundColor: "rgba(255,255,255,.06)", borderRadius: "18px", position: "relative", overflow: "hidden" },
  skeletonShimmer: {
    position: "absolute", inset: 0,
    backgroundImage: "linear-gradient(90deg, transparent, rgba(255,255,255,.07), transparent)",
    backgroundRepeat: "no-repeat", backgroundSize: "50% 100%",
    animationName: "sage-shimmer", animationDuration: "1.6s", animationTimingFunction: "ease-in-out", animationIterationCount: "infinite",
    "@media (prefers-reduced-motion: reduce)": { animation: "none" },
  },
});

const sageGlassDarkTheme = {
  ...webDarkTheme,
  colorNeutralForeground1: "#F4F7F5",
  colorNeutralForeground2: "rgba(244,247,245,.82)",
  colorNeutralForeground3: "rgba(244,247,245,.58)",
  colorNeutralStroke1: "rgba(255,255,255,.14)",
  colorNeutralStroke2: "rgba(255,255,255,.10)",
  colorNeutralStroke3: "rgba(255,255,255,.08)",
  colorBrandBackground: ACCENT,
  colorBrandBackgroundHover: ACCENT_STRONG,
  colorBrandBackgroundPressed: ACCENT,
  colorBrandForeground1: ACCENT_STRONG,
  colorBrandForeground2: ACCENT_STRONG,
  colorBrandStroke1: ACCENT,
  colorBrandStroke2: ACCENT_STRONG,
  colorCompoundBrandBackground: ACCENT,
  colorCompoundBrandBackgroundHover: ACCENT_STRONG,
  colorCompoundBrandBackgroundPressed: ACCENT,
  colorCompoundBrandStroke: ACCENT,
  colorCompoundBrandStrokeHover: ACCENT_STRONG,
  colorCompoundBrandStrokePressed: ACCENT,
  colorStrokeFocus2: ACCENT,
  colorSubtleBackgroundHover: "rgba(255,255,255,.06)",
  colorSubtleBackgroundPressed: "rgba(255,255,255,.03)",
  colorNeutralBackground1: "transparent",
  colorNeutralBackground2: "transparent",
  colorNeutralBackground3: "rgba(255,255,255,.06)",
  colorNeutralBackground4: "rgba(255,255,255,.04)",
  colorNeutralBackground5: "rgba(255,255,255,.08)",
  colorNeutralBackground6: "rgba(255,255,255,.10)",
};

const fallbackPayload: SettingsPayload = {
  appName: "BetterTrumpet", locale: "fr-FR", categories: [{ title: "Essentiel", pages: [
    { id: "general", title: "Général", subtitle: "Démarrage et icône de notification.", migrated: true },
    { id: "mouse", title: "Volume et souris", subtitle: "Molette et échelle du volume.", migrated: true },
    { id: "shortcuts", title: "Raccourcis", subtitle: "Raccourcis clavier.", migrated: true },
  ] }],
  labels: {}, values: {} as SettingsPayload["values"],
  collections: { hiddenApps: [], hiddenDevices: [], hotkeys: [], deviceHotkeys: [], profiles: [], selectedProfileIndex: -1, appRules: [], folderRules: [], themes: [], activeThemeName: "" },
  status: { version: "", health: "", updateText: "", updateDetail: "", updateAvailable: false, updateBusy: false, effectivePeakMeterFps: 60, ecoModeActive: false, monkeyUnlocked: false },
};

function pageIcon(pageId: string, className: string) {
  const props = { size: 18 };
  let icon;
  switch (pageId) {
    case "mouse": icon = <MouseIcon {...props} />; break;
    case "shortcuts": icon = <KeyboardIcon {...props} />; break;
    case "profiles": icon = <SaveIcon {...props} />; break;
    case "app-rules": icon = <ListChecksIcon {...props} />; break;
    case "appearance": icon = <BlendIcon {...props} />; break;
    case "media": icon = <MusicIcon {...props} />; break;
    case "performance": icon = <ActivityIcon {...props} />; break;
    case "updates": icon = <RefreshCwIcon {...props} />; break;
    case "privacy": icon = <ShieldCheckIcon {...props} />; break;
    case "about": icon = <InfoIcon {...props} />; break;
    default: icon = <SettingsIcon {...props} />;
  }
  return <span className={className}>{icon}</span>;
}

function groupPages(payload: SettingsPayload) {
  const pages = payload.categories.flatMap(category => category.pages);
  const byId = new Map(pages.map(page => [page.id, page]));
  const groups = [
    [payload.labels.essentials || "Essentials", ["general", "mouse", "shortcuts"]],
    [payload.labels.audio || "Audio", ["profiles", "app-rules", "media"]],
    [payload.labels.experience || "Experience", ["appearance", "performance"]],
    [payload.labels.application || "Application", ["updates", "privacy", "about"]],
  ] as const;
  return groups.map(([title, ids]) => ({ title, pages: ids.map(id => byId.get(id)).filter((page): page is SettingsPageDescriptor => Boolean(page)) })).filter(group => group.pages.length);
}

const pageLabelKeys: Record<string, string[]> = {
  general: ["startupTitle", "startupDescription", "runAtStartup", "trayTitle", "trayDescription", "useLegacyIcon", "showAppTooltips", "showAppTooltipsDescription", "hiddenApps", "hiddenAppsDescription", "hiddenDevices", "restore", "restoreAll"],
  mouse: ["scrollWheelTitle", "scrollWheelDescription", "useScrollWheelInTray", "useScrollWheelInTrayDescription", "useGlobalMouseWheelHook", "useGlobalMouseWheelHookDescription", "volumeScaleTitle", "volumeScaleDescription", "useLogarithmicVolume", "useVolumeTickSound", "useVolumeTickSoundDescription", "deviceChangeTitle", "deviceChangeDescription", "notifyOnDeviceChange", "focusLostTitle", "focusLostDescription", "useFocusLostVolume", "focusLostAttenuate", "focusLostAttenuateHint", "focusLostFade", "focusLostFadeHint", "focusLostScope", "focusLostAllApps", "focusLostSelectedApps", "focusLostSelectedHint"],
  shortcuts: ["shortcuts", "recordShortcut", "clearShortcut"],
  profiles: ["profileCapture", "profileCaptureDescription", "profileName", "allDevices", "confirmation", "savedProfiles", "appsOnly", "profileShortcut", "profileShortcutDescription", "apply", "export", "import", "delete"],
  "app-rules": ["appRules", "appRulesDescription", "appPlaceholder", "browse", "addApp", "hardMute", "focusLostRule", "volumeBehavior", "modeNone", "modeLaunch", "modeLock", "targetVolume", "clearAllRules", "folderRules", "folderRulesEmpty", "addFolder", "changeFolder"],
  appearance: ["appearance", "appearanceDescription", "dynamicAlbum", "dynamicAlbumDescription", "enableDynamicAlbum", "presets", "customColors", "customColorsDescription", "useCustomColors", "windowOpacity", "peakStyle", "randomize", "reset", "saveTheme", "sliderThumb", "sliderFill", "sliderTrack", "peakColor", "windowColor", "textColor", "accentColor", "deleteTheme"],
  media: ["mediaPopup", "mediaPopupDescription", "enableMediaPopup", "interaction", "hoverDelay", "showWhenPaused", "rememberExpanded"],
  performance: ["ecoMode", "ecoModeDescription", "enableEcoMode", "autoEcoMode", "animations", "smoothAnimation", "animationSpeed", "peakMeter", "refreshRate"],
  updates: ["updates", "updatesDescription", "autoUpdates", "notifyFor", "checkUpdate", "installUpdate", "updateChannel0", "updateChannel1", "updateChannel2", "updateChannel3"],
  privacy: ["privacy", "privacyDescription", "settingsData", "settingsDataDescription", "exportSettings", "importSettings"],
  about: ["about", "diagnostics", "diagnosticsDescription", "github", "feedback", "bugReport", "monkeySound", "monkeySoundDescription"],
};

function normalizeSearch(value: string, locale: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase(locale);
}

function pageSearchText(payload: SettingsPayload, page: SettingsPageDescriptor) {
  const labels = (pageLabelKeys[page.id] ?? []).map(key => payload.labels[key] ?? "");
  let dynamic: string[] = [];
  switch (page.id) {
    case "general": dynamic = [...payload.collections.hiddenApps.flatMap(item => [item.displayName, item.exeName, item.deviceName]), ...payload.collections.hiddenDevices.map(item => item.displayName)]; break;
    case "shortcuts": dynamic = [...payload.collections.hotkeys.flatMap(item => [item.label, item.description, item.value]), ...payload.collections.deviceHotkeys.flatMap(item => [item.label, item.value])]; break;
    case "profiles": dynamic = payload.collections.profiles.flatMap(item => [item.name, item.slug, item.details, item.hotkey]); break;
    case "app-rules": dynamic = [...payload.collections.appRules.flatMap(item => [item.displayName, item.exeName]), ...payload.collections.folderRules.map(item => item.folderPath)]; break;
    case "appearance": dynamic = payload.collections.themes.flatMap(item => [item.name, item.category]); break;
    case "updates": dynamic = [payload.status.updateText, payload.status.updateDetail]; break;
    case "about": dynamic = [payload.status.version, payload.status.health]; break;
  }
  return normalizeSearch([page.title, page.subtitle, ...labels, ...dynamic].join(" "), payload.locale);
}

// Skeleton shown while the bridge payload has not arrived yet. Mirrors the
// final layout (sidebar + page header + sections) so the transition into the
// real content is imperceptible.
function LoadingSkeleton({ styles }: { styles: ReturnType<typeof useStyles> }) {
  return (
    <div className={styles.skeletonShell} aria-busy="true" aria-label="Loading settings">
      <div className={styles.skeletonSidebar}>
        <div className={styles.skeletonBlock} style={{ height: 28, width: "70%", borderRadius: 14 }} />
        {Array.from({ length: 7 }).map((_, index) => <div key={index} className={styles.skeletonBlock} style={{ height: 38, borderRadius: 14 }}><div className={styles.skeletonShimmer} /></div>)}
      </div>
      <div className={styles.skeletonMain}>
        <div className={styles.atmosphere}><DitherField live={false} /></div>
        <div style={{ width: "100%", maxWidth: 820, boxSizing: "border-box", margin: "0 auto", padding: "40px 32px 80px", position: "relative", zIndex: 1 }}>
          <div style={{ marginBottom: 28 }}>
            <div className={styles.skeletonBlock} style={{ height: 26, width: "32%", marginBottom: 8 }}><div className={styles.skeletonShimmer} /></div>
            <div className={styles.skeletonBlock} style={{ height: 13, width: "54%", borderRadius: 999 }} />
          </div>
          {[0, 1].map(index => (
            <div key={index} className={styles.skeletonBlock} style={{ height: 232, marginBottom: 18 }}>
              <div className={styles.skeletonShimmer} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function App() {
  const styles = useStyles();
  const [payload, setPayload] = useState<SettingsPayload | null>(null);
  const [selectedId, setSelectedId] = useState("general");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [isOpeningLegacy, setIsOpeningLegacy] = useState(false);
  const [bridgeError, setBridgeError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mainEdgeFade, setMainEdgeFade] = useState({ top: false, bottom: false });

  useEffect(() => {
    const webview = window.chrome?.webview;
    if (!webview) return;
    const onMessage = (event: MessageEvent<HostMessage>) => {
      if (event.data.type === "state") {
        const data = event.data.data;
        setPayload(data);
        setIsOpeningLegacy(false);
        setBridgeError(null);
        const firstPage = data.categories.flatMap(category => category.pages)[0];
        if (firstPage) setSelectedId(current => data.categories.flatMap(category => category.pages).some(page => page.id === current) ? current : firstPage.id);
        requestAnimationFrame(() => requestAnimationFrame(() => webview.postMessage({ type: "rendered" })));
      } else if (event.data.type === "error") {
        setIsOpeningLegacy(false);
        setBridgeError(event.data.message);
      }
    };
    webview.addEventListener("message", onMessage);
    webview.postMessage({ type: "ready" });
    return () => webview.removeEventListener("message", onMessage);
  }, []);

  // Close the mobile drawer with Escape / when the window is resized back to desktop.
  useEffect(() => {
    if (!mobileDrawerOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setMobileDrawerOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileDrawerOpen]);

  const groups = useMemo(() => groupPages(payload ?? fallbackPayload), [payload]);
  const normalizedQuery = normalizeSearch(deferredQuery.trim(), payload?.locale ?? "fr-FR");
  const filteredGroups = useMemo(() => groups.map(group => ({ ...group, pages: group.pages.filter(page => !normalizedQuery || pageSearchText(payload ?? fallbackPayload, page).includes(normalizedQuery)) })).filter(group => group.pages.length), [groups, normalizedQuery, payload]);
  const allPages = (payload ?? fallbackPayload).categories.flatMap(category => category.pages);
  const visiblePages = filteredGroups.flatMap(group => group.pages);
  const effectiveSelectedId = normalizedQuery && !visiblePages.some(page => page.id === selectedId) ? visiblePages[0]?.id : selectedId;
  const selectedPage = normalizedQuery && !effectiveSelectedId ? undefined : allPages.find(page => page.id === effectiveSelectedId) ?? allPages[0];
  const setSetting = (key: SettingKey, value: SettingValue) => {
    setPayload(current => current ? { ...current, values: { ...current.values, [key]: value } } : current);
    window.chrome?.webview?.postMessage({ type: "setSetting", key, value });
  };
  const action = (name: string, data: Record<string, unknown> = {}) => window.chrome?.webview?.postMessage({ type: "action", action: name, ...data });
  const openClassic = (pageId?: string) => { setBridgeError(null); setIsOpeningLegacy(true); window.chrome?.webview?.postMessage({ type: "openLegacy", pageId: pageId ?? null }); };

  return (
    <FluentProvider className={styles.provider} theme={sageGlassDarkTheme}>
      <div className={mergeClasses(styles.dragRegion, sidebarCollapsed && styles.dragRegionCollapsed)} aria-hidden="true" onPointerDown={event => {
        if (event.button === 0) window.chrome?.webview?.postMessage({ type: "windowAction", action: "drag" });
      }} />
      <WindowControls labels={{ minimize: payload?.labels.minimize || "Minimize", close: payload?.labels.close || "Close" }} styles={styles} />
      {payload ? (
        <>
        <div className={mergeClasses(styles.shell, sidebarCollapsed && styles.shellCollapsed)}>
          <aside className={mergeClasses(styles.sidebar, "sidebar-polished", sidebarCollapsed && styles.sidebarCollapsed)}>
            <SidebarBody styles={styles} payload={payload} groups={filteredGroups} selectedPage={selectedPage} collapsed={sidebarCollapsed} query={query} setQuery={setQuery} isOpeningLegacy={isOpeningLegacy} openClassic={() => openClassic()} navigate={setSelectedId} onToggleCollapsed={() => setSidebarCollapsed(value => !value)} />
          </aside>
          <main className={styles.main}>
            <div className={styles.atmosphere}><DitherField live={!payload.status.ecoModeActive} /></div>
            <div className={mergeClasses(styles.mainScroll, "settings-main")} onScroll={event => {
              const el = event.currentTarget;
              const atTop = el.scrollTop <= 8;
              const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 8;
              setMainEdgeFade({ top: !atTop, bottom: !atBottom });
            }}>
              <div className={mergeClasses(styles.mobileHeader, "mobile-header-polished")}><img className={styles.logo} src={appIcon} alt="" /><Text weight="semibold">{payload.appName}</Text><Button className={styles.mobileMenuButton} appearance="subtle" icon={<MenuIcon size={20} />} aria-label={mobileDrawerOpen ? (payload.labels.closeNavigation || "Close navigation") : (payload.labels.openNavigation || "Open navigation")} aria-expanded={mobileDrawerOpen} title={mobileDrawerOpen ? (payload.labels.closeNavigation || "Close navigation") : (payload.labels.openNavigation || "Open navigation")} onClick={() => setMobileDrawerOpen(value => !value)} /></div>
              <div className={styles.content}>
                {bridgeError && <MessageBar className={styles.message} intent="error"><MessageBarBody>{bridgeError}</MessageBarBody></MessageBar>}
                {selectedPage && <SettingsPage page={selectedPage} payload={payload} styles={styles} setSetting={setSetting} action={action} openClassic={openClassic} isOpeningLegacy={isOpeningLegacy} />}
                {!selectedPage && <Text className={styles.searchEmpty}>{payload.labels.noResults || "No settings match your search."}</Text>}
              </div>
            </div>
            <div className={mergeClasses(styles.mainFade, styles.mainFadeTop, mainEdgeFade.top && styles.mainFadeVisible)} aria-hidden="true" />
            <div className={mergeClasses(styles.mainFade, styles.mainFadeBottom, mainEdgeFade.bottom && styles.mainFadeVisible)} aria-hidden="true" />
          </main>
        </div>
        <div className={mergeClasses(styles.drawerBackdrop, mobileDrawerOpen && styles.drawerBackdropOpen)} onClick={() => setMobileDrawerOpen(false)} aria-hidden="true" />
        <aside className={mergeClasses(styles.mobileDrawer, "sidebar-polished", mobileDrawerOpen && styles.mobileDrawerOpen)} aria-hidden={!mobileDrawerOpen} aria-label="Settings navigation">
          <SidebarBody styles={styles} payload={payload} groups={filteredGroups} selectedPage={selectedPage} collapsed={false} query={query} setQuery={setQuery} isOpeningLegacy={isOpeningLegacy} openClassic={() => { setMobileDrawerOpen(false); openClassic(); }} navigate={id => { setSelectedId(id); setMobileDrawerOpen(false); }} />
        </aside>
        </>
      ) : (
        <LoadingSkeleton styles={styles} />
      )}
    </FluentProvider>
  );
}

const morphEase: [number, number, number, number] = [0.33, 1, 0.68, 1];

function SidebarBody({ styles, payload, groups, selectedPage, collapsed, query, setQuery, isOpeningLegacy, openClassic, navigate, onToggleCollapsed }: {
  styles: ReturnType<typeof useStyles>;
  payload: SettingsPayload;
  groups: { title: string; pages: SettingsPageDescriptor[] }[];
  selectedPage?: SettingsPageDescriptor;
  collapsed: boolean;
  query: string;
  setQuery: (value: string) => void;
  isOpeningLegacy: boolean;
  openClassic: () => void;
  navigate: (id: string) => void;
  onToggleCollapsed?: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const duration = reduceMotion ? 0 : 0.22;
  const blur = (px: number) => (reduceMotion ? "blur(0px)" : `blur(${px}px)`);
  const morph = { duration, ease: morphEase };
  const labelAnimate = collapsed
    ? { opacity: 0 }
    : { opacity: 1 };

  return (
    <>
      <div className={mergeClasses(styles.sidebarHeader, collapsed && styles.sidebarHeaderCollapsed)}>
        <motion.button
          type="button"
          className={collapsed && onToggleCollapsed ? styles.logoButton : undefined}
          style={collapsed && onToggleCollapsed ? undefined : { display: "grid", placeItems: "center", padding: 0, border: "none", background: "transparent", cursor: "default" }}
          aria-label={collapsed && onToggleCollapsed ? (payload.labels.expandSidebar || "Expand sidebar") : undefined}
          title={collapsed && onToggleCollapsed ? (payload.labels.expandSidebar || "Expand sidebar") : undefined}
          tabIndex={collapsed && onToggleCollapsed ? 0 : -1}
          onClick={collapsed && onToggleCollapsed ? onToggleCollapsed : undefined}
        >
          <img className={mergeClasses(styles.logo, "logo-polished")} src={appIcon} alt="" />
        </motion.button>
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.span
              key="wordmark"
              className={styles.wordmark}
              initial={{ opacity: 0, filter: blur(10), x: -8 }}
              animate={{ opacity: 1, filter: blur(0), x: 0 }}
              exit={{ opacity: 0, filter: blur(10), x: -10 }}
              transition={morph}
            >
              {payload.appName}
            </motion.span>
          )}
        </AnimatePresence>
        <AnimatePresence initial={false}>
          {onToggleCollapsed && !collapsed && (
            <motion.div
              key="collapse"
              initial={{ opacity: 0, filter: blur(8) }}
              animate={{ opacity: 1, filter: blur(0) }}
              exit={{ opacity: 0, filter: blur(8) }}
              transition={morph}
              style={{ marginLeft: "auto" }}
            >
              <Button className={mergeClasses(styles.sidebarToggle, "sidebar-toggle-polished")} appearance="subtle" aria-label={payload.labels.collapseSidebar || "Collapse sidebar"} title={payload.labels.collapseSidebar || "Collapse sidebar"} onClick={onToggleCollapsed} icon={<IndentIncreaseIcon size={16} />} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="search"
            initial={{ opacity: 0, filter: blur(8), maxHeight: 0, marginBottom: 0 }}
            animate={{ opacity: 1, filter: blur(0), maxHeight: 48, marginBottom: 14 }}
            exit={{ opacity: 0, filter: blur(8), maxHeight: 0, marginBottom: 0 }}
            transition={morph}
            style={{ overflow: "hidden", flexShrink: 0 }}
          >
            <Input className={styles.search} appearance="filled-darker" contentBefore={<SearchIcon size={18} />} value={query} onChange={(_, data) => setQuery(data.value)} placeholder={payload.labels.searchPlaceholder || "Search settings"} aria-label={payload.labels.searchPlaceholder || "Search settings"} onKeyDown={event => { if (event.key === "Escape" && query) { setQuery(""); } else if (event.key === "Enter") { const first = groups.flatMap(group => group.pages)[0]; if (first && query.trim()) navigate(first.id); } }} />
          </motion.div>
        )}
      </AnimatePresence>
      <div className={styles.navWrap}>
        <nav className={styles.nav} aria-label={payload.labels.navigation || "Settings"}>
          {groups.map(group => <div className={mergeClasses(styles.category, "category-polished")} key={group.title}>
            <motion.div initial={false} animate={collapsed ? { opacity: 0, filter: blur(6), height: 0, paddingBottom: 0, marginBottom: 0 } : { opacity: 1, filter: blur(0), height: "auto", paddingBottom: 0, marginBottom: 0 }} transition={morph} style={{ overflow: "hidden" }}>
              <Text className={mergeClasses(styles.categoryTitle, "category-title-polished")} size={200} weight="semibold">{group.title}</Text>
            </motion.div>
            {group.pages.map(page => <Button key={page.id} appearance="subtle" className={mergeClasses(styles.navButton, "nav-button-polished", collapsed && styles.navButtonCollapsed, selectedPage?.id === page.id && styles.navButtonSelected, selectedPage?.id === page.id && "nav-button-selected-polished")} icon={pageIcon(page.id, mergeClasses(styles.navIcon, "nav-icon-polished", collapsed && styles.navIconCollapsed))} title={page.title} aria-current={selectedPage?.id === page.id ? "page" : undefined} onClick={() => navigate(page.id)}><motion.span className={mergeClasses(styles.navLabel, collapsed && styles.navLabelCollapsed)} initial={false} animate={labelAnimate} transition={morph}>{page.title}</motion.span></Button>)}
          </div>)}
          {!groups.length && <Text className={styles.empty}>{payload.labels.noResults || "No settings match your search."}</Text>}
        </nav>
        <div className={styles.navFade} aria-hidden="true" />
      </div>
      <div className={styles.sidebarFooter}>
        <Button className={mergeClasses(styles.classicButton, "classic-button-polished", collapsed && styles.navButtonCollapsed)} appearance="subtle" icon={<AArrowDownIcon size={18} />} disabled={isOpeningLegacy} onClick={openClassic} title={payload.labels.classicSettings || "Classic settings"}><motion.span className={mergeClasses(styles.navLabel, collapsed && styles.navLabelCollapsed)} initial={false} animate={labelAnimate} transition={morph}>{isOpeningLegacy ? <Spinner size="tiny" /> : payload.labels.classicSettings || "Classic settings"}</motion.span></Button>
        <Button className={mergeClasses(styles.classicButton, "classic-button-polished", collapsed && styles.navButtonCollapsed)} appearance="subtle" icon={<GithubIcon size={18} />} title="GitHub" onClick={() => window.chrome?.webview?.postMessage({ type: "action", action: "github" })}><motion.span className={mergeClasses(styles.navLabel, collapsed && styles.navLabelCollapsed)} initial={false} animate={labelAnimate} transition={morph}>{payload.labels.github || "GitHub"}</motion.span></Button>
      </div>
    </>
  );
}

function WindowControls({ labels, styles }: { labels: { minimize: string; close: string }; styles: ReturnType<typeof useStyles> }) {
  const post = (action: "minimize" | "close") => window.chrome?.webview?.postMessage({ type: "windowAction", action });
  return <div className={styles.windowControls} aria-label={`${labels.minimize}, ${labels.close}`}>
    <Button appearance="subtle" className={`${styles.windowButton} window-button-polished`} icon={<Subtract16Regular />} aria-label={labels.minimize} title={labels.minimize} onClick={() => post("minimize")} />
    <Button appearance="subtle" className={mergeClasses(styles.windowButton, styles.closeButton, "window-button-polished", "close-button-polished")} icon={<Dismiss16Regular />} aria-label={labels.close} title={labels.close} onClick={() => post("close")} />
  </div>;
}
