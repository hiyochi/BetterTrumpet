using System.Collections.Generic;
using System.Linq;
using System.Windows.Media;

namespace EarTrumpet.UI.ViewModels
{
    /// <summary>
    /// Central registry of predefined color themes.
    /// The list is intentionally curated: every theme is a complete look,
    /// including its own acrylic character (WindowBackgroundOpacity).
    /// Constructor: (name, category, thumb, fill, background, peak, windowBg, text, accentGlow, opacity)
    /// </summary>
    public static class ThemeRegistry
    {
        // Default colors (Windows accent blue as fallback)
        public static readonly Color DefaultAccentColor = Color.FromRgb(0, 120, 215);
        public static readonly Color DefaultTrackBackground = Color.FromRgb(80, 80, 80);
        public static readonly Color DefaultPeakMeter = DefaultAccentColor;

        // Category constants
        public const string CatDefault = "Minimal";
        public const string CatBrand = "Apps";
        public const string CatDev = "Editors";
        public const string CatAtmosphere = "Atmosphere";
        public const string CatAccessibility = "Accessibility";

        /// <summary>
        /// All category names in display order
        /// </summary>
        public static IReadOnlyList<string> Categories { get; } = new[]
        {
            CatDefault, CatBrand, CatDev, CatAtmosphere, CatAccessibility
        };

