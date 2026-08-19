import { useState, useEffect } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { Button, Input, Spinner, Switch, Text, mergeClasses } from "@fluentui/react-components";
import {
  ActivityIcon,
  ArrowLeftRightIcon,
  BlendIcon,
  EyeOffIcon,
  DownloadIcon,
  FileTextIcon,
  FolderIcon,
  GithubIcon,
  InfoIcon,
  KeyboardIcon,
  ListChecksIcon,
  MinusIcon,
  MonitorIcon,
  MouseIcon,
  MusicIcon,
  PlusIcon,
  RefreshCwIcon,
  SaveIcon,
  SettingsIcon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
  Trash2Icon,
  TriangleAlertIcon,
  UploadIcon,
  Volume2Icon,
} from "@animateicons/react/lucide";
import ElasticSlider from "./components/ElasticSlider";
import type { SettingKey, SettingsPageDescriptor, SettingsPayload, SettingValue } from "./types";

type Styles = Record<string, string>;
type Action = (name: string, data?: Record<string, unknown>) => void;
type SetSetting = (key: SettingKey, value: SettingValue) => void;

interface PageProps {
  page: SettingsPageDescriptor;
  payload: SettingsPayload;
  styles: Styles;
  setSetting: SetSetting;
  action: Action;
  openClassic: (pageId?: string) => void;
  isOpeningLegacy: boolean;
}

const t = (payload: SettingsPayload, key: string, fallback: string) => payload.labels[key] || fallback;

export function SettingsPage(props: PageProps) {
  const { page, styles } = props;
  return <>
    <header className={styles.pageHeader}>
      <Text className={styles.pageTitle} as="h1" size={700} weight="semibold">{page.title}</Text>
      <Text className={styles.pageSubtitle} size={300}>{page.subtitle}</Text>
    </header>
    {renderPage(props)}
  </>;
}

function renderPage(props: PageProps) {
  switch (props.page.id) {
    case "general": return <GeneralPage {...props} />;
    case "mouse": return <MousePage {...props} />;
    case "shortcuts": return <ShortcutsPage {...props} />;
    case "profiles": return <ProfilesPage {...props} />;
    case "app-rules": return <RulesPage {...props} />;
    case "appearance": return <AppearancePage {...props} />;
    case "media": return <MediaPage {...props} />;
    case "performance": return <PerformancePage {...props} />;
    case "updates": return <UpdatesPage {...props} />;
    case "privacy": return <PrivacyPage {...props} />;
    case "about": return <AboutPage {...props} />;
    default: return <UnsupportedPage {...props} />;
  }
}

function Section({ title, description, styles, children }: { icon?: ReactNode; title: string; description?: string; styles: Styles; children: ReactNode }) {
  return <section className={`${styles.section} section-polished`}><header className={styles.sectionHeader}><Text className={styles.sectionTitle} as="h2" size={400} weight="semibold">{title}</Text>{description && <Text className={styles.sectionDescription} size={200}>{description}</Text>}</header><div className={styles.settingList}>{children}</div></section>;
}

function ToggleRow({ payload, styles, settingKey, label, description, disabled, setSetting }: { payload: SettingsPayload; styles: Styles; settingKey: SettingKey; label: string; description?: string; disabled?: boolean; setSetting?: SetSetting }) {
  const checked = Boolean(payload.values[settingKey]);
  const update = setSetting ?? ((key: SettingKey, value: SettingValue) => window.chrome?.webview?.postMessage({ type: "setSetting", key, value }));
  return <label className={`${styles.settingRow} setting-row-polished`} htmlFor={`setting-${settingKey}`}><div className={styles.settingCopy}><Text weight="semibold">{label}</Text>{description && <Text className={styles.settingDescription} size={200}>{description}</Text>}</div><Switch id={`setting-${settingKey}`} checked={checked} disabled={disabled} aria-label={label} onChange={(_, data) => update(settingKey, data.checked)} /></label>;
}

function RangeRow({ styles, label, description, value, min, max, step = 1, suffix = "", onCommit }: { styles: Styles; label: string; description?: string; value: number; min: number; max: number; step?: number; suffix?: string; onCommit: (value: number) => void }) {
  return <div className={`${styles.settingRow} setting-row-polished`}><div className={styles.settingCopy}><Text weight="semibold">{label}</Text>{description && <Text className={styles.settingDescription} size={200}>{description}</Text>}</div><ElasticSlider className={styles.range} value={value} startingValue={min} maxValue={max} isStepped stepSize={step} suffix={suffix} ariaLabel={label} leftIcon={<MinusIcon size={15} />} rightIcon={<PlusIcon size={15} />} onCommit={onCommit} /></div>;
}

