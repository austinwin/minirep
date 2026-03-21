import { type ReactNode } from 'react';
import hljs from 'highlight.js/lib/core';
import json from 'highlight.js/lib/languages/json';
import http from 'highlight.js/lib/languages/http';
import xml from 'highlight.js/lib/languages/xml';
import {
  MAX_BODY_CHARS,
  HEADER_NAME_REGEX,
  FORBIDDEN_HEADERS,
  ASSET_TYPES,
  ASSET_EXTENSIONS,
} from '../constants';

hljs.registerLanguage('json', json);
hljs.registerLanguage('http', http);
hljs.registerLanguage('xml', xml);

import {
  NetworkEntry,
  HeaderPair,
  HeaderObject,
  ParsedRequest,
  FilterMode,
} from '../types';

// TODO: refine this type based on actual usage or imports
type HARFormatEntry = any;

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const toHeaderPairs = (headers?: Array<{ name: string; value: string }>) =>
  headers?.map((header) => ({ key: header.name, value: header.value })) ?? [];

export const headersToObject = (headers: HeaderPair[]): HeaderObject => {
  return headers.reduce<HeaderObject>((acc, header) => {
    const key = header.key.trim();
    if (!key) return acc;
    const normalizedKey = key.toLowerCase();
    const value = header.value ?? '';

    if (!acc[normalizedKey]) {
      acc[normalizedKey] = value;
    } else if (Array.isArray(acc[normalizedKey])) {
      (acc[normalizedKey] as string[]).push(value);
    } else {
      acc[normalizedKey] = [acc[normalizedKey] as string, value];
    }

    return acc;
  }, {});
};

export const isValidHeaderName = (name: string) => HEADER_NAME_REGEX.test(name);
export const isForbiddenHeaderName = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.startsWith('sec-') || lower.startsWith('proxy-')) return true;
  return FORBIDDEN_HEADERS.has(lower);
};

export const parseUrlParts = (url: string) => {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.host,
      path: `${parsed.pathname}${parsed.search}`,
      protocol: parsed.protocol.replace(':', ''),
    };
  } catch {
    return {
      host: '',
      path: url,
      protocol: '',
    };
  }
};

export const formatTime = (value?: string) => {
  if (!value) return '--:--:--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--:--:--';
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};

