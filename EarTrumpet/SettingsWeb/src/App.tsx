import { useDeferredValue, useEffect, useMemo, useState } from "react";
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
  BlendIcon,
  InfoIcon,
  KeyboardIcon,
  ListChecksIcon,
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
import { SettingsPage } from "./SettingsPages";
import type { HostMessage, SettingKey, SettingsPageDescriptor, SettingsPayload, SettingValue } from "./types";

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
    backgroundColor: "#0a080f", color: "#F4F7F5",
  },

  // ── Shell grid: sidebar + content surface ──
  shell: {
    position: "relative", zIndex: 1, display: "grid",
    gridTemplateColumns: "248px minmax(0, 1fr)",
    height: "100%", minWidth: 0,
    transitionProperty: "grid-template-columns", transitionDuration: "220ms",
    transitionTimingFunction: "cubic-bezier(.2,0,0,1)",
    "@media (max-width: 680px)": { display: "block" },
  },
  shellCollapsed: {
    gridTemplateColumns: "64px minmax(0, 1fr)",
  },

  // ── Sidebar: black, stable ──
  sidebar: {
    display: "flex", minHeight: 0, flexDirection: "column",
    padding: "16px 12px 12px", backgroundColor: "#0a080f",
    "@media (max-width: 680px)": { display: "none" },
  },
  sidebarHeader: { display: "flex", alignItems: "center", gap: "10px", minHeight: "40px", padding: "0 6px 14px", marginBottom: "10px", flexShrink: 0 },
  logo: { width: "28px", height: "28px", objectFit: "contain", flexShrink: 0, filter: "drop-shadow(0 1px 4px rgba(155, 123, 234, 0.25))" },
  sidebarToggle: {
    marginLeft: "auto", flexShrink: 0, minWidth: "32px", width: "32px", height: "32px", padding: 0,
    color: "rgba(244,247,245,.55)", borderRadius: "14px",
    ":hover": { color: "#F4F7F5", backgroundColor: "rgba(255,255,255,.06)" },
    ":active": { transform: "scale(0.94)" },
  },
  search: { marginBottom: "12px", flexShrink: 0 },
  searchHidden: { visibility: "hidden", height: 0, marginBottom: 0, pointerEvents: "none" },
  nav: { minHeight: 0, overflowY: "auto", paddingRight: "2px", overscrollBehavior: "contain" },
  category: { marginBottom: "16px" },
  categoryTitle: { display: "block", padding: "0 10px 6px", color: "rgba(244,247,245,.45)", whiteSpace: "nowrap", overflow: "hidden", transitionProperty: "opacity", transitionDuration: "150ms" },
  categoryTitleCollapsed: { opacity: 0 },
  navButton: {
    width: "100%", height: "38px", justifyContent: "flex-start", marginBottom: "2px",
    paddingLeft: "9px", overflow: "hidden", whiteSpace: "nowrap",
    borderRadius: "14px", fontWeight: tokens.fontWeightRegular,
    color: "rgba(244,247,245,.62)",
    transitionProperty: "background-color, color", transitionDuration: "150ms",
    ":hover": { color: "#F4F7F5", backgroundColor: "rgba(255,255,255,.05)" },
  },
  navIcon: { display: "inline-grid", flex: "0 0 20px", width: "20px", height: "20px", placeItems: "center", marginRight: "6px", color: "inherit", overflow: "hidden", "& > svg": { display: "block" } },
  navButtonSelected: { backgroundColor: ACCENT_DIM, color: "#F4F7F5", fontWeight: tokens.fontWeightSemibold, ":hover": { backgroundColor: ACCENT_DIM, color: "#F4F7F5" } },
  sidebarFooter: { flexShrink: 0, borderTop: "1px solid rgba(255,255,255,.08)", paddingTop: "10px", marginTop: "10px" },
  classicButton: { justifyContent: "flex-start", borderRadius: "14px", color: "rgba(244,247,245,.62)", ":hover": { color: "#F4F7F5" } },

  // ── Main: atmospheric sage surface ──
  main: { minWidth: 0, minHeight: 0, overflowY: "auto", overscrollBehavior: "contain", scrollbarGutter: "stable", contain: "layout paint" },
  // Sage-violet atmospheric background with wide soft halos. The surface is
  // translucent so the DWM acrylic backdrop keeps showing through.
  atmosphere: {
    position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
    backgroundColor: "rgba(133, 118, 155, 0.42)",
    backgroundImage: [
      "radial-gradient(ellipse 70% 45% at 50% -8%, rgba(155, 123, 234, 0.20), transparent 70%)",
      "radial-gradient(ellipse 55% 40% at -6% 108%, rgba(94, 78, 128, 0.24), transparent 70%)",
      "radial-gradient(ellipse 60% 45% at 106% 100%, rgba(38, 32, 52, 0.30), transparent 72%)",
      "linear-gradient(180deg, rgba(38, 32, 52, 0.16), rgba(38, 32, 52, 0.34))",
    ].join(", "),
    "@media (prefers-reduced-transparency: reduce)": { backgroundImage: "none", backgroundColor: "#3d3750" },
  },
  // Subtle dot grain, kept below content contrast.
  grain: {
    position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.5,
    backgroundImage: "radial-gradient(rgba(255,255,255,.05) 1px, transparent 1px)",
    backgroundSize: "22px 22px",
    "@media (prefers-reduced-transparency: reduce)": { display: "none" },
  },

  content: { position: "relative", zIndex: 1, width: "min(820px, calc(100% - 64px))", margin: "0 auto", padding: "48px 0 64px", "@media (max-width: 680px)": { width: "calc(100% - 32px)", padding: "76px 0 48px" } },

  // ── Page header ──
  pageHeader: { display: "grid", gridTemplateColumns: "46px minmax(0, 1fr)", gap: "16px", alignItems: "center", marginBottom: "30px" },
  pageIcon: { display: "grid", width: "46px", height: "46px", placeItems: "center", borderRadius: "18px", color: ACCENT_STRONG, backgroundColor: ACCENT_DIM, overflow: "hidden", "& > svg": { display: "block" } },
  pageTitle: { display: "block", marginBottom: "5px", letterSpacing: "-0.01em" },
  pageSubtitle: { display: "block", maxWidth: "68ch", color: "rgba(244,247,245,.58)" },

  // ── Cards / sections ──
  section: {
    marginBottom: "18px", overflow: "hidden",
    border: "1px solid rgba(255,255,255,.10)", borderRadius: "18px",
    backgroundColor: "rgba(22, 18, 32, 0.66)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,.05), 0 12px 34px rgba(10, 8, 15, 0.28)",
    backdropFilter: "blur(14px)",
    "@media (prefers-reduced-transparency: reduce)": { backgroundColor: "#1d1928", backdropFilter: "none" },
    contentVisibility: "auto", containIntrinsicSize: "auto 240px",
  },
  sectionHeader: { padding: "17px 20px 14px" },
  sectionTitle: { display: "block" },
  sectionDescription: { display: "block", marginTop: "3px", color: "rgba(244,247,245,.58)", maxWidth: "72ch" },

  // ── Setting rows ──
  settingList: { borderTop: "1px solid rgba(255,255,255,.08)" },
  settingRow: {
    display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: "24px", alignItems: "center",
    minHeight: "64px", padding: "0 20px", cursor: "pointer",
    transitionProperty: "background-color", transitionDuration: "150ms",
    "& + &": { borderTop: "1px solid rgba(255,255,255,.08)" },
    ":hover": { backgroundColor: "rgba(255,255,255,.04)" },
    ":focus-within": { outline: `2px solid ${ACCENT}`, outlineOffset: "-2px" },
    "@media (max-width: 680px)": { gridTemplateColumns: "minmax(0, 1fr)", gap: "8px", padding: "12px 16px" },
  },
  settingCopy: { minWidth: 0, padding: "12px 0", "@media (max-width: 680px)": { padding: 0 } },
  settingDescription: { display: "block", marginTop: "3px", color: "rgba(244,247,245,.58)", maxWidth: "72ch" },
  controlRow: { display: "flex", alignItems: "center", gap: "10px", padding: "14px 20px", minHeight: "58px" },
  controlGrow: { flex: 1, minWidth: 0 },
  range: { width: "246px", maxWidth: "100%" },
  select: { minWidth: "190px", minHeight: "38px", padding: "0 10px", color: "#F4F7F5", backgroundColor: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.10)", borderRadius: "14px", ":focus": { outline: `2px solid ${ACCENT}` } },
  actionRow: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", padding: "14px 20px", "& + &": { borderTop: "1px solid rgba(255,255,255,.08)" } },
  rowActions: { display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "flex-end", gap: "8px" },
  inlineRange: { width: "230px", maxWidth: "100%" },
  list: { display: "grid", gap: 0, padding: 0 },
  listRow: { display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: "12px", alignItems: "center", padding: "13px 20px", borderTop: "1px solid rgba(255,255,255,.08)", "@media (max-width: 680px)": { gridTemplateColumns: "minmax(0, 1fr)", alignItems: "start" } },
  listMeta: { display: "block", marginTop: "2px", color: "rgba(244,247,245,.58)" },
  empty: { padding: "16px 16px", color: "rgba(244,247,245,.58)" },

  // ── Theme presets ──
  themeGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "10px", padding: "14px 16px" },
  themeItem: { position: "relative", minWidth: 0 },
  themeButton: { display: "grid", width: "100%", gap: "8px", justifyItems: "start", padding: "12px 40px 12px 12px", minHeight: "78px", textAlign: "left", border: "1px solid rgba(255,255,255,.10)", borderRadius: "18px", color: "#F4F7F5", backgroundColor: "rgba(255,255,255,.04)", cursor: "pointer", transitionProperty: "background-color, border-color", transitionDuration: "150ms", ":hover": { backgroundColor: "rgba(255,255,255,.07)" }, ":focus-visible": { outline: `2px solid ${ACCENT}`, outlineOffset: "2px" } },
  themeSelected: { border: `1px solid ${ACCENT}`, backgroundColor: ACCENT_DIM },
  themeDelete: { position: "absolute", top: "8px", right: "8px", minWidth: "28px", width: "28px", height: "28px", padding: 0, borderRadius: "14px" },
  swatches: { display: "flex", gap: "4px" },
  swatch: { width: "24px", height: "10px", borderRadius: "999px" },
  colorInput: { width: "38px", height: "30px", padding: "0", border: "none", borderRadius: "14px", background: "transparent", cursor: "pointer" },

  // ── Window chrome ──
  windowControls: { position: "fixed", top: "8px", right: "8px", zIndex: 20, display: "flex", gap: "2px" },
  dragRegion: { position: "fixed", inset: "0 96px auto 0", zIndex: 19, height: "44px", touchAction: "none", userSelect: "none" },
  windowButton: { width: "36px", height: "36px", minWidth: "36px", padding: 0, borderRadius: "14px", color: "rgba(244,247,245,.7)", backgroundColor: "transparent", transitionProperty: "color, background-color, transform", transitionDuration: "120ms", ":hover": { color: "#F4F7F5", backgroundColor: "rgba(255,255,255,.08)" }, ":active": { transform: "scale(0.94)" } },
  closeButton: { ":hover": { color: "#fff", backgroundColor: "#c42b1c" }, ":active": { color: "#fff", backgroundColor: "#a4262c" } },
  windowIcon: { display: "grid", placeItems: "center", width: "20px", height: "20px" },

  // ── Mobile ──
  mobileHeader: { display: "none", "@media (max-width: 680px)": { display: "flex", position: "fixed", inset: "0 0 auto 0", zIndex: 10, alignItems: "center", gap: "10px", height: "58px", padding: "0 96px 0 16px", backgroundColor: "rgba(10, 8, 15, 0.88)", borderBottom: "1px solid rgba(255,255,255,.08)" } },
  mobileNav: { display: "none", "@media (max-width: 680px)": { display: "flex", gap: "6px", overflowX: "auto", padding: "10px 16px", backgroundColor: "rgba(10, 8, 15, 0.82)" } },
  message: { marginBottom: "18px" },
  searchEmpty: { display: "grid", minHeight: "280px", placeItems: "center", color: "rgba(244,247,245,.58)", textAlign: "center" },

  // ── Loading skeleton (replaces the WPF progress bar) ──
  skeletonShell: { display: "grid", gridTemplateColumns: "248px minmax(0, 1fr)", height: "100%", "@media (max-width: 680px)": { display: "block" } },
  skeletonSidebar: { backgroundColor: "#0a080f", padding: "16px 12px", display: "flex", flexDirection: "column", gap: "10px", "@media (max-width: 680px)": { display: "none" } },
  skeletonMain: { position: "relative", overflow: "hidden", padding: "48px 0" },
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
  colorBrandForeground1: ACCENT_STRONG,
  colorBrandForeground2: ACCENT_STRONG,
  colorBrandStroke1: ACCENT,
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
  collections: { hiddenApps: [], hiddenDevices: [], hotkeys: [], profiles: [], selectedProfileIndex: -1, appRules: [], folderRules: [], themes: [], activeThemeName: "" },
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
    case "shortcuts": dynamic = payload.collections.hotkeys.flatMap(item => [item.label, item.description, item.value]); break;
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
        <div className={styles.atmosphere} />
        <div className={styles.grain} />
        <div style={{ width: "min(820px, calc(100% - 64px))", margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 30 }}>
            <div className={styles.skeletonBlock} style={{ width: 46, height: 46, borderRadius: 18 }} />
            <div style={{ flex: 1 }}>
              <div className={styles.skeletonBlock} style={{ height: 22, width: "38%", marginBottom: 8 }}><div className={styles.skeletonShimmer} /></div>
              <div className={styles.skeletonBlock} style={{ height: 13, width: "62%", borderRadius: 999 }} />
            </div>
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
      <div className={styles.dragRegion} aria-hidden="true" onPointerDown={event => {
        if (event.button === 0) window.chrome?.webview?.postMessage({ type: "windowAction", action: "drag" });
      }} />
      <WindowControls labels={{ minimize: payload?.labels.minimize || "Minimize", close: payload?.labels.close || "Close" }} styles={styles} />
      {payload ? (
        <div className={mergeClasses(styles.shell, sidebarCollapsed && styles.shellCollapsed)}>
          <aside className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
              <img className={styles.logo} src={appIcon} alt="" />
              {!sidebarCollapsed && <Text size={400} weight="semibold">{payload.appName}</Text>}
              <Button className={styles.sidebarToggle} appearance="subtle" aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"} title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={() => setSidebarCollapsed(value => !value)} icon={<IndentIncreaseIcon size={16} />} />
            </div>
            {!sidebarCollapsed && <Input className={styles.search} appearance="filled-darker" contentBefore={<SearchIcon size={18} />} value={query} onChange={(_, data) => setQuery(data.value)} placeholder={payload.labels.searchPlaceholder || "Search settings"} aria-label={payload.labels.searchPlaceholder || "Search settings"} />}
            <nav className={styles.nav} aria-label={payload.labels.searchPlaceholder || "Settings"}>
              {filteredGroups.map(group => <div className={styles.category} key={group.title}>
                <Text className={mergeClasses(styles.categoryTitle, sidebarCollapsed && styles.categoryTitleCollapsed)} size={200} weight="semibold">{group.title}</Text>
                {group.pages.map(page => <Button key={page.id} appearance="subtle" className={mergeClasses(styles.navButton, selectedPage?.id === page.id && styles.navButtonSelected)} icon={pageIcon(page.id, styles.navIcon)} title={page.title} onClick={() => setSelectedId(page.id)}>{sidebarCollapsed ? "" : page.title}</Button>)}
              </div>)}
              {!filteredGroups.length && <Text className={styles.empty}>{payload.labels.noResults || "No settings match your search."}</Text>}
            </nav>
            <div className={styles.sidebarFooter}>
              <Button className={styles.classicButton} appearance="subtle" icon={<AArrowDownIcon size={18} />} disabled={isOpeningLegacy} onClick={() => openClassic()}>{sidebarCollapsed ? "" : (isOpeningLegacy ? <Spinner size="tiny" /> : payload.labels.classicSettings || "Classic settings")}</Button>
            </div>
          </aside>
          <main className={styles.main}>
            <div className={styles.atmosphere} />
            <div className={styles.grain} />
            <div className={styles.mobileHeader}><img className={styles.logo} src={appIcon} alt="" /><Text weight="semibold">{payload.appName}</Text></div>
            <div className={styles.mobileNav}>{payload.categories.flatMap(category => category.pages).map(page => <Button key={page.id} appearance={selectedPage?.id === page.id ? "primary" : "subtle"} onClick={() => setSelectedId(page.id)}>{page.title}</Button>)}</div>
            <div className={styles.content}>
              {bridgeError && <MessageBar className={styles.message} intent="error"><MessageBarBody>{bridgeError}</MessageBarBody></MessageBar>}
              {selectedPage && <SettingsPage page={selectedPage} payload={payload} styles={styles} setSetting={setSetting} action={action} openClassic={openClassic} isOpeningLegacy={isOpeningLegacy} />}
              {!selectedPage && <Text className={styles.searchEmpty}>{payload.labels.noResults || "No settings match your search."}</Text>}
            </div>
          </main>
        </div>
      ) : (
        <LoadingSkeleton styles={styles} />
      )}
    </FluentProvider>
  );
}

function WindowControls({ labels, styles }: { labels: { minimize: string; close: string }; styles: ReturnType<typeof useStyles> }) {
  const post = (action: "minimize" | "close") => window.chrome?.webview?.postMessage({ type: "windowAction", action });
  return <div className={styles.windowControls} aria-label={`${labels.minimize}, ${labels.close}`}>
    <Button appearance="subtle" className={styles.windowButton} icon={<Subtract16Regular />} aria-label={labels.minimize} title={labels.minimize} onClick={() => post("minimize")} />
    <Button appearance="subtle" className={mergeClasses(styles.windowButton, styles.closeButton)} icon={<Dismiss16Regular />} aria-label={labels.close} title={labels.close} onClick={() => post("close")} />
  </div>;
}
