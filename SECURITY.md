# Security Policy

## Supported versions

Security fixes are generally applied to the current `main` branch.

## Reporting a vulnerability

If you believe you found a security issue in `minirep` itself:

- do not publish full exploit details in a public issue first
- provide a clear description of the issue
- include reproduction steps, impacted files or features, and the expected security boundary
- if possible, include a minimal proof of concept

Open a private security report through GitHub Security Advisories if available for the repository. If that option is not available, contact the maintainer through a non-public channel before filing a public issue.

## Scope

This policy applies to vulnerabilities in `minirep` itself, such as:

- extension privilege misuse
- insecure data handling
- unsafe AI-context handling introduced by the extension
- local storage or export/import issues

This policy does not apply to vulnerabilities discovered in third-party targets that you inspect with `minirep`.