        public static IReadOnlyList<ColorTheme> AllThemes { get; } = new List<ColorTheme>
        {
            // ═══════════════════════════════════════════
            // MINIMAL — the baseline and the house looks
            // ═══════════════════════════════════════════

            // Windows default: blue accent with warm white text.
            // Leaves window opacity untouched: this is the system baseline.
            new ColorTheme("Default (Windows Accent)", CatDefault,
                DefaultAccentColor, DefaultAccentColor, DefaultTrackBackground, DefaultPeakMeter,
                Color.FromRgb(32, 32, 32), Color.FromRgb(255, 255, 255), DefaultAccentColor),

            // House palette: cool studio glass. Deep blue surfaces with an amber
            // peak for contrast; very translucent so the desktop shows through.
            new ColorTheme("Midnight Studio", CatDefault,
                Color.FromRgb(92, 145, 238),
                Color.FromRgb(58, 111, 206),
                Color.FromRgb(28, 31, 39),
                Color.FromRgb(242, 181, 86),
                Color.FromRgb(16, 18, 24), Color.FromRgb(242, 244, 248), Color.FromRgb(104, 158, 248),
                0.45),

            // House palette: warm brass on graphite. More opaque and serious;
            // sage green peak keeps it from reading as monochrome orange.
            new ColorTheme("Graphite", CatDefault,
                Color.FromRgb(222, 174, 112),
                Color.FromRgb(174, 123, 76),
                Color.FromRgb(39, 40, 45),
                Color.FromRgb(111, 194, 165),
                Color.FromRgb(22, 23, 27), Color.FromRgb(238, 239, 234), Color.FromRgb(231, 181, 117),
                0.75),

            // ═══════════════════════════════════════════
            // APPS — palettes that match the apps you mix
            // ═══════════════════════════════════════════

            // Spotify: brand green on near-black; brightened text for contrast
            // against the dark surface; coral peak (complement of green).
            new ColorTheme("Spotify", CatBrand,
                Color.FromRgb(30, 215, 96),
                Color.FromRgb(25, 175, 80),
                Color.FromRgb(40, 40, 40),
                Color.FromRgb(255, 120, 100),
                Color.FromRgb(18, 18, 18), Color.FromRgb(240, 240, 240), Color.FromRgb(30, 215, 96),
                0.85),

            // Discord: blurple thumb, online-green fill, gold peak. Window surface
            // uses Discord's server-list shade so sliders stay visible on it.
            new ColorTheme("Discord", CatBrand,
                Color.FromRgb(88, 101, 242),
                Color.FromRgb(87, 242, 135),
                Color.FromRgb(30, 31, 34),
                Color.FromRgb(240, 178, 50),
                Color.FromRgb(43, 45, 49), Color.FromRgb(227, 229, 232), Color.FromRgb(88, 101, 242),
                0.9),

            // ═══════════════════════════════════════════
            // EDITORS — the three classic editor themes
            // ═══════════════════════════════════════════

            // Dracula: purple/pink/cyan on its authentic background; track one
            // step darker than the window for slider depth.
            new ColorTheme("Dracula", CatDev,
                Color.FromRgb(189, 147, 249),
                Color.FromRgb(255, 121, 198),
                Color.FromRgb(33, 34, 44),
                Color.FromRgb(139, 233, 253),
                Color.FromRgb(40, 42, 54), Color.FromRgb(248, 248, 242), Color.FromRgb(189, 147, 249),
                0.75),

            // Catppuccin Mocha: mauve thumb, blue fill, frappé track, green peak.
            new ColorTheme("Catppuccin", CatDev,
                Color.FromRgb(203, 166, 247),
                Color.FromRgb(137, 180, 250),
                Color.FromRgb(24, 24, 37),
                Color.FromRgb(166, 227, 161),
                Color.FromRgb(30, 30, 46), Color.FromRgb(205, 214, 244), Color.FromRgb(245, 194, 231),
                0.7),

            // Nord: frost thumb, aurora fill, polar-night track one step below
            // the window shade; snow-storm text.
            new ColorTheme("Nord", CatDev,
                Color.FromRgb(136, 192, 208),
                Color.FromRgb(163, 190, 140),
                Color.FromRgb(36, 41, 51),
                Color.FromRgb(208, 135, 112),
                Color.FromRgb(46, 52, 64), Color.FromRgb(216, 222, 233), Color.FromRgb(136, 192, 208),
                0.65),

            // ═══════════════════════════════════════════
            // ATMOSPHERE — moods with strong character
            // ═══════════════════════════════════════════

            // Synthwave: neon pink/cyan over deep purple glass; kept translucent
            // so the glow reads like light through a window at night.
            new ColorTheme("Synthwave", CatAtmosphere,
                Color.FromRgb(255, 16, 128),
                Color.FromRgb(0, 255, 255),
                Color.FromRgb(25, 5, 45),
                Color.FromRgb(255, 160, 0),
                Color.FromRgb(15, 2, 30), Color.FromRgb(255, 130, 220), Color.FromRgb(180, 0, 255),
                0.5),

            // Aurora: aurora-green thumb against violet fill on a night-sky
            // surface; dawn-pink peak. Very translucent, like watching the sky.
            new ColorTheme("Aurora", CatAtmosphere,
                Color.FromRgb(0, 255, 170),
                Color.FromRgb(120, 60, 220),
                Color.FromRgb(8, 15, 25),
                Color.FromRgb(255, 140, 180),
                Color.FromRgb(5, 10, 18), Color.FromRgb(190, 240, 220), Color.FromRgb(0, 220, 150),
                0.45),

            // ═══════════════════════════════════════════
            // ACCESSIBILITY — contrast first
            // ═══════════════════════════════════════════

            // Maximum contrast: white/yellow/black/cyan, fully solid window so
            // no desktop content can bleed behind the mixer.
            new ColorTheme("High Contrast", CatAccessibility,
                Color.FromRgb(255, 255, 255),
                Color.FromRgb(255, 255, 0),
                Color.FromRgb(0, 0, 0),
                Color.FromRgb(0, 255, 255),
                Color.FromRgb(0, 0, 0), Color.FromRgb(255, 255, 255), Color.FromRgb(255, 255, 0),
                1.0),

            // Deuteranopia-safe Okabe-Ito set: blue/orange/pink/sky, nearly solid
            // to keep every channel distinguishable.
            new ColorTheme("Color Blind Safe", CatAccessibility,
                Color.FromRgb(0, 114, 178),
                Color.FromRgb(230, 159, 0),
                Color.FromRgb(15, 15, 18),
                Color.FromRgb(204, 121, 167),
                Color.FromRgb(16, 16, 20), Color.FromRgb(220, 220, 230), Color.FromRgb(86, 180, 233),
                0.95),
        };

        /// <summary>
        /// Get themes grouped by category, in display order.
        /// </summary>
        public static IEnumerable<IGrouping<string, ColorTheme>> GetGroupedThemes()
        {
            return AllThemes.GroupBy(t => t.Category)
                           .OrderBy(g => System.Array.IndexOf(Categories.ToArray(), g.Key));
        }
    }
}
