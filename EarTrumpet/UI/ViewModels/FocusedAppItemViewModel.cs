using EarTrumpet.Extensibility.Hosting;
using EarTrumpet.UI.Helpers;
using System;
using System.Collections.ObjectModel;
using System.Linq;

namespace EarTrumpet.UI.ViewModels
{
    public class FocusedAppItemViewModel : IFocusedViewModel
    {
        public event Action RequestClose;

        public IAppItemViewModel App { get; }
        public ObservableCollection<ToolbarItemViewModel> Toolbar { get; }
        public string DisplayName => App.DisplayName;
        public ObservableCollection<object> Addons { get; }

        public FocusedAppItemViewModel(DeviceCollectionViewModel parent, IAppItemViewModel app)
        {
            App = app;

            Toolbar = new ObservableCollection<ToolbarItemViewModel>();
            Toolbar.Add(new ToolbarItemViewModel
            {
                GlyphFontSize = 10,
                DisplayName = Properties.Resources.CloseButtonAccessibleText,
                Glyph = "\uE8BB",
                Command = new RelayCommand(() => RequestClose.Invoke())
            });

            var canHideEntry = parent.CanHideApp(app);

            if (app.IsMovable)
            {
                var persistedDeviceId = app.PersistedOutputDevice;

                var items = parent.AllDevices.Select(dev => new ContextMenuItem
                {
                    DisplayName = dev.DisplayName,
                    Command = new RelayCommand(() =>
                    {
                        parent.MoveAppToDevice(app, dev);
                        RequestClose.Invoke();
                    }),
                    IsChecked = (dev.Id == persistedDeviceId),
                }).ToList();

                items.Insert(0, new ContextMenuItem
                {
                    DisplayName = Properties.Resources.DefaultDeviceText,
                    IsChecked = (string.IsNullOrWhiteSpace(persistedDeviceId)),
                    Command = new RelayCommand(() =>
                    {
                        parent.MoveAppToDevice(app, null);
                        RequestClose.Invoke();
                    }),
                });
                items.Insert(1, new ContextMenuSeparator());

                Toolbar.Insert(0, new ToolbarItemViewModel
                {
                    GlyphFontSize = 16,
                    DisplayName = Properties.Resources.MoveButtonAccessibleText,
                    Glyph = "\uE8AB",
                    Menu = new ObservableCollection<ContextMenuItem>(items)
                });
            }

            if (canHideEntry)
            {
                Toolbar.Insert(0, new ToolbarItemViewModel
                {
                    GlyphFontSize = 16,
                    DisplayName = Properties.Resources.HideAppEntryButtonText,
                    Glyph = "\uE18B",
                    Command = new RelayCommand(() =>
                    {
                        parent.HideAppOnDevice(app);
                        RequestClose.Invoke();
                    }),
                });
            }

            if (!string.IsNullOrWhiteSpace(app.ExeName))
            {
                var rule = parent.GetAppRule(app);
                var ruleMode = rule?.VolumeMode ?? AppSettings.VolumeRuleMode.None;
                var rulePercent = rule?.VolumePercent ?? 0;
                bool isHardMuted = parent.IsAppHardMuted(app);

                Toolbar.Insert(0, new ToolbarItemViewModel
                {
                    GlyphFontSize = 16,
                    DisplayName = Properties.Resources.HardMuteAppButtonText,
                    Glyph = "\uE74F",
                    IsActive = isHardMuted,
                    Menu = new ObservableCollection<ContextMenuItem>
                    {
                        new ContextMenuItem
                        {
                            DisplayName = isHardMuted
                                ? Properties.Resources.HardMuteAppMenuDisableText
                                : Properties.Resources.HardMuteAppMenuText,
                            IsChecked = isHardMuted,
                            Command = new RelayCommand(() =>
                            {
                                parent.ToggleHardMuteApp(app);
                                RequestClose.Invoke();
                            }),
                        }
                    }
                });

                // Launch volume remains a menu because choosing the target value is the
                // action. Lock is intentionally direct: set the slider, then click Lock.
                Toolbar.Insert(0, new ToolbarItemViewModel
                {
                    GlyphFontSize = 16,
                    DisplayName = Properties.Resources.VolumeRuleLaunchButtonText,
                    Glyph = "\uE768",
                    IsActive = ruleMode == AppSettings.VolumeRuleMode.Launch,
                    Menu = BuildVolumeRuleItems(
                        parent,
                        app,
                        AppSettings.VolumeRuleMode.Launch,
                        ruleMode,
                        rulePercent)
                });

                bool isVolumeLocked = ruleMode == AppSettings.VolumeRuleMode.Lock;
                Toolbar.Insert(0, new ToolbarItemViewModel
                {
                    GlyphFontSize = 16,
                    DisplayName = isVolumeLocked
                        ? Properties.Resources.VolumeRuleUnlockButtonText
                        : Properties.Resources.VolumeRuleLockButtonText,
                    Glyph = "\uE72E",
                    IsActive = isVolumeLocked,
                    Command = new RelayCommand(() =>
                    {
                        if (isVolumeLocked)
                        {
                            parent.ClearAppVolumeRule(app);
                        }
                        else
                        {
                            parent.SetAppVolumeRule(app, AppSettings.VolumeRuleMode.Lock, app.Volume);
                        }

                        RequestClose.Invoke();
                    })
                });
            }

            var contentItems = AddonManager.Host.AppContentItems;
            if (contentItems != null)
            {
                Addons = new ObservableCollection<object>(contentItems.Select(a => a.GetContentForApp(App.Parent.Id, App.Id, () => RequestClose.Invoke())).ToArray());
                var moreCommandItems = contentItems.SelectMany(a => a.GetContextMenuItemsForApp(app.Parent.Id, app.AppId)).Where(x => x != null).ToList();
                if (moreCommandItems.Any())
                {
                    Toolbar.Insert(0, new ToolbarItemViewModel
                    {
                        GlyphFontSize = 16,
                        DisplayName = Properties.Resources.MoreCommandsAccessibleText,
                        Glyph = "\uE10C",
                        Menu = new ObservableCollection<ContextMenuItem>(moreCommandItems)
                    });
                }
            }
        }

