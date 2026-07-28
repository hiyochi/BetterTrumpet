using EarTrumpet.UI.Helpers;
using System;
using System.Windows.Threading;

namespace EarTrumpet.UI.ViewModels
{
    /// <summary>
    /// One editable row in the app rules settings list. Wraps a persisted
    /// <see cref="AppSettings.AppRuleEntry"/> and writes changes straight back through
    /// AppSettings, so edits here behave exactly like edits from the flyout menu.
    /// </summary>
    public class AppRuleItemViewModel : BindableBase
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

        public string ExeName { get; }
        public string DisplayName { get; }

        /// <summary>Friendly name when we captured one, otherwise the exe we key on.</summary>
        public string Title => string.IsNullOrWhiteSpace(DisplayName) ? ExeName : DisplayName;

        /// <summary>Always shown, so it is obvious the rule is keyed on the executable.</summary>
        public string Subtitle => ExeName;

        public string[] VolumeModeOptions { get; } =
        {
            Properties.Resources.AppRulesModeNoneText,
            Properties.Resources.AppRulesModeLaunchText,
            Properties.Resources.AppRulesModeLockText,
        };

        public AppRuleItemViewModel(AppSettings settings, AppSettings.AppRuleEntry entry, bool isRunning)
        {
            _settings = settings;

            ExeName = entry.ExeName;
            DisplayName = entry.DisplayName;
            _hardMuted = entry.HardMuted;
            _volumeModeIndex = (int)entry.VolumeMode;
            _volumePercent = entry.VolumePercent;
            _isRunning = isRunning;

            _volumeWriteTimer = new DispatcherTimer { Interval = VolumeWriteDelay };
            _volumeWriteTimer.Tick += OnVolumeWriteTick;
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

        /// <summary>0 = no rule, 1 = Launch, 2 = Lock. Indexes <see cref="VolumeModeOptions"/>.</summary>
        public int VolumeModeIndex
        {
            get => _volumeModeIndex;
            set
            {
                if (_volumeModeIndex == value || value < 0 || value >= VolumeModeOptions.Length)
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
