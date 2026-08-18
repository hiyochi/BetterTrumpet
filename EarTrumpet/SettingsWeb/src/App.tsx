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
  RefreshCwIcon,
  SaveIcon,
  SearchIcon,
  SettingsIcon,
  ShieldCheckIcon,
} from "@animateicons/react/lucide";
import { Dismiss16Regular } from "@fluentui/react-icons/svg/dismiss";
import { Subtract16Regular } from "@fluentui/react-icons/svg/subtract";
import appIcon from "../../Assets/icon.png";
import Scanner from "./components/Scanner";
import { SettingsPage } from "./SettingsPages";
import type { HostMessage, SettingKey, SettingsPageDescriptor, SettingsPayload, SettingValue } from "./types";

const useStyles = makeStyles({
  provider: { position: "relative", isolation: "isolate", height: "100%", overflow: "hidden", backgroundColor: "rgba(32, 30, 39, 0.74)", color: tokens.colorNeutralForeground1 },
  providerLight: { backgroundColor: "rgba(247, 245, 251, 0.76)" },
  shell: { position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: "278px minmax(0, 1fr)", height: "100%", minWidth: 0, "@media (max-width: 820px)": { display: "block" } },
  sidebar: { display: "flex", minHeight: 0, flexDirection: "column", padding: "18px 12px 12px", backgroundColor: tokens.colorNeutralBackground1, borderRight: `1px solid ${tokens.colorNeutralStroke2}`, "@media (max-width: 820px)": { display: "none" } },
  brand: { display: "flex", alignItems: "center", gap: "10px", minHeight: "36px", padding: "0 8px 14px", borderBottom: `1px solid ${tokens.colorNeutralStroke3}`, marginBottom: "16px" },
  logo: { width: "30px", height: "30px", objectFit: "contain", filter: "drop-shadow(0 1px 4px rgba(139, 92, 246, 0.2))" },
  search: { marginBottom: "16px" },
  nav: { minHeight: 0, overflowY: "auto", paddingRight: "2px" },
  category: { marginBottom: "18px" },
  categoryTitle: { display: "block", padding: "0 10px 6px", color: tokens.colorNeutralForeground3 },
  navButton: { width: "100%", height: "36px", justifyContent: "flex-start", marginBottom: "2px", paddingLeft: "10px", overflow: "hidden", whiteSpace: "nowrap", borderRadius: "4px", fontWeight: tokens.fontWeightRegular, color: tokens.colorNeutralForeground2, transitionProperty: "background-color, color", transitionDuration: "140ms", ":hover": { color: tokens.colorNeutralForeground1 } },
  navIcon: { display: "inline-grid", flex: "0 0 20px", width: "20px", height: "20px", placeItems: "center", marginRight: "4px", color: tokens.colorNeutralForeground2, overflow: "hidden", "& > svg": { display: "block" } },
  navButtonSelected: { backgroundColor: "rgba(139, 92, 246, 0.14)", color: tokens.colorNeutralForeground1, fontWeight: tokens.fontWeightSemibold },
  classicButton: { justifyContent: "flex-start", marginTop: "10px", borderTop: `1px solid ${tokens.colorNeutralStroke3}`, borderRadius: "4px", paddingTop: "14px" },
  main: { minWidth: 0, overflowY: "auto", overscrollBehavior: "contain", scrollbarGutter: "stable", contain: "layout paint" },
  content: { width: "min(790px, calc(100% - 48px))", margin: "0 auto", padding: "44px 0 64px", "@media (max-width: 820px)": { width: "calc(100% - 32px)", padding: "72px 0 48px" } },
  pageHeader: { display: "grid", gridTemplateColumns: "42px minmax(0, 1fr)", gap: "14px", alignItems: "center", marginBottom: "28px" },
  pageIcon: { display: "grid", width: "42px", height: "42px", placeItems: "center", borderRadius: "4px", color: tokens.colorBrandForeground1, backgroundColor: "rgba(139, 92, 246, 0.12)", overflow: "hidden", "& > svg": { display: "block" } },
  pageTitle: { display: "block", marginBottom: "6px" },
  pageSubtitle: { display: "block", maxWidth: "68ch", color: tokens.colorNeutralForeground3 },
  section: { marginBottom: "20px", overflow: "hidden", border: `1px solid ${tokens.colorNeutralStroke3}`, borderRadius: "6px", backgroundColor: `color-mix(in srgb, ${tokens.colorNeutralBackground2} 58%, transparent)`, contentVisibility: "auto", containIntrinsicSize: "auto 240px" },
  sectionHeader: { padding: "15px 16px 13px" },
  sectionTitle: { display: "block" },
  sectionDescription: { display: "block", marginTop: "2px", color: tokens.colorNeutralForeground3 },
  settingList: { borderTop: `1px solid ${tokens.colorNeutralStroke3}` },
  settingRow: { display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: "24px", alignItems: "center", minHeight: "66px", padding: "0 16px", cursor: "pointer", transitionProperty: "background-color", transitionDuration: "140ms", "& + &": { borderTop: `1px solid ${tokens.colorNeutralStroke3}` }, ":hover": { backgroundColor: tokens.colorSubtleBackgroundHover }, ":focus-within": { outline: `2px solid ${tokens.colorBrandStroke1}`, outlineOffset: "-2px" }, "@media (max-width: 720px)": { gridTemplateColumns: "minmax(0, 1fr)", gap: "8px", padding: "12px 14px" } },
  settingCopy: { minWidth: 0, padding: "12px 0", "@media (max-width: 720px)": { padding: 0 } },
  settingDescription: { display: "block", marginTop: "3px", color: tokens.colorNeutralForeground3 },
  controlRow: { display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", minHeight: "58px" },
  controlGrow: { flex: 1, minWidth: 0 },
  range: { width: "246px", maxWidth: "100%" },
  select: { minWidth: "190px", minHeight: "34px", padding: "0 8px", color: tokens.colorNeutralForeground1, backgroundColor: tokens.colorNeutralBackground3, border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: "4px" },
  actionRow: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", padding: "14px 16px", "& + &": { borderTop: `1px solid ${tokens.colorNeutralStroke3}` } },
  rowActions: { display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "flex-end", gap: "8px" },
  inlineRange: { width: "230px", maxWidth: "100%" },
  list: { display: "grid", gap: 0, padding: 0 },
  listRow: { display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: "12px", alignItems: "center", padding: "12px 16px", borderTop: `1px solid ${tokens.colorNeutralStroke3}`, "@media (max-width: 720px)": { gridTemplateColumns: "minmax(0, 1fr)", alignItems: "start" } },
  listMeta: { display: "block", marginTop: "2px", color: tokens.colorNeutralForeground3 },
  empty: { padding: "16px 12px", color: tokens.colorNeutralForeground3 },
  themeGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(145px, 1fr))", gap: "8px", padding: "12px" },
  themeItem: { position: "relative", minWidth: 0 },
  themeButton: { display: "grid", width: "100%", gap: "8px", justifyItems: "start", padding: "10px 38px 10px 10px", minHeight: "74px", textAlign: "left", border: `1px solid ${tokens.colorNeutralStroke3}`, borderRadius: "4px", color: tokens.colorNeutralForeground1, backgroundColor: "transparent", cursor: "pointer", ":hover": { backgroundColor: tokens.colorSubtleBackgroundHover }, ":focus-visible": { outline: `2px solid ${tokens.colorBrandStroke1}`, outlineOffset: "2px" } },
  themeSelected: { border: `1px solid ${tokens.colorBrandStroke1}`, backgroundColor: "rgba(139, 92, 246, 0.12)" },
  themeDelete: { position: "absolute", top: "6px", right: "6px", minWidth: "28px", width: "28px", height: "28px", padding: 0 },
  swatches: { display: "flex", gap: "4px" },
  swatch: { width: "24px", height: "10px", borderRadius: "2px" },
  colorInput: { width: "38px", height: "28px", padding: "0", border: "none", background: "transparent", cursor: "pointer" },
  windowControls: { position: "fixed", top: "8px", right: "8px", zIndex: 20, display: "flex", gap: "2px" },
  dragRegion: { position: "fixed", inset: "0 80px auto 0", zIndex: 19, height: "40px", touchAction: "none", userSelect: "none" },
  windowButton: { width: "34px", height: "34px", minWidth: "34px", padding: 0, borderRadius: "4px", color: tokens.colorNeutralForeground2, backgroundColor: "transparent", transitionProperty: "color, background-color, transform", transitionDuration: "120ms", ":hover": { color: tokens.colorNeutralForeground1, backgroundColor: tokens.colorSubtleBackgroundHover }, ":active": { transform: "scale(0.94)" } },
  closeButton: { ":hover": { color: "#fff", backgroundColor: "#c42b1c" }, ":active": { color: "#fff", backgroundColor: "#a4262c" } },
  windowIcon: { display: "grid", placeItems: "center", width: "20px", height: "20px" },
  mobileHeader: { display: "none", "@media (max-width: 820px)": { display: "flex", position: "fixed", inset: "0 0 auto 0", zIndex: 10, alignItems: "center", gap: "10px", height: "56px", padding: "0 88px 0 16px", backgroundColor: tokens.colorNeutralBackground2, borderBottom: `1px solid ${tokens.colorNeutralStroke2}` } },
  mobileNav: { display: "none", "@media (max-width: 820px)": { display: "flex", gap: "6px", overflowX: "auto", padding: "10px 16px", backgroundColor: tokens.colorNeutralBackground2 } },
  message: { marginBottom: "18px" },
  searchEmpty: { display: "grid", minHeight: "280px", placeItems: "center", color: tokens.colorNeutralForeground3, textAlign: "center" },
});

