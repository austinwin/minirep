import { NetworkEntry } from '../../types';
import { EndpointFinding } from './endpoints';

export type EndpointRiskLevel = 'low' | 'medium' | 'high';

export interface EndpointGraphNode {
  id: string;
  path: string;
  method: string;
  hit: boolean;
  confidence: 'low' | 'medium' | 'high';
  sources: string[];
  sourceUrls: string[];
  riskScore: number;
  riskLevel: EndpointRiskLevel;
  riskSignals: string[];
}

export const buildEndpointGraph = (
  endpoints: EndpointFinding[],
  runtimeEntries: NetworkEntry[],
): EndpointGraphNode[] => {
  const runtimeIndex = buildRuntimeIndex(runtimeEntries);
  const map = new Map<string, EndpointGraphNode>();

  endpoints.forEach((endpoint) => {
    const normalizedPath = normalizePath(endpoint.path);
    if (!normalizedPath) return;

    const method = endpoint.method ? endpoint.method.toUpperCase() : 'ANY';
    const key = `${method}|${normalizedPath}`;
    const hit = isEndpointHit(normalizedPath, method, runtimeIndex);

    const existing = map.get(key);
    if (existing) {
      existing.hit = existing.hit || hit;
      existing.confidence = higherConfidence(existing.confidence, endpoint.confidence);
      if (endpoint.source && !existing.sources.includes(endpoint.source)) {
        existing.sources.push(endpoint.source);
      }
      if (endpoint.sourceUrl && !existing.sourceUrls.includes(endpoint.sourceUrl)) {
        existing.sourceUrls.push(endpoint.sourceUrl);
      }
      return;
    }

    const { score, level, signals } = scoreEndpointRisk(
      normalizedPath,
      method,
      hit,
      endpoint.confidence,
    );

    map.set(key, {
      id: `endpoint-graph-${map.size}`,
      path: normalizedPath,
      method,
      hit,
      confidence: endpoint.confidence || 'low',
      sources: endpoint.source ? [endpoint.source] : [],
      sourceUrls: endpoint.sourceUrl ? [endpoint.sourceUrl] : [],
      riskScore: score,
      riskLevel: level,
      riskSignals: signals,
    });
  });

  return Array.from(map.values()).sort((a, b) => b.riskScore - a.riskScore);
};

type RuntimeIndexEntry = { path: string; method: string };

const buildRuntimeIndex = (entries: NetworkEntry[]): RuntimeIndexEntry[] => {
  return entries
    .filter((entry) => entry.url)
    .map((entry) => {
      const rawPath = entry.path || extractPath(entry.url);
      const path = normalizePath(rawPath);
      return {
        path,
        method: entry.method?.toUpperCase() || 'GET',
      };
    })
    .filter((entry) => entry.path);
};

const extractPath = (url: string) => {
  try {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
};

const normalizePath = (path: string) => {
  if (!path) return '';
  let clean = path.trim();
  if (!clean) return '';
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    try {
      const parsed = new URL(clean);
      clean = `${parsed.pathname}${parsed.search}`;
    } catch {
      return '';
    }
  }
  clean = clean.split('#')[0];
  clean = clean.split('?')[0];
  if (!clean.startsWith('/')) clean = `/${clean}`;
  if (clean.length > 1 && clean.endsWith('/')) {
    clean = clean.slice(0, -1);
  }
  return clean;
};

const isEndpointHit = (
  endpointPath: string,
  method: string,
  runtimeIndex: RuntimeIndexEntry[],
) => {
  const regex = pathToRegex(endpointPath);
  return runtimeIndex.some((entry) => {
    if (!regex.test(entry.path)) return false;
    if (method === 'ANY') return true;
    return entry.method === method;
  });
};

const pathToRegex = (path: string) => {
  let pattern = path;
  pattern = pattern.replace(/\{[^}]+\}/g, ':param');
  pattern = pattern.replace(/:[^/]+/g, ':param');
  pattern = escapeRegex(pattern).replace(/:param/g, '[^/]+');
  return new RegExp(`^${pattern}(?:/)?$`, 'i');
};

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const higherConfidence = (
  a: EndpointFinding['confidence'],
  b: EndpointFinding['confidence'],
) => {
  const rank = (value?: string) =>
    value === 'high' ? 3 : value === 'medium' ? 2 : 1;
  return rank(b) > rank(a) ? (b || 'low') : (a || 'low');
};

const scoreEndpointRisk = (
  path: string,
  method: string,
  hit: boolean,
  confidence?: string,
) => {
  let score = 0;
  const signals: string[] = [];

  if (!hit) {
    score += 15;
    signals.push('Unhit in traffic');
  }

  if (method !== 'ANY' && method !== 'GET') {
    score += 10;
    signals.push(`Method ${method}`);
  }

  if (/\/(admin|internal|debug|manage|console|metrics|config|system|private)\b/i.test(path)) {
    score += 25;
    signals.push('Privileged keyword');
  }

  if (/\/(auth|login|logout|token|session|password|reset|register|oauth|sso)\b/i.test(path)) {
    score += 20;
    signals.push('Auth surface');
  }

  if (/\/(billing|payment|invoice|payout|subscription)\b/i.test(path)) {
    score += 15;
    signals.push('Billing surface');
  }

  if (/\/(admin|sudo|impersonate|support|moderation)\b/i.test(path)) {
    score += 12;
    signals.push('High-privilege actions');
  }

  if (/\/(upload|import|export|file|files|download)\b/i.test(path)) {
    score += 15;
    signals.push('File handling');
  }

  if (/\/(graphql|gql)\b/i.test(path)) {
    score += 15;
    signals.push('GraphQL endpoint');
  }

  if (/(search|query|filter|where)\b/i.test(path)) {
    score += 8;
    signals.push('Query surface');
  }

  if (/\/(report|audit|logs|history)\b/i.test(path)) {
    score += 8;
    signals.push('Sensitive data surface');
  }

  if (/(:\w+|\{[^}]+\})/.test(path)) {
    score += 8;
    signals.push('Path params');
  }

  if (/\/v\d+\//i.test(path)) {
    score += 4;
    signals.push('Versioned API');
  }

  if (confidence === 'high') score += 8;
  if (confidence === 'low') score -= 5;

  score = Math.max(0, Math.min(100, score));
  const level: EndpointRiskLevel = score >= 50 ? 'high' : score >= 30 ? 'medium' : 'low';

  return { score, level, signals };
};
