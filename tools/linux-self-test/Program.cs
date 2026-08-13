using System.Runtime.InteropServices;
using System.Text.RegularExpressions;
using EarTrumpet.DataModel.WindowsAudio.Internal;
using EarTrumpet.Diagnosis;

namespace BetterTrumpet.LinuxSelfTest;

/// <summary>
/// Runs on the Linux cloud-agent VM. Covers the portable parts of GitHub #37 / #41 / #43.
/// Real WASAPI / flyout / tray behavior still needs a Windows box.
/// </summary>
internal static class Program
{
    private static int _failed;

    public static int Main(string[] args)
    {
        var repoRoot = args.Length > 0 ? args[0] : FindRepoRoot();
        if (repoRoot == null)
        {
            Console.WriteLine("FAIL  could not locate BetterTrumpet repo root");
            return 2;
        }

        Console.WriteLine("BetterTrumpet Linux self-test");
        Console.WriteLine("Repo:    " + repoRoot);
        Console.WriteLine("Runtime: " + RuntimeInformation.OSDescription);
        Console.WriteLine();

        RunPathSanitizerTests();
        RunDisconnectGateTests();
        RunSourceContractTests(repoRoot);

        Console.WriteLine();
        if (_failed == 0)
        {
            Console.WriteLine("ALL TESTS PASSED");
            Console.WriteLine("Note: this does not exercise WASAPI, the flyout, or combase.dll.");
            return 0;
        }

        Console.WriteLine(_failed + " TEST(S) FAILED");
        return 1;
    }

    private static void Assert(bool condition, string name, string? detail = null)
    {
        if (condition)
        {
            Console.WriteLine("PASS  " + name);
            return;
        }

        _failed++;
        Console.WriteLine("FAIL  " + name + (detail == null ? "" : " — " + detail));
    }

