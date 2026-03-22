---
title: Security Model and Responsible Use
description: How minirep handles permissions, data flow, AI context, and where it belongs in an authorized security testing workflow.
permalink: /security/
eyebrow: Security Posture
---

## Responsible use

`minirep` is for authorized security research, defensive testing, and educational work.

Do not use it against systems or applications without explicit permission.

## Why the extension requests broad host visibility

The extension uses DevTools network visibility so it can inspect traffic from the page you are actively debugging or assessing.

That is why the extension requests:

- host access for inspected traffic
- local storage for settings and layout persistence

These permissions support the product’s core behavior, not background crawling or arbitrary remote scanning.

## Data flow model

By default, `minirep` works locally inside the browser context.

Captured traffic stays local unless you:

- export it
- deliberately send context to an AI provider

When AI features are used, selected requests and chosen extractor findings can become part of the context sent to the configured provider.

## Security boundary summary

| Area | What minirep does | What the operator should remember |
| --- | --- | --- |
| Browser traffic | Reads traffic from the inspected tab in DevTools | Only traffic from the active inspected workflow is in scope |
| Local persistence | Stores layout and AI settings locally | Treat the local browser profile as part of your trust boundary |
| AI usage | Sends only the context you actively use with the configured provider | Do not send more traffic or findings than required for the task |
| Export/import | Allows JSON session movement | Exported session files should be handled as potentially sensitive artifacts |
| Replay | Re-sends modified requests from the panel | Operator judgment still controls the safety and appropriateness of what is sent |

## AI-context safety considerations

Before using `AI MiniReper`, operators should decide whether the active context is appropriate to send to the configured provider.

Best practice:

- keep context tight
- avoid sending unnecessary sensitive traffic
- remove findings that are not required for the current reasoning task
- use provider selection intentionally

## What minirep is good at in a security workflow

`minirep` is especially effective for:

- browser-native observation
- frontend-aware recon
- replay and mutation of observed requests
- auth and cache behavior comparison
- fast extractor-driven triage
- AI-assisted explanation and bounded validation

## What minirep is not designed to be

`minirep` is not intended to be:

- a full proxy replacement for large engagements
- a broad autonomous exploitation framework
- a substitute for human validation and reporting judgment

It is strongest when it accelerates the operator rather than replacing the operator.

## Operational guidance

Use `minirep` responsibly by:

- working only on authorized targets
- capturing realistic application flows
- validating findings before escalating claims
- treating AI output as analyst support, not final truth
- escalating into deeper tools only when the target and evidence justify it

## How minirep fits into defensive testing

`minirep` is most effective in defensive and authorized workflows where you need:

- fast visibility into what the browser is really doing
- a repeatable way to compare variants
- tight context for reasoning about auth, cache, endpoints, and response content
- a browser-side companion before you move into heavier proxy-led tooling

## Security reporting for minirep itself

If you believe you found a vulnerability in `minirep` itself, follow the process documented in the repository security policy rather than posting full exploit details publicly first.
