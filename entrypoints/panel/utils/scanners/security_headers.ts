import { NetworkEntry, HeaderPair } from '../../types';

export type SecurityHeaderSeverity = 'low' | 'medium' | 'high';

export interface SecurityHeaderFinding {
  id: string;
  url: string;
  host: string;
  header: string;
  issue: string;
  severity: SecurityHeaderSeverity;
  guidance: string;
  evidence?: string;
  recommendation?: string;
}

const SESSION_COOKIE_HINTS = /(session|sess|auth|token|jwt|sid|login)/i;
const HTML_CONTENT_TYPES = ['text/html', 'application/xhtml'];
const SAFE_XFO_VALUES = ['deny', 'sameorigin'];
const WEAK_REFERRER_POLICIES = [
  'unsafe-url',
  'no-referrer-when-downgrade',
  'origin',
  'origin-when-cross-origin',
];
const SAFE_COOP_VALUES = ['same-origin', 'same-origin-allow-popups'];
const SAFE_COEP_VALUES = ['require-corp', 'credentialless'];
const SAFE_CORP_VALUES = ['same-origin', 'same-site'];

export const scanSecurityHeaders = (
  entries: NetworkEntry[],
): SecurityHeaderFinding[] => {
  const findings: SecurityHeaderFinding[] = [];
  let counter = 0;

  const addFinding = (finding: Omit<SecurityHeaderFinding, 'id'>) => {
    findings.push({ id: `sec-hdr-${Date.now()}-${counter++}`, ...finding });
  };

  const baseline = buildBaseline(entries);

  entries.forEach((entry) => {
    if (!entry.responseHeaders || entry.responseHeaders.length === 0) return;

    const url = entry.url || '';
    const host = entry.host || '';
    const headers = entry.responseHeaders;
    const headerMap = headerMapLower(headers);
    const contentType = getHeaderValue(headerMap, 'content-type') || entry.mimeType || '';
    const isHtml = HTML_CONTENT_TYPES.some((type) => contentType.includes(type));
    const isHttps = entry.protocol === 'https' || url.startsWith('https://');

    // HSTS
    const hsts = getHeaderValue(headerMap, 'strict-transport-security');
    if (isHttps && !hsts) {
      addFinding({
        url,
        host,
        header: 'Strict-Transport-Security',
        issue: 'Missing HSTS',
        severity: 'medium',
        guidance:
          'Add `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` to enforce HTTPS.',
        recommendation:
          'Strict-Transport-Security: max-age=63072000; includeSubDomains; preload',
      });
    } else if (hsts) {
      const maxAge = extractDirectiveValue(hsts, 'max-age');
      if (maxAge !== null && maxAge < 15552000) {
        addFinding({
          url,
          host,
          header: 'Strict-Transport-Security',
          issue: `Short max-age (${maxAge})`,
          severity: 'low',
          guidance:
            'Increase HSTS max-age to at least 15552000 (180 days) or 63072000 for preload.',
          evidence: hsts,
          recommendation:
            'Strict-Transport-Security: max-age=63072000; includeSubDomains; preload',
        });
      }
      if (!/includesubdomains/i.test(hsts)) {
        addFinding({
          url,
          host,
          header: 'Strict-Transport-Security',
          issue: 'Missing includeSubDomains',
          severity: 'low',
          guidance:
            'Add `includeSubDomains` to cover all subdomains, if safe for your deployment.',
          evidence: hsts,
          recommendation:
            'Strict-Transport-Security: max-age=63072000; includeSubDomains; preload',
        });
      }
    }

    // CSP
    const csp = getHeaderValue(headerMap, 'content-security-policy');
    if (isHtml && !csp) {
      addFinding({
        url,
        host,
        header: 'Content-Security-Policy',
        issue: 'Missing CSP on HTML response',
        severity: 'medium',
        guidance:
          'Add a CSP (at minimum `default-src \'self\'`) to reduce XSS impact.',
        recommendation:
          "Content-Security-Policy: default-src 'self'; base-uri 'self'; object-src 'none'",
      });
    } else if (csp) {
      const directives = parseCsp(csp);
      if (directiveHasToken(directives, 'script-src', "'unsafe-inline'") ||
          directiveHasToken(directives, 'default-src', "'unsafe-inline'")) {
        addFinding({
          url,
          host,
          header: 'Content-Security-Policy',
          issue: 'CSP allows unsafe-inline',
          severity: 'medium',
          guidance:
            'Remove `\'unsafe-inline\'` and migrate to nonces or hashes for inline scripts.',
          evidence: csp,
          recommendation:
            "Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-<nonce>'",
        });
      }
      if (directiveHasToken(directives, 'script-src', "'unsafe-eval'") ||
          directiveHasToken(directives, 'default-src', "'unsafe-eval'")) {
        addFinding({
          url,
          host,
          header: 'Content-Security-Policy',
          issue: 'CSP allows unsafe-eval',
          severity: 'medium',
          guidance:
            'Avoid `\'unsafe-eval\'` and refactor code that relies on eval/Function.',
          evidence: csp,
          recommendation:
            "Content-Security-Policy: default-src 'self'; script-src 'self'",
        });
      }
      if (directiveHasWildcard(directives, ['default-src', 'script-src'])) {
        addFinding({
          url,
          host,
          header: 'Content-Security-Policy',
          issue: 'CSP uses wildcard sources',
          severity: 'medium',
          guidance:
            'Replace `*` sources with an explicit allowlist for scripts and default-src.',
          evidence: csp,
          recommendation:
            "Content-Security-Policy: default-src 'self'; script-src 'self'",
        });
      }
      if (!directives['base-uri']) {
        addFinding({
          url,
          host,
          header: 'Content-Security-Policy',
          issue: 'CSP missing base-uri',
          severity: 'low',
          guidance:
            'Add `base-uri \'self\'` to reduce base tag injection risks.',
          evidence: csp,
          recommendation:
            "Content-Security-Policy: default-src 'self'; base-uri 'self'; object-src 'none'",
        });
      }
      if (!directives['object-src']) {
        addFinding({
          url,
          host,
          header: 'Content-Security-Policy',
          issue: 'CSP missing object-src',
          severity: 'low',
          guidance:
            'Add `object-src \'none\'` to block legacy plugin content.',
          evidence: csp,
          recommendation:
            "Content-Security-Policy: default-src 'self'; base-uri 'self'; object-src 'none'",
        });
      }
      if (directiveHasWildcard(directives, ['frame-ancestors'])) {
        addFinding({
          url,
          host,
          header: 'Content-Security-Policy',
          issue: 'frame-ancestors allows wildcard',
          severity: 'medium',
          guidance:
            'Avoid `frame-ancestors *` unless intentionally framing across all origins.',
          evidence: csp,
          recommendation:
            "Content-Security-Policy: frame-ancestors 'none'",
        });
      }
    }

    const xcto = getHeaderValue(headerMap, 'x-content-type-options');
    if (!xcto) {
      addFinding({
        url,
        host,
        header: 'X-Content-Type-Options',
        issue: 'Missing nosniff protection',
        severity: 'low',
        guidance:
          'Add `X-Content-Type-Options: nosniff` to prevent MIME sniffing.',
        recommendation: 'X-Content-Type-Options: nosniff',
      });
    } else if (!/nosniff/i.test(xcto)) {
      addFinding({
        url,
        host,
        header: 'X-Content-Type-Options',
        issue: 'Unexpected value',
        severity: 'low',
        guidance:
          'Set the header value to `nosniff`.',
        evidence: xcto,
        recommendation: 'X-Content-Type-Options: nosniff',
      });
    }

    const xfo = getHeaderValue(headerMap, 'x-frame-options');
    if (isHtml && xfo) {
      const normalized = xfo.split(',')[0].trim().toLowerCase();
      if (!SAFE_XFO_VALUES.includes(normalized)) {
        addFinding({
          url,
          host,
          header: 'X-Frame-Options',
          issue: `Weak value (${xfo})`,
          severity: 'medium',
          guidance:
            'Use `DENY` or `SAMEORIGIN` unless framing is required.',
          evidence: xfo,
          recommendation: 'X-Frame-Options: DENY',
        });
      }
    } else if (isHtml && !xfo) {
      const cspDirectives = csp ? parseCsp(csp) : {};
      if (!cspDirectives['frame-ancestors']) {
        addFinding({
          url,
          host,
          header: 'X-Frame-Options',
          issue: 'Missing clickjacking protection',
          severity: 'medium',
          guidance:
            'Add X-Frame-Options or a CSP frame-ancestors directive for HTML pages.',
          recommendation: 'X-Frame-Options: DENY',
        });
      }
    }

    if (isHtml) {
      const referrerPolicy = getHeaderValue(headerMap, 'referrer-policy');
      if (!referrerPolicy) {
        addFinding({
          url,
          host,
          header: 'Referrer-Policy',
          issue: 'Missing referrer policy',
          severity: 'low',
          guidance:
            'Set a conservative referrer policy to limit referrer leakage.',
          recommendation: 'Referrer-Policy: strict-origin-when-cross-origin',
        });
      } else {
        const normalized = referrerPolicy.split(',')[0].trim().toLowerCase();
        if (WEAK_REFERRER_POLICIES.includes(normalized)) {
          addFinding({
            url,
            host,
            header: 'Referrer-Policy',
            issue: `Weak policy (${referrerPolicy})`,
            severity: 'low',
            guidance:
              'Prefer `strict-origin-when-cross-origin` or `no-referrer`.',
            evidence: referrerPolicy,
            recommendation: 'Referrer-Policy: strict-origin-when-cross-origin',
          });
        }
      }

      const permissionsPolicy = getHeaderValue(headerMap, 'permissions-policy');
      if (!permissionsPolicy) {
        addFinding({
          url,
          host,
          header: 'Permissions-Policy',
          issue: 'Missing permissions policy',
          severity: 'low',
          guidance:
            'Declare a Permissions-Policy to disable unused browser features.',
          recommendation:
            'Permissions-Policy: geolocation=(), microphone=(), camera=()',
        });
      }
    }

    const coop = getHeaderValue(headerMap, 'cross-origin-opener-policy');
    if (isHtml && !coop) {
      addFinding({
        url,
        host,
        header: 'Cross-Origin-Opener-Policy',
        issue: 'Missing COOP',
        severity: 'low',
        guidance:
          'Set COOP to isolate the browsing context and reduce XS-Leaks.',
        recommendation: 'Cross-Origin-Opener-Policy: same-origin',
      });
    } else if (coop && !SAFE_COOP_VALUES.includes(coop.toLowerCase())) {
      addFinding({
        url,
        host,
        header: 'Cross-Origin-Opener-Policy',
        issue: `Weak value (${coop})`,
        severity: 'low',
        guidance:
          'Use `same-origin` or `same-origin-allow-popups` for stronger isolation.',
        evidence: coop,
        recommendation: 'Cross-Origin-Opener-Policy: same-origin',
      });
    }

    const coep = getHeaderValue(headerMap, 'cross-origin-embedder-policy');
    if (isHtml && !coep) {
      addFinding({
        url,
        host,
        header: 'Cross-Origin-Embedder-Policy',
        issue: 'Missing COEP',
        severity: 'low',
        guidance:
          'Set COEP to lock down cross-origin resources when needed.',
        recommendation: 'Cross-Origin-Embedder-Policy: require-corp',
      });
    } else if (coep && !SAFE_COEP_VALUES.includes(coep.toLowerCase())) {
      addFinding({
        url,
        host,
        header: 'Cross-Origin-Embedder-Policy',
        issue: `Weak value (${coep})`,
        severity: 'low',
        guidance:
          'Use `require-corp` or `credentialless` for stronger isolation.',
        evidence: coep,
        recommendation: 'Cross-Origin-Embedder-Policy: require-corp',
      });
    }

    const corp = getHeaderValue(headerMap, 'cross-origin-resource-policy');
    if (isHtml && !corp) {
      addFinding({
        url,
        host,
        header: 'Cross-Origin-Resource-Policy',
        issue: 'Missing CORP',
        severity: 'low',
        guidance:
          'Set CORP to control which origins can load your resources.',
        recommendation: 'Cross-Origin-Resource-Policy: same-origin',
      });
    } else if (corp && !SAFE_CORP_VALUES.includes(corp.toLowerCase())) {
      addFinding({
        url,
        host,
        header: 'Cross-Origin-Resource-Policy',
        issue: `Weak value (${corp})`,
        severity: 'low',
        guidance:
          'Use `same-origin` or `same-site` to reduce unintended sharing.',
        evidence: corp,
        recommendation: 'Cross-Origin-Resource-Policy: same-origin',
      });
    }

    // CORS
    const acao = getHeaderValue(headerMap, 'access-control-allow-origin');
    const acc = getHeaderValue(headerMap, 'access-control-allow-credentials');
    const vary = getHeaderValue(headerMap, 'vary');
    const acah = getHeaderValue(headerMap, 'access-control-allow-headers');

    if (acao) {
      if (acao === '*') {
        if (acc && acc.toLowerCase() === 'true') {
          addFinding({
            url,
            host,
            header: 'Access-Control-Allow-Origin',
            issue: 'Wildcard origin with credentials',
            severity: 'high',
            guidance:
              'Do not use `*` with credentials. Reflect a vetted Origin and add `Vary: Origin`.',
            evidence: `acao=${acao}; acc=${acc}`,
            recommendation:
              'Access-Control-Allow-Origin: https://example.com',
          });
        } else {
          addFinding({
            url,
            host,
            header: 'Access-Control-Allow-Origin',
            issue: 'Wildcard origin',
            severity: 'medium',
            guidance:
              'Restrict CORS to trusted origins instead of `*` if sensitive data is exposed.',
            evidence: `acao=${acao}`,
            recommendation:
              'Access-Control-Allow-Origin: https://example.com',
          });
        }
      } else if (acao === 'null') {
        addFinding({
          url,
          host,
          header: 'Access-Control-Allow-Origin',
          issue: 'Origin set to "null"',
          severity: 'medium',
          guidance:
            'Avoid allowing `null` origins unless explicitly required by your threat model.',
          evidence: `acao=${acao}`,
          recommendation:
            'Access-Control-Allow-Origin: https://example.com',
        });
      } else if (!vary.toLowerCase().includes('origin')) {
        addFinding({
          url,
          host,
          header: 'Vary',
          issue: 'Missing Vary: Origin for CORS',
          severity: 'low',
          guidance:
            'Add `Vary: Origin` to prevent cache poisoning across origins.',
          evidence: `acao=${acao}; vary=${vary || '(missing)'}`,
          recommendation: 'Vary: Origin',
        });
      }
    }

    if (acah && acah.includes('*')) {
      addFinding({
        url,
        host,
        header: 'Access-Control-Allow-Headers',
        issue: 'Wildcard allow-headers',
        severity: 'low',
        guidance:
          'Prefer an explicit allowlist of headers to reduce CORS attack surface.',
        evidence: acah,
        recommendation: 'Access-Control-Allow-Headers: content-type, authorization',
      });
    }

    // Cookies
    const setCookies = getHeaderValues(headerMap, 'set-cookie');
    if (setCookies.length) {
      setCookies.forEach((cookieHeader) => {
        const parsed = parseSetCookie(cookieHeader);
        if (!parsed.name) return;

        const isSessionCookie = SESSION_COOKIE_HINTS.test(parsed.name);
        const sameSite = parsed.attributes.get('samesite') || '';
        const hasSecure = parsed.flags.has('secure');
        const hasHttpOnly = parsed.flags.has('httponly');

        if (isHttps && !hasSecure) {
          addFinding({
            url,
            host,
            header: 'Set-Cookie',
            issue: `Cookie ${parsed.name} missing Secure`,
            severity: isSessionCookie ? 'high' : 'medium',
            guidance:
              'Add the Secure flag to ensure cookies are sent only over HTTPS.',
            evidence: cookieHeader,
            recommendation: `Set-Cookie: ${parsed.name}=<value>; Secure`,
          });
        }

        if (!hasHttpOnly && isSessionCookie) {
          addFinding({
            url,
            host,
            header: 'Set-Cookie',
            issue: `Cookie ${parsed.name} missing HttpOnly`,
            severity: 'medium',
            guidance:
              'Add the HttpOnly flag to mitigate session theft via XSS.',
            evidence: cookieHeader,
            recommendation: `Set-Cookie: ${parsed.name}=<value>; HttpOnly`,
          });
        }

        if (!sameSite) {
          addFinding({
            url,
            host,
            header: 'Set-Cookie',
            issue: `Cookie ${parsed.name} missing SameSite`,
            severity: 'low',
            guidance:
              'Set SameSite=Lax (or Strict) unless cross-site usage is required.',
            evidence: cookieHeader,
            recommendation: `Set-Cookie: ${parsed.name}=<value>; SameSite=Lax`,
          });
        } else if (sameSite.toLowerCase() === 'none' && !hasSecure) {
          addFinding({
            url,
            host,
            header: 'Set-Cookie',
            issue: `Cookie ${parsed.name} SameSite=None without Secure`,
            severity: 'high',
            guidance:
              'SameSite=None requires Secure. Add Secure or choose Lax/Strict.',
            evidence: cookieHeader,
            recommendation: `Set-Cookie: ${parsed.name}=<value>; SameSite=None; Secure`,
          });
        }
      });
    }

    const baselineEntry = baseline.get(host);
    if (baselineEntry) {
      const currentHstsScore = scoreHsts(hsts);
      if (baselineEntry.hstsScore > currentHstsScore) {
        addFinding({
          url,
          host,
          header: 'Strict-Transport-Security',
          issue: 'HSTS weaker than host baseline',
          severity: 'low',
          guidance:
            'This route has weaker HSTS than other routes on the same host.',
          evidence: hsts || '(missing)',
          recommendation:
            'Strict-Transport-Security: max-age=63072000; includeSubDomains; preload',
        });
      }

      const currentCspScore = scoreCsp(csp);
      if (baselineEntry.cspScore > currentCspScore && isHtml) {
        addFinding({
          url,
          host,
          header: 'Content-Security-Policy',
          issue: 'CSP weaker than host baseline',
          severity: 'low',
          guidance:
            'This route has weaker CSP than other routes on the same host.',
          evidence: csp || '(missing)',
          recommendation:
            "Content-Security-Policy: default-src 'self'; base-uri 'self'; object-src 'none'",
        });
      }
    }
  });

  return findings;
};

