---
title: Installation
description: How to install minirep from a pre-built release or from source, how to load it into Chrome, and how to keep it updated.
permalink: /installation/
eyebrow: Getting Started
---

## Two installation paths

You can install `minirep` in Chrome in two ways:

- **Release zip**: best for end users who only want to use the extension
- **Build from source**: best for contributors, internal customization, or local development

## Install from the pre-built release zip

This is the recommended path for most users.

1. Open the project’s GitHub Releases page
2. Download the latest release zip
3. Unzip it locally
4. Find the extracted folder that contains `manifest.json`
5. Open `chrome://extensions`
6. Enable `Developer mode`
7. Click `Load unpacked`
8. Select the extracted folder that contains `manifest.json`

<div class="callout callout--warning">
  <h3>Common mistake</h3>
  <p>Chrome cannot install the zip directly through <code>Load unpacked</code>. You must unzip the release first and point Chrome at the extracted directory that contains <code>manifest.json</code>.</p>
</div>

## Build from source

Use this path if you want the current source version or want to change the code.

```bash
npm install
npm run build
```

The unpacked extension will be created in:

```text
.output/chrome-mv3
```

Load it in Chrome through `chrome://extensions` using `Load unpacked`.

## How to confirm you selected the right folder

The correct folder contains files and directories such as:

- `manifest.json`
- `panel.html`
- `devtools.html`
- `chunks/`
- `icon/`

If those files are one level deeper than the folder you selected, Chrome will not load the extension correctly.

## First launch

After install:

1. Open a target site in Chrome
2. Open DevTools
3. Open the `minirep` panel
4. Reload the page or interact with the application
5. Start reviewing captured requests

## Updating the extension

### If you installed from a release zip

1. Download the new release zip
2. Unzip it
3. In `chrome://extensions`, either:
   - click `Reload` on the existing extension if it already points to the updated extracted folder
   - or use `Load unpacked` again and select the new extracted folder

### If you built from source

```bash
npm install
npm run build
```

Then reload the extension from `chrome://extensions`.

## Troubleshooting install issues

### The `minirep` panel does not appear in DevTools

- reload the extension from `chrome://extensions`
- close and reopen DevTools
- confirm the extension loaded without manifest errors

### The extension loads, but no traffic appears

- reload the inspected page after opening DevTools
- make sure you are viewing the correct tab
- generate real application activity so requests populate

### The release zip installs, but the UI is broken

- verify you selected the folder containing `manifest.json`, not a parent directory
- remove the old unpacked version and load the fresh extracted folder again
