import React, { useState, useEffect, useMemo, useRef } from 'react';
import { NetworkEntry, ParsedRequest, RequestTabMode } from '../types';
import {
  renderHighlightedText,
  renderRequestPreview,
  buildRequestText,
  parseRequestText,
  buildRequestJson,
  highlightCode,
  jsonToRequestText,
  formatBytes,
  formatDuration,
  isValidHeaderName,
  isForbiddenHeaderName,
} from '../utils';

interface RequestDetailProps {
  selectedRequest: NetworkEntry | null;
  selectedRequests: NetworkEntry[];
  appliedRequest?: any; // Suggestion from AI
  onSend: (parsed: ParsedRequest) => Promise<NetworkEntry | null>;
  isSending: boolean;
}

export const RequestDetail: React.FC<RequestDetailProps> = ({
  selectedRequest,
  selectedRequests,
  appliedRequest,
  onSend,
  isSending,
}) => {
  const [requestTab, setRequestTab] = useState<RequestTabMode>('pretty');
  const [requestSearch, setRequestSearch] = useState('');
  const [requestText, setRequestText] = useState('');
  const [jsonEditorText, setJsonEditorText] = useState('');
  const [runnerResults, setRunnerResults] = useState<RunnerResult[]>([]);
  const [runnerBusy, setRunnerBusy] = useState(false);
  const [baselineSnapshot, setBaselineSnapshot] = useState<ResponseSnapshot | null>(null);
  const [selectedParamId, setSelectedParamId] = useState('');
  const [selectedAuthIds, setSelectedAuthIds] = useState<string[]>([]);

  const requestEditorRef = useRef<HTMLTextAreaElement | null>(null);
  const requestMirrorRef = useRef<HTMLPreElement | null>(null);
  const jsonEditorRef = useRef<HTMLTextAreaElement | null>(null);
  const jsonMirrorRef = useRef<HTMLPreElement | null>(null);

  useEffect(() => {
    if (!selectedRequest) {
      setRequestText('');
      setJsonEditorText('');
      setRunnerResults([]);
      setBaselineSnapshot(null);
      return;
    }
    const txt = buildRequestText(selectedRequest);
    setRequestText(txt);
    
    // If we are already in JSON mode when selecting a new request, we should update the JSON editor too
    if (requestTab === 'json') {
      const parsed = parseRequestText(txt, selectedRequest);
      setJsonEditorText(JSON.stringify(buildRequestJson(parsed), null, 2));
    }
  }, [selectedRequest?.id]);

  useEffect(() => {
    setRunnerResults([]);
    setBaselineSnapshot(buildBaselineSnapshot(selectedRequest));
  }, [selectedRequest?.id]);

  useEffect(() => {
    if (appliedRequest) {
        // Construct raw HTTP text from the applied request object
        let text = `${appliedRequest.method} ${appliedRequest.url} HTTP/1.1\n`;
        
        if (appliedRequest.headers) {
            Object.entries(appliedRequest.headers).forEach(([k, v]) => {
                text += `${k}: ${v}\n`;
            });
        }
        
        // Ensure Host header if missing (parsing URL)
        try {
            const u = new URL(appliedRequest.url);
            if (!text.match(/^Host:/im)) {
               text += `Host: ${u.host}\n`;
            }
        } catch(e) {}

        text += '\n';
        if (appliedRequest.body) {
            text += appliedRequest.body;
        }

        setRequestText(text);
        if (requestTab === 'json') {
          // If in JSON mode, try to update that view too, though it relies on parsing the text back
          // We can just switch to 'pretty' (default) to show the raw edit
           setRequestTab('pretty'); // Force switch to raw view to see changes
        }
    }
  }, [appliedRequest]);

  const requestSearchTerm = requestSearch.trim().toLowerCase();

  const parsedRequest = useMemo(
    () => parseRequestText(requestText, selectedRequest),
    [requestText, selectedRequest],
  );

  const requestTemplate = useMemo(
    () => buildRequestTemplate(parsedRequest),
    [parsedRequest],
  );
  const variantPresets = useMemo(
    () => (requestTemplate ? buildVariantPresets(requestTemplate) : []),
    [requestTemplate],
  );

  const paramOptions = useMemo(
    () => extractParams(parsedRequest),
    [parsedRequest],
  );

  const authVariants = useMemo(
    () => buildAuthVariants(selectedRequests, parsedRequest.url),
    [selectedRequests, parsedRequest.url],
  );

  useEffect(() => {
    if (!selectedParamId && paramOptions.length) {
      setSelectedParamId(paramOptions[0].id);
    }
  }, [paramOptions, selectedParamId]);

  useEffect(() => {
    if (selectedAuthIds.length === 0 && authVariants.length) {
      setSelectedAuthIds(authVariants.slice(0, 5).map((item) => item.id));
    }
  }, [authVariants, selectedAuthIds.length]);

  const handleCopyRequest = () => {
    if (!requestText.trim()) return;
    void navigator.clipboard?.writeText(requestText);
  };

  const handleJsonChange = (text: string) => {
    setJsonEditorText(text);
    const newRequestText = jsonToRequestText(text, selectedRequest?.httpVersion || 'HTTP/1.1');
    if (newRequestText !== null) {
      setRequestText(newRequestText);
    }
  };

  const handleTabChange = (tab: RequestTabMode) => {
    if (tab === 'json') {
      const json = requestText.trim()
        ? JSON.stringify(buildRequestJson(parsedRequest), null, 2)
        : '';
      setJsonEditorText(json);
    }
    setRequestTab(tab);
  };

  const handleClearRunner = () => {
    setRunnerResults([]);
  };

  const ensureBaseline = async () => {
    if (baselineSnapshot) return baselineSnapshot;
    if (!requestTemplate || !requestTemplate.url) return null;
    try {
      const response = await runRequest(requestTemplate);
      setBaselineSnapshot(response);
      return response;
    } catch {
      return null;
    }
  };

  const runVariants = async (variants: RunnerVariant[]) => {
    if (runnerBusy || variants.length === 0) return;
    setRunnerBusy(true);
    const baseline = await ensureBaseline();

    try {
      for (const variant of variants) {
        try {
          const response = await runRequest(variant.request);
          const diff = baseline ? buildDiffSummary(baseline, response) : null;
          const signal = buildRunnerSignal(variant, baseline, response, diff || undefined);
          setRunnerResults((prev) => [
            ...prev,
            {
              id: `${variant.id}-${Date.now()}`,
              label: variant.label,
              request: variant.request,
              response,
              diffSummary: diff?.summary || 'Baseline not set',
              deltaFields: diff?.fields || [],
              signal,
            },
          ]);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Request failed';
          const signal = buildRunnerSignal(variant, baseline, undefined, undefined, message);
          setRunnerResults((prev) => [
            ...prev,
            {
              id: `${variant.id}-${Date.now()}`,
              label: variant.label,
              request: variant.request,
              error: message,
              signal,
            },
          ]);
        }
      }
    } finally {
      setRunnerBusy(false);
    }
  };

  const handleVariantPresets = () => {
    if (!requestTemplate || !requestTemplate.url) return;
    runVariants(variantPresets);
  };

  const handleBoundaryDiff = () => {
    const base = requestTemplate;
    if (!base || !base.url) return;
    const variants = buildBoundaryVariants(base, authVariants, selectedAuthIds);
    runVariants(variants);
  };

  const handleCacheProbes = () => {
    const base = requestTemplate;
    if (!base || !base.url) return;
    runVariants(buildCacheProbeVariants(base));
  };

  const handlePayloadPack = (pack: PayloadPack) => {
    const base = requestTemplate;
    if (!base || !base.url) return;
    const param = paramOptions.find((item) => item.id === selectedParamId);
    if (!param) {
      alert('Select a parameter to inject payloads.');
      return;
    }
    runVariants(buildPayloadVariants(base, param, pack));
  };

  const renderSignalBadge = (signal?: RunnerSignal) => {
    if (!signal) {
      return <span className="badge badge--info">--</span>;
    }
    const levelClass =
      signal.level === 'high'
        ? 'badge--bad'
        : signal.level === 'warn'
          ? 'badge--warn'
          : signal.level === 'ok'
            ? 'badge--ok'
            : 'badge--info';
    const title = signal.details?.length
      ? `${signal.label} · ${signal.details.join(' | ')}`
      : signal.label;
    return (
      <span className={`badge ${levelClass}`} title={title}>
        {signal.label}
      </span>
    );
  };

  const renderStatusBadge = (status?: number, statusText?: string) => {
    if (!status) {
      return <span className="badge badge--bad">ERR</span>;
    }
    const levelClass =
      status >= 500
        ? 'badge--bad'
        : status >= 400
          ? 'badge--warn'
          : status >= 300
            ? 'badge--info'
            : 'badge--ok';
    return (
      <span className={`badge ${levelClass}`} title={statusText || ''}>
        {status}
      </span>
    );
  };

  return (
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
            onClick={() => void onSend(parsedRequest)}
            disabled={!parsedRequest.url || isSending}
          >
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
      <div className="tabs">
        <button
          className={`tab${requestTab === 'pretty' ? ' active' : ''}`}
          onClick={() => handleTabChange('pretty')}
        >
          Pretty
        </button>
        <button
          className={`tab${requestTab === 'json' ? ' active' : ''}`}
          onClick={() => handleTabChange('json')}
        >
          Json
        </button>
        <button
          className={`tab${requestTab === 'runner' ? ' active' : ''}`}
          onClick={() => handleTabChange('runner')}
        >
          Runner
        </button>
      </div>
      <div className="panel-body">
        {requestTab !== 'runner' && (
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
        )}

        {selectedRequest ? (
          requestTab === 'runner' ? (
            <div className="runner-panel">
              <div className="runner-baseline">
                <div>
                  <div className="runner-label">Baseline</div>
                  <div className="runner-meta">
                    {baselineSnapshot
                      ? `Status ${baselineSnapshot.status} | ${formatBytes(baselineSnapshot.size)} | ${baselineSnapshot.bodyHash}`
                      : 'Not set'}
                  </div>
                </div>
                <div className="runner-actions">
                  <button
                    className="btn ghost slim"
                    onClick={() => ensureBaseline()}
                    disabled={runnerBusy || !parsedRequest.url}
                  >
                    Refresh Baseline
                  </button>
                  <button className="btn ghost slim" onClick={handleClearRunner}>
                    Clear
                  </button>
                </div>
              </div>

              <div className="runner-section">
                <div className="runner-section-title">Variant runner</div>
                <div className="runner-button-row">
                  {variantPresets.map((preset) => (
                    <button
                      key={preset.id}
                      className="btn ghost slim"
                      onClick={() => runVariants([preset])}
                      disabled={runnerBusy || !parsedRequest.url}
                    >
                      {preset.label}
                    </button>
                  ))}
                  {variantPresets.length > 1 && (
                    <button
                      className="btn ghost slim"
                      onClick={handleVariantPresets}
                      disabled={runnerBusy || !parsedRequest.url}
                    >
                      Run all
                    </button>
                  )}
                </div>
              </div>

              <div className="runner-section">
                <div className="runner-section-title">Boundary diff</div>
                {authVariants.length ? (
                  <>
                    <div className="runner-auth-list">
                      {authVariants.map((item) => (
                        <label key={item.id} className="runner-auth-item">
                          <input
                            type="checkbox"
                            checked={selectedAuthIds.includes(item.id)}
                            onChange={() => {
                              setSelectedAuthIds((prev) =>
                                prev.includes(item.id)
                                  ? prev.filter((id) => id !== item.id)
                                  : [...prev, item.id],
                              );
                            }}
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>
                    <button
                      className="btn ghost slim"
                      onClick={handleBoundaryDiff}
                      disabled={runnerBusy || !parsedRequest.url || selectedAuthIds.length === 0}
                    >
                      Run boundary diff
                    </button>
                    <div className="runner-note">
                      Compares status, hashes, and JSON deltas across selected auth contexts.
                    </div>
                  </>
                ) : (
                  <div className="runner-note">
                    Select multiple requests for the same endpoint. Auth-like headers will be used when present.
                  </div>
                )}
              </div>

              <div className="runner-section">
                <div className="runner-section-title">Negative cache probes</div>
                <div className="runner-button-row">
                  <button
                    className="btn ghost slim"
                    onClick={handleCacheProbes}
                    disabled={runnerBusy || !parsedRequest.url}
                  >
                    Run cache probes
                  </button>
                </div>
                <div className="runner-note">
                  Adds unkeyed headers (Forwarded, X-Original-URL, X-Forwarded-*) and compares cache signals + hashes.
                </div>
              </div>

              <div className="runner-section">
                <div className="runner-section-title">Payload packs</div>
                <div className="runner-payload-row">
                  <select
                    className="runner-select"
                    value={selectedParamId}
                    onChange={(event) => setSelectedParamId(event.target.value)}
                  >
                    {paramOptions.length ? (
                      paramOptions.map((param) => (
                        <option key={param.id} value={param.id}>
                          {param.key} ({param.location})
                        </option>
                      ))
                    ) : (
                      <option value="">No parameters detected</option>
                    )}
                  </select>
                  <div className="runner-button-row">
                    {PAYLOAD_PACKS.map((pack) => (
                      <button
                        key={pack.id}
                        className="btn ghost slim"
                        onClick={() => handlePayloadPack(pack)}
                        disabled={runnerBusy || !parsedRequest.url || !paramOptions.length}
                      >
                        {pack.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="runner-section">
                <div className="runner-section-title">Run results</div>
                {runnerResults.length ? (
                  <div className="runner-results">
                    <div className="runner-results-head">
                      <span>Variant</span>
                      <span>Signal</span>
                      <span>Status</span>
                      <span>Time</span>
                      <span>Size</span>
                      <span>Hash</span>
                      <span>Diff</span>
                      <span>Cache</span>
                    </div>
                    {runnerResults.map((result) => (
                      <div key={result.id} className="runner-results-row">
                        <span title={result.label}>{result.label}</span>
                        <span>{renderSignalBadge(result.signal)}</span>
                        <span>
                          {renderStatusBadge(
                            result.response?.status,
                            result.response?.statusText,
                          )}
                        </span>
                        <span>
                          {result.response
                            ? formatDuration(result.response.timeMs)
                            : '--'}
                        </span>
                        <span>
                          {result.response
                            ? formatBytes(result.response.size)
                            : '--'}
                        </span>
                        <span title={result.response?.bodyHash || ''}>
                          {result.response?.bodyHash || '--'}
                        </span>
                        <span
                          title={result.deltaFields?.join(', ') || result.error || ''}
                        >
                          {result.error || result.diffSummary || '--'}
                        </span>
                        <span title={result.response?.cacheSummary || ''}>
                          {result.response?.cacheSummary || '--'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="runner-note">No runs yet.</div>
                )}
              </div>
            </div>
          ) : requestTab === 'json' ? (
            <div className="code-editor">
              <pre
                className="code-editor__mirror hljs"
                ref={jsonMirrorRef}
                dangerouslySetInnerHTML={{
                  __html: highlightCode(jsonEditorText, 'json', requestSearchTerm),
                }}
              />
              <textarea
                ref={jsonEditorRef}
                className="code-editor__input"
                spellCheck={false}
                value={jsonEditorText}
                onChange={(event) => handleJsonChange(event.target.value)}
                onScroll={() => {
                  if (!jsonEditorRef.current || !jsonMirrorRef.current) return;
                  jsonMirrorRef.current.scrollTop = jsonEditorRef.current.scrollTop;
                  jsonMirrorRef.current.scrollLeft = jsonEditorRef.current.scrollLeft;
                }}
              />
            </div>
          ) : (
            <div className="code-editor">
              <pre
                className="code-editor__mirror hljs"
                ref={requestMirrorRef}
                dangerouslySetInnerHTML={{
                  __html: highlightCode(requestText, 'http', requestSearchTerm),
                }}
              />
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
  );
};

type RequestTemplate = {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
};

type ResponseSnapshot = {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  timeMs: number;
  size: number;
  bodyHash: string;
  cacheSummary: string;
};

type RunnerResult = {
  id: string;
  label: string;
  request: RequestTemplate;
  response?: ResponseSnapshot;
  diffSummary?: string;
  deltaFields?: string[];
  error?: string;
  signal?: RunnerSignal;
};

type RunnerVariant = {
  id: string;
  label: string;
  request: RequestTemplate;
  meta?: {
    baseHasAuth?: boolean;
  };
};

type RunnerSignalLevel = 'ok' | 'info' | 'warn' | 'high';

type RunnerSignal = {
  level: RunnerSignalLevel;
  label: string;
  details?: string[];
};

type PayloadParam = {
  id: string;
  key: string;
  location: 'query' | 'body' | 'form';
};

type PayloadPack = {
  id: string;
  label: string;
  values: string[];
};

const PAYLOAD_PACKS: PayloadPack[] = [
  {
    id: 'idor',
    label: 'IDOR',
    values: ['1', '2', '9999', '../admin'],
  },
  {
    id: 'ssrf',
    label: 'SSRF',
    values: [
      'http://127.0.0.1:80',
      'http://localhost:8080',
      'http://169.254.169.254/latest/meta-data/',
    ],
  },
  {
    id: 'sqli',
    label: 'SQLi',
    values: ["' OR '1'='1", '1 OR 1=1--', '" OR "1"="1'],
  },
  {
    id: 'xss',
    label: 'XSS',
    values: [
      '<script>alert(1)</script>',
      '\"><img src=x onerror=alert(1)>',
      '<svg/onload=alert(1)>',
    ],
  },
];

const AUTH_HEADER_KEYS = [
  'authorization',
  'cookie',
  'x-api-key',
  'x-csrf-token',
  'x-xsrf-token',
  'x-auth-token',
  'x-access-token',
  'x-refresh-token',
  'x-session-token',
];

const buildRequestTemplate = (parsed: ParsedRequest): RequestTemplate | null => {
  if (!parsed.url) return null;
  return {
    method: parsed.method.toUpperCase(),
    url: parsed.url,
    headers: headerPairsToRecord(parsed.headers),
    body: parsed.body,
  };
};

const headerPairsToRecord = (headers: ParsedRequest['headers']) => {
  const map: Record<string, string> = {};
  headers.forEach((header) => {
    const key = header.key.trim();
    if (!key) return;
    map[key] = header.value ?? '';
  });
  return map;
};

const sanitizeHeaders = (headers: Record<string, string>) => {
  const sanitized: Record<string, string> = {};
  Object.entries(headers).forEach(([key, value]) => {
    const name = key.trim();
    if (!name) return;
    if (!isValidHeaderName(name) || isForbiddenHeaderName(name)) return;
    sanitized[name] = value;
  });
  return sanitized;
};

const hasAuthHeaders = (headers: Record<string, string>) =>
  Object.keys(headers).some((key) => {
    const normalized = key.toLowerCase();
    if (!AUTH_HEADER_KEYS.includes(normalized)) return false;
    return !isForbiddenHeaderName(normalized);
  });

const buildBaselineSnapshot = (entry: NetworkEntry | null): ResponseSnapshot | null => {
  if (!entry?.responseHeaders || entry.responseBody === undefined) return null;
  const headers: Record<string, string> = {};
  entry.responseHeaders.forEach((header) => {
    headers[header.key.toLowerCase()] = header.value || '';
  });
  const body = entry.responseBody || '';
  return {
    status: entry.status ?? 0,
    statusText: entry.statusText ?? '',
    headers,
    body,
    timeMs: entry.time ?? 0,
    size: entry.size ?? body.length,
    bodyHash: hashBody(body),
    cacheSummary: summarizeCacheHeaders(headers),
  };
};

const runRequest = async (request: RequestTemplate): Promise<ResponseSnapshot> => {
  const method = request.method.toUpperCase();
  const canHaveBody = !['GET', 'HEAD'].includes(method);
  const start = performance.now();
  const safeHeaders = sanitizeHeaders(request.headers);
  const response = await fetch(request.url, {
    method,
    headers: safeHeaders,
    body: canHaveBody && request.body ? request.body : undefined,
  });
  const body = await response.text();
  const timeMs = performance.now() - start;
  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });

  return {
    status: response.status,
    statusText: response.statusText,
    headers,
    body,
    timeMs,
    size: body.length,
    bodyHash: hashBody(body),
    cacheSummary: summarizeCacheHeaders(headers),
  };
};

const buildVariantPresets = (base: RequestTemplate): RunnerVariant[] => {
  const variants: RunnerVariant[] = [];
  const baseHeaders = { ...base.headers };
  const baseHasAuth = hasAuthHeaders(baseHeaders);

  variants.push({
    id: 'auth-strip',
    label: 'Auth stripped',
    request: {
      ...base,
      headers: stripAuthHeaders(baseHeaders),
    },
    meta: { baseHasAuth },
  });

  const methodOverride =
    base.method === 'GET' ? 'POST' : base.method === 'POST' ? 'GET' : 'POST';
  variants.push({
    id: 'method-override',
    label: `Method override -> ${methodOverride}`,
    request: {
      ...base,
      headers: {
        ...baseHeaders,
        'X-HTTP-Method-Override': methodOverride,
        'X-Method-Override': methodOverride,
        'X-Original-Method': methodOverride,
      },
    },
  });

  variants.push({
    id: 'method-tunnel',
    label: `Method tunnel (_method=${methodOverride})`,
    request: {
      ...base,
      url: addMethodOverrideParam(base.url, methodOverride),
    },
  });

  variants.push({
    id: 'header-pollution',
    label: 'Header pollution',
    request: {
      ...base,
      headers: {
        ...baseHeaders,
        Forwarded: 'for=127.0.0.1;proto=http;host=evil.example',
        'X-Forwarded-Host': 'evil.example',
        'X-Forwarded-Proto': 'http',
        'X-Forwarded-For': '127.0.0.1, 10.0.0.1',
        'X-Forwarded-Prefix': '/admin',
        'X-Host': 'evil.example',
        'X-Original-Host': 'evil.example',
        'X-Original-URL': '/',
      },
    },
  });

  variants.push({
    id: 'ip-spoof',
    label: 'Client IP spoof',
    request: {
      ...base,
      headers: {
        ...baseHeaders,
        'X-Forwarded-For': '127.0.0.1, 10.0.0.1',
        'X-Real-IP': '127.0.0.1',
        'True-Client-IP': '127.0.0.1',
      },
    },
  });

  variants.push({
    id: 'path-confusion',
    label: 'Path confusion (/.)',
    request: {
      ...base,
      url: appendPathSuffix(base.url, '/.'),
    },
  });

  variants.push({
    id: 'param-duplication',
    label: 'Param duplication',
    request: {
      ...base,
      url: duplicateFirstQueryParam(base.url),
    },
  });

  return variants;
};

const buildBoundaryVariants = (
  base: RequestTemplate,
  authVariants: AuthVariant[],
  selectedIds: string[],
) => {
  const baseHasAuth = hasAuthHeaders(base.headers);
  const selected = authVariants.filter((item) => selectedIds.includes(item.id));
  return selected.map((variant) => ({
    id: `boundary-${variant.id}`,
    label: `Boundary: ${variant.label}`,
    request: {
      ...base,
      headers: applyAuthHeaders(base.headers, variant.headers),
    },
    meta: { baseHasAuth },
  }));
};

const buildCacheProbeVariants = (base: RequestTemplate): RunnerVariant[] => {
  const variants: RunnerVariant[] = [];
  const headers = { ...base.headers };

  variants.push({
    id: 'cache-probe-host',
    label: 'Cache probe: host',
    request: {
      ...base,
      headers: {
        ...headers,
        'X-Forwarded-Host': 'cache-poison.example',
        'X-Host': 'cache-poison.example',
        'X-Original-Host': 'cache-poison.example',
      },
    },
  });

  variants.push({
    id: 'cache-probe-proto',
    label: 'Cache probe: proto',
    request: {
      ...base,
      headers: {
        ...headers,
        'X-Forwarded-Proto': 'http',
        'X-Forwarded-Port': '80',
        'X-Forwarded-Scheme': 'http',
      },
    },
  });

  variants.push({
    id: 'cache-probe-forwarded',
    label: 'Cache probe: forwarded',
    request: {
      ...base,
      headers: {
        ...headers,
        Forwarded: 'for=127.0.0.1;proto=http;host=cache-poison.example',
      },
    },
  });

  variants.push({
    id: 'cache-probe-path',
    label: 'Cache probe: path',
    request: {
      ...base,
      headers: {
        ...headers,
        'X-Original-URL': '/__cache_probe',
        'X-Rewrite-URL': '/__cache_probe',
        'X-Forwarded-Prefix': '/__cache_probe',
      },
    },
  });

  return variants;
};

const buildPayloadVariants = (
  base: RequestTemplate,
  param: PayloadParam,
  pack: PayloadPack,
) => {
  return pack.values.map((value, index) => ({
    id: `${pack.id}-${index}`,
    label: `${pack.label}: ${value.slice(0, 24)}`,
    request: applyPayload(base, param, value),
  }));
};

const extractParams = (parsed: ParsedRequest): PayloadParam[] => {
  const params: PayloadParam[] = [];
  const seen = new Set<string>();

  if (parsed.url) {
    try {
      const url = new URL(parsed.url);
      url.searchParams.forEach((_value, key) => {
        if (seen.has(`query:${key}`)) return;
        seen.add(`query:${key}`);
        params.push({ id: `query:${key}`, key, location: 'query' });
      });
    } catch {
      // Ignore invalid URLs.
    }
  }

  const contentType = getHeaderValue(parsed.headers, 'content-type') || '';
  const body = parsed.body || '';

  if (contentType.includes('application/json')) {
    try {
      const parsedJson = JSON.parse(body);
      if (parsedJson && typeof parsedJson === 'object' && !Array.isArray(parsedJson)) {
        Object.keys(parsedJson).forEach((key) => {
          if (seen.has(`body:${key}`)) return;
          seen.add(`body:${key}`);
          params.push({ id: `body:${key}`, key, location: 'body' });
        });
      }
    } catch {
      // Ignore invalid JSON.
    }
  } else if (body.includes('=')) {
    const formParams = new URLSearchParams(body);
    formParams.forEach((_value, key) => {
      if (seen.has(`form:${key}`)) return;
      seen.add(`form:${key}`);
      params.push({ id: `form:${key}`, key, location: 'form' });
    });
  }

  return params;
};

const applyPayload = (
  base: RequestTemplate,
  param: PayloadParam,
  value: string,
) => {
  if (param.location === 'query') {
    return {
      ...base,
      url: updateQueryParam(base.url, param.key, value),
    };
  }

  if (param.location === 'form') {
    return {
      ...base,
      body: updateFormParam(base.body || '', param.key, value),
    };
  }

  if (param.location === 'body') {
    return {
      ...base,
      body: updateJsonParam(base.body || '', param.key, value),
    };
  }

  return base;
};

const updateQueryParam = (url: string, key: string, value: string) => {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set(key, value);
    return parsed.toString();
  } catch {
    return url;
  }
};

const updateFormParam = (body: string, key: string, value: string) => {
  const params = new URLSearchParams(body);
  params.set(key, value);
  return params.toString();
};

const updateJsonParam = (body: string, key: string, value: string) => {
  try {
    const parsed = JSON.parse(body || '{}');
    if (!parsed || typeof parsed !== 'object') return body;
    (parsed as Record<string, unknown>)[key] = value;
    return JSON.stringify(parsed, null, 2);
  } catch {
    return body;
  }
};

const getHeaderValue = (headers: ParsedRequest['headers'], key: string) => {
  const target = key.toLowerCase();
  const found = headers.find((header) => header.key.toLowerCase() === target);
  return found?.value || '';
};

type AuthVariant = {
  id: string;
  label: string;
  headers: Record<string, string>;
};

const BOUNDARY_HEADER_KEYS = AUTH_HEADER_KEYS;

const CANONICAL_HEADER_NAMES: Record<string, string> = {
  authorization: 'Authorization',
  cookie: 'Cookie',
  'x-api-key': 'X-API-Key',
  'x-csrf-token': 'X-CSRF-Token',
  'x-xsrf-token': 'X-XSRF-Token',
  'x-auth-token': 'X-Auth-Token',
  'x-access-token': 'X-Access-Token',
  'x-refresh-token': 'X-Refresh-Token',
  'x-session-token': 'X-Session-Token',
};

const buildAuthVariants = (
  entries: NetworkEntry[],
  baseUrl: string,
): AuthVariant[] => {
  if (!entries.length) return [];
  const targetPath = normalizePathFromUrl(baseUrl);
  const targetHost = normalizeHostFromUrl(baseUrl);
  const variants: AuthVariant[] = [];
  const seen = new Set<string>();

  entries.forEach((entry, index) => {
    if (!entry.url) return;
    if (targetHost && normalizeHostFromUrl(entry.url) !== targetHost) return;
    if (targetPath && normalizePathFromUrl(entry.url) !== targetPath) return;
    const headers = entry.requestHeaders || [];
    const authHeaders = pickHeaders(headers);

    const labelParts = [];
    Object.entries(authHeaders).forEach(([key, value]) => {
      labelParts.push(`${key}: ${truncate(value, 18)}`);
    });
    if (!labelParts.length) {
      labelParts.push('No auth headers');
    }
    const label = labelParts.join(' | ');

    const key = JSON.stringify(authHeaders);
    if (seen.has(key)) return;
    seen.add(key);

    variants.push({
      id: `auth-${index}`,
      label,
      headers: authHeaders,
    });
  });

  return variants;
};

const pickHeaders = (headers: NetworkEntry['requestHeaders']) => {
  const picked: Record<string, string> = {};
  headers.forEach((header) => {
    const key = header.key.toLowerCase();
    if (!BOUNDARY_HEADER_KEYS.includes(key)) return;
    const canonical = CANONICAL_HEADER_NAMES[key] || header.key;
    picked[canonical] = header.value || '';
  });
  return picked;
};

const applyAuthHeaders = (
  baseHeaders: Record<string, string>,
  authHeaders: Record<string, string>,
) => {
  const next = { ...baseHeaders };
  Object.keys(next).forEach((key) => {
    if (BOUNDARY_HEADER_KEYS.includes(key.toLowerCase())) {
      delete next[key];
    }
  });
  return { ...next, ...authHeaders };
};

const stripAuthHeaders = (headers: Record<string, string>) => {
  const next = { ...headers };
  Object.keys(next).forEach((key) => {
    if (BOUNDARY_HEADER_KEYS.includes(key.toLowerCase())) {
      delete next[key];
    }
  });
  return next;
};

const duplicateFirstQueryParam = (url: string) => {
  try {
    const parsed = new URL(url);
    const entries = Array.from(parsed.searchParams.entries());
    if (entries.length === 0) {
      parsed.searchParams.append('dup', '1');
      return parsed.toString();
    }
    const [key, value] = entries[0];
    parsed.searchParams.append(key, `${value}-dup`);
    return parsed.toString();
  } catch {
    return url;
  }
};

const addMethodOverrideParam = (url: string, method: string) => {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set('_method', method);
    return parsed.toString();
  } catch {
    return url;
  }
};

const appendPathSuffix = (url: string, suffix: string) => {
  try {
    const parsed = new URL(url);
    const basePath = parsed.pathname.endsWith('/')
      ? parsed.pathname.slice(0, -1)
      : parsed.pathname || '/';
    parsed.pathname = `${basePath}${suffix}`;
    return parsed.toString();
  } catch {
    return url;
  }
};

const normalizePathFromUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return parsed.pathname;
  } catch {
    return '';
  }
};

const normalizeHostFromUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return parsed.host;
  } catch {
    return '';
  }
};

const buildDiffSummary = (baseline: ResponseSnapshot, current: ResponseSnapshot) => {
  const fields = diffJsonFields(baseline.body, current.body);
  const parts: string[] = [];

  if (baseline.status !== current.status) {
    parts.push(`status ${baseline.status} -> ${current.status}`);
  }
  if (fields.length) {
    parts.push(`json ${fields.slice(0, 4).join(', ')}`);
  } else if (baseline.bodyHash !== current.bodyHash) {
    parts.push('hash changed');
  } else {
    parts.push('same hash');
  }

  return { summary: parts.join(' | '), fields };
};

const isPayloadVariant = (variantId: string) =>
  PAYLOAD_PACKS.some((pack) => variantId.startsWith(`${pack.id}-`));

const buildRunnerSignal = (
  variant: RunnerVariant,
  baseline: ResponseSnapshot | null,
  response?: ResponseSnapshot,
  diff?: { summary: string; fields: string[] },
  error?: string,
): RunnerSignal => {
  if (error) {
    return { level: 'warn', label: 'Request failed', details: [error] };
  }

  if (!response) {
    return { level: 'warn', label: 'No response' };
  }

  if (!baseline) {
    return { level: 'info', label: 'Baseline missing' };
  }

  const baselineOk = baseline.status >= 200 && baseline.status < 300;
  const responseOk = response.status >= 200 && response.status < 300;
  const baselineDenied = baseline.status === 401 || baseline.status === 403;
  const responseDenied = response.status === 401 || response.status === 403;
  const statusChanged = baseline.status !== response.status;
  const hashSame = baseline.bodyHash === response.bodyHash;
  const sizeDelta = baseline.size
    ? Math.abs(response.size - baseline.size) / baseline.size
    : 0;

  const details: string[] = [];
  if (statusChanged) {
    details.push(`status ${baseline.status} -> ${response.status}`);
  }
  if (!hashSame) {
    details.push('hash changed');
  }
  if (sizeDelta > 0.25) {
    details.push(`size delta ${Math.round(sizeDelta * 100)}%`);
  }
  if (diff?.fields?.length) {
    details.push(`json ${diff.fields.slice(0, 3).join(', ')}`);
  }
  if (response.cacheSummary) {
    details.push(`cache ${response.cacheSummary}`);
  }

  const isAuthVariant = variant.id === 'auth-strip' || variant.id.startsWith('boundary-');
  const isCacheProbe = variant.id.startsWith('cache-probe');
  const isMethodVariant = variant.id.includes('method');
  const isPayload = isPayloadVariant(variant.id);
  const baseHasAuth = variant.meta?.baseHasAuth ?? true;

  if (isAuthVariant) {
    if (!baseHasAuth) {
      return { level: 'info', label: 'No auth baseline', details };
    }
    if (baselineDenied && responseOk) {
      return { level: 'high', label: 'Auth bypass', details };
    }
    if (baselineOk && responseOk && hashSame && baseHasAuth) {
      return { level: 'high', label: 'Auth overlap', details };
    }
    if (responseDenied) {
      return { level: 'ok', label: 'Boundary enforced', details };
    }
    if (statusChanged || !hashSame) {
      return { level: 'info', label: 'Boundary changed', details };
    }
    return { level: 'ok', label: 'Boundary enforced', details };
  }

  if (isCacheProbe) {
    if (response.cacheSummary && !hashSame) {
      return { level: 'warn', label: 'Cache variance', details };
    }
    if (response.cacheSummary && hashSame) {
      return { level: 'info', label: 'Cache stable', details };
    }
    return { level: 'ok', label: 'No cache signal', details };
  }

  if (isMethodVariant) {
    if ((baseline.status === 405 || baseline.status === 501) && responseOk) {
      return { level: 'warn', label: 'Method accepted', details };
    }
    if (statusChanged || !hashSame) {
      return { level: 'info', label: 'Method variance', details };
    }
    return { level: 'ok', label: 'No change', details };
  }

  if (isPayload) {
    if (response.status >= 500) {
      return { level: 'warn', label: 'Server error', details };
    }
    if (statusChanged || !hashSame) {
      return { level: 'info', label: 'Input impact', details };
    }
    return { level: 'ok', label: 'No change', details };
  }

  if (statusChanged || !hashSame) {
    return { level: 'info', label: 'Response changed', details };
  }

  return { level: 'ok', label: 'No change', details };
};

const diffJsonFields = (leftBody: string, rightBody: string) => {
  let left: unknown;
  let right: unknown;
  try {
    left = JSON.parse(leftBody);
    right = JSON.parse(rightBody);
  } catch {
    return [];
  }
  const diffs: string[] = [];
  collectJsonDiff(left, right, '', 0, diffs);
  return diffs;
};

const collectJsonDiff = (
  left: unknown,
  right: unknown,
  path: string,
  depth: number,
  diffs: string[],
) => {
  if (depth > 3) return;
  if (diffs.length > 12) return;
  if (left === right) return;

  const leftType = typeof left;
  const rightType = typeof right;
  if (leftType !== rightType) {
    diffs.push(path || '(root)');
    return;
  }

  if (Array.isArray(left) && Array.isArray(right)) {
    if (left.length !== right.length) {
      diffs.push(path || '(array)');
      return;
    }
    for (let i = 0; i < left.length; i += 1) {
      collectJsonDiff(left[i], right[i], `${path}[${i}]`, depth + 1, diffs);
    }
    return;
  }

  if (left && right && leftType === 'object') {
    const leftObj = left as Record<string, unknown>;
    const rightObj = right as Record<string, unknown>;
    const keys = new Set([...Object.keys(leftObj), ...Object.keys(rightObj)]);
    keys.forEach((key) => {
      collectJsonDiff(
        leftObj[key],
        rightObj[key],
        path ? `${path}.${key}` : key,
        depth + 1,
        diffs,
      );
    });
    return;
  }

  diffs.push(path || '(value)');
};

const summarizeCacheHeaders = (headers: Record<string, string>) => {
  const signals: string[] = [];
  const cacheControl = headers['cache-control'];
  const age = headers['age'];
  const vary = headers['vary'];

  if (cacheControl) signals.push(`cache-control=${truncate(cacheControl, 32)}`);
  if (age) signals.push(`age=${age}`);
  if (vary) signals.push(`vary=${truncate(vary, 32)}`);

  const cacheHeaders = [
    'x-cache',
    'x-cache-hits',
    'cf-cache-status',
    'x-served-by',
    'x-cacheable',
    'x-fastly-cache',
    'x-akamai-cache',
    'cdn-cache',
    'x-proxy-cache',
    'x-edge-cache',
  ];

  cacheHeaders.forEach((name) => {
    const value = headers[name];
    if (value) signals.push(`${name}=${truncate(value, 24)}`);
  });

  return signals.slice(0, 3).join('; ');
};

const hashBody = (value: string) => {
  let hash = 5381;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 33) ^ value.charCodeAt(i);
  }
  return `h${(hash >>> 0).toString(16)}`;
};

const truncate = (value: string, max: number) =>
  value.length <= max ? value : `${value.slice(0, max - 3)}...`;
