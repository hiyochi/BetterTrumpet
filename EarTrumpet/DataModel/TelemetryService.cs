using EarTrumpet.DataModel.Storage;
using System;
using System.Diagnostics;
using System.IO;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace EarTrumpet.DataModel
{
    /// <summary>
    /// Anonymous usage telemetry service.
    /// Sends a single "app_start" ping to track active installations.
    /// Respects user opt-out via Settings → About → "Help improve BetterTrumpet".
    /// </summary>
    public class TelemetryService
    {
        private const string TelemetryEndpoint = "https://bettertrumpet.com/api/telemetry/ping";
        private const string AnonymousIdFileName = "telemetry_id.txt";
        private static readonly HttpClient s_httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(3) };

        private readonly AppSettings _settings;
        private string _anonymousId;

        public TelemetryService(AppSettings settings)
        {
            _settings = settings;
        }

        /// <summary>
        /// Sends an anonymous startup ping if telemetry is enabled.
        /// Never throws - fails silently to avoid impacting app startup.
        /// </summary>
        public async Task SendStartupPingAsync()
        {
            try
            {
                // Respect user opt-out
                if (!_settings.IsTelemetryEnabled)
                {
                    Trace.WriteLine("Telemetry: User opted out - skipping ping");
                    return;
                }

                // Get or create persistent anonymous ID
                _anonymousId = GetOrCreateAnonymousId();
                if (string.IsNullOrEmpty(_anonymousId))
                {
                    Trace.WriteLine("Telemetry: Failed to get anonymous ID - skipping ping");
                    return;
                }

                var payload = new
                {
                    id = _anonymousId,
                    version = App.PackageVersion,
                    os = Environment.OSVersion.Version.ToString(),
                    timestamp = DateTime.UtcNow.ToString("o"), // ISO 8601
                    @event = "app_start"
                };

                var json = JsonSerializer.Serialize(payload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                Trace.WriteLine($"Telemetry: Sending startup ping (id: {_anonymousId.Substring(0, 8)}..., version: {App.PackageVersion})");

                var response = await s_httpClient.PostAsync(TelemetryEndpoint, content);

                if (response.IsSuccessStatusCode)
                {
                    Trace.WriteLine("Telemetry: Ping sent successfully");
                }
                else
                {
                    Trace.WriteLine($"Telemetry: Server returned {(int)response.StatusCode} {response.ReasonPhrase}");
                }
            }
            catch (TaskCanceledException)
            {
                Trace.WriteLine("Telemetry: Request timeout (3s) - skipping");
            }
            catch (HttpRequestException ex)
            {
                Trace.WriteLine($"Telemetry: Network error - {ex.Message}");
            }
            catch (Exception ex)
            {
                Trace.WriteLine($"Telemetry: Unexpected error - {ex.Message}");
            }
        }

        /// <summary>
        /// Gets or creates a persistent anonymous ID (GUID).
        /// Stored in AppData or portable config folder.
        /// </summary>
        private string GetOrCreateAnonymousId()
        {
            try
            {
                var idFilePath = GetAnonymousIdFilePath();

                // Read existing ID
                if (File.Exists(idFilePath))
                {
                    var existingId = File.ReadAllText(idFilePath).Trim();
                    if (Guid.TryParse(existingId, out _))
                    {
                        return existingId;
                    }

                    Trace.WriteLine($"Telemetry: Invalid ID in file, regenerating");
                }

                // Generate new ID
                var newId = Guid.NewGuid().ToString();
                Directory.CreateDirectory(Path.GetDirectoryName(idFilePath));
                File.WriteAllText(idFilePath, newId);

                Trace.WriteLine($"Telemetry: Generated new anonymous ID: {newId.Substring(0, 8)}...");
                return newId;
            }
            catch (Exception ex)
            {
                Trace.WriteLine($"Telemetry: Failed to get/create anonymous ID - {ex.Message}");
                return null;
            }
        }

        /// <summary>
        /// Returns the path to the anonymous ID file.
        /// Portable mode: [exe dir]/config/telemetry_id.txt
        /// Normal mode: %APPDATA%/BetterTrumpet/telemetry_id.txt
        /// </summary>
        private string GetAnonymousIdFilePath()
        {
            if (StorageFactory.IsPortableMode)
            {
                var exeDir = Path.GetDirectoryName(System.Reflection.Assembly.GetExecutingAssembly().Location);
                return Path.Combine(exeDir, "config", AnonymousIdFileName);
            }
            else
            {
                return Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
                    "BetterTrumpet",
                    AnonymousIdFileName);
            }
        }
    }
}
