using EarTrumpet.UI.Helpers;
using System;
using System.Collections.ObjectModel;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Windows;
using System.Windows.Input;
using System.Windows.Threading;

namespace EarTrumpet.UI.ViewModels
{
    /// <summary>
    /// The manageable list of per-app rules: one row per app, editable in place.
    /// Rules can also be created here for apps that aren't running, which is the only
    /// way to reach an app that never shows up in the flyout.
    /// </summary>
    public class EarTrumpetAppRulesSettingsPageViewModel : SettingsPageViewModel
    {
        private readonly AppSettings _settings;
        private bool _isSubscribed;
        private bool _syncPending;
        private bool _isAddRulePanelOpen;

        public ObservableCollection<AppRuleItemViewModel> Rules { get; } = new ObservableCollection<AppRuleItemViewModel>();

        public bool HasRules => Rules.Count > 0;
        public bool IsEmpty => Rules.Count == 0;

        private string _newRuleExeName = "";
        public string NewRuleExeName
        {
            get => _newRuleExeName;
            set
            {
                _newRuleExeName = value;
                RaisePropertyChanged(nameof(NewRuleExeName));
                RaisePropertyChanged(nameof(CanAddRule));
            }
        }

        public bool CanAddRule => !string.IsNullOrWhiteSpace(NewRuleExeName);

        public bool IsAddRulePanelOpen
        {
            get => _isAddRulePanelOpen;
            set
            {
                if (_isAddRulePanelOpen != value)
                {
                    _isAddRulePanelOpen = value;
                    RaisePropertyChanged(nameof(IsAddRulePanelOpen));
                }
            }
        }

        public ICommand AddRuleCommand { get; }
        public ICommand BrowseForExeCommand { get; }
        public ICommand RemoveRuleCommand { get; }
        public ICommand ClearAllRulesCommand { get; }
        public ICommand ToggleAddRulePanelCommand { get; }

        public EarTrumpetAppRulesSettingsPageViewModel(AppSettings settings) : base(null)
        {
            _settings = settings;
            Title = Properties.Resources.AppRulesSettingsPageText;
            Subtitle = Properties.Resources.AppRulesSettingsPageSubtitle;
            Glyph = "\xE72E"; // Lock icon

            AddRuleCommand = new RelayCommand(AddRuleFromExeName);
            BrowseForExeCommand = new RelayCommand(BrowseForExe);
            RemoveRuleCommand = new RelayCommand<AppRuleItemViewModel>(RemoveRule);
            ClearAllRulesCommand = new RelayCommand(ClearAllRules);
            ToggleAddRulePanelCommand = new RelayCommand(() => IsAddRulePanelOpen = !IsAddRulePanelOpen);

            SyncRules();
        }

        /// <summary>
        /// Subscribe only while this page is visible. This keeps flyout edits live without
        /// letting the long-lived settings object retain closed settings page instances.
        /// </summary>
        public override void NavigatedTo()
        {
            if (!_isSubscribed)
            {
                _settings.AppRulesChanged += OnAppRulesChanged;
                _isSubscribed = true;
            }

            SyncRules();
        }

        public override bool NavigatingFrom(NavigationCookie cookie)
        {
            if (_isSubscribed)
            {
                _settings.AppRulesChanged -= OnAppRulesChanged;
                _isSubscribed = false;
            }

            foreach (var row in Rules)
            {
                row.Detach();
            }

            Rules.Clear();
            RaiseRuleCollectionStateChanged();
            return base.NavigatingFrom(cookie);
        }

        private void OnAppRulesChanged()
        {
            var dispatcher = Application.Current?.Dispatcher;
            if (dispatcher == null || _syncPending)
            {
                return;
            }

            _syncPending = true;
            dispatcher.BeginInvoke(DispatcherPriority.DataBind, new Action(() =>
            {
                _syncPending = false;
                if (_isSubscribed)
                {
                    SyncRules();
                }
            }));
        }

        private void SyncRules()
        {
            try
            {
                var runningApps = GetRunningApps();
                var storedRules = _settings.GetAppRules();
                var rowsByExeName = Rules.ToDictionary(row => row.ExeName, StringComparer.OrdinalIgnoreCase);
                var retainedExeNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

                for (int index = 0; index < storedRules.Count; index++)
                {
                    var rule = storedRules[index];
                    retainedExeNames.Add(rule.ExeName);
                    runningApps.TryGetValue(rule.ExeName, out var liveApp);

                    if (!rowsByExeName.TryGetValue(rule.ExeName, out var row))
                    {
                        row = new AppRuleItemViewModel(_settings, rule, liveApp);
                        Rules.Insert(Math.Min(index, Rules.Count), row);
                        rowsByExeName.Add(rule.ExeName, row);
                    }
                    else
                    {
                        row.Apply(rule, liveApp);
                        var currentIndex = Rules.IndexOf(row);
                        if (currentIndex != index)
                        {
                            Rules.Move(currentIndex, index);
                        }
                    }
                }

                for (int index = Rules.Count - 1; index >= 0; index--)
                {
                    var row = Rules[index];
                    if (!retainedExeNames.Contains(row.ExeName))
                    {
                        row.Detach();
                        Rules.RemoveAt(index);
                    }
                }
            }
            catch (Exception ex)
            {
                Trace.WriteLine($"AppRulesVM SyncRules failed: {ex.Message}");
            }

            RaiseRuleCollectionStateChanged();
        }

