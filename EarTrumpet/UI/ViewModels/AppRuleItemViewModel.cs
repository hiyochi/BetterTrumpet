using EarTrumpet.UI.Helpers;
using System;
using System.Linq;
using System.Windows.Threading;

namespace EarTrumpet.UI.ViewModels
{
    /// <summary>
    /// One editable row in the app rules settings list. Wraps a persisted
    /// <see cref="AppSettings.AppRuleEntry"/> and writes changes straight back through
    /// AppSettings, so edits here behave exactly like edits from the flyout menu.
    /// </summary>
    public class AppRuleItemViewModel : BindableBase, IAppIconSource
    {
        // Volume writes come from a slider drag, so they are debounced: without this
        // every pixel of the drag would serialize the whole rule list to the registry
        // (or rewrite settings.json in portable mode).
        private static readonly TimeSpan VolumeWriteDelay = TimeSpan.FromMilliseconds(250);

        private readonly AppSettings _settings;
        private readonly DispatcherTimer _volumeWriteTimer;

        private bool _hardMuted;
        private int _volumeModeIndex;
        private int _volumePercent;
        private bool _isRunning;
        private string _iconPath;
        private bool _isDesktopApp;

        public string ExeName { get; }
        public string DisplayName { get; }
        public string IconPath => _iconPath;
        public bool IsDesktopApp => _isDesktopApp;
        public bool HasIcon => !string.IsNullOrWhiteSpace(_iconPath);
        public char IconText => string.IsNullOrWhiteSpace(Title)
            ? '?'
            : Title.ToUpperInvariant().FirstOrDefault(character => char.IsLetterOrDigit(character));

        /// <summary>Friendly name when we captured one, otherwise the exe we key on.</summary>
        public string Title => string.IsNullOrWhiteSpace(DisplayName) ? ExeName : DisplayName;

        /// <summary>Always shown, so it is obvious the rule is keyed on the executable.</summary>
        public string Subtitle => ExeName.EndsWith(".exe", StringComparison.OrdinalIgnoreCase)
            ? ExeName
            : $"{ExeName}.exe";

        public AppRuleItemViewModel(AppSettings settings, AppSettings.AppRuleEntry entry, IAppItemViewModel liveApp)
        {
            _settings = settings;

            ExeName = entry.ExeName;
            DisplayName = entry.DisplayName;
            _hardMuted = entry.HardMuted;
            _volumeModeIndex = (int)entry.VolumeMode;
            _volumePercent = entry.VolumePercent;
            _isRunning = liveApp != null;
            _iconPath = !string.IsNullOrWhiteSpace(liveApp?.IconPath) ? liveApp.IconPath : entry.IconPath;
            _isDesktopApp = liveApp?.IsDesktopApp ?? entry.IsDesktopApp;

            _volumeWriteTimer = new DispatcherTimer { Interval = VolumeWriteDelay };
            _volumeWriteTimer.Tick += OnVolumeWriteTick;
        }

        /// <summary>
        /// Refreshes this row from storage without writing the values back. Reusing the row
        /// keeps keyboard focus and an active slider intact when the flyout changes a rule.
        /// </summary>
        internal void Apply(AppSettings.AppRuleEntry entry, IAppItemViewModel liveApp)
        {
            if (entry == null)
            {
                return;
            }

            if (_hardMuted != entry.HardMuted)
            {
                _hardMuted = entry.HardMuted;
                RaisePropertyChanged(nameof(HardMuted));
            }

            var newModeIndex = (int)entry.VolumeMode;
            if (_volumeModeIndex != newModeIndex)
            {
                _volumeModeIndex = newModeIndex;
                RaisePropertyChanged(nameof(VolumeModeIndex));
                RaisePropertyChanged(nameof(HasVolumeRule));
            }

            if (_volumePercent != entry.VolumePercent)
            {
                _volumeWriteTimer.Stop();
                _volumePercent = entry.VolumePercent;
                RaisePropertyChanged(nameof(VolumePercent));
            }

            var newIconPath = !string.IsNullOrWhiteSpace(liveApp?.IconPath) ? liveApp.IconPath : entry.IconPath;
            var newIsDesktopApp = liveApp?.IsDesktopApp ?? entry.IsDesktopApp;
            if (_iconPath != newIconPath || _isDesktopApp != newIsDesktopApp)
            {
                _iconPath = newIconPath;
                _isDesktopApp = newIsDesktopApp;
                RaisePropertyChanged(nameof(IconPath));
                RaisePropertyChanged(nameof(IsDesktopApp));
                RaisePropertyChanged(nameof(HasIcon));
            }

            IsRunning = liveApp != null;
        }

        public bool HardMuted
        {
            get => _hardMuted;
            set
            {
                if (_hardMuted == value)
                {
                    return;
                }

                _hardMuted = value;
                RaisePropertyChanged(nameof(HardMuted));
                _settings.SetAppHardMuted(ExeName, value, DisplayName);
            }
        }

        /// <summary>0 = no rule, 1 = Launch, 2 = Lock.</summary>
        public int VolumeModeIndex
        {
            get => _volumeModeIndex;
            set
            {
                if (_volumeModeIndex == value || !Enum.IsDefined(typeof(AppSettings.VolumeRuleMode), value))
                {
                    return;
                }

                _volumeModeIndex = value;
                RaisePropertyChanged(nameof(VolumeModeIndex));
                RaisePropertyChanged(nameof(HasVolumeRule));
                WriteVolumeRule();
            }
        }

        public bool HasVolumeRule => _volumeModeIndex != (int)AppSettings.VolumeRuleMode.None;

        public int VolumePercent
        {
            get => _volumePercent;
            set
            {
                var bounded = Math.Max(0, Math.Min(100, value));
                if (_volumePercent == bounded)
                {
                    return;
                }

                _volumePercent = bounded;
                RaisePropertyChanged(nameof(VolumePercent));

                // Restart on every tick so only the value the user settles on is written.
                _volumeWriteTimer.Stop();
                _volumeWriteTimer.Start();
            }
        }

        /// <summary>True when the app currently has a live audio session.</summary>
        public bool IsRunning
        {
            get => _isRunning;
            internal set
            {
                if (_isRunning != value)
                {
                    _isRunning = value;
                    RaisePropertyChanged(nameof(IsRunning));
                    RaisePropertyChanged(nameof(StatusText));
                }
            }
        }

        public string StatusText => _isRunning
            ? Properties.Resources.AppRulesStatusRunningText
            : Properties.Resources.AppRulesStatusNotRunningText;

        /// <summary>
        /// Stops watching this row and flushes any debounced volume write, so a drag that
        /// hadn't settled when the list was rebuilt isn't silently discarded.
        /// </summary>
        internal void Detach()
        {
            _volumeWriteTimer.Tick -= OnVolumeWriteTick;

            if (_volumeWriteTimer.IsEnabled)
            {
                _volumeWriteTimer.Stop();
                WriteVolumeRule();
            }
        }

        private void OnVolumeWriteTick(object sender, EventArgs e)
        {
            _volumeWriteTimer.Stop();
            WriteVolumeRule();
        }

        private void WriteVolumeRule()
        {
            _settings.SetAppVolumeRule(
                ExeName,
                (AppSettings.VolumeRuleMode)_volumeModeIndex,
                _volumePercent,
                DisplayName);
        }
    }
}
