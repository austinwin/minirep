---
title: FAQ
description: Common questions about installation, data handling, AI providers, Burp positioning, and how to get the most from minirep.
permalink: /faq/
eyebrow: Reference
---

## Is minirep a Burp replacement?

No. It is better described as a browser-native companion to Burp and related security tooling.

## Does minirep proxy all browser traffic?

It works through the DevTools context of the inspected tab and is optimized around that working model.

## Can I use it without AI?

Yes. Capture, request replay, response inspection, extractor findings, import/export, and the request runner are useful on their own.

## Which users benefit most?

- AppSec engineers
- bug bounty researchers
- security-minded frontend and API developers
- QA teams testing request behavior

## Does minirep send captured data to a server by default?

No. Captured traffic stays local unless you export it or deliberately use an AI provider with selected context.

## What is the easiest way to install it?

Download the pre-built release zip, unzip it, and load the extracted folder that contains `manifest.json` through `chrome://extensions`.

## Why do I not see requests immediately?

Open DevTools first, then reload the page or generate traffic after the panel is already active.

## When should I use Ask mode versus Agent mode?

- use `Ask` mode when you want understanding, explanation, and targeted reasoning
- use `Agent` mode when you want bounded audit-style generation and optional auto-run behavior

## What makes the docs site useful once Pages is enabled?

It gives the project:

- a cleaner product surface than a repo page alone
- better structure for end users
- a more search-indexable landing surface
- a stronger professional impression for teams evaluating the tool