export const formatBytes = (bytes?: number) => {
  if (bytes == null || Number.isNaN(bytes) || bytes < 0) return '--';
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} kb`;
  return `${(bytes / 1024 / 1024).toFixed(1)} mb`;
};

export const formatDuration = (duration?: number) => {
  if (duration == null || Number.isNaN(duration)) return '-- ms';
  if (duration < 1000) return `${Math.round(duration)} ms`;
  return `${(duration / 1000).toFixed(2)} s`;
};

export const statusTone = (status?: number) => {
  if (!status) return 'warn';
  if (status >= 200 && status < 300) return 'ok';
  if (status >= 300 && status < 400) return 'warn';
  return 'bad';
};

export const decodeContent = (
  content: string,
  encoding?: string,
  maxChars = MAX_BODY_CHARS,
) => {
  if (!content) return '';
  let text = content;
  if (encoding === 'base64') {
    try {
      text = atob(content);
    } catch {
      text = content;
    }
  }
  if (maxChars !== Infinity && text.length > maxChars) {
    const remaining = text.length - maxChars;
    return `${text.slice(0, maxChars)}\n\n... ${remaining} more chars`;
  }
  return text;
};

export const prettyBody = (body?: string) => {
  if (!body) return '';
  const trimmed = body.trim();
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    try {
      return JSON.stringify(JSON.parse(trimmed), null, 2);
    } catch {
      return body;
    }
  }
  return body;
};

export const parseMaybeJson = (body?: string) => {
  if (!body) return '';
  const trimmed = body.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    return body;
  }
};

export const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const renderHighlightedText = (text: string, term: string): ReactNode => {
  if (!term) return text;
  const escaped = escapeRegExp(term);
  const regex = new RegExp(`(${escaped})`, 'ig');
  const parts = text.split(regex);
  return parts.map((part, index) =>
    part.toLowerCase() === term.toLowerCase() ? (
      <mark key={`${part}-${index}`}>{part}</mark>
    ) : (
      part
    ),
  );
};

export const buildRequestText = (entry: NetworkEntry) => {
  const requestLine = `${entry.method} ${entry.path} ${entry.httpVersion ?? ''}`.trim();
  const headers = entry.requestHeaders
    .map((header) => `${header.key}: ${header.value}`)
    .join('\n');
  const body = entry.requestBody ?? '';

  if (headers && body) return `${requestLine}\n${headers}\n\n${body}`;
  if (headers) return `${requestLine}\n${headers}`;
  return requestLine;
};

export const parseRequestText = (
  text: string,
  fallback?: NetworkEntry | null,
): ParsedRequest => {
  const lines = text.split('\n');
  const requestLine = lines[0] ?? '';
  const blankIndex = lines.findIndex(
    (line, index) => index > 0 && line.trim() === '',
  );
  const headerLines = blankIndex === -1 ? lines.slice(1) : lines.slice(1, blankIndex);
  const bodyLines = blankIndex === -1 ? [] : lines.slice(blankIndex + 1);
  const body = bodyLines.join('\n');

  const requestLineParts = requestLine.trim().split(/\s+/);
  const method =
    requestLineParts[0]?.toUpperCase() || fallback?.method || 'GET';
  const target = requestLineParts[1] ?? fallback?.path ?? '';
  const version = requestLineParts[2] ?? fallback?.httpVersion ?? '';
  const normalizedLine = [method, target, version].filter(Boolean).join(' ').trim();

  const headers: HeaderPair[] = [];
  headerLines.forEach((line) => {
    if (!line.trim()) return;
    let separatorIndex = line.indexOf(':');
    if (line.startsWith(':')) separatorIndex = line.indexOf(':', 1);
    if (separatorIndex === -1) return;
    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trimStart();
    if (!key) return;
    headers.push({ key, value });
  });

  const fallbackParts = fallback?.url ? parseUrlParts(fallback.url) : null;
  const findHeaderValue = (names: string[]) => {
    const match = headers.find((header) =>
      names.includes(header.key.toLowerCase()),
    );
    return match?.value;
  };

  const scheme = findHeaderValue([':scheme']) || fallbackParts?.protocol;
  const host =
    findHeaderValue(['host', ':authority']) || fallbackParts?.host || '';

  let url = '';
  if (target.startsWith('http://') || target.startsWith('https://')) {
    url = target;
  } else if (target && host) {
    const prefix = scheme ? `${scheme}://` : 'https://';
    const path = target.startsWith('/') ? target : `/${target}`;
    url = `${prefix}${host}${path}`;
  } else if (fallback?.url) {
    url = fallback.url;
  }

  return {
    method,
    url,
    headers,
    body,
    requestLine: normalizedLine,
  };
};

