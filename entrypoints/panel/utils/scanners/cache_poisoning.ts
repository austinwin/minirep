import { NetworkEntry, HeaderPair } from '../../types';
import { MAX_SCAN_BODY_CHARS } from '../../constants';

export interface CachePoisoningFinding {
  id: string;
  requestUrl: string;
  method?: string;
  vector: string;
  evidence: string;
  confidence: 'low' | 'medium' | 'high';
}

const UNKEYED_HEADERS = [
  'forwarded',
  'x-forwarded-host',
  'x-forwarded-proto',
  'x-forwarded-port',
  'x-forwarded-for',
  'x-forwarded-prefix',
  'x-forwarded-scheme',
  'x-forwarded-server',
  'x-real-ip',
  'x-host',
  'x-original-url',
  'x-original-host',
  'x-rewrite-url',
  'x-http-method-override',
  'x-method-override',
];

const CACHE_STATUS_HEADERS = [
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

export const scanForCachePoisoning = (
  requests: NetworkEntry[],
): CachePoisoningFinding[] => {
  const results: CachePoisoningFinding[] = [];
  const seen = new Set<string>();

  requests.forEach((entry) => {
    const responseHeaders = entry.responseHeaders || [];
    if (!responseHeaders.length) return;

    const cacheControl = getHeaderValue(responseHeaders, 'cache-control') || '';
    const vary = getHeaderValue(responseHeaders, 'vary') || '';
    const cacheSignals = collectCacheSignals(responseHeaders, cacheControl);
    const isCacheable = cacheSignals.length > 0;
    if (!isCacheable) return;

    const cacheSummary = buildCacheSummary(cacheSignals, cacheControl, vary);
    const requestHeaders = normalizeHeaders(entry.requestHeaders || []);
    const responseBody = (entry.responseBody || '').slice(0, MAX_SCAN_BODY_CHARS);
    const responseBodyLower = responseBody.toLowerCase();
    const responseHeaderValues = responseHeaders
      .map((header) => header.value || '')
      .join(' ')
      .toLowerCase();

    const unkeyedHits = UNKEYED_HEADERS.filter((name) => requestHeaders[name]);
    const queryParams = getQueryParams(entry.url);
    const hasCookie = Boolean(requestHeaders.cookie);
    const hasAuth = Boolean(requestHeaders.authorization);
    const varyLower = vary.toLowerCase();

    let added = 0;

    if (unkeyedHits.length) {
      unkeyedHits.forEach((headerName) => {
        if (added >= 3) return;
        const value = String(requestHeaders[headerName]);
        const reflected = isReflected(value, responseBodyLower, responseHeaderValues);
        const vector = reflected
          ? 'Unkeyed Header Reflection'
          : 'Unkeyed Header Present';
        const evidence = `${cacheSummary}; ${formatHeader(headerName)}=${truncate(
          value,
          80,
        )}${reflected ? ' reflected in response' : ''}`;
        const confidence = reflected ? 'high' : 'medium';
        const key = `${entry.url}:${vector}:${headerName}`;
        if (seen.has(key)) return;
        seen.add(key);
        results.push({
          id: `cache-poison-${results.length}`,
          requestUrl: entry.url,
          method: entry.method,
          vector,
          evidence,
          confidence,
        });
        added += 1;
      });
    }

    if (added < 3 && (hasCookie || hasAuth)) {
      const variesCookie =
        varyLower.includes('cookie') || varyLower.includes('authorization');
      if (!variesCookie) {
        const vector = 'Cacheable Response With Session Headers';
        const evidence = `${cacheSummary}; request includes ${
          hasCookie && hasAuth ? 'Cookie + Authorization' : hasCookie ? 'Cookie' : 'Authorization'
        }`;
        const key = `${entry.url}:${vector}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({
            id: `cache-poison-${results.length}`,
            requestUrl: entry.url,
            method: entry.method,
            vector,
            evidence,
            confidence: 'medium',
          });
          added += 1;
        }
      }
    }

    if (added < 3 && queryParams.length && !varyLower) {
      const vector = 'Cacheable Response With Query Params';
      const evidence = `${cacheSummary}; query params: ${queryParams
        .slice(0, 3)
        .map((param) => param.key)
        .join(', ')}${queryParams.length > 3 ? '...' : ''}`;
      const key = `${entry.url}:${vector}`;
      if (!seen.has(key)) {
        seen.add(key);
        results.push({
          id: `cache-poison-${results.length}`,
          requestUrl: entry.url,
          method: entry.method,
          vector,
          evidence,
          confidence: 'low',
        });
      }
    }
  });

  return results.sort((a, b) => confidenceScore(b.confidence) - confidenceScore(a.confidence));
};

const normalizeHeaders = (headers: HeaderPair[]) => {
  const map: Record<string, string> = {};
  headers.forEach((header) => {
    const key = header.key.toLowerCase();
    if (!key) return;
    map[key] = header.value;
  });
  return map;
};

const getHeaderValue = (headers: HeaderPair[], name: string) => {
  const target = name.toLowerCase();
  const values = headers
    .filter((header) => header.key.toLowerCase() === target)
    .map((header) => header.value)
    .filter(Boolean);
  return values.join(', ');
};

const collectCacheSignals = (headers: HeaderPair[], cacheControl: string) => {
  const signals: string[] = [];
  const cacheControlLower = cacheControl.toLowerCase();
  const maxAge = extractDirective(cacheControlLower, 'max-age');
  const sMaxAge = extractDirective(cacheControlLower, 's-maxage');

  if (cacheControlLower.includes('public')) signals.push('public');
  if (cacheControlLower.includes('stale-while-revalidate'))
    signals.push('stale-while-revalidate');
  if (cacheControlLower.includes('stale-if-error')) signals.push('stale-if-error');
  if (maxAge > 0) signals.push(`max-age=${maxAge}`);
  if (sMaxAge > 0) signals.push(`s-maxage=${sMaxAge}`);

  const ageHeader = getHeaderValue(headers, 'age');
  const ageValue = Number(ageHeader);
  if (!Number.isNaN(ageValue) && ageValue > 0) signals.push(`age=${ageValue}`);

  const expiresHeader = getHeaderValue(headers, 'expires');
  if (expiresHeader) {
    const expiresAt = Date.parse(expiresHeader);
    if (!Number.isNaN(expiresAt) && expiresAt > Date.now()) {
      signals.push('expires-future');
    }
  }

  CACHE_STATUS_HEADERS.forEach((name) => {
    const value = getHeaderValue(headers, name);
    if (value) {
      signals.push(`${name}=${truncate(value, 50)}`);
    }
  });

  return signals;
};

const extractDirective = (value: string, directive: string) => {
  const match = value.match(new RegExp(`${directive}\\s*=\\s*(\\d+)`));
  return match ? Number(match[1]) : 0;
};

const buildCacheSummary = (signals: string[], cacheControl: string, vary: string) => {
  const cacheHint = signals.length
    ? `cache: ${signals.slice(0, 3).join(', ')}${signals.length > 3 ? '...' : ''}`
    : cacheControl
      ? `cache-control: ${cacheControl}`
      : 'cache-control: missing';
  const varyHint = vary ? `; vary: ${vary}` : '';
  return `${cacheHint}${varyHint}`;
};

const getQueryParams = (url: string) => {
  try {
    const parsed = new URL(url);
    const params: Array<{ key: string; value: string }> = [];
    parsed.searchParams.forEach((value, key) => {
      params.push({ key, value });
    });
    return params;
  } catch {
    return [];
  }
};

const isReflected = (
  value: string,
  bodyLower: string,
  headerValuesLower: string,
) => {
  const cleaned = String(value || '').trim();
  if (cleaned.length < 3) return false;
  const lowered = cleaned.toLowerCase();
  if (bodyLower.includes(lowered)) return true;
  if (headerValuesLower.includes(lowered)) return true;
  return false;
};

const truncate = (value: string, max: number) => {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 3)}...`;
};

const formatHeader = (value: string) =>
  value
    .split('-')
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join('-');

const confidenceScore = (level: 'low' | 'medium' | 'high') => {
  if (level === 'high') return 3;
  if (level === 'medium') return 2;
  return 1;
};
