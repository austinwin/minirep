import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { browser, Browser } from '#imports';
import './App.css';

type HeaderPair = {
  key: string;
  value: string;
};

type NetworkEntry = {
  id: string;
  method: string;
  url: string;
  path: string;
  host: string;
  protocol: string;
  status?: number;
  statusText?: string;
  startedDateTime?: string;
  time?: number;
  httpVersion?: string;
  responseHttpVersion?: string;
  requestHeaders: HeaderPair[];
  responseHeaders: HeaderPair[];
  requestBody?: string;
  responseBody?: string;
  responseEncoding?: string;
  mimeType?: string;
  size?: number;
  resourceType?: string;
};

type FilterMode = 'all' | 'xhr' | 'fetch' | 'errors' | 'assets';
type RequestTabMode = 'pretty' | 'json';
type ResponseTabMode = 'pretty' | 'json';

type HeaderObject = Record<string, string | string[]>;
type ParsedRequest = {
  method: string;
  url: string;
  headers: HeaderPair[];
  body: string;
  requestLine: string;
};

const MAX_ITEMS = 300;
const MAX_BODY_CHARS = 20000;
const RESIZER_WIDTH = 8;
const COLUMN_GAP = 8;
const MIN_COL_1 = 240;
const MIN_COL_2 = 320;
const MIN_COL_3 = 320;

const METHOD_OPTIONS = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS',
];

const HEADER_NAME_REGEX = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;
const FORBIDDEN_HEADERS = new Set([
  'accept-charset',
  'accept-encoding',
  'access-control-request-headers',
  'access-control-request-method',
  'connection',
  'content-length',
  'cookie',
  'cookie2',
  'date',
  'dnt',
  'expect',
  'host',
  'keep-alive',
  'origin',
  'referer',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'user-agent',
  'via',
]);

const ASSET_TYPES = new Set(['stylesheet', 'image', 'font', 'script', 'media']);
const ASSET_EXTENSIONS = [
  '.css',
  '.js',
  '.mjs',
  '.png',
  '.jpg',
  '.jpeg',
  '.svg',
  '.gif',
  '.webp',
  '.woff',
  '.woff2',
  '.ttf',
  '.ico',
  '.map',
];

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const toHeaderPairs = (headers?: Array<{ name: string; value: string }>) =>
  headers?.map((header) => ({ key: header.name, value: header.value })) ?? [];

const headersToObject = (headers: HeaderPair[]): HeaderObject => {
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

const isValidHeaderName = (name: string) => HEADER_NAME_REGEX.test(name);
const isForbiddenHeaderName = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.startsWith('sec-') || lower.startsWith('proxy-')) return true;
  return FORBIDDEN_HEADERS.has(lower);
};