export const renderRequestPreview = (text: string, term: string) => {
  const lines = text.split('\n');
  let inBody = false;

  return lines.map((line, index) => {
    if (index === 0) {
      const firstSpaceIndex = line.search(/\s/);
      if (firstSpaceIndex === -1) {
        return (
          <span className="code-line" key={`line-${index}`}>
            {renderHighlightedText(line, term)}
          </span>
        );
      }
      const method = line.slice(0, firstSpaceIndex);
      const remainder = line.slice(firstSpaceIndex);
      const remainderMatch = remainder.match(/^(\s+)(\S+)(\s*)(.*)$/);
      if (!remainderMatch) {
        return (
          <span className="code-line" key={`line-${index}`}>
            {renderHighlightedText(line, term)}
          </span>
        );
      }
      const [, space1, path, space2, version] = remainderMatch;
      return (
        <span className="code-line" key={`line-${index}`}>
          <span className="token token--method">
            {renderHighlightedText(method, term)}
          </span>
          {space1}
          <span className="token token--path">
            {renderHighlightedText(path, term)}
          </span>
          {space2}
          <span className="token token--muted">
            {renderHighlightedText(version, term)}
          </span>
        </span>
      );
    }

    if (!inBody && line.trim() === '') {
      inBody = true;
      return (
        <span className="code-line code-line--blank" key={`line-${index}`}>
          {line}
        </span>
      );
    }

    if (!inBody) {
      let separatorIndex = line.indexOf(':');
      if (line.startsWith(':')) separatorIndex = line.indexOf(':', 1);
      if (separatorIndex !== -1) {
        const key = line.slice(0, separatorIndex);
        const value = line.slice(separatorIndex + 1);
        return (
          <span className="code-line" key={`line-${index}`}>
            <span className="token token--header-name">
              {renderHighlightedText(key, term)}
            </span>
            <span className="token token--punct">:</span>
            <span className="token token--header-value">
              {renderHighlightedText(value, term)}
            </span>
          </span>
        );
      }
    }

    return (
      <span className="code-line" key={`line-${index}`}>
        {renderHighlightedText(line, term)}
      </span>
    );
  });
};

export const headerMatches = (header: HeaderPair, term: string) => {
  if (!term) return true;
  const target = `${header.key} ${header.value}`.toLowerCase();
  return target.includes(term);
};

export const isAssetRequest = (entry: NetworkEntry) => {
  const type = entry.resourceType?.toLowerCase();
  if (type && ASSET_TYPES.has(type)) return true;
  const cleanPath = entry.path.split('?')[0].toLowerCase();
  return ASSET_EXTENSIONS.some((ext) => cleanPath.endsWith(ext));
};

export const matchesMode = (entry: NetworkEntry, mode: FilterMode) => {
  if (mode === 'all') return true;
  if (mode === 'errors') return (entry.status ?? 0) >= 400;

  const type = entry.resourceType?.toLowerCase();
  if (mode === 'xhr') return type === 'xhr';
  if (mode === 'fetch') return type === 'fetch';
  if (mode === 'assets') return isAssetRequest(entry);

  return true;
};

export const entryFromHar = (entry: HARFormatEntry, id: string): NetworkEntry => {
  const request = entry.request ?? ({} as HARFormatEntry['request']);
  const response = entry.response ?? ({} as HARFormatEntry['response']);
  const content = response.content ?? {};
  const url = request.url ?? '';
  const { host, path, protocol } = parseUrlParts(url);
  const resourceType = (entry as unknown as { _resourceType?: string })
    ._resourceType;

  const bodySize =
    typeof response.bodySize === 'number' && response.bodySize >= 0
      ? response.bodySize
      : typeof content.size === 'number' && content.size >= 0
        ? content.size
        : undefined;

  const rawBody =
    typeof content.text === 'string' ? content.text : undefined;
  const responseBody = rawBody
    ? decodeContent(rawBody, content.encoding)
    : undefined;

  return {
    id,
    method: request.method ?? 'GET',
    url,
    path: path || url,
    host,
    protocol,
    status: response.status,
    statusText: response.statusText,
    startedDateTime: entry.startedDateTime,
    time: entry.time,
    httpVersion: request.httpVersion,
    responseHttpVersion: response.httpVersion,
    requestHeaders: toHeaderPairs(request.headers),
    responseHeaders: toHeaderPairs(response.headers),
    requestBody: request.postData?.text,
    responseBody,
    responseEncoding: content.encoding,
    mimeType: content.mimeType,
    size: bodySize,
    resourceType,
  };
};

export const buildRequestJson = (parsed: ParsedRequest) => ({
  method: parsed.method,
  url: parsed.url,
  headers: headersToObject(parsed.headers),
  body: parseMaybeJson(parsed.body),
});

export const buildResponseJson = (entry: NetworkEntry) => ({
  status: entry.status ?? 0,
  statusText: entry.statusText ?? '',
  headers: headersToObject(entry.responseHeaders),
  body: parseMaybeJson(entry.responseBody),
});

