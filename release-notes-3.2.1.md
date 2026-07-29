## BetterTrumpet v3.2.1

Before anything else: thank you for 8,000 downloads! That is honestly a lot more than I expected when this fork started, and it is very cool to see people actually using it.

This release is mostly about making the things you use every day a little less annoying. A good part of it came directly from detailed bug reports and community contributions.

### Per-app volume rules

- **Set volume when an app starts** - BetterTrumpet can now apply a volume once when an app launches, then leave you alone so you can adjust it normally. This is the first pass at the request from [issue #30](https://github.com/xammen/BetterTrumpet/issues/30).
- **Lock an app to a volume** - Or keep an app pinned to a level and automatically put it back when Windows or the app changes it.
- **Hard mute and volume rules now play nice** - Both settings live in the same app rule, work together, and can be edited from the flyout or Settings.
- **Old settings are kept** - Existing hard-mute data and older exports are migrated instead of being thrown away.

### Media popup

- **Less twitchy hover behavior** - The popup now gets out of the way when the flyout opens, waits longer before closing, and gives the mouse a bit more room around the edge. These fixes came directly from the behavior reported in [issue #31](https://github.com/xammen/BetterTrumpet/issues/31).
- **Better session choice** - When several media apps are around, an actively playing session gets priority over a paused one.
- **Fewer stale thumbnails** - Artwork cache is refreshed when Windows switches the selected media session.

### CLI and reliability fixes

- **Unicode finally stays Unicode** - Device names, app names, help text, and JSON output no longer turn into mojibake when they pass through the CLI or named pipe.
- **Store installs follow the Store** - Packaged installs no longer show or initialize the GitHub/Inno updater. GitHub, Chocolatey, and Winget installs keep the normal updater.
- **Peak meters are centered** - Dotted, Blocks, Bars, and Wave styles no longer sit slightly too high in the slider. This fix was contributed by [@DARKFiB3R in PR #26](https://github.com/xammen/BetterTrumpet/pull/26).
- **Cleaner version reporting** - The app, CLI, installer, and package all agree that this is `3.2.1`.

Nothing flashy this time, just a bunch of small fixes that should make BetterTrumpet feel more predictable when you are using it every day.

Big thanks to [@vertigo220](https://github.com/vertigo220) for the detailed reports, and to [@DARKFiB3R](https://github.com/DARKFiB3R) for the peak-meter fix.