const buildBaseline = (entries: NetworkEntry[]) => {
  const map = new Map<string, { hstsScore: number; cspScore: number }>();

  entries.forEach((entry) => {
    const host = entry.host || '';
    if (!host || !entry.responseHeaders?.length) return;
    const headers = headerMapLower(entry.responseHeaders);
    const hsts = getHeaderValue(headers, 'strict-transport-security');
    const csp = getHeaderValue(headers, 'content-security-policy');
    const hstsScore = scoreHsts(hsts);
    const cspScore = scoreCsp(csp);

    const current = map.get(host);
    if (!current) {
      map.set(host, { hstsScore, cspScore });
    } else {
      map.set(host, {
        hstsScore: Math.max(current.hstsScore, hstsScore),
        cspScore: Math.max(current.cspScore, cspScore),
      });
    }
  });

  return map;
};

const scoreHsts = (value?: string) => {
  if (!value) return 0;
  const maxAge = extractDirectiveValue(value, 'max-age') || 0;
  const hasInclude = /includesubdomains/i.test(value);
  let score = 1;
  if (maxAge >= 15552000) score += 1;
  if (maxAge >= 63072000) score += 1;
  if (hasInclude) score += 1;
  return score;
};

const scoreCsp = (value?: string) => {
  if (!value) return 0;
  const directives = parseCsp(value);
  let score = 2;
  if (directiveHasToken(directives, 'script-src', "'unsafe-inline'") ||
      directiveHasToken(directives, 'default-src', "'unsafe-inline'")) {
    score -= 1;
  }
  if (directiveHasToken(directives, 'script-src', "'unsafe-eval'") ||
      directiveHasToken(directives, 'default-src', "'unsafe-eval'")) {
    score -= 1;
  }
  if (directiveHasWildcard(directives, ['default-src', 'script-src'])) {
    score -= 1;
  }
  return Math.max(0, score);
};

