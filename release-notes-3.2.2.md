## BetterTrumpet v3.2.2

Another small cleanup release, this time for a few Windows edge cases that were
making BetterTrumpet feel a little more chaotic than it should. Still a bit
surreal that we are past 8,000 downloads. Thanks for keeping the reports coming.

### Better positioning

- **The flyout stays attached to the taskbar edge** - The tray icon now picks the right monitor without pulling the flyout away from its proper taskbar position. It also enters the topmost band before its opening animation, so other always-on-top windows cannot jump in front of it.
- **Custom display scaling behaves properly** - The flyout and media popup convert Windows' physical tray and monitor coordinates to WPF DIPs, then react to DPI changes instead of slowly drifting or overflowing after a scaling change.
- **The media popup catches missed track updates** - A lightweight visible-state check refreshes the title and artwork cache when a media provider skips a track-change event.

### CLI reliability

- **`set-default` now means it** - The CLI sets both the `Console` and `Multimedia` playback roles, then verifies that Windows actually accepted the selected device. A failed or ignored COM call now returns an error instead of a very confident but wrong `ok: true`.

### Appearance

- **Custom window colors keep the Acrylic look** - The live flyout content now uses the selected window color without painting over the Windows Acrylic material.
- **Window background opacity is adjustable** - Pick how much of your custom color comes through, from subtle tint to fully solid, without hammering the DWM effect while dragging the slider.
- **A few calmer house presets** - `Midnight Studio`, `Graphite`, and `Night Shift` join the palette, and the color picker now shows the live hex values it is using.

Nothing dramatic, just less UI drifting, fewer stale media details, and a CLI that does not claim victory before Windows has actually done the job.
