import { NetworkEntry } from '../../types';

export interface ParameterFinding {
    id: string;
    key: string;
    value?: string;
    source: string; // 'query' | 'body' | 'path' | 'header'
    url: string;
    risk?: 'low' | 'medium' | 'high';
    confidence?: number;
}

// Risk patterns from reference
const HIGH_RISK_PATTERNS = {
    auth: /^(password|pwd|pass|passwd|token|api[_-]?key|secret|auth|accessToken|access_token|session|sessionId|session_id|secretKey|secret_key)$/i,
    access: /^(role|roles|userRole|user_role|permission|permissions|access|accessLevel|admin|isAdmin|is_admin|adminRole|privilege|privileges)$/i,
    flags: /^(debug|debugMode|debug_mode|isDebug|test|testMode|testing|bypass|bypassAuth|skipValidation)$/i,
    idor: /^(id|userId|user_id|userID|uid|ownerId|owner_id|creator|creatorId|recordId|record_id)$/i,
    features: /^(feature|features|featureFlag|feature_flag|enabled|disabled|active|inactive|status|state)$/i
};

// Suppression patterns (false positives)
const SUPPRESSION_PATTERNS = {
    buildTools: /(webpack|chunk|bundle|module|__webpack|__dirname|__filename)/i,
    frameworks: /^(react|vue|angular|component|props|state|redux|store|dispatch|action)$/i,
    libraries: /^(jquery|\$|lodash|_|axios|fetch|xhr|request)$/i,
    domEvents: /^(event|target|currentTarget|preventDefault|key|keyCode|which|button|click)$/i,
    generic: /^(data|obj|item|value|result|response|config|options|settings|params)$/i,
    singleChar: /^[a-z]$/i,
    filePaths: /(node_modules|dist|build|static|\.js|\.css|\.png|\.jpg|\.jpeg|\.gif|\.svg|\.ico|\.woff|\.ttf|\.eot)/i,
    commonParams: /^(page|limit|offset|sort|order|filter|search|q|query)$/i,
    telemetry: /^(visitId|analytics|trace|metric|hcaptchaToken|x-sentry-.*)$/i,
    standardHeaders: /^(content-type|accept|user-agent|accept-language|accept-encoding|connection|cache-control|host|origin|referer|referrer)$/i,
    genericWrapper: /^(index|data|value|prefill|members)$/i
};

const TYPE_HINTS = {
    userId: /^(userId|user_id|userID|uid)$/i,
    email: /^(email|emailAddress|email_address)$/i,
    token: /^(token|apiKey|api_key|apikey|accessToken|access_token)$/i,
    password: /^(password|pwd|pass|passwd)$/i,
    id: /^(id|.*Id|.*_id|.*ID)$/i
};

export const scanForParameters = (requests: NetworkEntry[]): ParameterFinding[] => {
    const results: ParameterFinding[] = [];
    const seen = new Set<string>();

    const addParam = (key: string, value: string | undefined, source: string, url: string, isStatic = false, context?: string) => {
        // Validation/Suppression
        if (shouldSuppress(key, context, isStatic)) return;

        const id = `param-${key}-${source}`;
        if (seen.has(id)) return;
        seen.add(id);

        const risk = getRiskLevel(key);
        // Calculate confidence
        let confidence = 50;
        if (risk === 'high') confidence += 40;
        if (value) confidence += 20;
        if (source === 'body' || source === 'query') confidence += 10;
        if (isStatic) confidence -= 10; // Static analysis is less certain

        results.push({
            id: `p-${results.length}`,
            key,
            value,
            source,
            url,
            risk,
            confidence: Math.min(100, Math.max(0, confidence))
        });
    };

    requests.forEach(req => {
        // 1. Runtime Query Parameters
        try {
            const url = new URL(req.url);
            url.searchParams.forEach((value, key) => {
                 addParam(key, value, 'query', req.url);
            });
        } catch (e) {}

        // 2. Runtime Body Parameters
        if (req.requestBody && (req.requestBody.startsWith('{') || req.requestBody.startsWith('['))) {
             try {
                const body = JSON.parse(req.requestBody);
                scanObject(body, 'body', req.url, addParam);
             } catch (e) {}
        }

        // 3. Static Analysis of JS files
        if (isScriptEntry(req) && req.responseBody) {
             const staticParams = extractParameters(req.responseBody, req.url);
             staticParams.forEach(p => {
                 addParam(p.name, undefined, p.location, req.url, true, p.context);
             });
        }
    });

    return results.sort((a, b) => {
        const riskScore = (r?: string) => r === 'high' ? 3 : r === 'medium' ? 2 : 1;
        return riskScore(b.risk) - riskScore(a.risk) || (b.confidence || 0) - (a.confidence || 0);
    });
};