const headerMapLower = (headers: HeaderPair[]) => {
  const map = new Map<string, string[]>();
  headers.forEach((header) => {
    const key = header.key.toLowerCase();
    if (!key) return;
    const list = map.get(key) || [];
    list.push(header.value || '');
    map.set(key, list);
  });
  return map;
};

const getHeaderValues = (map: Map<string, string[]>, name: string) => {
  return map.get(name.toLowerCase()) || [];
};

const getHeaderValue = (map: Map<string, string[]>, name: string) => {
  const values = getHeaderValues(map, name);
  return values.join(', ');
};

const extractDirectiveValue = (value: string, directive: string) => {
  const match = value.match(new RegExp(`${directive}\\s*=\\s*(\\d+)`, 'i'));
  if (!match) return null;
  return Number(match[1]);
};

const parseCsp = (value: string) => {
  const directives: Record<string, string[]> = {};
  value
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((directive) => {
      const [name, ...tokens] = directive.split(/\s+/);
      if (!name) return;
      directives[name.toLowerCase()] = tokens;
    });
  return directives;
};

const directiveHasToken = (
  directives: Record<string, string[]>,
  name: string,
  token: string,
) => {
  const values = directives[name.toLowerCase()] || [];
  return values.some((value) => value.toLowerCase() === token.toLowerCase());
};

const directiveHasWildcard = (
  directives: Record<string, string[]>,
  names: string[],
) => {
  return names.some((name) =>
    (directives[name.toLowerCase()] || []).some((token) => token === '*'),
  );
};

const parseSetCookie = (value: string) => {
  const parts = value.split(';').map((part) => part.trim());
  const [nameValue, ...attrs] = parts;
  const [name] = nameValue.split('=');
  const flags = new Set<string>();
  const attributes = new Map<string, string>();

  attrs.forEach((attr) => {
    if (!attr) return;
    const [rawKey, rawVal] = attr.split('=');
    const key = rawKey.toLowerCase();
    if (rawVal === undefined) {
      flags.add(key);
    } else {
      attributes.set(key, rawVal);
    }
  });

  return { name: name?.trim(), flags, attributes };
};
