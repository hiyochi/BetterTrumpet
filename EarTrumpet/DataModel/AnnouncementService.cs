using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System.Windows.Threading;

namespace EarTrumpet.DataModel
{
    /// <summary>One question of a survey item.</summary>
    public class AnnouncementQuestion
    {
        public string Id { get; set; }
        public string Text { get; set; }
        public List<string> Options { get; set; } = new List<string>();
    }

    /// <summary>One variant of an A/B comparison item.</summary>
    public class AnnouncementVariant
    {
        public string Id { get; set; }
        public string Label { get; set; }
        public string Title { get; set; }
        public string Body { get; set; }
        public string Image { get; set; }
    }

    /// <summary>
    /// A single pushed announcement. Supports several content types:
    /// news (title/body/link), poll (single question), survey (multiple
    /// questions) and ab (two variants to compare).
    /// </summary>
    public class Announcement
    {
        /// <summary>Stable unique id (e.g. a date slug). Used for read/vote tracking.</summary>
        public string Id { get; set; }
        /// <summary>news | poll | survey | ab (defaults to news).</summary>
        public string Type { get; set; } = "news";
        public string Title { get; set; }
        public string Body { get; set; }
        public string Date { get; set; }
        /// <summary>Optional chip text next to the type (e.g. "New").</summary>
        public string Badge { get; set; }
        /// <summary>Optional external link (news items).</summary>
        public string Link { get; set; }
        /// <summary>Only show to users on this version or newer (optional).</summary>
        public string MinVersion { get; set; }
        /// <summary>Only show to users on this version or older (optional).</summary>
        public string MaxVersion { get; set; }
        /// <summary>Poll options (poll type).</summary>
        public List<string> Options { get; set; } = new List<string>();
        /// <summary>Survey questions (survey type).</summary>
        public List<AnnouncementQuestion> Questions { get; set; } = new List<AnnouncementQuestion>();
        /// <summary>A/B variants (ab type).</summary>
        public List<AnnouncementVariant> Variants { get; set; } = new List<AnnouncementVariant>();
        /// <summary>Owner-maintained counts: optionKey -> votes (poll/ab).</summary>
        public Dictionary<string, int> Results { get; set; } = new Dictionary<string, int>();
        /// <summary>Owner-maintained counts per question: questionId -> optionKey -> votes (survey).</summary>
        public Dictionary<string, Dictionary<string, int>> QuestionResults { get; set; } = new Dictionary<string, Dictionary<string, int>>();
        /// <summary>Optional per-item vote collector endpoint; falls back to the feed-wide one.</summary>
        public string VoteEndpoint { get; set; }
    }

    /// <summary>
    /// Fetches the remote announcements feed (hosted on GitHub raw) so the
    /// "What's new" window can show pushed messages, polls, surveys and A/B
    /// comparisons without shipping an update. Checks at startup (after a
    /// short delay) then every 6 hours. Votes are stored locally and, when a
    /// collector endpoint is configured in the feed, POSTed to it.
    /// </summary>
    public class AnnouncementService
    {
        private const string FeedUrl = "https://raw.githubusercontent.com/xammen/BetterTrumpet/master/announcements.json";
        private static readonly TimeSpan CheckInterval = TimeSpan.FromHours(6);
        private static readonly TimeSpan StartupDelay = TimeSpan.FromSeconds(10);

        public event Action AnnouncementsChanged;

        private readonly HttpClient _httpClient;
        private readonly DispatcherTimer _timer;
        private readonly Dispatcher _dispatcher;
        private bool _started;

        private IReadOnlyList<Announcement> _announcements = Array.Empty<Announcement>();
        public IReadOnlyList<Announcement> Announcements
        {
            get => _announcements;
            private set
            {
                _announcements = value;
                UpdateUnreadState();
            }
        }

        private bool _hasUnreadAnnouncements;
        public bool HasUnreadAnnouncements
        {
            get => _hasUnreadAnnouncements;
            private set
            {
                if (_hasUnreadAnnouncements != value)
                {
                    _hasUnreadAnnouncements = value;
                    AnnouncementsChanged?.Invoke();
                }
            }
        }