function InlineRange({ styles, label, value, onCommit }: { styles: Styles; label: string; value: number; onCommit: (value: number) => void }) {
  return <ElasticSlider className={styles.inlineRange} value={value} startingValue={0} maxValue={100} isStepped stepSize={1} suffix="%" ariaLabel={label} leftIcon={<MinusIcon size={15} />} rightIcon={<PlusIcon size={15} />} onCommit={onCommit} />;
}

function SelectRow({ styles, label, description, value, options, onChange }: { styles: Styles; label: string; description?: string; value: number; options: { value: number; label: string }[]; onChange: (value: number) => void }) {
  return <div className={`${styles.settingRow} setting-row-polished`}><div className={styles.settingCopy}><Text weight="semibold">{label}</Text>{description && <Text className={styles.settingDescription} size={200}>{description}</Text>}</div><select className={`${styles.select} select-polished`} value={value} aria-label={label} onChange={event => onChange(Number(event.currentTarget.value))}>{options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>;
}

function ListRow({ styles, title, meta, badge, actions }: { styles: Styles; title: string; meta?: string; badge?: ReactNode; actions: ReactNode }) {
  return <div className={styles.listRow}><div className="list-row-copy"><div className="list-row-title"><Text weight="semibold">{title}</Text>{badge}</div>{meta && <Text className={styles.listMeta} size={200}>{meta}</Text>}</div><div className={styles.rowActions}>{actions}</div></div>;
}

function Empty({ payload, styles }: { payload: SettingsPayload; styles: Styles }) { return <Text className={styles.empty}>{t(payload, "empty", "Nothing configured yet.")}</Text>; }

function GeneralPage({ payload, styles, action }: PageProps) {
  return <>
    <Section icon={<MonitorIcon size={18} />} title={t(payload, "startupTitle", "Startup")} description={t(payload, "startupDescription", "Launch BetterTrumpet with Windows")} styles={styles}><ToggleRow payload={payload} styles={styles} settingKey="runAtStartup" label={t(payload, "runAtStartup", "Run at Windows startup")} /></Section>
    <Section icon={<SettingsIcon size={18} />} title={t(payload, "trayTitle", "Notification icon")} description={t(payload, "trayDescription", "Tray icon appearance and behavior")} styles={styles}><ToggleRow payload={payload} styles={styles} settingKey="useLegacyIcon" label={t(payload, "useLegacyIcon", "Use original icon")} /><ToggleRow payload={payload} styles={styles} settingKey="showAppTooltips" label={t(payload, "showAppTooltips", "Show icon tooltips")} description={t(payload, "showAppTooltipsDescription", "Show details while hovering app icons.")} /></Section>
    <Section icon={<MinusIcon size={18} />} title={t(payload, "hiddenApps", "Hidden apps")} description={t(payload, "hiddenAppsDescription", "Restore apps hidden from the mixer.")} styles={styles}>{payload.collections.hiddenApps.length ? <><div className={styles.list}>{payload.collections.hiddenApps.map(item => <ListRow key={`${item.deviceId}-${item.appId}-${item.exeName}`} styles={styles} title={item.displayName} meta={item.deviceName} actions={<Button appearance="subtle" onClick={() => action("restoreHiddenApp", { ...item })}>{t(payload, "restore", "Restore")}</Button>} />)}</div><div className={styles.actionRow}><Button appearance="secondary" onClick={() => action("restoreAllHiddenApps")}>{t(payload, "restoreAll", "Restore all")}</Button></div></> : <Empty payload={payload} styles={styles} />}</Section>
    {payload.collections.hiddenDevices.length > 0 && <Section icon={<Volume2Icon size={18} />} title={t(payload, "hiddenDevices", "Hidden devices")} styles={styles}><div className={styles.list}>{payload.collections.hiddenDevices.map(item => <ListRow key={item.deviceId} styles={styles} title={item.displayName || item.deviceId} actions={<Button appearance="subtle" onClick={() => action("restoreHiddenDevice", { deviceId: item.deviceId })}>{t(payload, "restore", "Restore")}</Button>} />)}</div><div className={styles.actionRow}><Button appearance="secondary" onClick={() => action("restoreAllHiddenDevices")}>{t(payload, "restoreAll", "Restore all")}</Button></div></Section>}
  </>;
}

function MousePage({ payload, styles, setSetting }: PageProps) {
  const focusLostEnabled = Boolean(payload.values.useFocusLostVolume);
  return <><Section icon={<MouseIcon size={18} />} title={t(payload, "scrollWheelTitle", "Mouse wheel")} description={t(payload, "scrollWheelDescription", "Control volume with the wheel")} styles={styles}><ToggleRow payload={payload} styles={styles} settingKey="useScrollWheelInTray" label={t(payload, "useScrollWheelInTray", "Change volume over the tray icon")} description={t(payload, "useScrollWheelInTrayDescription", "Scroll over the notification icon.")} /><ToggleRow payload={payload} styles={styles} settingKey="useGlobalMouseWheelHook" label={t(payload, "useGlobalMouseWheelHook", "Change volume while the interface is open")} description={t(payload, "useGlobalMouseWheelHookDescription", "The wheel controls volume from the interface.")} /></Section><Section icon={<Volume2Icon size={18} />} title={t(payload, "volumeScaleTitle", "Volume scale")} description={t(payload, "volumeScaleDescription", "Volume step distribution")} styles={styles}><ToggleRow payload={payload} styles={styles} settingKey="useLogarithmicVolume" label={t(payload, "useLogarithmicVolume", "Use logarithmic scale")} /><ToggleRow payload={payload} styles={styles} settingKey="useVolumeTickSound" label={t(payload, "useVolumeTickSound", "Play a sound while adjusting")} description={t(payload, "useVolumeTickSoundDescription", "Play a light tick while changing volume.")} /></Section><Section icon={<ArrowLeftRightIcon size={18} />} title={t(payload, "deviceChangeTitle", "Device change")} description={t(payload, "deviceChangeDescription", "Toast when the default playback device switches")} styles={styles}><ToggleRow payload={payload} styles={styles} settingKey="notifyOnDeviceChange" label={t(payload, "notifyOnDeviceChange", "Show a notification when the default device changes")} /></Section><Section icon={<EyeOffIcon size={18} />} title={t(payload, "focusLostTitle", "Focus lost")} description={t(payload, "focusLostDescription", "Mute or reduce apps when another window is in front")} styles={styles}><ToggleRow payload={payload} styles={styles} settingKey="useFocusLostVolume" label={t(payload, "useFocusLostVolume", "Lower volume of apps that lose focus")} setSetting={setSetting} />{focusLostEnabled && <><RangeRow styles={styles} label={t(payload, "focusLostAttenuate", "Background volume (0% mutes)")} description={t(payload, "focusLostAttenuateHint", "Locked and keep-muted rules are left alone.")} value={Number(payload.values.focusLostAttenuatePercent)} min={0} max={100} suffix="%" onCommit={value => setSetting("focusLostAttenuatePercent", value)} /><RangeRow styles={styles} label={t(payload, "focusLostFade", "Fade duration")} description={t(payload, "focusLostFadeHint", "0 ms is immediate.")} value={Number(payload.values.focusLostFadeDurationMs)} min={0} max={5000} step={100} suffix=" ms" onCommit={value => setSetting("focusLostFadeDurationMs", value)} /><SelectRow styles={styles} label={t(payload, "focusLostScope", "Applications affected")} description={t(payload, "focusLostSelectedHint", "Use the Focus lost checkbox on an app rule to select an application.")} value={Number(payload.values.focusLostSelectedAppsOnly)} options={[{ value: 0, label: t(payload, "focusLostAllApps", "All applications") }, { value: 1, label: t(payload, "focusLostSelectedApps", "Only applications selected in App rules") }]} onChange={value => setSetting("focusLostSelectedAppsOnly", value === 1)} /></>}</Section></>;
}

function ShortcutsPage({ payload, styles }: PageProps) {
  const [recording, setRecording] = useState<string | null>(null);
  useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (event.data.type === "state") {
        setRecording(null);
      }
    };
    window.chrome?.webview?.addEventListener("message", listener);
    return () => {
      window.chrome?.webview?.removeEventListener("message", listener);
    };
  }, []);
  const start = (id: string) => { setRecording(id); window.chrome?.webview?.postMessage({ type: "hotkeyCaptureStarted" }); };
  const keyDown = (event: KeyboardEvent<HTMLButtonElement>, id: string) => {
    event.preventDefault();
    const modifierOnly = ["Control", "Shift", "Alt", "Meta"].includes(event.key);
    if (modifierOnly) return;
    const clear = event.key === "Escape" || event.key === "Backspace" || event.key === "Delete";
    window.chrome?.webview?.postMessage({ type: "setHotkey", id, keyCode: clear ? 0 : event.keyCode, ctrlKey: clear ? false : event.ctrlKey, altKey: clear ? false : event.altKey, shiftKey: clear ? false : event.shiftKey, metaKey: clear ? false : event.metaKey });
    setRecording(null);
  };
  const HotkeyButton = ({ id, value }: { id: string; value: string }) => (
    <Button className={value && recording !== id ? "hotkey-button-polished" : undefined} appearance={recording === id ? "primary" : "secondary"} onClick={() => start(id)} onKeyDown={event => keyDown(event, id)}>
      {recording === id ? t(payload, "recordShortcut", "Press a shortcut…") : value ? <span className="hotkey-chips">{value.split("+").map((part, index) => <kbd key={index}>{part.trim()}</kbd>)}</span> : t(payload, "recordShortcut", "Record")}
    </Button>
  );
  const ClearButton = ({ id }: { id: string }) => (
    <Button appearance="subtle" icon={<Trash2Icon size={17} />} aria-label={t(payload, "clearShortcut", "Clear shortcut")} onClick={() => window.chrome?.webview?.postMessage({ type: "setHotkey", id, keyCode: 0 })} />
  );
  return <>
    <Section icon={<KeyboardIcon size={18} />} title={t(payload, "shortcuts", "Keyboard shortcuts")} styles={styles}>
      <div className={styles.list}>
        {payload.collections.hotkeys.map(hotkey => <ListRow key={hotkey.id} styles={styles} title={hotkey.label} meta={hotkey.description} actions={<>
          <HotkeyButton id={hotkey.id} value={hotkey.value} />
          {hotkey.value && <ClearButton id={hotkey.id} />}
        </>} />)}
      </div>
    </Section>
    {payload.collections.deviceHotkeys.length > 0 && <Section icon={<Volume2Icon size={18} />} title={t(payload, "deviceShortcuts", "Device shortcuts")} description={t(payload, "deviceShortcutsDesc", "Switch the default playback device with one shortcut.")} styles={styles}>
      <div className={styles.list}>
        {[...payload.collections.deviceHotkeys].sort((a, b) => Number(b.isDefault) - Number(a.isDefault)).map(hotkey => <ListRow key={hotkey.id} styles={styles} title={hotkey.label} badge={hotkey.isDefault ? <span className="badge-default-polished">{t(payload, "defaultDeviceBadge", "Default")}</span> : undefined} actions={<>
          <HotkeyButton id={hotkey.id} value={hotkey.value} />
          {hotkey.value && <ClearButton id={hotkey.id} />}
        </>} />)}
      </div>
    </Section>}
  </>;
}

