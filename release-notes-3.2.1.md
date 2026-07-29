## BetterTrumpet v3.2.1

### Per-app volume rules

- **Persistent volume rules** - Set an app's volume once when it launches, or lock it to a chosen level throughout the session.
- **Unified app controls** - Volume rules and persistent hard mute now share one editable app entry in the flyout and Settings.
- **Reliable migration** - Existing hard-mute settings and older exported configurations are migrated and merged without losing app rules.

### Media popup

- **More stable hover behavior** - The popup now coordinates with the main flyout, uses a larger pointer tolerance area, and waits longer before closing.
- **Better session selection** - Actively playing sessions are preferred over paused sessions, with stale artwork invalidated when the selected session changes.

### Reliability and compatibility

- **Unicode CLI support** - Device names, app names, help text, and JSON output now preserve non-ASCII characters across console and named-pipe communication.
- **Correct Store update flow** - Microsoft Store installations no longer initialize or display the GitHub installer updater, while unpackaged installs keep automatic update support.
- **Centered peak meters** - Dotted, Blocks, Bars, and Wave peak-meter styles are vertically aligned correctly.
- **Consistent version reporting** - App, CLI, installer, and package versions consistently report 3.2.1 without exposing packaging-only revision numbers.
