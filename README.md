# Pinterest Navigator

A lightweight Chrome extension that lets you navigate between Pinterest pins using the keyboard.

I made this project to make browsing Pinterest a little easier. Instead of repeatedly opening pins and returning to the feed, you can use the **Left** and **Right arrow keys** to move between collected pins.

## Features

- **Keyboard navigation** — use the left and right arrow keys to move between pins.
- **Automatic feed tracking** — detects Pinterest's home feed and collects links to pins currently loaded on the page.
- **Automatic scrolling** — scrolls through the feed in increments to load additional pins.
- **Session-based storage** — keeps the collected pin URLs in Chrome's session storage.
- **Pin prefetching** — prefetches nearby pins to help make navigation feel faster.
- **Navigation overlay** — displays the current pin position while browsing.

## Installation

This extension is not currently published on the Chrome Web Store. You can install it manually through Chrome's developer mode.

1. Download or clone this repository.
2. Open `chrome://extensions/` in Chrome.
3. Enable **Developer mode**.
4. Select **Load unpacked**.
5. Select the downloaded `Pinterest-Navigator` folder.

The extension should now be enabled when browsing Pinterest.

## Usage

1. Open [Pinterest](https://www.pinterest.com/).
2. Allow the extension to detect and collect pins from the feed.
3. Open a pin.
4. Use:
   - `←` Previous pin
   - `→` Next pin

The extension displays a small overlay showing your current position in the collected pin list.

## Project Structure

| File | Purpose |
|---|---|
| `manifest.json` | Chrome extension configuration and permissions |
| `content.js` | Feed tracking, automatic scrolling, and keyboard navigation |
| `background.js` | Handles messages and session storage |
| `icon.png` | Extension icon |

## Technical Details

The extension uses **Chrome Extension Manifest V3** and plain JavaScript.

It uses a content script to interact with Pinterest pages and a background service worker to manage session storage. A `MutationObserver` detects changes to the feed, while browser history events help detect navigation within Pinterest's single-page application.

The extension requests access to Pinterest pages and uses Chrome's storage and scripting-related permissions.

## Limitations

- Pin navigation depends on the URLs collected from the currently rendered feed.
- The collected list is stored in session storage and is not intended to persist as a permanent browsing history.
- Pinterest may change its page structure or navigation behaviour, which can affect the extension.
- This is a small personal project and may require updates as Pinterest changes.

## License

This project is licensed under the [MIT License](LICENSE).