function ProfileHotkey({ payload, styles, profileIndex, value }: { payload: SettingsPayload; styles: Styles; profileIndex: number; value: string }) {
  const [recording, setRecording] = useState(false);
  const id = `profile:${profileIndex}`;
  const start = () => { setRecording(true); window.chrome?.webview?.postMessage({ type: "hotkeyCaptureStarted" }); };
  const keyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!recording) return;
    event.preventDefault();
    if (["Control", "Shift", "Alt", "Meta"].includes(event.key)) return;
    const clear = event.key === "Escape" || event.key === "Backspace" || event.key === "Delete";
    window.chrome?.webview?.postMessage({ type: "setHotkey", id, keyCode: clear ? 0 : event.keyCode, ctrlKey: !clear && event.ctrlKey, altKey: !clear && event.altKey, shiftKey: !clear && event.shiftKey, metaKey: !clear && event.metaKey });
    setRecording(false);
  };
  return <div className={styles.actionRow}><Button appearance={recording ? "primary" : "secondary"} onClick={start} onKeyDown={keyDown}>{recording ? t(payload, "recordShortcut", "Press a shortcut...") : value || t(payload, "recordShortcut", "Record")}</Button>{value && !recording && <Button appearance="subtle" icon={<Trash2Icon size={17} />} aria-label={t(payload, "clearShortcut", "Clear shortcut")} onClick={() => window.chrome?.webview?.postMessage({ type: "setHotkey", id, keyCode: 0 })} />}</div>;
}

