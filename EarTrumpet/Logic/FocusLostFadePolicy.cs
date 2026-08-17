using System;

namespace EarTrumpet.Logic
{
    /// <summary>Pure helpers for the optional focus-lost volume transition.</summary>
    public static class FocusLostFadePolicy
    {
        public const int DefaultDurationMs = 0;
        public const int MaxDurationMs = 5000;

        public static int ClampDurationMs(int durationMs)
        {
            return Math.Max(0, Math.Min(MaxDurationMs, durationMs));
        }

        public static int InterpolateVolume(int startVolume, int targetVolume, double progress)
        {
            progress = Math.Max(0.0, Math.Min(1.0, progress));
            startVolume = Math.Max(0, Math.Min(100, startVolume));
            targetVolume = Math.Max(0, Math.Min(100, targetVolume));
            return (int)Math.Round(startVolume + ((targetVolume - startVolume) * progress), MidpointRounding.AwayFromZero);
        }
    }
}
