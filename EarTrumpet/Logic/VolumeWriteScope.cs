using System;

namespace EarTrumpet.Logic
{
    /// <summary>
    /// Marks volume writes that should not persist as the user's last RDP volume.
    /// </summary>
    public static class VolumeWriteScope
    {
        [ThreadStatic]
        private static int _depth;

        public static bool IsActive
        {
            get { return _depth > 0; }
        }

        public static IDisposable Begin()
        {
            _depth++;
            return new Releaser();
        }

        private sealed class Releaser : IDisposable
        {
            private bool _disposed;

            public void Dispose()
            {
                if (_disposed)
                {
                    return;
                }

                _disposed = true;
                _depth--;
            }
        }
    }
}
