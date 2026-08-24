using EarTrumpet.DataModel;
using Microsoft.Web.WebView2.Core;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Media.Animation;

namespace EarTrumpet.UI.Views
{
    /// <summary>
    /// WebView2 window that renders the pushed announcements feed (news, polls,
    /// surveys, A/B comparisons). The C# side fetches the remote JSON via
    /// AnnouncementService and posts it to a local HTML page. Opening the window
    /// marks everything read; votes are stored locally and POSTed to the feed's
    /// collector endpoint when one is configured.
    /// </summary>
    public partial class AnnouncementsWindow : Window
    {
        private const string AnnouncementsHostName = "bettertrumpet.announcements";
        private static readonly JsonSerializerOptions JsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        };

        private readonly AnnouncementService _service;
        private bool _isInitialized;
        private bool _markedRead;

        public AnnouncementsWindow(AnnouncementService service)
        {
            _service = service ?? throw new ArgumentNullException(nameof(service));

            InitializeComponent();

            Loaded += async (_, __) => await InitializeWebViewAsync();
            Closed += (_, __) => Trace.WriteLine("AnnouncementsWindow Closed");
        }

        private async Task InitializeWebViewAsync()
        {
            if (_isInitialized)
            {
                return;
            }

            ErrorOverlay.Visibility = Visibility.Collapsed;

            try
            {
                var bundlePath = Path.Combine(AppContext.BaseDirectory, "AnnouncementsWeb");
                var indexPath = Path.Combine(bundlePath, "index.html");
                if (!File.Exists(indexPath))
                {
                    throw new FileNotFoundException("The announcements bundle was not found.", indexPath);
                }

                var userDataPath = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                    "BetterTrumpet",
                    "AnnouncementsWebView");
                Directory.CreateDirectory(userDataPath);

                var environment = await CoreWebView2Environment.CreateAsync(null, userDataPath);
                await AnnouncementsWebView.EnsureCoreWebView2Async(environment);

                var core = AnnouncementsWebView.CoreWebView2;
                core.Settings.AreDefaultContextMenusEnabled = false;
                core.Settings.AreDevToolsEnabled = false;
                core.Settings.IsStatusBarEnabled = false;
                core.Settings.IsZoomControlEnabled = false;
                core.Settings.AreBrowserAcceleratorKeysEnabled = false;

                core.SetVirtualHostNameToFolderMapping(
                    AnnouncementsHostName,
                    bundlePath,
                    CoreWebView2HostResourceAccessKind.DenyCors);

                core.NavigationStarting += Core_NavigationStarting;
                core.NavigationCompleted += Core_NavigationCompleted;
                core.WebMessageReceived += Core_WebMessageReceived;
                core.ProcessFailed += (_, args) =>
                {
                    Trace.WriteLine($"AnnouncementsWindow WebView2 process failed: {args.ProcessFailedKind}");
                    Dispatcher.BeginInvoke(new Action(ShowLoadError));
                };

                _isInitialized = true;
                core.Navigate($"https://{AnnouncementsHostName}/index.html");
            }
            catch (Exception ex)
            {
                Trace.WriteLine($"AnnouncementsWindow initialization failed: {ex}");
                ShowLoadError();
            }
        }

        private void Core_NavigationStarting(object sender, CoreWebView2NavigationStartingEventArgs e)
        {
            if (!Uri.TryCreate(e.Uri, UriKind.Absolute, out var uri) ||
                !string.Equals(uri.Host, AnnouncementsHostName, StringComparison.OrdinalIgnoreCase))
            {
                e.Cancel = true;
                Trace.WriteLine($"AnnouncementsWindow blocked navigation: {e.Uri}");
            }
        }

        private void Core_NavigationCompleted(object sender, CoreWebView2NavigationCompletedEventArgs e)
        {
            if (!e.IsSuccess)
            {
                Trace.WriteLine($"AnnouncementsWindow navigation failed: {e.WebErrorStatus}");
                ShowLoadError();
            }
        }

        private void Core_WebMessageReceived(object sender, CoreWebView2WebMessageReceivedEventArgs e)
        {
            try
            {
                using var document = JsonDocument.Parse(e.WebMessageAsJson);
                var root = document.RootElement;
                if (!root.TryGetProperty("type", out var typeElement))
                {
                    return;
                }

                switch (typeElement.GetString())
                {
                    case "ready":
                        PostAnnouncements();
                        break;
                    case "rendered":
                        HideSplash();
                        break;
                    case "openUrl":
                        var url = root.TryGetProperty("url", out var urlElement) &&
                            urlElement.ValueKind == JsonValueKind.String
                            ? urlElement.GetString()
                            : null;
                        if (!string.IsNullOrWhiteSpace(url))
                        {
                            System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
                            {
                                FileName = url,
                                UseShellExecute = true
                            });
                        }
                        break;
                    case "vote":
                        var voteId = root.TryGetProperty("id", out var idElement) &&
                            idElement.ValueKind == JsonValueKind.String
                            ? idElement.GetString()
                            : null;
                        var answers = new Dictionary<string, string>();
                        if (root.TryGetProperty("answers", out var answersElement) &&
                            answersElement.ValueKind == JsonValueKind.Object)
                        {
                            foreach (var property in answersElement.EnumerateObject())
                            {
                                if (property.Value.ValueKind == JsonValueKind.String)
                                {
                                    answers[property.Name] = property.Value.GetString() ?? string.Empty;
                                }
                            }
                        }
                        if (!string.IsNullOrWhiteSpace(voteId))
                        {
                            _ = SubmitVoteAsync(voteId, answers);
                        }
                        break;
                }
            }
            catch (Exception ex)
            {
                Trace.WriteLine($"AnnouncementsWindow message failed: {ex}");
            }
        }

        private async Task SubmitVoteAsync(string announcementId, Dictionary<string, string> answers)
        {
            try
            {
                await _service.VoteAsync(announcementId, answers);
                // Refresh the rendered state so results reflect the new local vote.
                PostAnnouncements();
            }
            catch (Exception ex)
            {
                Trace.WriteLine($"AnnouncementsWindow vote failed: {ex}");
            }
        }

        private void PostAnnouncements()
        {
            if (!_isInitialized || AnnouncementsWebView.CoreWebView2 == null)
            {
                return;
            }

            var payload = new
            {
                type = "announcements",
                data = new
                {
                    version = App.PackageVersion?.ToString() ?? string.Empty,
                    labels = new Dictionary<string, string>
                    {
                        ["title"] = R("AnnouncementsTitle"),
                        ["emptyTitle"] = R("AnnouncementsEmptyTitle"),
                        ["emptyBody"] = R("AnnouncementsEmptyBody"),
                        ["vote"] = R("AnnouncementsVoteButton"),
                        ["change"] = R("AnnouncementsChangeVote"),
                        ["learnMore"] = R("AnnouncementsLearnMore"),
                        ["votesFormat"] = R("AnnouncementsVotesFormat"),
                        ["youVoted"] = R("AnnouncementsYouVoted"),
                        ["thanks"] = R("AnnouncementsThanks"),
                        ["typeNews"] = R("AnnouncementsTypeNews"),
                        ["typePoll"] = R("AnnouncementsTypePoll"),
                        ["typeSurvey"] = R("AnnouncementsTypeSurvey"),
                        ["typeAb"] = R("AnnouncementsTypeAb"),
                    },
                    announcements = _service.Announcements.Select(a => new
                    {
                        a.Id,
                        a.Type,
                        a.Title,
                        a.Body,
                        a.Date,
                        a.Badge,
                        a.Link,
                        a.Options,
                        a.Questions,
                        a.Variants,
                        results = a.Results,
                        questionResults = a.QuestionResults,
                        localVote = ParseLocalVote(App.Settings.GetPollVote(a.Id)),
                    }),
                },
            };

            var json = JsonSerializer.Serialize(payload, JsonOptions);
            AnnouncementsWebView.CoreWebView2.PostWebMessageAsString(json);

            // Opening the window marks every announcement as read.
            if (!_markedRead)
            {
                _markedRead = true;
                _service.MarkAllRead();
            }
        }

        private static Dictionary<string, string> ParseLocalVote(string json)
        {
            if (string.IsNullOrWhiteSpace(json))
            {
                return new Dictionary<string, string>();
            }

            try
            {
                var parsed = JsonSerializer.Deserialize<Dictionary<string, string>>(json);
                return parsed ?? new Dictionary<string, string>();
            }
            catch
            {
                return new Dictionary<string, string>();
            }
        }

        private static string R(string key)
        {
            return EarTrumpet.Properties.Resources.ResourceManager.GetString(key, CultureInfo.CurrentUICulture) ?? key;
        }

        private void HideSplash()
        {
            Dispatcher.BeginInvoke(new Action(() =>
            {
                if (SystemParameters.ClientAreaAnimation)
                {
                    var fade = new DoubleAnimation(1, 0, TimeSpan.FromMilliseconds(240))
                    {
                        EasingFunction = new CubicEase { EasingMode = EasingMode.EaseOut },
                    };
                    fade.Completed += (_, __) => LoadingSplash.Visibility = Visibility.Collapsed;
                    LoadingSplash.BeginAnimation(UIElement.OpacityProperty, fade);
                }
                else
                {
                    LoadingSplash.Visibility = Visibility.Collapsed;
                }
            }));
        }

        private void ShowLoadError()
        {
            LoadingSplash.Visibility = Visibility.Collapsed;
            ErrorOverlay.Visibility = Visibility.Visible;
        }

        private void Retry_Click(object sender, RoutedEventArgs e)
        {
            ErrorOverlay.Visibility = Visibility.Collapsed;
            LoadingSplash.Visibility = Visibility.Visible;
            _isInitialized = false;
            _ = InitializeWebViewAsync();
        }

        private void Close_Click(object sender, RoutedEventArgs e)
        {
            Close();
        }
    }
}
