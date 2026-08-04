## BetterTrumpet v3.2.3

This one is for anyone who has ever launched a game and immediately reached for
the volume slider. You can now set a starting volume for a whole folder instead
of teaching BetterTrumpet about every executable one by one.

### Folder-based launch volume rules

- **Set a default for a folder** - Pick a folder and new desktop apps launched from it start at the volume you choose. This is the folder-based follow-up to [issue #30](https://github.com/xammen/BetterTrumpet/issues/30).
- **Nested folders do what you expect** - If rules overlap, the deepest matching folder wins, so a more specific game or tools folder can override a broad Steam, Work, or Projects rule.
- **Explicit app rules still win** - A per-app `Set at launch` or `Lock` rule stays more specific than any folder default. Hard mute also keeps composing normally with the result.
- **The rules are editable and portable** - Add, browse, edit, and remove folder rules from Settings. They are stored with the rest of the profile and included in settings export/import.

Small feature, but a pretty useful one if your games, tools, or work apps tend to
start way louder than you would like. Thanks to everyone who kept pushing on this
request.