const betterTrumpetLightTheme = { ...webLightTheme, colorNeutralBackground1: "#f7f5fb", colorNeutralBackground2: "#efedf5", colorNeutralStroke2: "#c9c3d5", colorNeutralStroke3: "#ded9e7", colorBrandBackground: "#6741c7", colorBrandBackgroundHover: "#5735ae", colorBrandForeground1: "#5735ae", colorBrandStroke1: "#6741c7" };
const betterTrumpetDarkTheme = { ...webDarkTheme, colorNeutralBackground1: "#201e27", colorNeutralBackground2: "#292631", colorNeutralStroke2: "#484351", colorNeutralStroke3: "#37333f", colorBrandBackground: "#9b7bea", colorBrandBackgroundHover: "#b196f1", colorBrandForeground1: "#b196f1", colorBrandStroke1: "#9b7bea" };

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

function useSystemDarkMode() {
  const [dark, setDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);
  useEffect(() => { const media = window.matchMedia("(prefers-color-scheme: dark)"); const onChange = (event: MediaQueryListEvent) => setDark(event.matches); media.addEventListener("change", onChange); return () => media.removeEventListener("change", onChange); }, []);
  return dark;
}

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
  mouse: ["scrollWheelTitle", "scrollWheelDescription", "useScrollWheelInTray", "useScrollWheelInTrayDescription", "useGlobalMouseWheelHook", "useGlobalMouseWheelHookDescription", "volumeScaleTitle", "volumeScaleDescription", "useLogarithmicVolume", "useVolumeTickSound", "useVolumeTickSoundDescription"],
  shortcuts: ["shortcuts", "recordShortcut", "clearShortcut"],
  profiles: ["profileCapture", "profileCaptureDescription", "profileName", "allDevices", "confirmation", "savedProfiles", "appsOnly", "profileShortcut", "profileShortcutDescription", "apply", "export", "import", "delete"],
  "app-rules": ["appRules", "appRulesDescription", "appPlaceholder", "browse", "addApp", "hardMute", "volumeBehavior", "modeNone", "modeLaunch", "modeLock", "targetVolume", "clearAllRules", "folderRules", "folderRulesEmpty", "addFolder", "changeFolder"],
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