function ProfilesPage({ payload, styles, action }: PageProps) {
  const [name, setName] = useState("");
  const [allDevices, setAllDevices] = useState(false);
  const selected = payload.collections.profiles.find(profile => profile.index === payload.collections.selectedProfileIndex);
  return <><Section icon={<SaveIcon size={18} />} title={t(payload, "profileCapture", "Save current volumes")} description={t(payload, "profileCaptureDescription", "Create a preset from the current audio state.")} styles={styles}><div className={styles.actionRow}><Input className={styles.controlGrow} value={name} onChange={(_, data) => setName(data.value)} placeholder={t(payload, "profileName", "Preset name")} /><Switch checked={allDevices} label={t(payload, "allDevices", "All devices")} onChange={(_, data) => setAllDevices(data.checked)} /><Button appearance="primary" icon={<SaveIcon size={17} />} onClick={() => { action("profileCapture", { name, allDevices }); setName(""); }}>{t(payload, "profileCapture", "Save")}</Button></div><ToggleRow payload={payload} styles={styles} settingKey="showQuickTrumpetConfirmation" label={t(payload, "confirmation", "Show confirmation after applying")} /></Section><Section icon={<SlidersHorizontalIcon size={18} />} title={t(payload, "savedProfiles", "Saved presets")} styles={styles}>{payload.collections.profiles.length ? <div className={styles.list}>{payload.collections.profiles.map(profile => <ListRow key={profile.index} styles={styles} title={profile.name} meta={`${profile.slug} · ${profile.details}`} actions={<Button appearance={profile.index === payload.collections.selectedProfileIndex ? "primary" : "subtle"} onClick={() => action("profileSelect", { index: profile.index })}>{profile.index === payload.collections.selectedProfileIndex ? "✓" : t(payload, "apply", "Select")}</Button>} />)}</div> : <Empty payload={payload} styles={styles} />}{selected && <><label className={styles.settingRow}><div className={styles.settingCopy}><Text weight="semibold">{t(payload, "appsOnly", "Apply apps only")}</Text></div><Switch checked={selected.applyAppsOnly} aria-label={t(payload, "appsOnly", "Apply apps only")} onChange={(_, data) => action("profileAppsOnly", { index: selected.index, value: data.checked })} /></label><div className={styles.settingRow}><div className={styles.settingCopy}><Text weight="semibold">{t(payload, "profileShortcut", "Shortcut")}</Text><Text className={styles.settingDescription} size={200}>{t(payload, "profileShortcutDescription", "Apply this preset with a global shortcut.")}</Text></div><ProfileHotkey payload={payload} styles={styles} profileIndex={selected.index} value={selected.hotkey} /></div><div className={styles.actionRow}><Button appearance="primary" onClick={() => action("profileApply", { index: selected.index })}>{t(payload, "apply", "Apply")}</Button><Button appearance="secondary" icon={<DownloadIcon size={17} />} onClick={() => action("profileExport", { index: selected.index })}>{t(payload, "export", "Export")}</Button><Button appearance="secondary" icon={<UploadIcon size={17} />} onClick={() => action("profileImport")}>{t(payload, "import", "Import")}</Button><Button appearance="subtle" icon={<Trash2Icon size={17} />} onClick={() => action("profileDelete", { index: selected.index })}>{t(payload, "delete", "Delete")}</Button></div></>}</Section></>;
}