const parseUrlParts = (url: string) => {
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

const formatTime = (value?: string) => {
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

const formatBytes = (bytes?: number) => {
  if (bytes == null || Number.isNaN(bytes) || bytes < 0) return '--';
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} kb`;
  return `${(bytes / 1024 / 1024).toFixed(1)} mb`;
};

const formatDuration = (duration?: number) => {
  if (duration == null || Number.isNaN(duration)) return '-- ms';
  if (duration < 1000) return `${Math.round(duration)} ms`;
  return `${(duration / 1000).toFixed(2)} s`;
};

const statusTone = (status?: number) => {
  if (!status) return 'warn';
  if (status >= 200 && status < 300) return 'ok';
  if (status >= 300 && status < 400) return 'warn';
  return 'bad';
};

const decodeContent = (content: string, encoding?: string) => {
  if (!content) return '';
  let text = content;
  if (encoding === 'base64') {
    try {
      text = atob(content);
    } catch {
      text = content;
    }
  }
  if (text.length > MAX_BODY_CHARS) {
    const remaining = text.length - MAX_BODY_CHARS;
    return `${text.slice(0, MAX_BODY_CHARS)}\n\n... ${remaining} more chars`;
  }
  return text;
};

const prettyBody = (body?: string) => {
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

const parseMaybeJson = (body?: string) => {
  if (!body) return '';
  const trimmed = body.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    return body;
  }
};

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const renderHighlightedText = (text: string, term: string): ReactNode => {
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

const buildRequestText = (entry: NetworkEntry) => {
  const requestLine = `${entry.method} ${entry.path} ${entry.httpVersion ?? ''}`.trim();
  const headers = entry.requestHeaders
    .map((header) => `${header.key}: ${header.value}`)
    .join('\n');
  const body = entry.requestBody ?? '';

  if (headers && body) return `${requestLine}\n${headers}\n\n${body}`;
  if (headers) return `${requestLine}\n${headers}`;
  return requestLine;
};

const parseRequestText = (
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

const renderRequestPreview = (text: string, term: string) => {
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

const headerMatches = (header: HeaderPair, term: string) => {
  if (!term) return true;
  const target = `${header.key} ${header.value}`.toLowerCase();
  return target.includes(term);
};

const isAssetRequest = (entry: NetworkEntry) => {
  const type = entry.resourceType?.toLowerCase();
  if (type && ASSET_TYPES.has(type)) return true;
  const cleanPath = entry.path.split('?')[0].toLowerCase();
  return ASSET_EXTENSIONS.some((ext) => cleanPath.endsWith(ext));
};

const matchesMode = (entry: NetworkEntry, mode: FilterMode) => {
  if (mode === 'all') return true;
  if (mode === 'errors') return (entry.status ?? 0) >= 400;

  const type = entry.resourceType?.toLowerCase();
  if (mode === 'xhr') return type === 'xhr';
  if (mode === 'fetch') return type === 'fetch';
  if (mode === 'assets') return isAssetRequest(entry);

  return true;
};

const entryFromHar = (entry: HARFormatEntry, id: string): NetworkEntry => {
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

const buildRequestJson = (parsed: ParsedRequest) => ({
  method: parsed.method,
  url: parsed.url,
  headers: headersToObject(parsed.headers),
  body: parseMaybeJson(parsed.body),
});

const buildResponseJson = (entry: NetworkEntry) => ({
  status: entry.status ?? 0,
  statusText: entry.statusText ?? '',
  headers: headersToObject(entry.responseHeaders),
  body: parseMaybeJson(entry.responseBody),
});

const buildExportPayload = (entries: NetworkEntry[]) => ({
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

function App() {
  const [requests, setRequests] = useState<NetworkEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterText, setFilterText] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [paused, setPaused] = useState(false);
  const [requestTab, setRequestTab] = useState<RequestTabMode>('pretty');
  const [responseTab, setResponseTab] = useState<ResponseTabMode>('pretty');
  const [requestSearch, setRequestSearch] = useState('');
  const [responseSearch, setResponseSearch] = useState('');
  const [requestText, setRequestText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [columnSizes, setColumnSizes] = useState([280, 420, 360]);

  const idRef = useRef(0);
  const pausedRef = useRef(paused);
  const selectedRef = useRef(selectedId);
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const requestEditorRef = useRef<HTMLTextAreaElement | null>(null);
  const requestMirrorRef = useRef<HTMLPreElement | null>(null);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    selectedRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    if (!browser?.devtools?.network) return;

    const handleRequestFinished = (request: Browser.devtools.network.Request) => {
      if (pausedRef.current) return;
      const id = `req-${Date.now()}-${idRef.current++}`;
      const entry = entryFromHar(request, id);

      setRequests((prev) => [entry, ...prev].slice(0, MAX_ITEMS));
      if (!selectedRef.current) setSelectedId(id);

      request.getContent((content, encoding) => {
        if (!content) return;
        const decoded = decodeContent(content, encoding);
        setRequests((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  responseBody: decoded || item.responseBody,
                  responseEncoding: encoding || item.responseEncoding,
                }
              : item,
          ),
        );
      });
    };

    const handleNavigated = () => {
      setRequests([]);
      setSelectedId(null);
    };

    browser.devtools.network.onRequestFinished.addListener(handleRequestFinished);
    browser.devtools.network.onNavigated.addListener(handleNavigated);

    browser.devtools.network.getHAR((harLog) => {
      const entries = harLog?.entries ?? [];
      if (!entries.length) return;
      const seed = entries
        .slice(-MAX_ITEMS)
        .map((entry, index) =>
          entryFromHar(entry, `har-${Date.now()}-${index}`),
        )
        .reverse();
      setRequests(seed);
      if (!selectedRef.current && seed.length) setSelectedId(seed[0].id);
    });

    return () => {
      browser.devtools.network.onRequestFinished.removeListener(
        handleRequestFinished,
      );
      browser.devtools.network.onNavigated.removeListener(handleNavigated);
    };
  }, []);

  useEffect(() => {
    if (!requests.length) {
      if (selectedId) setSelectedId(null);
      return;
    }

    if (!selectedId || !requests.some((entry) => entry.id === selectedId)) {
      setSelectedId(requests[0].id);
    }
  }, [requests, selectedId]);

  useEffect(() => {
    if (!workspaceRef.current) return;

    const applyClamp = () => {
      const container = workspaceRef.current;
      if (!container) return;
      const available =
        container.getBoundingClientRect().width -
        RESIZER_WIDTH * 2 -
        COLUMN_GAP * 4;
      const minTotal = MIN_COL_1 + MIN_COL_2 + MIN_COL_3;

      if (available <= minTotal) return;

      setColumnSizes((prev) => {
        const total = prev.reduce((sum, value) => sum + value, 0);
        if (!total) return prev;
        const scale = Math.min(1, available / total);
        let [col1, col2, col3] = prev.map((value) =>
          Math.floor(value * scale),
        );
        col1 = Math.max(MIN_COL_1, col1);
        col2 = Math.max(MIN_COL_2, col2);
        col3 = Math.max(MIN_COL_3, col3);

        const adjustedTotal = col1 + col2 + col3;
        if (adjustedTotal < available) {
          col2 += available - adjustedTotal;
        }

        return [col1, col2, col3];
      });
    };

    applyClamp();
    window.addEventListener('resize', applyClamp);

    return () => window.removeEventListener('resize', applyClamp);
  }, []);

  const filteredRequests = useMemo(() => {
    const term = filterText.trim().toLowerCase();
    return requests.filter((entry) => {
      if (!matchesMode(entry, filterMode)) return false;
      if (!term) return true;

      return (
        entry.url.toLowerCase().includes(term) ||
        entry.path.toLowerCase().includes(term) ||
        entry.host.toLowerCase().includes(term)
      );
    });
  }, [requests, filterText, filterMode]);

  const selectedRequest = useMemo(() => {
    if (!selectedId) return requests[0] ?? null;
    return requests.find((entry) => entry.id === selectedId) ?? null;
  }, [requests, selectedId]);

  useEffect(() => {
    if (!selectedRequest) {
      setRequestText('');
      return;
    }
    setRequestText(buildRequestText(selectedRequest));
  }, [selectedRequest?.id]);

  const requestSearchTerm = requestSearch.trim().toLowerCase();
  const responseSearchTerm = responseSearch.trim().toLowerCase();

  const parsedRequest = useMemo(
    () => parseRequestText(requestText, selectedRequest),
    [requestText, selectedRequest],
  );
  const responseHeaders = selectedRequest?.responseHeaders ?? [];

  const filteredResponseHeaders = responseHeaders.filter((header) =>
    headerMatches(header, responseSearchTerm),
  );

  const responseLine = selectedRequest
    ? `${selectedRequest.responseHttpVersion ?? 'HTTP'} ${
        selectedRequest.status ?? ''
      } ${selectedRequest.statusText ?? ''}`.trim()
    : 'No response selected.';

  const responseTone = statusTone(selectedRequest?.status);
  const responseBody = prettyBody(selectedRequest?.responseBody);

  const requestJsonText = requestText.trim()
    ? JSON.stringify(buildRequestJson(parsedRequest), null, 2)
    : '';
  const responseJsonText = selectedRequest
    ? JSON.stringify(buildResponseJson(selectedRequest), null, 2)
    : '';

  const handleClear = () => {
    setRequests([]);
    setSelectedId(null);
  };

  const handleExport = () => {
    const payload = buildExportPayload(requests);
    const fileName = `minirep-export-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const handleCopyRequest = () => {
    if (!requestText.trim()) return;
    void navigator.clipboard?.writeText(requestText);
  };

  const handleSend = async () => {
    if (!parsedRequest.url) return;

    const trimmedMethod = parsedRequest.method.trim().toUpperCase();
    const method = METHOD_OPTIONS.includes(trimmedMethod)
      ? trimmedMethod
      : 'GET';

    const headers = parsedRequest.headers.filter(
      (header) => header.key.trim() || header.value.trim(),
    );

    const startedDateTime = new Date().toISOString();
    const parts = parseUrlParts(parsedRequest.url);
    const manualId = `manual-${Date.now()}-${idRef.current++}`;

    const manualEntry: NetworkEntry = {
      id: manualId,
      method,
      url: parsedRequest.url,
      path: parts.path || parsedRequest.url,
      host: parts.host,
      protocol: parts.protocol,
      startedDateTime,
      time: undefined,
      requestHeaders: headers,
      responseHeaders: [],
      requestBody: parsedRequest.body,
      responseBody: undefined,
      responseHttpVersion: 'HTTP',
      resourceType: 'fetch',
    };

    setRequests((prev) => [manualEntry, ...prev].slice(0, MAX_ITEMS));
    setSelectedId(manualId);
    setIsSending(true);

    const headerObject: Record<string, string> = {};
    headers.forEach((header) => {
      const name = header.key.trim();
      if (!name) return;
      if (!isValidHeaderName(name) || isForbiddenHeaderName(name)) return;
      headerObject[name] = header.value;
    });

    const canHaveBody = !['GET', 'HEAD'].includes(method);

    try {
      const start = performance.now();
      const response = await fetch(parsedRequest.url, {
        method,
        headers: headerObject,
        body: canHaveBody && parsedRequest.body ? parsedRequest.body : undefined,
      });

      const responseText = await response.text();
      const duration = performance.now() - start;
      const responseHeaders: HeaderPair[] = Array.from(
        response.headers.entries(),
      ).map(([key, value]) => ({ key, value }));

      setRequests((prev) =>
        prev.map((entry) =>
          entry.id === manualId
            ? {
                ...entry,
                status: response.status,
                statusText: response.statusText,
                responseHeaders,
                responseBody: decodeContent(responseText),
                size: responseText.length,
                time: duration,
              }
            : entry,
        ),
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Request failed.';
      setRequests((prev) =>
        prev.map((entry) =>
          entry.id === manualId
            ? {
                ...entry,
                status: 0,
                statusText: 'Request failed',
                responseBody: message,
                time: 0,
              }
            : entry,
        ),
      );
    } finally {
      setIsSending(false);
    }
  };

  const startResize = (index: 0 | 1) =>
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const container = workspaceRef.current;
      if (!container) return;
      const startX = event.clientX;
      const startSizes = [...columnSizes];
      const available =
        container.getBoundingClientRect().width -
        RESIZER_WIDTH * 2 -
        COLUMN_GAP * 4;

      const handleMove = (moveEvent: PointerEvent) => {
        const delta = moveEvent.clientX - startX;

        if (index === 0) {
          const maxCol1 = available - MIN_COL_2 - startSizes[2];
          const col1 = clamp(startSizes[0] + delta, MIN_COL_1, maxCol1);
          const col2 = available - col1 - startSizes[2];
          setColumnSizes([col1, col2, startSizes[2]]);
        } else {
          const maxCol3 = available - MIN_COL_2 - startSizes[0];
          const col3 = clamp(startSizes[2] - delta, MIN_COL_3, maxCol3);
          const col2 = available - startSizes[0] - col3;
          setColumnSizes([startSizes[0], col2, col3]);
        }
      };

      const handleUp = () => {
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.removeEventListener('pointermove', handleMove);
        window.removeEventListener('pointerup', handleUp);
      };

      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', handleUp);
    };

  const gridStyle = {
    '--col-1': `${columnSizes[0]}px`,
    '--col-2': `${columnSizes[1]}px`,
    '--col-3': `${columnSizes[2]}px`,
  } as React.CSSProperties;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <div>
            <div className="brand-title">minirep</div>
            <div className="brand-sub">DevTools request mirror</div>
          </div>
        </div>
        <div className="topbar-actions">
          <button
            className={`btn ghost${paused ? ' active' : ''}`}
            onClick={() => setPaused((prev) => !prev)}
          >
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button className="btn ghost" onClick={handleExport}>
            Export
          </button>
        </div>
      </header>

      <div className="workspace" style={gridStyle} ref={workspaceRef}>
        <section className="panel panel--list">
          <div className="panel-header">
            <div className="panel-title">
              <span className="eyebrow">Capture</span>
              <h2>
                Requests <span className="count">{requests.length}</span>
              </h2>
            </div>
            <div className="panel-actions">
              <button className="btn ghost slim" onClick={handleExport}>
                Export
              </button>
              <button className="btn ghost slim" onClick={handleClear}>
                Clear
              </button>
            </div>
          </div>
          <div className="panel-body">
            <div className="search">
              <input
                type="search"
                value={filterText}
                onChange={(event) => setFilterText(event.target.value)}
                placeholder="Filter requests..."
                aria-label="Filter requests"
              />
              <button
                className={`btn ghost slim${paused ? ' active' : ''}`}
                onClick={() => setPaused((prev) => !prev)}
              >
                {paused ? 'Paused' : 'Live'}
              </button>
            </div>
            <div className="filters">
              {(['all', 'xhr', 'fetch', 'errors', 'assets'] as FilterMode[]).map(
                (mode) => (
                  <button
                    key={mode}
                    className={`chip${filterMode === mode ? ' active' : ''}`}
                    onClick={() => setFilterMode(mode)}
                  >
                    {mode === 'all' ? 'All' : mode.toUpperCase()}
                  </button>
                ),
              )}
            </div>
            {filteredRequests.length ? (
              <ul className="request-list">
                {filteredRequests.map((request) => (
                  <li
                    key={request.id}
                    className={`request-item${
                      request.id === selectedId ? ' active' : ''
                    }`}
                    onClick={() => setSelectedId(request.id)}
                  >
                    <div className="request-main">
                      <span
                        className={`method method--${request.method.toLowerCase()}`}
                      >
                        {request.method}
                      </span>
                      <div className="request-path">{request.path}</div>
                      <div className="request-domain">
                        {request.host || 'unknown host'}
                      </div>
                    </div>
                    <div className="request-meta">
                      <span className={`status status--${statusTone(request.status)}`}>
                        {request.status ?? '---'}
                      </span>
                      <span className="time">
                        {formatTime(request.startedDateTime)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-state">
                No requests yet. Reload the tab or interact with the page to
                capture traffic.
              </div>
            )}
          </div>
        </section>

        <div
          className="resizer"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize panels"
          onPointerDown={startResize(0)}
        />

        <section className="panel panel--detail">
          <div className="panel-header">
            <div className="panel-title">
              <span className="eyebrow">Request</span>
              <h2>Request</h2>
            </div>
            <div className="panel-actions">
              <div
                className={`toggle${
                  selectedRequest?.protocol === 'https' ? '' : ' off'
                }`}
              >
                <span className="toggle-dot" />
                {selectedRequest?.protocol === 'https' ? 'HTTPS' : 'HTTP'}
              </div>
              <button
                className="btn ghost slim"
                onClick={handleCopyRequest}
                disabled={!requestText.trim()}
              >
                Copy
              </button>
              <button
                className="btn primary slim"
                onClick={handleSend}
                disabled={!parsedRequest.url || isSending}
              >
                {isSending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
          <div className="tabs">
            <button
              className={`tab${requestTab === 'pretty' ? ' active' : ''}`}
              onClick={() => setRequestTab('pretty')}
            >
              Pretty
            </button>
            <button
              className={`tab${requestTab === 'json' ? ' active' : ''}`}
              onClick={() => setRequestTab('json')}
            >
              Json
            </button>
          </div>
          <div className="panel-body">
            <div className="search small">
              <input
                type="search"
                value={requestSearch}
                onChange={(event) => setRequestSearch(event.target.value)}
                placeholder="Search in request..."
                aria-label="Search in request"
              />
              <button
                className="btn ghost slim"
                onClick={() => setRequestSearch('')}
              >
                Clear
              </button>
            </div>

            {selectedRequest ? (
              requestTab === 'json' ? (
                <pre className="code-block">
                  {renderHighlightedText(requestJsonText, requestSearchTerm)}
                </pre>
              ) : (
                <div className="code-editor">
                  <pre className="code-editor__mirror" ref={requestMirrorRef}>
                    {renderRequestPreview(requestText, requestSearchTerm)}
                  </pre>
                  <textarea
                    ref={requestEditorRef}
                    className="code-editor__input"
                    spellCheck={false}
                    value={requestText}
                    onChange={(event) => setRequestText(event.target.value)}
                    onScroll={() => {
                      if (!requestEditorRef.current || !requestMirrorRef.current) {
                        return;
                      }
                      requestMirrorRef.current.scrollTop =
                        requestEditorRef.current.scrollTop;
                      requestMirrorRef.current.scrollLeft =
                        requestEditorRef.current.scrollLeft;
                    }}
                  />
                </div>
              )
            ) : (
              <div className="empty-state">Select a request to inspect.</div>
            )}
          </div>
        </section>

        <div
          className="resizer"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize panels"
          onPointerDown={startResize(1)}
        />

        <section className="panel panel--response">
          <div className="panel-header">
            <div className="panel-title">
              <span className="eyebrow">Response</span>
              <h2>{responseLine}</h2>
            </div>
            <div className="panel-actions">
              <span className={`badge badge--${responseTone}`}>
                {selectedRequest?.status ?? '---'}
              </span>
              <span className="badge badge--info">
                {formatBytes(selectedRequest?.size)}
              </span>
              <span className="badge badge--time">
                {formatDuration(selectedRequest?.time)}
              </span>
            </div>
          </div>
          <div className="tabs">
            <button
              className={`tab${responseTab === 'pretty' ? ' active' : ''}`}
              onClick={() => setResponseTab('pretty')}
            >
              Pretty
            </button>
            <button
              className={`tab${responseTab === 'json' ? ' active' : ''}`}
              onClick={() => setResponseTab('json')}
            >
              Json
            </button>
          </div>
          <div className="panel-body">
            <div className="search small">
              <input
                type="search"
                value={responseSearch}
                onChange={(event) => setResponseSearch(event.target.value)}
                placeholder="Search in response..."
                aria-label="Search in response"
              />
              <button
                className="btn ghost slim"
                onClick={() => setResponseSearch('')}
              >
                Clear
              </button>
            </div>

            {selectedRequest ? (
              responseTab === 'json' ? (
                <pre className="code-block">
                  {renderHighlightedText(responseJsonText, responseSearchTerm)}
                </pre>
              ) : (
                <>
                  <div className="section-title">Headers</div>
                  {filteredResponseHeaders.length ? (
                    <div className="kv-grid">
                      {filteredResponseHeaders.map((header) => (
                        <div
                          className={`kv-row${
                            responseSearchTerm && headerMatches(header, responseSearchTerm)
                              ? ' match'
                              : ''
                          }`}
                          key={`${header.key}-${header.value}`}
                        >
                          <span className="kv-key">
                            {renderHighlightedText(header.key, responseSearchTerm)}
                          </span>
                          <span className="kv-value">
                            {renderHighlightedText(
                              header.value,
                              responseSearchTerm,
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">No response headers found.</div>
                  )}
                  <div className="section-title">Body</div>
                  <pre className="code-block">
                    {responseBody
                      ? renderHighlightedText(responseBody, responseSearchTerm)
                      : 'Response body not captured yet.'}
                  </pre>
                </>
              )
            ) : (
              <div className="empty-state">
                Select a request to view the response.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
