---
title: minirep Documentation
description: Enterprise-style product documentation for minirep, the Chrome DevTools companion for request replay, extractor-driven recon, AI-assisted analysis, and security testing workflows.
permalink: /
eyebrow: Official Product Docs
---

`minirep` is a DevTools-native security and API analysis companion built for people who want browser context, real traffic, and repeatable validation without immediately leaving Chrome. It captures traffic from the inspected tab, lets you replay and mutate requests, extracts findings from responses and loaded client resources, and adds AI-assisted reasoning through `AI MiniReper`.

<div class="callout callout--accent">
  <h3>How to think about minirep</h3>
  <p><code>minirep</code> is best used as the browser-native front line of your workflow: capture what the app is actually doing, understand it quickly, build context from findings, and then decide whether to continue validating inside <code>minirep</code> or move deeper into tools like Burp Suite.</p>
</div>

## Why teams use it

<div class="doc-card-grid">
  <div class="doc-card">
    <h3>Real session context</h3>
    <p>Work from actual browser traffic, selected requests, pinned flows, and extracted findings instead of synthetic examples or copied fragments.</p>
  </div>
  <div class="doc-card">
    <h3>One-screen workflow</h3>
    <p>Capture, request editing, response analysis, extractor findings, and AI reasoning live in one movable DevTools workspace.</p>
  </div>
  <div class="doc-card">
    <h3>Fast triage</h3>
    <p>Move quickly from “what is this app doing?” to “what should I test next?” without having to export everything into another tool first.</p>
  </div>
  <div class="doc-card">
    <h3>Bounded automation</h3>
    <p>Use structured AI-assisted audit flows and request variants while keeping the process anchored to captured traffic and operator review.</p>
  </div>
</div>

## Core product areas

### Capture and workspace

- live request capture from the inspected tab
- HAR-seeded startup context
- request filtering and search
- movable dashboard layout
- import/export of captured traffic

### Request replay and validation

- editable request text and JSON views
- built-in sender for replay
- baseline capture
- runner workflows for diffing and negative testing

### Extractor

- secrets, endpoints, parameters, XSS signals, web cache poisoning signals, security header issues, endpoint graphing, response search, and Supabase-focused findings
- optional inclusion of loaded script resources and source map sources
- AI context handoff from extractor findings

### AI MiniReper

- `Ask` mode for explanation, triage, and targeted reasoning
- `Agent` mode for bounded audit-style execution
- auto context from selected requests, pinned requests, and chosen extractor findings
- auto-run of structured attack suggestions, with post-run analysis

## Where minirep fits in a modern security workflow

`minirep` is especially strong in the part of the workflow where frontend context matters:

- understanding what the browser is really sending
- identifying hidden endpoints and exposed client-side assumptions
- mapping auth context across requests
- validating boundary, cache, and parameter behavior with live replay
- feeding real, selected evidence into an AI assistant

It is not meant to replace every part of a mature AppSec toolchain. It is strongest as the fast, browser-native layer that sits before or beside heavier tools.

## Minirep as a companion to Burp Suite

If you already use Burp:

- use `minirep` to stay close to the browser and understand live flows quickly
- use `Extractor` to turn traffic into findings and candidate context
- use `AI MiniReper` to triage, explain, and stage follow-up ideas
- use the runner to test variants without leaving the panel
- move to Burp when you need broader proxying, manual exploitation depth, scan ecosystems, or larger engagements

The practical model is:

1. Observe and understand in `minirep`
2. Validate quickly in `minirep`
3. Escalate to Burp when the target deserves deeper proxy-driven testing

## Best-fit use cases

<div class="info-grid">
  <div>
    <h3>Application security</h3>
    <p>AppSec engineers can use <code>minirep</code> to understand flows, inspect headers, validate auth boundaries, and triage client-side exposure quickly.</p>
  </div>
  <div>
    <h3>Bug bounty and research</h3>
    <p>Researchers can keep reconnaissance and browser-grounded validation close to the actual application session instead of immediately jumping out into a disconnected workflow.</p>
  </div>
  <div>
    <h3>Developer debugging</h3>
    <p>Developers and QA teams can use the same surfaces for API debugging, request mutation, error analysis, and replay-driven troubleshooting.</p>
  </div>
  <div>
    <h3>Supabase-heavy frontends</h3>
    <p>Teams reviewing Supabase-backed applications can use the dedicated Supabase extractor output to quickly surface table access and sensitive field exposure signals.</p>
  </div>
</div>

## Read next

<div class="link-grid">
  <a href="{{ '/installation/' | relative_url }}">
    <h3>Installation</h3>
    <span>Install from a release zip or build from source.</span>
  </a>
  <a href="{{ '/workspace/' | relative_url }}">
    <h3>Workspace</h3>
    <span>Understand capture, request, response, layout, import, and export.</span>
  </a>
  <a href="{{ '/ai-minireper/' | relative_url }}">
    <h3>AI MiniReper</h3>
    <span>Learn Ask mode, Agent mode, checklist flows, and auto-run behavior.</span>
  </a>
  <a href="{{ '/extractor/' | relative_url }}">
    <h3>Extractor</h3>
    <span>See what each extractor tab does and what kinds of findings it produces.</span>
  </a>
  <a href="{{ '/runner/' | relative_url }}">
    <h3>Runner</h3>
    <span>Use the built-in repeater and variant runner for diff-driven testing.</span>
  </a>
  <a href="{{ '/security/' | relative_url }}">
    <h3>Security Model</h3>
    <span>Understand permissions, data flow, AI context boundaries, and responsible use.</span>
  </a>
</div>