export function App() {
  const styles = useStyles();
  const isDark = useSystemDarkMode();
  const [payload, setPayload] = useState(fallbackPayload);
  const [selectedId, setSelectedId] = useState("general");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [isOpeningLegacy, setIsOpeningLegacy] = useState(false);
  const [bridgeError, setBridgeError] = useState<string | null>(null);

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

  const groups = useMemo(() => groupPages(payload), [payload.categories, payload.labels]);
  const normalizedQuery = normalizeSearch(deferredQuery.trim(), payload.locale);
  const filteredGroups = useMemo(() => groups.map(group => ({ ...group, pages: group.pages.filter(page => !normalizedQuery || pageSearchText(payload, page).includes(normalizedQuery)) })).filter(group => group.pages.length), [groups, normalizedQuery, payload]);
  const allPages = payload.categories.flatMap(category => category.pages);
  const visiblePages = filteredGroups.flatMap(group => group.pages);
  const effectiveSelectedId = normalizedQuery && !visiblePages.some(page => page.id === selectedId) ? visiblePages[0]?.id : selectedId;
  const selectedPage = normalizedQuery && !effectiveSelectedId ? undefined : allPages.find(page => page.id === effectiveSelectedId) ?? allPages[0];
  const setSetting = (key: SettingKey, value: SettingValue) => {
    setPayload(current => ({ ...current, values: { ...current.values, [key]: value } }));
    window.chrome?.webview?.postMessage({ type: "setSetting", key, value });
  };
  const action = (name: string, data: Record<string, unknown> = {}) => window.chrome?.webview?.postMessage({ type: "action", action: name, ...data });
  const openClassic = (pageId?: string) => { setBridgeError(null); setIsOpeningLegacy(true); window.chrome?.webview?.postMessage({ type: "openLegacy", pageId: pageId ?? null }); };

  return (
    <FluentProvider className={mergeClasses(styles.provider, !isDark && styles.providerLight)} theme={isDark ? betterTrumpetDarkTheme : betterTrumpetLightTheme}>
      <Scanner
        color1={isDark ? "#251D39" : "#D9D0EA"}
        color2={isDark ? "#7359A8" : "#8063B2"}
        color3={isDark ? "#D8D1E8" : "#FFFFFF"}
        opacity={isDark ? 0.13 : 0.07}
      />
      <div className={styles.dragRegion} aria-hidden="true" onPointerDown={event => {
        if (event.button === 0) window.chrome?.webview?.postMessage({ type: "windowAction", action: "drag" });
      }} />
      <WindowControls labels={{ minimize: payload.labels.minimize || "Minimize", close: payload.labels.close || "Close" }} styles={styles} />
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <div className={styles.brand}><img className={styles.logo} src={appIcon} alt="" /><Text size={400} weight="semibold">{payload.appName}</Text></div>
          <Input className={styles.search} appearance="filled-darker" contentBefore={<SearchIcon size={18} />} value={query} onChange={(_, data) => setQuery(data.value)} placeholder={payload.labels.searchPlaceholder || "Search settings"} aria-label={payload.labels.searchPlaceholder || "Search settings"} />
          <nav className={styles.nav} aria-label={payload.labels.searchPlaceholder || "Settings"}>
            {filteredGroups.map(group => <div className={styles.category} key={group.title}><Text className={styles.categoryTitle} size={200} weight="semibold">{group.title}</Text>{group.pages.map(page => <Button key={page.id} appearance="subtle" className={mergeClasses(styles.navButton, selectedPage?.id === page.id && styles.navButtonSelected)} icon={pageIcon(page.id, styles.navIcon)} title={page.title} onClick={() => setSelectedId(page.id)}>{page.title}</Button>)}</div>)}
            {!filteredGroups.length && <Text className={styles.empty}>{payload.labels.noResults || "No settings match your search."}</Text>}
          </nav>
          <Button className={styles.classicButton} appearance="subtle" icon={<AArrowDownIcon size={19} />} disabled={isOpeningLegacy} onClick={() => openClassic()}>{isOpeningLegacy ? <Spinner size="tiny" /> : payload.labels.classicSettings || "Classic settings"}</Button>
        </aside>
        <main className={styles.main}>
          <div className={styles.mobileHeader}><img className={styles.logo} src={appIcon} alt="" /><Text weight="semibold">{payload.appName}</Text></div>
          <div className={styles.mobileNav}>{payload.categories.flatMap(category => category.pages).map(page => <Button key={page.id} appearance={selectedPage?.id === page.id ? "primary" : "subtle"} onClick={() => setSelectedId(page.id)}>{page.title}</Button>)}</div>
          <div className={styles.content}>
            {bridgeError && <MessageBar className={styles.message} intent="error"><MessageBarBody>{bridgeError}</MessageBarBody></MessageBar>}
            {selectedPage && <SettingsPage page={selectedPage} payload={payload} styles={styles} setSetting={setSetting} action={action} openClassic={openClassic} isOpeningLegacy={isOpeningLegacy} />}
            {!selectedPage && <Text className={styles.searchEmpty}>{payload.labels.noResults || "No settings match your search."}</Text>}
          </div>
        </main>
      </div>
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
