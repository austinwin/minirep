> For authorized security research, defensive testing, and educational use only. Do not use `minirep` against systems, networks, or applications without explicit permission. You are responsible for complying with all applicable laws and policies. Use at your own risk.

# minirep

[![GitHub stars](https://img.shields.io/github/stars/austinwin/minirep?style=social)](https://github.com/austinwin/minirep/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/austinwin/minirep?style=social)](https://github.com/austinwin/minirep/network/members)

`minirep` is a Chrome DevTools extension for live request capture, API replay, response inspection, extractor-based recon, and AI-assisted security testing. It combines a DevTools request mirror, a lightweight repeater/runner, a finding extractor, and an AI agent that can work from captured traffic and selected findings.

If you are looking for a Chrome DevTools extension for API testing, request replay, bug bounty recon, web application security review, AI pentesting workflows, endpoint discovery, header auditing, Supabase exposure checks, or request/response analysis, `minirep` is built for that workflow.

## Why Minirep

- Keep capture, replay, extraction, and AI analysis inside Chrome DevTools
- Work from real traffic instead of synthetic examples
- Move from passive recon to guided validation without leaving the panel
- Build AI context from selected requests, pinned requests, and chosen extractor findings
- Run bounded adversarial checks without handing control to an unrestricted external scanner

## Core Capabilities

### AI MiniReper

`AI MiniReper` is the AI workspace inside `minirep`. It is built to help explain traffic, propose follow-up tests, and run bounded agent-style audits from the exact requests you captured.

#### Ask mode

- Ask focused questions about selected requests and responses
- Explain complex flows, parameters, auth behavior, and response structures
- Summarize likely vulnerabilities and suspicious indicators from current context
- Suggest attacks, probes, or next traffic to capture

#### Agent mode

- Switch from `Ask` to `Agent` mode for more adversarial, audit-style behavior
- Parse model output into structured `attack-suggestion` variants
- Generate concrete follow-up requests from the live request context
- Support an `Agent Audit` workflow for fast audit-style execution
- Show run progress in explicit stages: prepare, request, response, parse, auto-run, analyze

#### Auto context analysis

- Builds AI context from:
  - the currently selected request
  - multi-selected requests
  - pinned requests you want to keep in scope
  - extractor findings you explicitly add to context
- Shows a token estimate in the toolbar so you can manage prompt size
- Keeps short-term memory summaries and atomic facts in local storage to preserve useful context across interactions

#### Auto attack generation and bounded auto-run

- Agent mode can extract generated test variants directly from model output
- `Auto-run` can automatically execute generated variants through the in-panel sender
- Auto-run is intentionally bounded and currently caps execution to 6 generated tests per run
- After executing generated variants, the AI can automatically analyze the results and produce a follow-up report
- This gives you an AI-assisted repeater workflow inside DevTools, not just a chat box

#### Feasible checklist

The AI panel includes a feasible checklist designed to stay close to observed traffic and safe probes.

Passive checks:

- Identify web server, framework, CDN/WAF, and likely database
- Review security headers and cookie flags
- Scan source comments for endpoints, TODOs, or credentials
- Find leaked emails, IDs, tokens, and suspicious identifiers
- Detect WAF or CDN signals
- Inventory observed URLs and parameters
- Highlight potentially risky URLs for follow-up testing
- Locate login and admin panels
- Inventory JavaScript files
- Look for hardcoded API endpoints and secrets in JavaScript

Lightweight probes:

- Check `robots.txt`, `sitemap.xml`, and common `/.well-known/*` files
- Probe CORS behavior
- Probe allowed HTTP methods

Preparation and planning:

- Summarize site structure and flows
- Produce focused test cases tied to captured traffic
- Infer the business area and critical operations

Checklist behavior is intentionally constrained:

- Uses captured traffic and selected findings as primary context
- Uses only safe GET/HEAD/OPTIONS probes when probes are required
- Does not rely on external scanners

#### Extractor-to-AI handoff

- The extractor can publish findings into a catalog
- You can select findings by tab and add them into AI context
- Findings stay visible in the active context panel until you remove them
- This makes the AI work from actual discovered evidence instead of generic prompts

#### AI providers

Supported providers:

- OpenAI
- Google Gemini
- Anthropic Claude
- Grok / xAI
- DeepSeek
- Perplexity

Other AI capabilities:

- Provider and model selection in-panel
- Optional custom base URL for OpenAI-compatible endpoints
- Chat export as JSON
- Clear memory and reset chat state

### Extractor

The `Extractor` is the recon and finding engine for `minirep`. It scans captured traffic and can also load script resources and source map sources to widen coverage beyond raw API requests.

#### Extractor workflow

- Runs directly on the traffic captured in the DevTools session
- Adds script/document resources when available
- Attempts to include source map sources for deeper client-side discovery
- Supports filtering, sorting, pagination, and strict-mode scanning
- Publishes findings into an AI context catalog for `AI MiniReper`

#### Extractor tabs and findings

Supabase:

- Detect Supabase URLs and JWTs from captured content
- Infer token roles
- Enumerate accessible tables when possible
- Highlight vulnerable tables and sensitive fields
- Summarize counts by severity

Secrets:

- Scan headers, bodies, URLs, responses, scripts, and mapped sources
- Use generated rules plus secretlint-style matching
- Show match, type, confidence, and source file/request

Endpoints:

- Extract endpoint paths and methods
- Show confidence and source
- Build a fast inventory of reachable application surface

Parameters:

- Inventory parameters found in URLs, bodies, and observed requests
- Show key, value, source, and request location

Web Cache Poisoning:

- Surface cache-related signals and suspicious vectors
- Keep request linkage so findings can be replayed or validated

XSS Scanner:

- Surface reflected or suspicious parameter/evidence patterns
- Link findings back to request context for quick retesting

Security Headers:

- Check missing or weak security headers
- Show severity, issue, guidance, and request URL
- Offer copyable recommended header values when available

Endpoint Graph:

- Build a risk-scored endpoint map
- Track method, path, observed hits, sources, and risk signals

Response Search:

- Search across all captured response bodies from one place
- Return matching responses with request linkage and context snippets

#### Extractor output management

- Findings can be filtered within each tab
- Results can be sorted by the most important fields for each finding type
- Strict mode helps narrow scans when you want tighter matching
- The panel clearly warns that automated findings can include false positives and should be manually verified

### Capture, Request, Response, and Runner

`minirep` is not only an extractor or AI panel. It is also a full request mirror and in-panel replay tool.

#### Capture panel

- Live network capture from the inspected Chrome tab
- Seed capture from the current HAR when the panel opens
- Filters for:
  - all
  - xhr
  - fetch
  - errors
  - assets
- Pause and resume live capture
- Search by URL, path, and host
- Multi-select requests
- Sequence numbering for replay order and investigation flow
- Clear captured traffic
- Import and export captured traffic as JSON

#### Request panel

- Inspect request line, headers, and body
- Search within the request
- Edit requests in:
  - pretty/raw request text form
  - JSON form
  - runner mode
- Copy request text
- Send modified requests directly from the panel

#### Response panel

- Inspect response headers and body
- Pretty and JSON views
- Search within response data
- Copy response body
- Review:
  - status
  - status text
  - duration
  - size

#### Runner / repeater workflow

The Request panel includes a built-in runner that turns captured traffic into repeatable validation runs.

Baseline:

- Capture a baseline response with status, size, hash, and cache summary

Variant runner presets:

- Auth stripped
- Method override headers
- Method tunneling via `_method`
- Header pollution
- Client IP spoof headers
- Path confusion
- Parameter duplication

Boundary diff:

- Reuse auth-like headers from multiple selected requests
- Compare status, hashes, and JSON deltas across auth contexts
- Useful for access-control and tenant-boundary validation

Negative cache probes:

- Probe host, protocol, forwarded headers, and path variants
- Compare hashes and cache signals

Payload packs:

- IDOR
- SSRF
- SQLi
- XSS

Run results:

- Variant label
- Signal classification
- HTTP status
- Time
- Size
- Body hash
- Diff summary
- Cache summary

Signal labels can surface outcomes like:

- auth bypass
- boundary enforced
- boundary changed
- cache variance
- method accepted
- input impact

### Workspace and usability

- Movable and resizable dashboard layout
- Capture, Request, Response, and AI panels arranged in one workspace
- Layout reset support
- Extractor toggle and AI toggle in the top bar
- Layout and AI settings persisted locally for reuse across sessions

## Who This Extension Is For

- Security engineers validating real application traffic
- Bug bounty hunters doing browser-based recon and replay
- Developers debugging auth, headers, caching, and request flows
- QA teams checking API behavior across variants
- AppSec teams reviewing exposed client-side endpoints and secrets
- Teams using Supabase and wanting fast browser-side exposure review

## Relevant Search Terms

These are the kinds of workflows `minirep` is designed for:

- Chrome DevTools extension for API testing
- AI Chrome extension for web security testing
- request repeater alternative inside Chrome DevTools
- request and response analyzer for bug bounty workflows
- endpoint finder and secret extractor from browser traffic
- AI-assisted vulnerability analysis for captured requests
- Supabase key, table, and exposure checker from frontend traffic
- API replay, request runner, and response diff tool in the browser

<img width="1306" height="736" alt="image" src="https://github.com/user-attachments/assets/2cb69d4e-8638-4510-92d5-c06eed8e1a9b" />  
<img width="812" height="636" alt="image" src="https://github.com/user-attachments/assets/5312a898-b820-452a-9968-eae245d07227" />  
<img width="1042" height="550" alt="image" src="https://github.com/user-attachments/assets/d0886e48-40e8-4c5f-8510-781c542c8df3" />  
<img width="1314" height="618" alt="image" src="https://github.com/user-attachments/assets/cc988805-0159-4c05-878a-f85e72775214" />  




## Install In Chrome

You can install `minirep` in Chrome in two ways.

### Option A: Install from the pre-built GitHub Release zip

This is the easiest path for end users because it does not require Node.js or a local build.

1. Open the GitHub Releases page for `minirep`
2. Download the latest pre-built zip asset
3. Unzip the file on your machine
4. Open the extracted folder and locate the folder that contains `manifest.json`
5. Open `chrome://extensions`
6. Turn on `Developer mode`
7. Click `Load unpacked`
8. Select the extracted folder that contains `manifest.json`

Important notes:

- Chrome cannot install the zip directly through `Load unpacked`; you must unzip it first
- If the release extracts into a folder such as `output_built/` or `chrome-mv3/`, choose that folder if it contains `manifest.json`
- The correct folder is always the one that directly contains files like `manifest.json`, `panel.html`, `devtools.html`, `chunks/`, and `icon/`

### Option B: Build from source

Use this path if you want to develop, modify, or locally rebuild the extension.

1. Install dependencies from the extension folder:

```bash
npm install
```

2. Build the extension:

```bash
npm run build
```

3. The unpacked Chrome extension will be created in:

```text
.output/chrome-mv3
```

4. Open `chrome://extensions`
5. Turn on `Developer mode`
6. Click `Load unpacked`
7. Select the `.output/chrome-mv3` folder

### First run after install

1. Open any target web app in Chrome
2. Open DevTools
3. Click the `minirep` tab
4. Reload the page or interact with it to start populating traffic

### Updating to a newer release build

1. Download the newer pre-built release zip
2. Unzip it to a new or replacement folder
3. Open `chrome://extensions`
4. Click `Reload` on the existing `minirep` extension, or use `Load unpacked` again and select the newer extracted folder

## Suggested Workflow

1. Open a target app and let `minirep` capture traffic.
2. Filter and multi-select the requests that matter.
3. Inspect request and response details to understand the flow.
4. Open `Extractor` and run a scan.
5. Add the most relevant extractor findings into AI context.
6. Switch `AI MiniReper` into `Ask` mode for explanation or `Agent` mode for a bounded audit.
7. Run `Agent Audit` or generate attack variants.
8. Let auto-run execute bounded test variants when appropriate.
9. Review runner output, diffs, hashes, cache signals, and follow-up AI analysis.
10. Export traffic or AI chat if you want to preserve the session.

## Permissions and Privacy

- `host_permissions: <all_urls>` is required so DevTools can inspect traffic from the page you are debugging
- `storage` is used to persist layout and AI settings locally
- Captured traffic remains local unless you export it or send selected context to an AI provider
- When AI features are used, selected request data and chosen extractor findings can be sent to the configured provider

## Current Limitations

- `minirep` runs inside Chrome DevTools, not as a standalone desktop app
- Capture is scoped to the inspected tab
- Some browser-controlled headers cannot be replayed exactly from the in-panel sender, including `Cookie`, `Host`, `Origin`, and `User-Agent`
- Automated findings and AI suggestions should still be manually verified

## Troubleshooting

- If the `minirep` tab does not appear, reload the extension from `chrome://extensions` and reopen DevTools
- If you do not see requests, reload the page after opening DevTools
- If extractor findings are empty, capture more traffic and run the scan again
- If the AI panel cannot respond, verify provider, model, API key, and optional base URL
- If you change source files, rebuild with `npm run build` and reload the unpacked extension

## Help This Project Grow

If `minirep` helps your workflow:

- Star the repo
- Fork it for custom rules, scanners, or provider integrations
- Share it with developers, QA engineers, AppSec teams, and bug bounty researchers
- Open issues and feature requests with real workflows you want supported

More visibility means more feedback, better extractor coverage, better AI workflows, and a stronger open-source DevTools extension for API security testing and browser-based application analysis.

## License

This project is released under the MIT License. See [LICENSE](./LICENSE).