    private static void RunPathSanitizerTests()
    {
        Console.WriteLine("== #41 PathSanitizer ==");
        Assert(PathSanitizer.Sanitize(string.Empty) == string.Empty, "empty stays empty");

        var windowsLog = @"C:\Users\Nekromast\AppData\Roaming\BetterTrumpet\logs\bettertrumpet-20260809.log";
        var sanitizedLog = PathSanitizer.Sanitize(windowsLog);
        Assert(
            sanitizedLog.Contains(@"C:\Users\%USERNAME%\AppData\Roaming\BetterTrumpet\logs")
            && !sanitizedLog.Contains("Nekromast"),
            "Windows profile path becomes %USERNAME%",
            sanitizedLog);

        var mixed = @"Log directory not found: c:\users\Alice\AppData\Roaming\BetterTrumpet\logs";
        var mixedOut = PathSanitizer.Sanitize(mixed);
        Assert(
            mixedOut.Contains(@"c:\users\%USERNAME%\", StringComparison.OrdinalIgnoreCase)
            && !mixedOut.Contains("Alice"),
            "case-insensitive Windows user path",
            mixedOut);

        var quoted = @"IconPath: ""C:\Users\Bob\AppData\Local\Programs\Spotify\Spotify.exe""";
        var quotedOut = PathSanitizer.Sanitize(quoted);
        Assert(
            quotedOut.Contains(@"C:\Users\%USERNAME%\") && !quotedOut.Contains("Bob"),
            "quoted exe path",
            quotedOut);

        Assert(
            PathSanitizer.Sanitize(PathSanitizer.Sanitize(windowsLog)) == PathSanitizer.Sanitize(windowsLog),
            "sanitize is idempotent");

        var userProfile = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
        if (!string.IsNullOrWhiteSpace(userProfile) && userProfile.Length >= 4)
        {
            var localOut = PathSanitizer.Sanitize(userProfile + "/BetterTrumpet/logs/app.log");
            Assert(localOut.StartsWith("%USERPROFILE%", StringComparison.Ordinal), "Linux user profile replaced", localOut);
            Assert(!localOut.Contains(userProfile), "raw profile path gone");
        }

        var appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
        if (!string.IsNullOrWhiteSpace(appData) && appData.Length >= 4)
        {
            var outApp = PathSanitizer.Sanitize(appData + "/BetterTrumpet/diagnostics/bundle.zip");
            Assert(outApp.StartsWith("%APPDATA%", StringComparison.Ordinal), "appdata replaced", outApp);
        }

        var temp = Path.GetTempPath().TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
        var tempOut = PathSanitizer.Sanitize(temp + "/BetterTrumpet-diagnostics.zip");
        Assert(tempOut.StartsWith("%TEMP%", StringComparison.Ordinal), "temp replaced", tempOut);

        Assert(
            PathSanitizer.Sanitize("Brave froze and I killed it") == "Brave froze and I killed it",
            "plain prose unchanged");
    }

    private static void RunDisconnectGateTests()
    {
        Console.WriteLine();
        Console.WriteLine("== #43 SessionDisconnectGate ==");

        var issued = 0;
        Assert(SessionDisconnectGate.TryBeginDisconnect(ref issued), "first disconnect wins");
        Assert(issued == 1, "flag is set after first disconnect");
        Assert(!SessionDisconnectGate.TryBeginDisconnect(ref issued), "second disconnect is ignored");
        Assert(!SessionDisconnectGate.TryBeginDisconnect(ref issued), "third disconnect is ignored");

        var concurrent = 0;
        var entered = 0;
        Parallel.For(0, 2000, _ =>
        {
            if (SessionDisconnectGate.TryBeginDisconnect(ref concurrent))
            {
                Interlocked.Increment(ref entered);
            }
        });
        Assert(entered == 1, "exactly one concurrent caller enters teardown", "entered=" + entered);
    }

    private static void RunSourceContractTests(string repoRoot)
    {
        Console.WriteLine();
        Console.WriteLine("== #37 / #41 source contracts ==");

        var combase = Read(repoRoot, "EarTrumpet/Interop/Combase.cs");
        Assert(
            !Regex.IsMatch(combase, @"MarshalAs\s*\(\s*UnmanagedType\.HString"),
            "Combase.cs does not marshal HSTRING via UnmanagedType.HString");
        Assert(
            !Regex.IsMatch(combase, @"MarshalAs\s*\(\s*UnmanagedType\.IInspectable"),
            "Combase.cs does not marshal IInspectable via UnmanagedType.IInspectable");
        Assert(combase.Contains("GetActivationFactory"), "Combase.cs exposes GetActivationFactory");
        Assert(combase.Contains("WindowsDeleteString"), "Combase.cs deletes HSTRING handles");
        Assert(combase.Contains("WindowsGetStringRawBuffer"), "Combase.cs unpacks HSTRING buffers");
        Assert(Regex.IsMatch(combase, @"RoGetActivationFactory\(\s*IntPtr"), "RoGetActivationFactory takes IntPtr, not string");

        foreach (var variant in new[]
                 {
                     "EarTrumpet/Interop/MMDeviceAPI/IAudioPolicyConfigFactoryVariantFor21H2.cs",
                     "EarTrumpet/Interop/MMDeviceAPI/IAudioPolicyConfigFactoryVariantForDownlevel.cs"
                 })
        {
            var text = Read(repoRoot, variant);
            Assert(
                text.Contains("GetPersistedDefaultAudioEndpoint") && text.Contains("out IntPtr deviceId"),
                Path.GetFileName(variant) + " returns HSTRING as IntPtr",
                variant);
            Assert(!Regex.IsMatch(text, @"MarshalAs\s*\(\s*UnmanagedType\.HString"), Path.GetFileName(variant) + " has no HString marshaller");
        }

        var manager = Read(repoRoot, "EarTrumpet/DataModel/WindowsAudio/IAudioDeviceManagerWindowsAudio.cs");
        Assert(manager.Contains("bool SetDefaultEndPoint"), "SetDefaultEndPoint reports success to callers");

        var moveVm = Read(repoRoot, "EarTrumpet/UI/ViewModels/DeviceCollectionViewModel.cs");
        Assert(
            moveVm.Contains("if (!app.MoveToDevice") && moveVm.Contains("Windows API failed"),
            "flyout does not clone an app row after a failed endpoint move");

        var session = Read(repoRoot, "EarTrumpet/DataModel/WindowsAudio/Internal/AudioDeviceSession.cs");
        Assert(
            session.Contains("SessionDisconnectGate.TryBeginDisconnect"),
            "AudioDeviceSession uses the disconnect gate");
        Assert(
            session.Contains("_dispatcher.BeginInvoke") && session.Contains("OnIconPathChanged"),
            "OnIconPathChanged marshals to the dispatcher");

        var exporter = Read(repoRoot, "EarTrumpet/Diagnosis/LocalDataExporter.cs");
        Assert(exporter.Contains("PathSanitizer.Sanitize"), "diagnostic export sanitizes paths");
        Assert(exporter.Contains("CreateStagingFolder"), "diagnostic export can stage files for review");

        var reporter = Read(repoRoot, "EarTrumpet/Diagnosis/ErrorReporter.cs");
        Assert(reporter.Contains("HasStoredTelemetryConsent"), "Sentry waits for stored telemetry consent");
        Assert(reporter.Contains("DiagnosticsExportConfirmMessage"), "manual export warns before creating files");

        var onboarding = Read(repoRoot, "EarTrumpet/UI/ViewModels/OnboardingViewModel.cs");
        Assert(
            onboarding.Contains("ApplyPrivacyAndUpdates()") && Regex.IsMatch(onboarding, @"void Skip\(\)[\s\S]*ApplyPrivacyAndUpdates"),
            "onboarding Skip persists privacy choices");

        var app = Read(repoRoot, "EarTrumpet/App.xaml.cs");
        Assert(app.Contains("TryStartUpdateService"), "GitHub update checks wait for first-run");
        Assert(
            app.Contains("Settings.HasShownFirstRun = true") && app.Contains("vm.Completed +="),
            "hasShownFirstRun is written when onboarding completes");
    }

    private static string Read(string repoRoot, string relative)
    {
        return File.ReadAllText(Path.Combine(repoRoot, relative));
    }

    private static string? FindRepoRoot()
    {
        var dir = new DirectoryInfo(Directory.GetCurrentDirectory());
        while (dir != null)
        {
            if (File.Exists(Path.Combine(dir.FullName, "EarTrumpet", "Interop", "Combase.cs")))
            {
                return dir.FullName;
            }

            dir = dir.Parent;
        }

        dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir != null)
        {
            if (File.Exists(Path.Combine(dir.FullName, "EarTrumpet", "Interop", "Combase.cs")))
            {
                return dir.FullName;
            }

            dir = dir.Parent;
        }

        return null;
    }
}
