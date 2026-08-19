export type SettingValue = boolean | number | string;

export type SettingKey =
  | "runAtStartup"
  | "useLegacyIcon"
  | "showAppTooltips"
  | "useScrollWheelInTray"
  | "useGlobalMouseWheelHook"
  | "useLogarithmicVolume"
  | "useVolumeTickSound"
  | "notifyOnDeviceChange"
  | "useFocusLostVolume"
  | "focusLostAttenuatePercent"
  | "focusLostFadeDurationMs"
  | "focusLostSelectedAppsOnly"
  | "showQuickTrumpetConfirmation"
  | "mediaPopupEnabled"
  | "mediaPopupHoverDelay"
  | "showWhenPaused"
  | "mediaPopupRememberExpanded"
  | "ecoMode"
  | "autoEcoMode"
  | "useSmoothVolumeAnimation"
  | "volumeAnimationSpeed"
  | "peakMeterFps"
  | "useCustomSliderColors"
  | "peakMeterStyleIndex"
  | "windowBackgroundOpacity"
  | "useDynamicAlbumArtTheme"
  | "sliderThumbColor"
  | "sliderTrackFillColor"
  | "sliderTrackBackgroundColor"
  | "peakMeterColor"
  | "windowBackgroundColor"
  | "textColor"
  | "accentGlowColor"
  | "isTelemetryEnabled"
  | "autoCheckForUpdates"
  | "updateChannelIndex"
  | "useMonkeyTickSound";

export interface SettingsPageDescriptor {
  id: string;
  title: string;
  subtitle: string;
  migrated: boolean;
}

export interface SettingsCategoryDescriptor {
  title: string;
  pages: SettingsPageDescriptor[];
}

export interface HiddenApp {
  deviceId: string;
  appId: string;
  exeName: string;
  displayName: string;
  deviceName: string;
}

export interface HiddenDevice {
  deviceId: string;
  displayName: string;
}

export interface HotkeySetting {
  id: string;
  label: string;
  description: string;
  value: string;
}

export interface DeviceHotkeySetting extends HotkeySetting {
  deviceId: string;
  deviceName: string;
  isDefault: boolean;
}

export interface VolumeProfile {
  index: number;
  name: string;
  slug: string;
  details: string;
  applyAppsOnly: boolean;
  hotkey: string;
}

export interface AppRule {
  exeName: string;
  displayName: string;
  hardMuted: boolean;
  focusLost: boolean;
  volumeMode: number;
  volumePercent: number;
}

export interface FolderRule {
  id: string;
  folderPath: string;
  volumePercent: number;
}

export interface ThemePreset {
  name: string;
  category: string;
  colors: string[];
  isCustom: boolean;
}

export interface SettingsCollections {
  hiddenApps: HiddenApp[];
  hiddenDevices: HiddenDevice[];
  hotkeys: HotkeySetting[];
  deviceHotkeys: DeviceHotkeySetting[];
  profiles: VolumeProfile[];
  selectedProfileIndex: number;
  appRules: AppRule[];
  folderRules: FolderRule[];
  themes: ThemePreset[];
  activeThemeName: string;
}

export interface SettingsStatus {
  version: string;
  health: string;
  updateText: string;
  updateDetail: string;
  updateAvailable: boolean;
  updateBusy: boolean;
  effectivePeakMeterFps: number;
  ecoModeActive: boolean;
  monkeyUnlocked: boolean;
}

export interface SettingsPayload {
  appName: string;
  locale: string;
  categories: SettingsCategoryDescriptor[];
  labels: Record<string, string>;
  values: Record<SettingKey, SettingValue>;
  collections: SettingsCollections;
  status: SettingsStatus;
}

export type HostMessage =
  | { type: "state"; data: SettingsPayload }
  | { type: "settingChanged"; key: SettingKey; value: SettingValue }
  | { type: "error"; message: string };

declare global {
  interface Window {
    chrome?: {
      webview?: {
        addEventListener: (type: "message", listener: (event: MessageEvent<HostMessage>) => void) => void;
        removeEventListener: (type: "message", listener: (event: MessageEvent<HostMessage>) => void) => void;
        postMessage: (message: unknown) => void;
      };
    };
  }
}