        // Presets offered for both Launch and Lock, plus "use whatever the slider is at now",
        // which is the natural gesture: set the volume, then pin it.
        private static readonly int[] VolumeRulePresets = { 10, 20, 30, 50, 75 };

        private ObservableCollection<ContextMenuItem> BuildVolumeRuleItems(
            DeviceCollectionViewModel parent,
            IAppItemViewModel app,
            AppSettings.VolumeRuleMode mode,
            AppSettings.VolumeRuleMode currentMode,
            int currentPercent)
        {
            var items = new ObservableCollection<ContextMenuItem>();

            foreach (var preset in VolumeRulePresets)
            {
                var value = preset;
                items.Add(new ContextMenuItem
                {
                    DisplayName = string.Format(Properties.Resources.VolumeRulePercentFormatText, value),
                    IsChecked = currentMode == mode && currentPercent == value,
                    Command = new RelayCommand(() =>
                    {
                        parent.SetAppVolumeRule(app, mode, value);
                        RequestClose.Invoke();
                    }),
                });
            }

            items.Add(new ContextMenuSeparator());
            items.Add(new ContextMenuItem
            {
                DisplayName = string.Format(Properties.Resources.VolumeRuleUseCurrentFormatText, app.Volume),
                Command = new RelayCommand(() =>
                {
                    parent.SetAppVolumeRule(app, mode, app.Volume);
                    RequestClose.Invoke();
                }),
            });

            items.Add(new ContextMenuSeparator());
            items.Add(new ContextMenuItem
            {
                DisplayName = Properties.Resources.VolumeRuleMenuNoneText,
                IsChecked = currentMode == AppSettings.VolumeRuleMode.None,
                Command = new RelayCommand(() =>
                {
                    parent.ClearAppVolumeRule(app);
                    RequestClose.Invoke();
                }),
            });

            return items;
        }

        public void Closing()
        {

        }
    }
}
