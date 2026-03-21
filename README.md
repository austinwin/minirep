# minirep

`minirep` is a Chrome DevTools extension for capturing, replaying, and analyzing network traffic from the tab you are inspecting. It keeps the workflow inside DevTools and adds request replay, response review, extractor scans, and optional AI assistance.

## Who It Is For

- Developers debugging frontend or API traffic
- QA engineers validating request and response behavior
- Security testers reviewing endpoints, headers, parameters, and exposed data

## Features

- Live request capture from the current DevTools session
- Search, filtering, pause/resume, and multi-select for captured requests
- Request and response inspection with headers, bodies, status, size, and timing
- Manual request editing and replay from inside the panel
- Request import/export as JSON
- Variant runners for boundary checks, cache probes, auth comparisons, and payload testing
- Extractor tabs for secrets, endpoints, parameters, security headers, XSS signals, cache poisoning signals, endpoint graphs, response search, and Supabase-focused findings
- AI MiniReper assistant for explaining traffic, generating follow-up ideas, and working from captured extractor context
- Saved panel layout and saved AI settings in local extension storage

## Install In Chrome

This project is currently installed from source as an unpacked Chrome extension.

### 1. Install dependencies

Run these commands from the extension folder, the one that contains `package.json`.
If you are starting from the repo root, enter `minirep/` first.

```bash
npm install
```

### 2. Build the extension

```bash
npm run build
```

This creates the unpacked Chrome extension in:

```text
.output/chrome-mv3
```

### 3. Load it in Chrome

1. Open `chrome://extensions`
2. Turn on `Developer mode`
3. Click `Load unpacked`
4. Select the `.output/chrome-mv3` folder

### 4. Open the panel

1. Open any website in Chrome
2. Open DevTools
3. Click the `minirep` tab in DevTools
4. Reload the page or interact with it to start capturing traffic

## Basic Usage

1. Open the `minirep` DevTools panel on the tab you want to inspect
2. Browse or use the page to generate requests
3. Select a request from the left column
4. Review the request and response details
5. Edit and resend a request if you want to replay it
6. Open `Extractor` to scan captured traffic
7. Open `AI MiniReper` if you want AI help with the selected traffic
8. Export captures when you want to save or share a session

## AI MiniReper

The AI panel supports these providers:

- OpenAI
- Google
- Anthropic
- Grok
- DeepSeek
- Perplexity

To use it:

1. Open `AI MiniReper`
2. Enter your API key
3. Choose a provider and model
4. Optionally set a custom base URL for OpenAI-compatible endpoints

AI settings are stored locally in extension storage and local browser storage for convenience.

## Permissions And Privacy

- `host_permissions: <all_urls>` is used so DevTools can inspect traffic from the page you are debugging
- `storage` is used to save layout and AI settings locally
- Captured traffic stays local unless you export it or send context to an AI provider
- When you use AI features, the selected request data and related context may be sent to the provider you configured

## Limitations

- `minirep` works inside Chrome DevTools, not as a standalone page
- The panel only captures traffic for the inspected tab
- Some browser-controlled headers cannot be replayed exactly from the request editor, including headers like `Cookie`, `Host`, `Origin`, and `User-Agent`

## Troubleshooting

- If the `minirep` tab does not appear, reload the extension from `chrome://extensions` and reopen DevTools
- If you do not see requests, reload the page after opening DevTools
- If AI requests fail, verify the provider, model, API key, and optional base URL
- After code changes, run `npm run build` again and reload the unpacked extension
