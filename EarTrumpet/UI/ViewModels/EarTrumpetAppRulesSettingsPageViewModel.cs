using EarTrumpet.UI.Helpers;
using System;
using System.Collections.ObjectModel;
using System.Diagnostics;
using System.Linq;
using System.Windows;
using System.Windows.Input;

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
            }
        }

        public ICommand AddRuleCommand { get; }
        public ICommand BrowseForExeCommand { get; }
        public ICommand RemoveRuleCommand { get; }
        public ICommand ClearAllRulesCommand { get; }

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

            Reload();
        }

        /// <summary>
        /// Refreshed on navigation rather than by subscribing to AppRulesChanged. The
        /// settings window is recreated on every open (App.CreateSettingsExperience via
        /// WindowHolder), so a constructor subscription would outlive the page and pile up
        /// one dead listener per open. Rules changed from the flyout are picked up the next
        /// time this page is shown; edits made here refresh through the explicit Reload calls.
        /// </summary>
        public override void NavigatedTo()
        {
            Reload();
        }

        private void Reload()
        {
            try
            {
                var runningExeNames = GetRunningExeNames();

                // Detach first: a row whose debounced volume write hasn't fired yet
                // flushes it here, so the value the user just dragged to isn't lost.
                foreach (var row in Rules)
                {
                    row.Detach();
                }
                Rules.Clear();

                foreach (var rule in _settings.GetAppRules())
                {
                    Rules.Add(new AppRuleItemViewModel(_settings, rule, runningExeNames.Contains(rule.ExeName)));
                }
            }
            catch (Exception ex)
            {
                Trace.WriteLine($"AppRulesVM Reload failed: {ex.Message}");
            }

            RaisePropertyChanged(nameof(HasRules));
            RaisePropertyChanged(nameof(IsEmpty));
        }

        private System.Collections.Generic.HashSet<string> GetRunningExeNames()
        {
            var running = new System.Collections.Generic.HashSet<string>(StringComparer.OrdinalIgnoreCase);

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
                            running.Add(app.ExeName);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Trace.WriteLine($"AppRulesVM GetRunningExeNames failed: {ex.Message}");
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
            Reload();
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
                    NewRuleExeName = System.IO.Path.GetFileName(dlg.FileName);
                    AddRuleFromExeName();
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
            Reload();
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
                Reload();
            }
        }
    }
}
