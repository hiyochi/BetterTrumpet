using EarTrumpet.DataModel;
using System.Collections.Generic;
using System.Diagnostics;

namespace EarTrumpet.UI.ViewModels
{
    /// <summary>
    /// Remembers which processes already had their Launch volume rule applied.
    /// <para>
    /// A Launch rule means "set the volume once per app launch". But a session can
    /// re-enter the collection without the app ever restarting: moving it to another
    /// device and back (AudioDeviceSessionCollection.MovedSession_PropertyChanged),
    /// unhiding it, or a DeviceViewModel rebuild all call AddSession again. Applying
    /// the rule on every AddSession would reset the user's volume mid-session, so we
    /// key on the process id instead: a new pid is a real launch, a known pid is not.
    /// </para>
    /// <para>
    /// State is per-run and deliberately not persisted — after a BetterTrumpet restart
    /// every session looks new, which is what makes the rule survive a reboot when the
    /// app wins the startup race and is already playing before we enumerate.
    /// </para>
    /// </summary>
    internal static class LaunchVolumeTracker
    {
        private static readonly object s_lock = new object();
        private static readonly HashSet<int> s_appliedProcessIds = new HashSet<int>();

        /// <summary>
        /// Returns true the first time it is called for a given process id, false after.
        /// Registers a process watcher so the id is forgotten when the process exits;
        /// that keeps the set bounded and lets Windows recycle the pid safely.
        /// </summary>
        public static bool TryClaim(int processId)
        {
            if (processId <= 0)
            {
                return false;
            }

            lock (s_lock)
            {
                if (!s_appliedProcessIds.Add(processId))
                {
                    return false;
                }
            }

            // Fires on the watcher's background thread, hence the lock above.
            ProcessWatcherService.WatchProcess(processId, quitProcessId =>
            {
                lock (s_lock)
                {
                    s_appliedProcessIds.Remove(quitProcessId);
                }
            });

            Trace.WriteLine($"LaunchVolumeTracker claimed pid {processId}");
            return true;
        }

        /// <summary>
        /// Forgets a process id so the next AddSession for it counts as a launch again.
        /// Used when a rule is created or edited, so the new value takes effect on the
        /// running instance instead of waiting for the next restart.
        /// </summary>
        public static void Release(int processId)
        {
            lock (s_lock)
            {
                s_appliedProcessIds.Remove(processId);
            }
        }
    }
}
