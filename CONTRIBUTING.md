# Contributing to minirep

Thanks for contributing to `minirep`.

## What to contribute

High-value contribution areas:

- extractor improvements
- new rules and scanners
- AI MiniReper workflow improvements
- request runner and replay improvements
- UX, layout, and DevTools usability improvements
- documentation, examples, and release notes

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Run the extension in development mode:

```bash
npm run dev
```

3. Or build the unpacked extension:

```bash
npm run build
```

4. Load the generated extension in Chrome through `chrome://extensions`

## Pull request guidelines

- Keep changes scoped and focused
- Prefer clear, user-visible improvements over broad refactors
- Update documentation when behavior changes
- Include screenshots or short notes for UI changes when possible
- Avoid committing secrets, local credentials, `.output`, or `node_modules`

## Issues and feature requests

- Use issues for bugs, regressions, and feature proposals
- Include reproduction steps, expected behavior, actual behavior, and environment details
- For new scanner or extractor ideas, include example traffic patterns or target use cases