function RulesPage({ payload, styles, action }: PageProps) {
  const [exeName, setExeName] = useState("");
  return <><Section icon={<ListChecksIcon size={18} />} title={t(payload, "appRules", "Application rules")} description={t(payload, "appRulesDescription", "Persistent mute and volume behavior per app.")} styles={styles}><div className={styles.actionRow}><Input className={styles.controlGrow} value={exeName} onChange={(_, data) => setExeName(data.value)} placeholder={t(payload, "appPlaceholder", "Application executable")} /><Button appearance="secondary" onClick={() => action("appRuleBrowse")}>{t(payload, "browse", "Browse")}</Button><Button appearance="primary" icon={<PlusIcon size={17} />} disabled={!exeName.trim()} onClick={() => { action("appRuleAdd", { exeName }); setExeName(""); }}>{t(payload, "addApp", "Add")}</Button></div>{payload.collections.appRules.length ? <div className={styles.list}>{payload.collections.appRules.map(rule => <div className={styles.listRow} key={rule.exeName}><div><Text weight="semibold">{rule.displayName || rule.exeName}</Text><Text className={styles.listMeta} size={200}>{rule.exeName}.exe</Text></div><div className={styles.rowActions}><Switch checked={rule.hardMuted} label={t(payload, "hardMute", "Keep muted")} onChange={(_, data) => action("appRuleUpdate", { exeName: rule.exeName, hardMuted: data.checked })} /><Switch checked={rule.focusLost} label={t(payload, "focusLostRule", "Focus lost")} onChange={(_, data) => action("appRuleUpdate", { exeName: rule.exeName, focusLost: data.checked })} /><select className={styles.select} value={rule.volumeMode} aria-label={t(payload, "volumeBehavior", "Volume behavior")} onChange={event => action("appRuleUpdate", { exeName: rule.exeName, volumeMode: Number(event.currentTarget.value) })}><option value={0}>{t(payload, "modeNone", "None")}</option><option value={1}>{t(payload, "modeLaunch", "Set at launch")}</option><option value={2}>{t(payload, "modeLock", "Lock")}</option></select>{rule.volumeMode > 0 && <InlineRange styles={styles} label={t(payload, "targetVolume", "Target volume")} value={rule.volumePercent} onCommit={value => action("appRuleUpdate", { exeName: rule.exeName, volumePercent: value })} />}<Button appearance="subtle" icon={<Trash2Icon size={17} />} aria-label={t(payload, "delete", "Delete")} onClick={() => action("appRuleRemove", { exeName: rule.exeName })} /></div></div>)}</div> : <Empty payload={payload} styles={styles} />}{payload.collections.appRules.length > 0 && <div className={styles.actionRow}><Button appearance="subtle" onClick={() => action("appRuleClear")}>{t(payload, "clearAllRules", "Clear all rules")}</Button></div>}</Section><Section icon={<FolderIcon size={18} />} title={t(payload, "folderRules", "Folder defaults")} styles={styles}><div className={styles.actionRow}><Button appearance="primary" icon={<FolderIcon size={17} />} onClick={() => action("folderRuleAdd")}>{t(payload, "addFolder", "Add folder")}</Button></div>{payload.collections.folderRules.length ? <div className={styles.list}>{payload.collections.folderRules.map(rule => <div className={styles.listRow} key={rule.id}><Text className={styles.controlGrow}>{rule.folderPath}</Text><div className={styles.rowActions}><InlineRange styles={styles} label={t(payload, "targetVolume", "Target volume")} value={rule.volumePercent} onCommit={value => action("folderRuleUpdate", { ...rule, volumePercent: value })} /><Button appearance="subtle" icon={<FolderIcon size={17} />} aria-label={t(payload, "changeFolder", "Change folder")} title={t(payload, "changeFolder", "Change folder")} onClick={() => action("folderRuleBrowse", { id: rule.id })} /><Button appearance="subtle" icon={<Trash2Icon size={17} />} aria-label={t(payload, "delete", "Delete")} onClick={() => action("folderRuleRemove", { id: rule.id })} /></div></div>)}</div> : <Text className={styles.empty}>{t(payload, "folderRulesEmpty", "No folder defaults.")}</Text>}</Section></>;
}

