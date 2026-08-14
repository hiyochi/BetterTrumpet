using System.Collections.Generic;

namespace EarTrumpet.Logic
{
    /// <summary>
    /// Tracks original volume/mute per session while an app is in the background.
    /// Win32 focus polling stays in FocusLostService; this engine is Linux-testable.
    /// </summary>
    public sealed class FocusLostSupervisor
    {
        private readonly Dictionary<string, FocusLostSnapshot> _saved = new Dictionary<string, FocusLostSnapshot>();
        private int _foregroundPid;

        public bool HasSavedState
        {
            get { return _saved.Count > 0; }
        }

        public IReadOnlyList<FocusLostAdjustment> OnForegroundChanged(
            int foregroundPid,
            IReadOnlyList<FocusLostSession> sessions,
            FocusLostMode mode,
            int attenuatePercent)
        {
            var adjustments = new List<FocusLostAdjustment>();
            sessions = sessions ?? new FocusLostSession[0];

            if (mode == FocusLostMode.Off)
            {
                RestoreAll(sessions, adjustments);
                _foregroundPid = 0;
                return adjustments;
            }

            if (foregroundPid <= 0)
            {
                return adjustments;
            }

            if (_foregroundPid == 0)
            {
                _foregroundPid = foregroundPid;
                return adjustments;
            }

            if (_foregroundPid == foregroundPid)
            {
                return adjustments;
            }

            _foregroundPid = foregroundPid;

            for (var i = 0; i < sessions.Count; i++)
            {
                var session = sessions[i];
                if (string.IsNullOrEmpty(session.Key) || !session.CanAdjust || session.ProcessId <= 0)
                {
                    continue;
                }

                if (session.ProcessId == foregroundPid)
                {
                    FocusLostSnapshot saved;
                    if (_saved.TryGetValue(session.Key, out saved))
                    {
                        adjustments.Add(new FocusLostAdjustment(session.Key, saved.Volume, saved.IsMuted));
                        _saved.Remove(session.Key);
                    }
                    continue;
                }

                if (!_saved.ContainsKey(session.Key))
                {
                    _saved[session.Key] = new FocusLostSnapshot(session.Volume, session.IsMuted);
                }

                var applied = FocusLostVolumePolicy.ApplyBackground(
                    session.Volume,
                    session.IsMuted,
                    mode,
                    attenuatePercent);
                adjustments.Add(new FocusLostAdjustment(session.Key, applied.Volume, applied.IsMuted));
            }

            return adjustments;
        }

        private void RestoreAll(IReadOnlyList<FocusLostSession> sessions, List<FocusLostAdjustment> adjustments)
        {
            if (_saved.Count == 0)
            {
                return;
            }

            for (var i = 0; i < sessions.Count; i++)
            {
                var session = sessions[i];
                FocusLostSnapshot saved;
                if (!string.IsNullOrEmpty(session.Key) && _saved.TryGetValue(session.Key, out saved))
                {
                    adjustments.Add(new FocusLostAdjustment(session.Key, saved.Volume, saved.IsMuted));
                }
            }

            _saved.Clear();
        }
    }
}
