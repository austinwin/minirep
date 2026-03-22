---
title: Request Runner and Repeater
description: How the built-in request runner works, how to use baselines, variants, boundary diffing, payload packs, and cache probes.
permalink: /runner/
eyebrow: Validation Layer
---

## Why the runner matters

The runner is the bridge between observing traffic and actively validating behavior.

Instead of exporting a request into another tool just to test a basic hypothesis, you can stay in `minirep` and run controlled variants against a live request.

## Baseline-first workflow

The runner starts by building a baseline response.

That baseline gives you:

- status
- size
- body hash
- cache summary

From there, every variant is easier to interpret because you are comparing against something concrete instead of relying on memory.

## Variant presets

The built-in presets focus on fast, high-signal changes:

- auth stripped
- method override headers
- method tunneling through `_method`
- header pollution
- client IP spoof headers
- path confusion
- parameter duplication

These are intentionally practical variants, not random fuzz.

## Boundary diff

Boundary diff is one of the highest-value workflows in the runner.

When you multi-select requests for the same endpoint, `minirep` can reuse auth-like header sets from those requests and compare results against the baseline.

This helps you validate questions like:

- does the same endpoint behave differently under different auth context?
- are tenant boundaries consistent?
- is there suspicious overlap between responses?

## Negative cache probes

The cache probe set adds headers and path variants that are often interesting for cache-behavior review.

The output helps you spot:

- response variance
- hash changes
- cache summary changes

This is especially useful when paired with Extractor cache findings.

## Payload packs

Payload packs help stage fast validation against a chosen parameter:

- IDOR
- SSRF
- SQLi
- XSS

These are useful when you already know which parameter matters and want quick structured attempts without manually rewriting every request by hand.

## Result interpretation

Runner output shows:

- variant label
- signal label
- status
- timing
- size
- body hash
- diff summary
- cache summary

The signal layer helps compress the readout into outcomes such as:

- auth bypass
- boundary enforced
- boundary changed
- cache variance
- method accepted
- input impact

## Where the runner fits

The runner is ideal for:

- quick replay
- variant testing
- auth boundary comparison
- response comparison with minimal context switching

When you need heavier proxy-side manipulation or larger manual exploitation workflows, that is where a tool like Burp typically takes over.