function AppearancePage({ payload, styles, setSetting, action }: PageProps) {
  const [themeName, setThemeName] = useState("");
  const colorFields: { key: SettingKey; label: string }[] = [
    { key: "sliderThumbColor", label: t(payload, "sliderThumb", "Thumb") },
    { key: "sliderTrackFillColor", label: t(payload, "sliderFill", "Fill") },
    { key: "sliderTrackBackgroundColor", label: t(payload, "sliderTrack", "Track") },
    { key: "peakMeterColor", label: t(payload, "peakColor", "Peak") },
    { key: "windowBackgroundColor", label: t(payload, "windowColor", "Window") },
    { key: "textColor", label: t(payload, "textColor", "Text") },
    { key: "accentGlowColor", label: t(payload, "accentColor", "Accent") },
  ];
  return <><Section icon={<MusicIcon size={18} />} title={t(payload, "dynamicAlbum", "Dynamic album theme")} description={t(payload, "dynamicAlbumDescription", "Adapt colors to the current artwork.")} styles={styles}><ToggleRow payload={payload} styles={styles} settingKey="useDynamicAlbumArtTheme" label={t(payload, "enableDynamicAlbum", "Enable dynamic album theme")} setSetting={setSetting} /></Section><Section icon={<BlendIcon size={18} />} title={t(payload, "presets", "Presets")} description={t(payload, "appearanceDescription", "Choose a coordinated color palette.")} styles={styles}><div className={styles.themeGrid}>{payload.collections.themes.map(theme => <div className={styles.themeItem} key={theme.name}><button className={mergeClasses(styles.themeButton, payload.collections.activeThemeName === theme.name && styles.themeSelected)} onClick={() => action("themeSelect", { name: theme.name })}><Text weight="semibold">{theme.name}</Text><span className={styles.swatches}>{theme.colors.map((color, index) => <span key={`${color}-${index}`} className={styles.swatch} style={{ backgroundColor: color }} />)}</span></button>{theme.isCustom && <Button className={styles.themeDelete} appearance="subtle" icon={<Trash2Icon size={15} />} aria-label={t(payload, "deleteTheme", "Delete theme")} title={t(payload, "deleteTheme", "Delete theme")} onClick={() => action("themeDelete", { name: theme.name })} />}</div>)}</div></Section><Section icon={<SlidersHorizontalIcon size={18} />} title={t(payload, "customColors", "Custom colors")} description={t(payload, "customColorsDescription", "Fine tune each visual channel.")} styles={styles}><ToggleRow payload={payload} styles={styles} settingKey="useCustomSliderColors" label={t(payload, "useCustomColors", "Use custom colors")} setSetting={setSetting} />{colorFields.map(field => <div className={styles.settingRow} key={field.key}><Text weight="semibold">{field.label}</Text><input className={styles.colorInput} type="color" value={String(payload.values[field.key]).slice(0, 7)} aria-label={field.label} onChange={event => setSetting(field.key, event.currentTarget.value)} /></div>)}<RangeRow styles={styles} label={t(payload, "windowOpacity", "Window opacity")} value={Math.round(Number(payload.values.windowBackgroundOpacity) * 100)} min={5} max={100} suffix="%" onCommit={value => setSetting("windowBackgroundOpacity", value / 100)} /><SelectRow styles={styles} label={t(payload, "peakStyle", "Peak meter style")} value={Number(payload.values.peakMeterStyleIndex)} options={[0,1,2,3,4].map((value, index) => ({ value, label: ["Classic", "Dotted", "Blocks", "Bars", "Wave"][index] }))} onChange={value => setSetting("peakMeterStyleIndex", value)} /><div className={styles.actionRow}><Button appearance="secondary" onClick={() => action("themeRandomize")}>{t(payload, "randomize", "Randomize")}</Button><Button appearance="secondary" onClick={() => action("themeReset")}>{t(payload, "reset", "Reset")}</Button><Input className={styles.controlGrow} value={themeName} onChange={(_, data) => setThemeName(data.value)} placeholder={t(payload, "profileName", "Theme name")} /><Button appearance="primary" onClick={() => { action("themeSave", { name: themeName }); setThemeName(""); }}>{t(payload, "saveTheme", "Save theme")}</Button><Button appearance="subtle" icon={<DownloadIcon size={17} />} onClick={() => action("themeExport")}>{t(payload, "export", "Export")}</Button><Button appearance="subtle" icon={<UploadIcon size={17} />} onClick={() => action("themeImport")}>{t(payload, "import", "Import")}</Button></div></Section></>;
}