const scanObject = (obj: any, source: string, url: string, addParam: any, depth=0) => {
    if (depth > 5) return;
    if (!obj || typeof obj !== 'object') return;

    if (Array.isArray(obj)) {
        obj.forEach(item => scanObject(item, source, url, addParam, depth+1));
        return;
    }

    Object.keys(obj).forEach(key => {
        const val = obj[key];
        const strVal = typeof val === 'object' ? '[object]' : String(val);
        addParam(key, strVal, source, url);
        
        if (typeof val === 'object') {
            scanObject(val, source, url, addParam, depth+1);
        }
    });
};

const isScriptEntry = (entry: NetworkEntry) => {
  if (entry.resourceType === 'script') return true;
  if (entry.mimeType?.includes('javascript')) return true;
  return /\.(mjs|cjs|js)(\?|#|$)/i.test(entry.url);
};

// --- Static Analysis Helpers (from parameters.js) ---

function isHighRiskParameter(paramName: string) {
    for (const pattern of Object.values(HIGH_RISK_PATTERNS)) {
        if (pattern.test(paramName)) return true;
    }
    return false;
}

function getRiskLevel(paramName: string): 'high' | 'medium' | 'low' {
    if (HIGH_RISK_PATTERNS.auth.test(paramName) || 
        HIGH_RISK_PATTERNS.access.test(paramName) || 
        HIGH_RISK_PATTERNS.flags.test(paramName)) {
        return 'high';
    }
    if (HIGH_RISK_PATTERNS.idor.test(paramName) || 
        HIGH_RISK_PATTERNS.features.test(paramName)) {
        return 'medium';
    }
    return 'low';
}

function shouldSuppress(paramName: string, context?: string, isStatic?: boolean) {
    for (const pattern of Object.values(SUPPRESSION_PATTERNS)) {
        if (pattern.test(paramName)) return true;
    }
    if (paramName.length < 2) return true;
    if (isStatic && context && referencesComplexObjects(context)) return true;
    return false;
}

function referencesComplexObjects(context: string) {
    const ctx = context.toLowerCase();
    return ctx.includes('document.') || ctx.includes('window.') || 
           ctx.includes('event.') || ctx.includes('function(');
}

// Simplified static extraction
function extractParameters(content: string, sourceUrl: string) {
    const params: {name: string; location: string; context: string}[] = [];
    const seen = new Set<string>();

    // 1. URL search params in strings
    const queryPattern = /["'`]([^"'`]*\?([a-zA-Z_][a-zA-Z0-9_-]{1,49})=[^"'`&]*)["'`]/g;
    let match;
    while ((match = queryPattern.exec(content)) !== null) {
        const queryString = match[1];
        const paramMatches = queryString.match(/([a-zA-Z_][a-zA-Z0-9_-]{1,49})=/g);
        if (paramMatches) {
             paramMatches.forEach(pm => {
                 const name = pm.slice(0, -1);
                 if (!seen.has(name)) {
                     seen.add(name);
                     params.push({ name, location: 'query', context: match![0] });
                 }
             });
        }
    }

    // 2. JSON keys in stringified objects
    const jsonPattern = /JSON\.stringify\s*\(\s*\{([^}]+)\}/g;
    while ((match = jsonPattern.exec(content)) !== null) {
        const bodyObj = match[1];
        const paramMatches = bodyObj.match(/([a-zA-Z_$][a-zA-Z0-9_$-]{1,49})\s*:/g);
        if (paramMatches) {
            paramMatches.forEach(pm => {
                const name = pm.slice(0, -1);
                if (!seen.has(name)) {
                     seen.add(name);
                     params.push({ name, location: 'body', context: match![0] });
                }
            });
        }
    }

    // 3. Common object property patterns in API calls (heuristics)
    // Looking for { key: val } inside fetch/axios calls is hard with regex, 
    // but we can look for "safe" keys prone to appear in payloads
    const payloadPattern = /["'](email|password|token|user_id|id|role)["']\s*:/g;
    while ((match = payloadPattern.exec(content)) !== null) {
        const name = match[1];
        if (!seen.has(name)) {
             seen.add(name);
             params.push({ name, location: 'body', context: content.slice(Math.max(0, match.index-20), Math.min(content.length, match.index+50)) });
        }
    }

    return params;
}
