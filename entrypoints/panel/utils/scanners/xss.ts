import { NetworkEntry, HeaderPair } from '../../types';
import { MAX_SCAN_BODY_CHARS } from '../../constants';

export interface XssFinding {
  id: string;
  requestUrl: string;
  parameter: string;
  context: string;
  evidence: string;
  confidence: 'low' | 'medium' | 'high';
}

const MAX_INPUTS = 40;
const MIN_VALUE_LENGTH = 2;
const MAX_VALUE_LENGTH = 80;
const MAX_CONTEXT_SNIPPET = 120;

export const scanForXss = (requests: NetworkEntry[]): XssFinding[] => {
  const results: XssFinding[] = [];
  const seen = new Set<string>();

  requests.forEach((entry) => {
    const responseBody = entry.responseBody;
    if (!responseBody) return;

    const trimmedBody = responseBody.slice(0, MAX_SCAN_BODY_CHARS);
    const lowerBody = trimmedBody.toLowerCase();
    const contentType = getHeaderValue(entry.responseHeaders, 'content-type') || entry.mimeType || '';
    const isHtml = contentType.includes('text/html') || contentType.includes('application/xhtml');
    const isScript = contentType.includes('javascript') || contentType.includes('ecmascript');

    const inputs = extractInputs(entry).slice(0, MAX_INPUTS);
    inputs.forEach((input) => {
      const value = sanitizeValue(input.value);
      if (!value) return;
      if (value.length < MIN_VALUE_LENGTH || value.length > MAX_VALUE_LENGTH) return;

      const lowerValue = value.toLowerCase();
      let index = lowerBody.indexOf(lowerValue);
      let hits = 0;

      while (index !== -1 && hits < 2) {
        const context = getContext(trimmedBody, lowerBody, index, value.length);
        const confidence = scoreConfidence(context, isHtml, isScript, value);
        const evidence = `${context.label}: ${context.snippet}`;
        const key = `${entry.url}:${input.key}:${context.label}:${index}`;

        if (!seen.has(key)) {
          seen.add(key);
          results.push({
            id: `xss-${results.length}`,
            requestUrl: entry.url,
            parameter: input.key,
            context: context.label,
            evidence,
            confidence,
          });
        }

        hits += 1;
        index = lowerBody.indexOf(lowerValue, index + value.length);
      }
    });
  });

  return results.sort((a, b) => confidenceScore(b.confidence) - confidenceScore(a.confidence));
};

const extractInputs = (entry: NetworkEntry) => {
  const inputs: Array<{ key: string; value: string }> = [];

  try {
    const url = new URL(entry.url);
    url.searchParams.forEach((value, key) => {
      inputs.push({ key, value });
    });
  } catch {
    // Ignore invalid URLs.
  }

  const contentType = getHeaderValue(entry.requestHeaders, 'content-type') || '';
  if (entry.requestBody) {
    if (contentType.includes('application/json')) {
      try {
        const parsed = JSON.parse(entry.requestBody);
        collectJsonStrings(parsed, inputs, 'json');
      } catch {
        // Ignore invalid JSON.
      }
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const params = new URLSearchParams(entry.requestBody);
      params.forEach((value, key) => inputs.push({ key, value }));
    } else if (entry.requestBody.includes('=')) {
      const params = new URLSearchParams(entry.requestBody);
      params.forEach((value, key) => inputs.push({ key, value }));
    }
  }

  return inputs;
};

const collectJsonStrings = (
  value: unknown,
  inputs: Array<{ key: string; value: string }>,
  prefix: string,
) => {
  if (!value) return;
  if (typeof value === 'string') {
    inputs.push({ key: prefix, value });
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => collectJsonStrings(entry, inputs, `${prefix}[${index}]`));
    return;
  }
  if (typeof value === 'object') {
    Object.entries(value as Record<string, unknown>).forEach(([key, val]) => {
      collectJsonStrings(val, inputs, `${prefix}.${key}`);
    });
  }
};

const sanitizeValue = (value: string) => {
  if (!value) return '';
  return value.replace(/\s+/g, ' ').trim();
};

const getContext = (
  body: string,
  lowerBody: string,
  index: number,
  length: number,
) => {
  const snippetStart = Math.max(0, index - 40);
  const snippetEnd = Math.min(body.length, index + length + 40);
  const snippet = body.slice(snippetStart, snippetEnd).replace(/\s+/g, ' ').trim();
  const label = detectContext(lowerBody, index);
  return {
    label,
    snippet: truncate(snippet, MAX_CONTEXT_SNIPPET),
  };
};

const detectContext = (lowerBody: string, index: number) => {
  const tagStart = lowerBody.lastIndexOf('<', index);
  const tagEnd = lowerBody.indexOf('>', index);
  const inTag = tagStart !== -1 && tagEnd !== -1 && tagStart < index && tagEnd > index;
  if (inTag) {
    const tagChunk = lowerBody.slice(tagStart, tagEnd);
    if (/on[a-z]+\s*=/.test(tagChunk)) return 'event handler';
    if (tagChunk.includes('javascript:')) return 'javascript: attribute';
    return 'html attribute';
  }

  const scriptStart = lowerBody.lastIndexOf('<script', index);
  const scriptEnd = lowerBody.indexOf('</script', index);
  if (scriptStart !== -1 && scriptEnd !== -1 && scriptStart > lowerBody.lastIndexOf('</script', index)) {
    return 'script tag';
  }

  return 'html body';
};

const scoreConfidence = (
  context: { label: string },
  isHtml: boolean,
  isScript: boolean,
  value: string,
) => {
  const riskyValue = /[<>"']/.test(value);
  if (context.label === 'event handler' || context.label === 'script tag') return 'high';
  if (context.label === 'javascript: attribute') return 'high';
  if (isScript && context.label === 'html body') return 'medium';
  if (isHtml && context.label === 'html attribute') return riskyValue ? 'high' : 'medium';
  if (isHtml && context.label === 'html body') return riskyValue ? 'medium' : 'low';
  return 'low';
};

const getHeaderValue = (headers: HeaderPair[], name: string) => {
  const target = name.toLowerCase();
  const values = headers
    .filter((header) => header.key.toLowerCase() === target)
    .map((header) => header.value)
    .filter(Boolean);
  return values.join(', ');
};

const truncate = (value: string, max: number) => {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 3)}...`;
};

const confidenceScore = (level: 'low' | 'medium' | 'high') => {
  if (level === 'high') return 3;
  if (level === 'medium') return 2;
  return 1;
};
