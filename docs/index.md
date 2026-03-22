---
layout: default
title: minirep
description: Chrome DevTools extension for AI-assisted API testing, request replay, extractor-based recon, and web security analysis.
---

# minirep

`minirep` is a Chrome DevTools extension for AI-assisted API testing, request replay, response inspection, extractor-based recon, and browser-based web security analysis.

## What it does

- captures live traffic from the inspected Chrome tab
- lets you inspect requests and responses in one workspace
- replays and mutates requests with an in-panel runner
- extracts endpoints, secrets, parameters, security header issues, Supabase exposure signals, XSS signals, cache-poisoning signals, and response-body matches
- adds AI-assisted analysis through `AI MiniReper`

## Best fit use cases

- API testing
- request replay
- request and response analysis
- bug bounty recon
- AppSec validation
- security research on owned or authorized targets
- frontend endpoint discovery
- Supabase exposure review

## Install

- End users: download the latest pre-built release from the GitHub Releases page and load the extracted folder in `chrome://extensions`
- Developers: clone the repo, run `npm install`, then `npm run build`, and load `.output/chrome-mv3`

## Links

- Repository: [github.com/austinwin/minirep](https://github.com/austinwin/minirep)
- Releases: [github.com/austinwin/minirep/releases](https://github.com/austinwin/minirep/releases)
- README: [github.com/austinwin/minirep/blob/main/README.md](https://github.com/austinwin/minirep/blob/main/README.md)

## Responsible use

Use `minirep` only for authorized research, defensive testing, and educational work. Do not use it against systems you do not own or have explicit permission to assess.
