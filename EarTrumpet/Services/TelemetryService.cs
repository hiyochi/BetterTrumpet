using System;
using System.Diagnostics;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace EarTrumpet.Services
{
    /// <summary>
    /// Anonymous telemetry service for usage statistics.
    /// Collects only: anonymous ID, app version, OS version, and startup timestamp.
    /// Never collects personal information, device names, or audio data.
    /// </summary>
    public class TelemetryService
    {
        private const string TelemetryEndpoint = "https://bettertrumpet.com/api/telemetry/ping";
        private const int TimeoutSeconds = 5;

        private readonly AppSettings _settings;

        public TelemetryService(AppSettings settings)
        {
            _settings = settings ?? throw new ArgumentNullException(nameof(settings));
        }

        /// <summary>
        /// Send anonymous startup ping in background. Never throws.
        /// </summary>
        public async Task SendStartupPingAsync()
        {
            // Respect opt-out
            if (!_settings.IsTelemetryEnabled)
            {
                Trace.WriteLine("Telemetry: Disabled by user settings");
                return;
            }

            try
            {
                var anonymousId = GetOrCreateAnonymousId();
                var payload = new
                {
                    id = anonymousId,
                    version = App.PackageVersion.ToString(),
                    os = Environment.OSVersion.Version.ToString(),
                    timestamp = DateTime.UtcNow.ToString("o"), // ISO 8601
                    @event = "app_start"
                };

                var json = JsonSerializer.Serialize(payload);
                using var client = new HttpClient { Timeout = TimeSpan.FromSeconds(TimeoutSeconds) };
                using var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await client.PostAsync(TelemetryEndpoint, content);

                if (response.IsSuccessStatusCode)
                {
                    Trace.WriteLine($"Telemetry: Ping sent successfully (id: {anonymousId.Substring(0, 8)}...)");
                }
                else
                {
                    Trace.WriteLine($"Telemetry: Server returned {response.StatusCode}");
                }
            }
            catch (TaskCanceledException)
            {
                Trace.WriteLine("Telemetry: Request timed out (silent fail)");
            }
            catch (HttpRequestException ex)
            {
                Trace.WriteLine($"Telemetry: Network error (silent fail): {ex.Message}");
            }
            catch (Exception ex)
            {
                Trace.WriteLine($"Telemetry: Unexpected error (silent fail): {ex.Message}");
            }
        }

        /// <summary>
        /// Get or create a persistent anonymous GUID for this installation,
        /// stored alongside the other settings.
        /// </summary>
        private string GetOrCreateAnonymousId()
        {
            var existingId = _settings.TelemetryAnonymousId;
            if (!string.IsNullOrWhiteSpace(existingId) && Guid.TryParse(existingId, out _))
                return existingId;

            var newId = Guid.NewGuid().ToString();
            _settings.TelemetryAnonymousId = newId;
            Trace.WriteLine($"Telemetry: Generated new anonymous ID: {newId.Substring(0, 8)}...");
            return newId;
        }
    }
}