        private void RaiseRuleCollectionStateChanged()
        {
            RaisePropertyChanged(nameof(HasRules));
            RaisePropertyChanged(nameof(IsEmpty));
        }

        private Dictionary<string, IAppItemViewModel> GetRunningApps()
        {
            var running = new Dictionary<string, IAppItemViewModel>(StringComparer.OrdinalIgnoreCase);

            try
            {
                var collection = ((App)Application.Current).CollectionViewModel;
                if (collection == null)
                {
                    return running;
                }

                foreach (var device in collection.AllDevices)
                {
                    foreach (var app in device.Apps)
                    {
                        if (!string.IsNullOrWhiteSpace(app.ExeName))
                        {
                            if (!running.ContainsKey(app.ExeName))
                            {
                                running.Add(app.ExeName, app);
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Trace.WriteLine($"AppRulesVM GetRunningApps failed: {ex.Message}");
            }

            return running;
        }

        // A new rule starts as a hard mute: that's the only state that means something
        // on its own, and the row's controls take it from there.
        private void AddRuleFromExeName()
        {
            var exeName = NormalizeTypedExeName(NewRuleExeName);
            if (string.IsNullOrEmpty(exeName))
            {
                return;
            }

            _settings.SetAppHardMuted(exeName, true, exeName);
            NewRuleExeName = "";
            IsAddRulePanelOpen = false;
            SyncRules();
        }

        /// <summary>
        /// Matches what a live session reports as its ExeName, which is the file name with
        /// no extension (DesktopAppInfo uses Path.GetFileNameWithoutExtension). Typing
        /// "steam.exe" or pasting a full path both have to end up as "steam", otherwise the
        /// rule is stored but never matches anything.
        /// </summary>
        private static string NormalizeTypedExeName(string typed)
        {
            var value = (typed ?? "").Trim().Trim('"');
            if (string.IsNullOrEmpty(value))
            {
                return "";
            }

            try
            {
                // Handles both a bare name and a full path.
                var withoutExtension = System.IO.Path.GetFileNameWithoutExtension(value);
                return string.IsNullOrWhiteSpace(withoutExtension) ? value : withoutExtension;
            }
            catch (ArgumentException)
            {
                // Invalid path characters: fall back to trimming a trailing .exe by hand.
                return value.EndsWith(".exe", StringComparison.OrdinalIgnoreCase)
                    ? value.Substring(0, value.Length - 4)
                    : value;
            }
        }

        private void BrowseForExe()
        {
            try
            {
                var dlg = new Microsoft.Win32.OpenFileDialog
                {
                    Title = Properties.Resources.AppRulesBrowseDialogTitle,
                    Filter = Properties.Resources.AppRulesBrowseDialogFilter,
                    DefaultExt = ".exe",
                    CheckFileExists = true,
                };

                if (dlg.ShowDialog() == true)
                {
                    var exeName = NormalizeTypedExeName(dlg.FileName);
                    _settings.SetAppHardMuted(exeName, true, exeName, dlg.FileName, true);
                    NewRuleExeName = "";
                    IsAddRulePanelOpen = false;
                    SyncRules();
                }
            }
            catch (Exception ex)
            {
                Trace.WriteLine($"AppRulesVM BrowseForExe failed: {ex.Message}");
            }
        }

        private void RemoveRule(AppRuleItemViewModel row)
        {
            if (row == null)
            {
                return;
            }

            _settings.RemoveAppRule(row.ExeName);
            SyncRules();
        }

        private void ClearAllRules()
        {
            if (Rules.Count == 0)
            {
                return;
            }

            var result = MessageBox.Show(
                Properties.Resources.AppRulesClearAllConfirmText,
                Properties.Resources.AppRulesClearAllConfirmTitle,
                MessageBoxButton.YesNo,
                MessageBoxImage.Warning);

            if (result == MessageBoxResult.Yes)
            {
                _settings.ClearAppRules();
                SyncRules();
            }
        }
    }
}