        private int _unreadCount;
        public int UnreadCount
        {
            get => _unreadCount;
            private set
            {
                if (_unreadCount != value)
                {
                    _unreadCount = value;
                    AnnouncementsChanged?.Invoke();
                }
            }
        }

        public AnnouncementService()
        {
            _dispatcher = Dispatcher.CurrentDispatcher;
            _httpClient = new HttpClient();
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "BetterTrumpet-Announcements");
            _httpClient.Timeout = TimeSpan.FromSeconds(15);

            _timer = new DispatcherTimer(DispatcherPriority.Background, _dispatcher)
            {
                Interval = CheckInterval
            };
            _timer.Tick += (_, __) => CheckForAnnouncementsAsync();
        }

        /// <summary>Start the announcement check cycle: delay then check, then every 6h.</summary>
        public void Start()
        {
            if (_started)
            {
                return;
            }
            _started = true;

            var startupTimer = new DispatcherTimer(DispatcherPriority.Background, _dispatcher)
            {
                Interval = StartupDelay
            };
            startupTimer.Tick += (_, __) =>
            {
                startupTimer.Stop();
                CheckForAnnouncementsAsync();
                _timer.Start();
            };
            startupTimer.Start();

            Trace.WriteLine($"AnnouncementService: Started, first check in {StartupDelay.TotalSeconds}s, then every {CheckInterval.TotalHours}h");
        }

        public void Stop()
        {
            _timer.Stop();
        }

        /// <summary>Fetch and parse the remote feed, filtering by the local version.</summary>
        public async void CheckForAnnouncementsAsync()
        {
            try
            {
                Trace.WriteLine("AnnouncementService: Checking for announcements...");
                var response = await _httpClient.GetStringAsync(FeedUrl);
                var json = JObject.Parse(response);

                var feedVoteEndpoint = json["voteEndpoint"]?.ToString() ?? string.Empty;
                var items = json["announcements"] as JArray;
                if (items == null)
                {
                    return;
                }

                var localVersion = App.PackageVersion;
                var announcements = new List<Announcement>();
                foreach (var item in items)
                {
                    var announcement = ParseAnnouncement(item, feedVoteEndpoint);
                    if (string.IsNullOrWhiteSpace(announcement.Id))
                    {
                        continue;
                    }

                    if (!IsInVersionRange(localVersion, announcement.MinVersion, announcement.MaxVersion))
                    {
                        continue;
                    }

                    announcements.Add(announcement);
                }

                Announcements = announcements;
                Trace.WriteLine($"AnnouncementService: {announcements.Count} announcement(s) loaded, {UnreadCount} unread");
            }
            catch (Exception ex)
            {
                Trace.WriteLine($"AnnouncementService: Check failed — {ex.Message}");
            }
        }

        /// <summary>
        /// Records the user's vote locally (so the UI stays truthful and the state
        /// survives restarts) and, when a collector endpoint is configured, submits
        /// it there in the background.
        /// </summary>
        public async Task VoteAsync(string announcementId, Dictionary<string, string> answers)
        {
            if (string.IsNullOrEmpty(announcementId) || answers == null || answers.Count == 0)
            {
                return;
            }

            App.Settings.SetPollVote(announcementId, JsonSerializer.Serialize(answers));
            Trace.WriteLine($"AnnouncementService: Vote recorded for {announcementId}");

            // Let the open window refresh the rendered results.
            AnnouncementsChanged?.Invoke();

            await SubmitVoteAsync(announcementId, answers);
        }

        private async Task SubmitVoteAsync(string announcementId, Dictionary<string, string> answers)
        {
            var endpoint = _announcements.FirstOrDefault(a => a.Id == announcementId)?.VoteEndpoint;
            if (string.IsNullOrWhiteSpace(endpoint))
            {
                return;
            }

            try
            {
                var payload = new
                {
                    app = "BetterTrumpet",
                    version = App.PackageVersion?.ToString(),
                    announcementId,
                    answers,
                    votedAt = DateTime.UtcNow,
                };
                var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
                using var response = await _httpClient.PostAsync(endpoint, content);
                Trace.WriteLine($"AnnouncementService: Vote submitted to {endpoint} ({response.StatusCode})");
            }
            catch (Exception ex)
            {
                Trace.WriteLine($"AnnouncementService: Vote submission failed — {ex.Message}");
            }
        }