function MediaPage({ payload, styles, setSetting }: PageProps) {
  return <><Section icon={<MusicIcon size={18} />} title={t(payload, "mediaPopup", "Media popup")} description={t(payload, "mediaPopupDescription", "Playback controls on tray hover.")} styles={styles}><ToggleRow payload={payload} styles={styles} settingKey="mediaPopupEnabled" label={t(payload, "enableMediaPopup", "Enable media popup")} /></Section><Section icon={<MouseIcon size={18} />} title={t(payload, "interaction", "Interaction")} styles={styles}><RangeRow styles={styles} label={t(payload, "hoverDelay", "Hover delay")} value={Number(payload.values.mediaPopupHoverDelay)} min={0.5} max={5} step={0.25} suffix={` ${t(payload, "seconds", "s")}`} onCommit={value => setSetting("mediaPopupHoverDelay", value)} /><ToggleRow payload={payload} styles={styles} settingKey="showWhenPaused" label={t(payload, "showWhenPaused", "Show when paused")} /><ToggleRow payload={payload} styles={styles} settingKey="mediaPopupRememberExpanded" label={t(payload, "rememberExpanded", "Remember expanded state")} /></Section></>;
}

function PerformancePage({ payload, styles, setSetting }: PageProps) {
  return <><Section icon={<ActivityIcon size={18} />} title={t(payload, "ecoMode", "Eco mode")} description={t(payload, "ecoModeDescription", "Reduce rendering work and CPU usage.")} styles={styles}><ToggleRow payload={payload} styles={styles} settingKey="ecoMode" label={t(payload, "enableEcoMode", "Enable eco mode")} /><ToggleRow payload={payload} styles={styles} settingKey="autoEcoMode" label={t(payload, "autoEcoMode", "Enable on battery")} /><Text className={styles.empty}>{payload.status.effectivePeakMeterFps} FPS{payload.status.ecoModeActive ? " · Eco" : ""}</Text></Section><Section icon={<SlidersHorizontalIcon size={18} />} title={t(payload, "animations", "Animations")} styles={styles}><ToggleRow payload={payload} styles={styles} settingKey="useSmoothVolumeAnimation" label={t(payload, "smoothAnimation", "Smooth volume animation")} /><RangeRow styles={styles} label={t(payload, "animationSpeed", "Animation speed")} value={Number(payload.values.volumeAnimationSpeed)} min={1} max={10} onCommit={value => setSetting("volumeAnimationSpeed", value)} /></Section><Section icon={<Volume2Icon size={18} />} title={t(payload, "peakMeter", "Peak meter")} styles={styles}><SelectRow styles={styles} label={t(payload, "refreshRate", "Refresh rate")} value={Number(payload.values.peakMeterFps)} options={[5,20,30,60].map(value => ({ value, label: `${value} FPS` }))} onChange={value => setSetting("peakMeterFps", value)} /></Section></>;
}

