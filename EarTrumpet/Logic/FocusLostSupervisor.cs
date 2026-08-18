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
        private FocusLostMode _mode = FocusLostMode.Off;

        public bool HasSavedState
        {
            get { return _saved.Count > 0; }
        }

        public IReadOnlyList<FocusLostAdjustment> OnForegroundChanged(
            int foregroundPid,
            IReadOnlyList<FocusLostSession> sessions,
            FocusLostMode mode,
            int attenuatePercent,
            int ignoredForegroundPid = 0,
            string foregroundExecutableName = "")
        {
            var adjustments = new List<FocusLostAdjustment>();
            sessions = sessions ?? new FocusLostSession[0];

            if (mode == FocusLostMode.Off)
            {
                RestoreAll(sessions, adjustments);
                _foregroundPid = 0;
                _mode = FocusLostMode.Off;
                return adjustments;
            }

            if (foregroundPid <= 0)
            {
                return adjustments;
            }

            if (ignoredForegroundPid != 0 && foregroundPid == ignoredForegroundPid)
            {
                return adjustments;
            }

            if (_foregroundPid == 0)
            {
                _foregroundPid = foregroundPid;
                _mode = mode;
                return adjustments;
            }

            _foregroundPid = foregroundPid;
            _mode = mode;

            var liveKeys = new HashSet<string>();
            for (var i = 0; i < sessions.Count; i++)
            {
                var session = sessions[i];
                if (string.IsNullOrEmpty(session.Key) || session.ProcessId <= 0)
                {
                    continue;
                }

                if (!session.CanAdjust)
                {
                    // A scope/rule change can make a previously managed session
                    // ineligible while it is still alive. Restore it before dropping
                    // the saved snapshot; lock/hard-mute rules are then free to apply.
                    FocusLostSnapshot excludedSaved;
                    if (_saved.TryGetValue(session.Key, out excludedSaved))
                    {
                        QueueIfChanged(adjustments, session, excludedSaved.Volume, excludedSaved.IsMuted);
                        _saved.Remove(session.Key);
                    }

                    continue;
                }

                liveKeys.Add(session.Key);

                if (IsForegroundSession(session, foregroundPid, foregroundExecutableName))
                {
                    FocusLostSnapshot saved;
                    if (_saved.TryGetValue(session.Key, out saved))
                    {
                        QueueIfChanged(adjustments, session, saved.Volume, saved.IsMuted);
                        _saved.Remove(session.Key);
                    }
                    continue;
                }

                FocusLostSnapshot original;
                if (!_saved.TryGetValue(session.Key, out original))
                {
                    original = new FocusLostSnapshot(session.Volume, session.IsMuted);
                    _saved[session.Key] = original;
                }

                var applied = FocusLostVolumePolicy.ApplyBackground(
                    original.Volume,
                    original.IsMuted,
                    mode,
                    attenuatePercent);
                QueueIfChanged(adjustments, session, applied.Volume, applied.IsMuted);
            }

            Prune(liveKeys);
            return adjustments;
        }

        private static bool IsForegroundSession(FocusLostSession session, int foregroundPid, string foregroundExecutableName)
        {
            if (session.ProcessId == foregroundPid)
            {
                return true;
            }

            return !string.IsNullOrWhiteSpace(session.ExecutableName) &&
                   !string.IsNullOrWhiteSpace(foregroundExecutableName) &&
                   AppIdentity.MatchesExact(session.ExecutableName, "", foregroundExecutableName);
        }

        private static void QueueIfChanged(List<FocusLostAdjustment> adjustments, FocusLostSession session, int volume, bool isMuted)
        {
            if (session.Volume == volume && session.IsMuted == isMuted)
            {
                return;
            }

            adjustments.Add(new FocusLostAdjustment(session.Key, volume, isMuted));
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
                    QueueIfChanged(adjustments, session, saved.Volume, saved.IsMuted);
                }
            }

            _saved.Clear();
        }

        private void Prune(HashSet<string> liveKeys)
        {
            if (_saved.Count == 0)
            {
                return;
            }

            var stale = new List<string>();
            foreach (var key in _saved.Keys)
            {
                if (!liveKeys.Contains(key))
                {
                    stale.Add(key);
                }
            }

            for (var i = 0; i < stale.Count; i++)
            {
                _saved.Remove(stale[i]);
            }
        }
    }
}
