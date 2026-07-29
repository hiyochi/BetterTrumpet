using System;
using Windows.ApplicationModel;

namespace EarTrumpet.Interop.Helpers
{
    class PackageHelper
    {
        public static Version GetVersion(bool isPackaged)
        {
            if (isPackaged)
            {
                var packageVer = Package.Current.Id.Version;
                return new Version(packageVer.Major, packageVer.Minor, packageVer.Build);
            }
            else
            {
                return Normalize(System.Reflection.Assembly.GetExecutingAssembly().GetName().Version);
            }
        }

        /// <summary>
        /// Drops the revision so versions are always Major.Minor.Patch. The MSIX manifest and
        /// assembly metadata both carry a mandatory fourth field; we never surface it, which also
        /// keeps comparisons against 3-part release tags (v3.2.1) consistent.
        /// </summary>
        public static Version Normalize(Version version)
        {
            return version == null ? null : new Version(version.Major, version.Minor, Math.Max(version.Build, 0));
        }

        public static string GetFamilyName(bool isPackaged)
        {
            return isPackaged ? Package.Current.Id.FamilyName : null;
        }

        public static bool CheckHasIdentity()
        {
#if VSDEBUG
            if (System.Diagnostics.Debugger.IsAttached)
            {
                return false;
            }
#endif

            try
            {
                return Package.Current.Id != null;
            }
            catch (InvalidOperationException)
            {
                // Expected in non-packaged mode (portable / classic installer).
                // Not an error — just means we're not running as MSIX.
                System.Diagnostics.Trace.WriteLine("PackageHelper: No package identity (portable/installer mode)");
                return false;
            }
        }

        public static bool HasDevIdentity()
        {
#if VSDEBUG
            return true;
#else
            bool result = false;
            try
            {
                result = Package.Current.DisplayName.EndsWith("(dev)");
            }
            catch
            {
            }
            return result;
#endif
        }
    }
}
