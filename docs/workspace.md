---
title: Workspace and Traffic Model
description: The capture, request, response, and layout model inside minirep, including how to work from live browser traffic and exported sessions.
permalink: /workspace/
eyebrow: Product Tour
---

## The workspace model

`minirep` is designed as a unified DevTools workspace. Instead of sending traffic to multiple disconnected views, it keeps the operator inside one surface where capture, request editing, response review, extractor findings, and AI context can all interact.

The default working areas are:

- **Capture**
- **Request**
- **Response**
- **AI MiniReper**

The layout is movable and resizable so users can prioritize triage, replay, or AI work depending on the moment.

## Capture panel

The Capture panel is the live traffic mirror for the inspected tab.

It supports:

- live capture from the DevTools network stream
- HAR seeding on load so current traffic is not empty on startup
- request filters for `all`, `xhr`, `fetch`, `errors`, and `assets`
- text filtering by URL, path, and host
- pause and resume
- single selection and multi-selection
- sequence ordering for investigation flow
- clear, import, and export actions

## Request panel

The Request panel is where replay and mutation begin.

It supports:

- raw request editing
- JSON-based request editing
- header inspection
- body inspection
- request search
- copy
- resend through the built-in sender

This is the surface you use when you want to quickly answer questions like:

- what exactly did the browser send?
- what happens if I remove auth-like headers?
- what changes if I duplicate parameters or alter the method path?

## Response panel

The Response panel is optimized for fast comparison and quick inspection.

It supports:

- pretty and JSON views
- header inspection
- response body review
- response search
- copy body
- status, duration, and size review

For practical security and debugging work, that means you can very quickly compare:

- status changes
- body hash changes
- obvious access control shifts
- cache behavior shifts
- content-type or security-header drift

## Selection model

Selection matters in `minirep`.

- the currently selected request becomes the focused working request
- multi-selected requests expand the context for auth and boundary comparisons
- pinned requests remain in AI context even when you switch focus

This is how the product bridges capture, replay, and AI analysis without forcing you to manually rebuild context every time.

## Import and export

`minirep` supports JSON export and import of captured traffic.

That is useful for:

- preserving sessions for later review
- handing reproducible evidence to teammates
- moving from a live browser session into an offline reasoning workflow
- building an internal library of representative flows

## Why this matters for security work

The workspace model is one of the main reasons `minirep` is effective as a companion tool. It reduces the gap between:

- observing a browser behavior
- understanding it
- replaying it
- testing a variation
- feeding the result into the next stage of reasoning

That is especially useful for frontend-heavy applications where the browser itself is part of the security story.