        /// <summary>Recompute unread state from the stored last-seen id.</summary>
        private void UpdateUnreadState()
        {
            var lastSeen = App.Settings.LastSeenAnnouncementId;
            var lastSeenIndex = -1;
            for (var i = 0; i < _announcements.Count; i++)
            {
                if (string.Equals(_announcements[i].Id, lastSeen, StringComparison.Ordinal))
                {
                    lastSeenIndex = i;
                }
            }

            var unread = _announcements.Skip(lastSeenIndex + 1).ToList();
            UnreadCount = unread.Count;
            HasUnreadAnnouncements = UnreadCount > 0;
        }

        /// <summary>Mark every announcement as read (called when the window opens).</summary>
        public void MarkAllRead()
        {
            var latest = _announcements.LastOrDefault();
            if (latest != null)
            {
                App.Settings.LastSeenAnnouncementId = latest.Id;
            }
            UpdateUnreadState();
        }

        private static Announcement ParseAnnouncement(JToken item, string feedVoteEndpoint)
        {
            var announcement = new Announcement
            {
                Id = item["id"]?.ToString() ?? string.Empty,
                Type = (item["type"]?.ToString() ?? "news").ToLowerInvariant(),
                Title = item["title"]?.ToString() ?? string.Empty,
                Body = item["body"]?.ToString() ?? string.Empty,
                Date = item["date"]?.ToString() ?? string.Empty,
                Badge = item["badge"]?.ToString() ?? string.Empty,
                Link = item["link"]?.ToString() ?? string.Empty,
                MinVersion = item["minVersion"]?.ToString(),
                MaxVersion = item["maxVersion"]?.ToString(),
                VoteEndpoint = item["voteEndpoint"]?.ToString() ?? feedVoteEndpoint,
            };

            var options = item["options"] as JArray;
            if (options != null)
            {
                announcement.Options = options.Select(option => option.ToString()).ToList();
            }

            var questions = item["questions"] as JArray;
            if (questions != null)
            {
                foreach (var questionToken in questions)
                {
                    var question = new AnnouncementQuestion
                    {
                        Id = questionToken["id"]?.ToString() ?? string.Empty,
                        Text = questionToken["text"]?.ToString() ?? string.Empty,
                    };
                    var questionOptions = questionToken["options"] as JArray;
                    if (questionOptions != null)
                    {
                        question.Options = questionOptions.Select(option => option.ToString()).ToList();
                    }
                    announcement.Questions.Add(question);
                }
            }

            var variants = item["variants"] as JArray;
            if (variants != null)
            {
                foreach (var variantToken in variants)
                {
                    announcement.Variants.Add(new AnnouncementVariant
                    {
                        Id = variantToken["id"]?.ToString() ?? string.Empty,
                        Label = variantToken["label"]?.ToString() ?? string.Empty,
                        Title = variantToken["title"]?.ToString() ?? string.Empty,
                        Body = variantToken["body"]?.ToString() ?? string.Empty,
                        Image = variantToken["image"]?.ToString(),
                    });
                }
            }

            var results = item["results"] as JObject;
            if (results != null)
            {
                foreach (var property in results.Properties())
                {
                    if (property.Value is JObject nested)
                    {
                        var map = new Dictionary<string, int>();
                        foreach (var inner in nested.Properties())
                        {
                            if (inner.Value.Type == JTokenType.Integer)
                            {
                                map[inner.Name] = inner.Value.Value<int>();
                            }
                        }
                        announcement.QuestionResults[property.Name] = map;
                    }
                    else if (property.Value.Type == JTokenType.Integer)
                    {
                        announcement.Results[property.Name] = property.Value.Value<int>();
                    }
                }
            }

            return announcement;
        }

        private static bool IsInVersionRange(Version local, string minVersion, string maxVersion)
        {
            if (local == null)
            {
                return true;
            }

            if (!string.IsNullOrWhiteSpace(minVersion) &&
                Version.TryParse(minVersion.TrimStart('v', 'V'), out var min) &&
                local < min)
            {
                return false;
            }

            if (!string.IsNullOrWhiteSpace(maxVersion) &&
                Version.TryParse(maxVersion.TrimStart('v', 'V'), out var max) &&
                local > max)
            {
                return false;
            }

            return true;
        }
    }
}
