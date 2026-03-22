---
title: AI MiniReper
description: Ask mode, Agent mode, active context, extractor handoff, checklist execution, and bounded auto-run inside minirep.
permalink: /ai-minireper/
eyebrow: AI Layer
---

## What AI MiniReper is

`AI MiniReper` is the in-product AI workspace for `minirep`. It is not just a chatbot attached to the extension. It is built around:

- real request/response context
- selected and pinned flows
- extractor findings
- bounded audit and replay behavior

Its job is to help you understand what you captured, decide what is worth testing, and in `Agent` mode, push that workflow into structured follow-up validation.

## Ask mode

Use `Ask` mode when you want reasoning without automated audit execution.

Good uses for `Ask` mode:

- explaining a request or sequence of requests
- summarizing likely vulnerability classes
- identifying auth or cache assumptions
- generating ideas for next manual probes
- interpreting suspicious response patterns

`Ask` mode is the fastest way to turn raw traffic into an understandable narrative.

## Agent mode

Use `Agent` mode when you want a more adversarial workflow.

In this mode, `AI MiniReper` can:

- produce structured `attack-suggestion` outputs
- convert those outputs into concrete requests
- auto-run bounded variants through the request sender
- analyze the resulting responses

The goal is not unbounded autonomous exploitation. The goal is fast, structured, operator-guided validation that stays tied to real context.

## Active context

AI quality in `minirep` depends on context quality.

`AI MiniReper` builds context from:

- the selected request
- multi-selected requests
- pinned requests
- extractor findings you choose to add
- a lightweight local memory summary

That means the AI is not reasoning from abstract prompts alone. It is reasoning from the same concrete evidence you are looking at.

## Extractor handoff

One of the best parts of the AI workflow is the extractor handoff.

You can:

1. run the Extractor
2. review findings by tab
3. pick the ones that matter
4. add them to AI context

This is especially effective when you want the model to reason from:

- specific endpoint findings
- discovered parameters
- security header issues
- Supabase findings
- suspicious secrets or response matches

## Feasible checklist

The AI checklist gives you a practical, bounded workflow for common reconnaissance and validation steps.

It includes:

- passive fingerprinting
- security header and cookie review
- comment review
- leaked identifier review
- WAF/CDN detection
- URL and JavaScript inventory
- admin/login discovery
- robots and well-known file probes
- CORS and allowed method probes
- site structure and business-context reasoning

The checklist is valuable because it is anchored to observed traffic and constrained probes, not arbitrary unrelated scanning.

## Auto-run model

`Agent` mode supports bounded auto-run.

The current model:

- parses generated attack suggestions
- runs a limited number of generated variants
- captures their responses
- performs a follow-up AI analysis of the results

This keeps the automation loop useful while still making the operator the decision-maker.

## Progress visibility

The product surfaces progress explicitly so you can see the audit lifecycle:

- prepare
- request
- response
- parse
- auto-run
- analyze

That makes the AI workflow easier to trust and easier to debug.

## Providers and settings

Supported providers include:

- OpenAI
- Google Gemini
- Anthropic Claude
- Grok / xAI
- DeepSeek
- Perplexity

The panel supports:

- provider selection
- model selection
- API key entry
- optional custom base URL for OpenAI-compatible setups

## Practical advice

`AI MiniReper` is strongest when you give it disciplined context:

- choose the smallest relevant request set
- pin only what matters
- add extractor findings intentionally
- use `Ask` mode first to understand the flow
- use `Agent` mode when you are ready to validate bounded variants

That keeps the output more relevant and makes the auto-run loop much more useful.