function UpdatesPage({ payload, styles, setSetting, action }: PageProps) {
  return <Section icon={<RefreshCwIcon size={18} />} title={t(payload, "updates", "Updates")} description={t(payload, "updatesDescription", "Choose how BetterTrumpet is updated.")} styles={styles}><ToggleRow payload={payload} styles={styles} settingKey="autoCheckForUpdates" label={t(payload, "autoUpdates", "Check automatically")} /><SelectRow styles={styles} label={t(payload, "notifyFor", "Notify for")} value={Number(payload.values.updateChannelIndex)} options={[0,1,2,3].map(value => ({ value, label: payload.labels[`updateChannel${value}`] || ["All updates", "Minor and major", "Major only", "Never"][value] }))} onChange={value => setSetting("updateChannelIndex", value)} /><ListRow styles={styles} title={payload.status.updateText || t(payload, "checkUpdate", "Check for updates")} meta={payload.status.updateDetail} actions={<><Button appearance="secondary" icon={payload.status.updateBusy ? <Spinner size="tiny" /> : <RefreshCwIcon size={17} />} disabled={payload.status.updateBusy} onClick={() => action("checkUpdate")}>{t(payload, "checkUpdate", "Check")}</Button>{payload.status.updateAvailable && <Button appearance="primary" icon={<DownloadIcon size={17} />} onClick={() => action("installUpdate")}>{t(payload, "installUpdate", "Install")}</Button>}</>} /></Section>;
}

function PrivacyPage({ payload, styles, action }: PageProps) {
  return <><Section icon={<ShieldCheckIcon size={18} />} title={t(payload, "privacy", "Diagnostics data")} description={t(payload, "privacyDescription", "Help improve stability with anonymous diagnostics.")} styles={styles}><ToggleRow payload={payload} styles={styles} settingKey="isTelemetryEnabled" label={t(payload, "privacy", "Share diagnostics")} /></Section><Section icon={<FileTextIcon size={18} />} title={t(payload, "settingsData", "Settings data")} description={t(payload, "settingsDataDescription", "Back up or restore your configuration.")} styles={styles}><div className={styles.actionRow}><Button appearance="secondary" icon={<DownloadIcon size={17} />} onClick={() => action("settingsExport")}>{t(payload, "exportSettings", "Export settings")}</Button><Button appearance="secondary" icon={<UploadIcon size={17} />} onClick={() => action("settingsImport")}>{t(payload, "importSettings", "Import settings")}</Button></div></Section></>;
}

function AboutPage({ payload, styles, action }: PageProps) {
  return <><Section icon={<InfoIcon size={18} />} title={`${payload.appName} ${payload.status.version}`} description="© 2026 xmn" styles={styles}><div className={styles.actionRow}><Button appearance="secondary" icon={<GithubIcon size={17} />} onClick={() => action("github")}>{t(payload, "github", "GitHub")}</Button><Button appearance="secondary" onClick={() => action("feedback")}>{t(payload, "feedback", "Feedback")}</Button><Button appearance="secondary" icon={<TriangleAlertIcon size={17} />} onClick={() => action("bugReport")}>{t(payload, "bugReport", "Report a bug")}</Button></div></Section><Section icon={<ActivityIcon size={18} />} title={t(payload, "diagnostics", "Diagnostics")} description={t(payload, "diagnosticsDescription", "Create a support bundle with logs and app state.")} styles={styles}><Text className={styles.empty}>{payload.status.health}</Text><div className={styles.actionRow}><Button appearance="primary" onClick={() => action("diagnostics")}>{t(payload, "diagnostics", "Export diagnostics")}</Button></div></Section>{payload.status.monkeyUnlocked && <Section icon={<MusicIcon size={18} />} title={t(payload, "monkeySound", "Alternate volume sound")} styles={styles}><ToggleRow payload={payload} styles={styles} settingKey="useMonkeyTickSound" label={t(payload, "monkeySound", "Use alternate volume sound")} description={t(payload, "monkeySoundDescription", "Play the unlocked sound set while adjusting volume.")} /></Section>}</>;
}

function UnsupportedPage({ page, payload, styles, openClassic, isOpeningLegacy }: PageProps) {
  return <Section icon={<InfoIcon size={18} />} title={page.title} description={page.subtitle} styles={styles}><div className={styles.actionRow}><Button appearance="primary" disabled={isOpeningLegacy} onClick={() => openClassic(page.id)}>{isOpeningLegacy ? <Spinner size="tiny" /> : t(payload, "classicSettings", "Open classic settings")}</Button></div></Section>;
}
