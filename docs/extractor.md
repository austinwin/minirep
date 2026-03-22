---
title: Extractor
description: Detailed documentation for the Extractor, including scan sources, finding tabs, output interpretation, and AI-context integration.
permalink: /extractor/
eyebrow: Recon Engine
---

## What the Extractor does

The `Extractor` is the structured finding engine inside `minirep`.

It turns captured application traffic into categorized findings that can be:

- reviewed directly
- filtered and sorted
- linked back to source requests
- handed into `AI MiniReper` as explicit context

## Scan sources

The Extractor does more than inspect plain request/response pairs.

It can scan:

- captured requests
- captured responses
- loaded scripts
- loaded document resources
- source map sources when available

This is important because many high-value findings are present in frontend resources, not only in API payloads.

## Extractor tabs

### Supabase

The Supabase tab focuses on Supabase-backed frontend exposure.

It can surface:

- Supabase URLs
- JWT-like tokens
- inferred token roles
- accessible tables
- vulnerable table counts
- sensitive field exposure indicators

This tab is especially useful when assessing modern frontend apps that embed Supabase assumptions into client-visible code or traffic.

### Secrets

The Secrets tab scans for token-like and secret-like material across captured content and loaded resources.

It reports:

- match
- type
- confidence
- source file or request

This is useful both for direct triage and for deciding what to send into AI context.

### Endpoints

The Endpoints tab builds a fast surface map from observed traffic and discovered content.

It helps answer:

- what paths exist?
- what methods are associated with them?
- which ones were learned from live traffic versus extracted sources?

### Parameters

The Parameters tab inventories parameters across URLs, requests, and content.

It is useful for:

- replay planning
- payload pack targeting
- quickly spotting auth, ID, redirect, or file-like parameters

### Web Cache Poisoning

This tab surfaces cache-related signals and suspicious vectors that may justify follow-up validation in the runner.

It does not replace careful manual verification. It helps identify where to look.

### XSS Scanner

This tab highlights reflected or suspicious XSS-related evidence tied to parameters and requests.

It is useful for:

- deciding what should be replayed
- feeding specific suspicious findings into AI context
- prioritizing frontend-originated reflection points

### Security Headers

This tab reviews header posture and provides:

- severity
- affected header
- issue summary
- guidance
- request linkage

When available, recommended header values can be copied directly.

### Endpoint Graph

This tab turns discovered endpoints into a lightweight risk-scored graph view.

It helps answer:

- which endpoints look more sensitive?
- what signals contribute to that impression?
- which paths have stronger operational interest?

### Response Search

This tab searches response bodies across the session and returns:

- request linkage
- matching file or URL
- result context snippet

This is useful for broad content discovery without manually clicking through every response.

## How to use the Extractor well

The Extractor works best when you:

1. capture realistic application flows first
2. run the scan after meaningful traffic exists
3. filter findings to the categories that matter for the target
4. promote only the most relevant findings into AI context

## False positives and operator review

The Extractor is a fast triage engine, not a substitute for validation.

Its job is to compress the signal-discovery phase. The operator still decides:

- what is real
- what is exploitable
- what belongs in a report

That is why the handoff into the runner and AI layers matters so much.
