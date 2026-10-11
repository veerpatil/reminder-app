# Bolt Reminder

A Spydy-style desktop reminder app: set a message and time, and **Bolt** — your custom flying hero mascot — swoops onto your screen when it’s time.

Mascot art: replace `assets/mascot.png` (used for overlay, tray, and UI).

Inspired by [Spydy Reminder](https://spydyreminder.vercel.app/) — same vibe, different character.

## Features

- Menu bar / system tray app (macOS & Windows)
- Custom reminder message and time
- Once or daily repeat
- **Test now** — preview the drop without waiting
- Full-screen overlay with drop animation and dismiss

## Development

```bash
npm install
npm start
```

If the app crashes with `app.whenReady` undefined, unset `ELECTRON_RUN_AS_NODE` in your shell (some tools set it globally). The `npm start` script clears it automatically.

On macOS the app hides from the Dock and lives in the menu bar. Click the tray icon to open settings.

## Build installers

```bash
npm run dist
```

Output goes to `release/`.

## Landing page (Vercel)

The `web/` folder is a static marketing page. Deploy from the **repo root** so `../assets/mascot.png` resolves, or copy `assets/mascot.png` into `web/assets/` if the Vercel root is `web/`.