export const buildExportPayload = (entries: NetworkEntry[]) => ({
  exported_at: new Date().toISOString(),
  requests: entries.map((entry, index) => ({
    id: `req_${index + 1}`,
    method: entry.method,
    url: entry.url,
    headers: headersToObject(entry.requestHeaders),
    body: entry.requestBody ?? '',
    response: {
      status: entry.status ?? 0,
      headers: headersToObject(entry.responseHeaders),
      body: entry.responseBody ?? '',
    },
    timestamp: entry.startedDateTime
      ? new Date(entry.startedDateTime).getTime()
      : Date.now(),
  })),
});

const objectToHeaders = (
  obj: Record<string, string | string[]>,
): HeaderPair[] => {
  const headers: HeaderPair[] = [];
  Object.entries(obj || {}).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => headers.push({ key, value: v }));
    } else {
      headers.push({ key, value: String(value) });
    }
  });
  return headers;
};

export { objectToHeaders };

export const jsonToRequestText = (jsonStr: string, fallbackVersion = 'HTTP/1.1') => {
  try {
    const obj = JSON.parse(jsonStr);
    const method = obj.method || 'GET';
    const rawUrl = obj.url || '';
    const { path } = parseUrlParts(rawUrl);
    
    const headers = objectToHeaders(obj.headers || {});
    const headerString = headers.map(h => `${h.key}: ${h.value}`).join('\n');
    
    let body = obj.body;
    if (body && typeof body !== 'string') {
      body = JSON.stringify(body, null, 2);
    }
    body = body || '';
    
    const reqLine = `${method} ${path} ${fallbackVersion}`;
    if (headerString && body) return `${reqLine}\n${headerString}\n\n${body}`;
    if (headerString) return `${reqLine}\n${headerString}`;
    return reqLine;
  } catch {
    return null;
  }
};

export const highlightCode = (code: string, language: string, term?: string) => {
  if (!code) return '';
  try {
    const result = hljs.highlight(code, { language, ignoreIllegals: true }).value;
    if (!term) return result;

    const regex = new RegExp(`(${escapeRegExp(term)})`, 'gi');
    let html = '';
    let lastIndex = 0;
    const tagRegex = /<[^>]+>/g;
    let match;

    while ((match = tagRegex.exec(result)) !== null) {
      const text = result.slice(lastIndex, match.index);
      html += text.replace(regex, '<mark>$1</mark>');
      html += match[0];
      lastIndex = tagRegex.lastIndex;
    }
    html += result.slice(lastIndex).replace(regex, '<mark>$1</mark>');
    return html;
  } catch {
    const escaped = code
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    
    if (!term) return escaped;
    const regex = new RegExp(`(${escapeRegExp(term)})`, 'gi');
    return escaped.replace(regex, '<mark>$1</mark>');
  }
};

export const importFromPayload = (json: any): NetworkEntry[] => {
  if (!json || !Array.isArray(json.requests)) {
    throw new Error('Invalid import format. Expected "requests" array.');
  }

  return json.requests.map((req: any, index: number) => {
    const { host, path, protocol } = parseUrlParts(req.url || '');

    return {
      id: `imported-${Date.now()}-${index}`,
      method: req.method || 'GET',
      url: req.url || '',
      path,
      host,
      protocol,
      status: req.response?.status,
      statusText: '',
      startedDateTime: req.timestamp
        ? new Date(req.timestamp).toISOString()
        : undefined,
      time: undefined,
      httpVersion: '',
      responseHttpVersion: '',
      requestHeaders: objectToHeaders(req.headers),
      responseHeaders: objectToHeaders(req.response?.headers),
      requestBody: req.body,
      responseBody: req.response?.body,
      responseEncoding: undefined,
      mimeType: undefined,
      size: typeof req.response?.body === 'string' ? req.response.body.length : 0,
      resourceType: 'imported',
    } as NetworkEntry;
  });
};
