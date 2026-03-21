import { parse } from 'acorn';
import { NetworkEntry } from '../../types';
import { ASSET_EXTENSIONS } from '../../constants';
import { parseUrlParts } from '../index';

export interface EndpointFinding {
  id: string;
  path: string;
  method?: string;
  source: string;
  sourceUrl?: string;
  confidence?: 'low' | 'medium' | 'high';
}

type EndpointScanOptions = {
  enableAst?: boolean;
};

// Enhanced patterns from reference
const ENDPOINT_PATTERNS = {
  apiPath: /["'`](\/api\/[a-zA-Z0-9_\-\/{}:]+)["'`]/g,
  versionedPath: /["'`](\/v\d+\/[a-zA-Z0-9_\-\/{}:]+)["'`]/g,
  fullUrl: /["'`](https?:\/\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]+)["'`]/g,
  relativePath: /["'`](\/[a-zA-Z0-9_\-]+(?:\/[a-zA-Z0-9_\-{}:]+)+)["'`]/g,
  graphqlPath: /["'`](\/graphql|\/gql)["'`]/gi,
  fetchCall: /(?:fetch|axios)\s*\(\s*["'`]([^"'`]+)["'`]/g,
  axiosMethod: /axios\.(get|post|put|patch|delete|head|options)\s*\(\s*["'`]([^"'`]+)["'`]/gi,
  templateUrl: /`([^`]*(?:https?:\/\/|\/api\/|\/v\d+\/)[^`]*)`/g,
  restEndpoint: /["'`](\/(?:users|auth|login|logout|register|profile|settings|posts|comments|products|orders|payments|upload|download|search|items|entities|resources)(?:\/[a-zA-Z0-9_\-{}:]*)?(?:\/[a-zA-Z0-9_\-{}:]+)*)["'`]/g,
};

const HTTP_METHODS = new Set([
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'head',
  'options',
]);

const MAX_JS_PARSE_CHARS = 400000;

export const scanForEndpoints = (
  requests: NetworkEntry[],
  options: EndpointScanOptions = { enableAst: true },
): EndpointFinding[] => {
  const results: EndpointFinding[] = [];
  const seen = new Set<string>();

  const addEndpoint = (
    path: string,
    sourceUrl: string,
    method?: string,
    confidence: 'low' | 'medium' | 'high' = 'low',
    context?: string
  ) => {
    // If context is provided, we can improve the method and confidence estimate
    if (context && !method) {
      method = extractMethod(context, path);
    }
    if (context && !confidence) {
       confidence = calculateConfidence(path, method, context);
    } else if (context && confidence) {
       // Re-verify confidence with context
       const calcConf = calculateConfidence(path, method, context);
       if (confidenceScore(calcConf) > confidenceScore(confidence)) {
           confidence = calcConf;
       }
    }

    const normalizedPath = normalizePath(path);
    if (!normalizedPath) return;

    // Filter using robust logic
    if (!isValidEndpoint(normalizedPath)) return;

    const key = `${method ?? 'GET'}:${normalizedPath}`;
    if (seen.has(key)) return;
    seen.add(key);

    const sourceLabel = formatSource(sourceUrl);
    results.push({
      id: `endpoint-${results.length}`,
      path: normalizedPath,
      method,
      confidence,
      source: sourceLabel,
      sourceUrl,
    });
  };

  const processContent = (
    content: string,
    sourceUrl: string,
    isScript: boolean,
  ) => {
    if (!content) return;

    // 1. AST Parsing (High Accuracy)
    if (options.enableAst && isScript) {
      extractEndpointsFromAst(content, sourceUrl, addEndpoint);
    }

    // 2. Regex Pattern Matching (Broad Coverage)
    // Using the enhanced patterns from endpoints.js
    for (const [patternName, pattern] of Object.entries(ENDPOINT_PATTERNS)) {
        let match;
        // Reset lastIndex for global regexes
        const regex = new RegExp(pattern.source, pattern.flags);
        
        while ((match = regex.exec(content)) !== null) {
            const rawEndpoint = match[1] || match[2];
            if (!rawEndpoint) continue;

            const index = match.index;
            const contextStart = Math.max(0, index - 100);
            const contextEnd = Math.min(content.length, index + 100);
            const context = content.slice(contextStart, contextEnd);

            let derivedMethod = undefined;
            if (patternName === 'axiosMethod') {
                derivedMethod = match[1].toUpperCase();
            }

            // Estimate confidence based on which pattern matched
            let baseConfidence: 'low' | 'medium' | 'high' = 'low';
            if (patternName === 'apiPath' || patternName === 'versionedPath' || patternName === 'graphqlPath') {
                baseConfidence = 'high';
            } else if (patternName === 'fetchCall' || patternName === 'axiosMethod' || patternName === 'restEndpoint') {
                baseConfidence = 'medium';
            }

            // Refine confidence with calculation
            const calculatedConfidence = calculateConfidence(rawEndpoint, derivedMethod, context);

            // Use the higher of the two
            const finalConfidence = confidenceScore(calculatedConfidence) > confidenceScore(baseConfidence) 
                ? calculatedConfidence 
                : baseConfidence;

            addEndpoint(rawEndpoint, sourceUrl, derivedMethod, finalConfidence, context);
        }
    }
  };

  requests.forEach(req => {
      // 1. Add the request URL itself
      try {
        const url = new URL(req.url);
        const path = url.pathname + url.search;
        if (path !== '/' && isValidEndpoint(path)) {
          addEndpoint(path, req.url, req.method, 'high');
        }
      } catch (e) {}

      // 2. Scan bodies
      if (req.responseBody) {
        processContent(req.responseBody, req.url, isScriptEntry(req));
      }
      if (req.requestBody) {
        processContent(req.requestBody, req.url, false);
      }
  });

  return results.sort((a, b) => {
    return confidenceScore(b.confidence) - confidenceScore(a.confidence);
  });
};

const confidenceScore = (level?: string) => {
    if (level === 'high') return 3;
    if (level === 'medium') return 2;
    if (level === 'low') return 1;
    return 0;
};

const isScriptEntry = (entry: NetworkEntry) => {
  if (entry.resourceType === 'script') return true;
  if (entry.mimeType?.includes('javascript')) return true;
  return /\.(mjs|cjs|js)(\?|#|$)/i.test(entry.url);
};

// Adapted from endpoints.js
const isValidEndpoint = (endpoint: string) => {
    if (endpoint.length < 3) return false;

    // Filter out common analytics and tracking
    if (endpoint.startsWith('/g/collect') || endpoint.includes('google-analytics') || endpoint.includes('doubleclick')) return false;

    const falsePositives = [
        '//', '/\\"', '/\\', '/node_modules/', '/webpack/', '/dist/', '/build/', 
        '/__', '/static/', '/public/', '/images/', '/fonts/', '/styles/', '/scripts/',
        'text/html'
    ];

    for (const fp of falsePositives) {
        if (endpoint.includes(fp)) return false;
    }

    if (!endpoint.startsWith('/') && !endpoint.startsWith('http')) return false;

    // Asset extensions
    const [pathname] = endpoint.split('?');
    if (ASSET_EXTENSIONS.some(ext => pathname.toLowerCase().endsWith(ext))) return false;

    return true;
};

const extractMethod = (context: string, endpoint: string) => {
    // Check for axios method calls
    const axiosMatch = context.match(/axios\.(get|post|put|patch|delete|head|options)/i);
    if (axiosMatch) {
        return axiosMatch[1].toUpperCase();
    }

    // Check for fetch with method option
    const fetchMethodMatch = context.match(/method\s*:\s*["'`](GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)["'`]/i);
    if (fetchMethodMatch) {
        return fetchMethodMatch[1].toUpperCase();
    }

    // Check for explicit method mentions
    for (const method of HTTP_METHODS) {
        const methodRegex = new RegExp(`["'\`]${method}["'\`]`, 'i');
        if (methodRegex.test(context)) {
            return method.toUpperCase();
        }
    }

    // Heuristics
    if (endpoint.includes('/login') || endpoint.includes('/register') || endpoint.includes('/upload') || endpoint.includes('/create')) {
        return 'POST';
    }
    if (endpoint.includes('/update') || endpoint.includes('/edit')) {
        return 'PUT';
    }
    if (endpoint.includes('/delete') || endpoint.includes('/remove')) {
        return 'DELETE';
    }

    return undefined;
};

const calculateConfidence = (endpoint: string, method: string | undefined, context: string): 'low' | 'medium' | 'high' => {
    let score = 50;

    // Boosts
    if (endpoint.startsWith('/api/')) score += 30;
    if (endpoint.startsWith('/v1/') || endpoint.startsWith('/v2/')) score += 25;
    if (endpoint === '/graphql' || endpoint === '/gql') score += 30;
    if (method && method !== 'GET') score += 15;
    if (endpoint.includes('{') || endpoint.includes(':')) score += 10; // Params
    if (/\/(users|auth|login|posts|products|orders)/.test(endpoint)) score += 15;
    if (endpoint.startsWith('http')) score += 20;

    // Penalties
    if (endpoint.length < 4) score -= 20;
    if (!endpoint.includes('/')) score -= 15;

    if (score >= 75) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
};

const normalizePath = (path: string) => {
  if (!path) return '';
  let clean = path.trim();
  // Remove quotes if present
  clean = clean.replace(/^["'`]|["'`]$/g, '');
  
  if (!clean) return '';

  if (clean.includes('${')) {
    clean = clean.replace(/\$\{[^}]+\}/g, ':param');
  }

  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    try {
      const url = new URL(clean);
      clean = url.pathname + url.search;
    } catch {
      return '';
    }
  }

  if (!clean.startsWith('/')) return '';
  
  return clean;
};

const formatSource = (sourceUrl: string) => {
  if (!sourceUrl) return 'Unknown';
  try {
    const { path } = parseUrlParts(sourceUrl);
    const name = path.split('/').pop();
    return name || sourceUrl;
  } catch {
    return sourceUrl;
  }
};

const extractEndpointsFromAst = (
  content: string,
  sourceUrl: string,
  addEndpoint: (
    path: string,
    sourceUrl: string,
    method?: string,
    confidence?: 'low' | 'medium' | 'high',
  ) => void,
) => {
  if (content.length > MAX_JS_PARSE_CHARS) return;

  let ast: any;
  try {
    ast = parse(content, {
      ecmaVersion: 'latest',
      sourceType: 'module',
      allowHashBang: true,
    });
  } catch {
    try {
      ast = parse(content, {
        ecmaVersion: 'latest',
        sourceType: 'script',
        allowHashBang: true,
      });
    } catch {
      return;
    }
  }

  walkAst(ast, (node: any) => {
    if (node.type === 'CallExpression') {
      const callee = node.callee;
      const args = node.arguments ?? [];

      if (isIdentifier(callee, 'fetch')) {
        const url = resolveString(args[0]);
        const method = getMethodFromOptions(args[1]);
        if (url) addEndpoint(url, sourceUrl, method, method ? 'high' : 'medium');
        return;
      }

      if (callee.type === 'MemberExpression') {
        const methodName = getPropertyName(callee.property);
        const url = resolveString(args[0]);
        if (!methodName || !url) return;

        if (isIdentifier(callee.object, 'axios')) {
          addEndpoint(url, sourceUrl, methodName.toUpperCase(), 'high');
          return;
        }

        if (HTTP_METHODS.has(methodName)) {
          addEndpoint(url, sourceUrl, methodName.toUpperCase(), 'medium');
        }
      }

      if (isIdentifier(callee, 'axios')) {
        const config = args[0];
        if (config?.type === 'ObjectExpression') {
          const url = getObjectStringProperty(config, 'url');
          if (!url) return;
          const method = getObjectStringProperty(config, 'method');
          addEndpoint(url, sourceUrl, method?.toUpperCase(), method ? 'high' : 'medium');
        }
      }
    }

    if (node.type === 'NewExpression') {
      const callee = node.callee;
      const args = node.arguments ?? [];
      if (isIdentifier(callee, 'URL')) {
        const url = resolveString(args[0]);
        if (url) addEndpoint(url, sourceUrl, undefined, 'medium');
        return;
      }
      if (isIdentifier(callee, 'Request')) {
        const url = resolveString(args[0]);
        const method = getMethodFromOptions(args[1]);
        if (url) addEndpoint(url, sourceUrl, method, method ? 'high' : 'medium');
      }
    }
  });
};

const walkAst = (root: any, visit: (node: any) => void) => {
  const stack = [root];
  const seen = new Set<any>();

  while (stack.length) {
    const node = stack.pop();
    if (!node || typeof node !== 'object') continue;
    if (seen.has(node)) continue;
    seen.add(node);

    visit(node);

    for (const value of Object.values(node)) {
      if (Array.isArray(value)) {
        value.forEach((child) => {
          if (child && typeof child === 'object' && 'type' in child) {
            stack.push(child);
          }
        });
      } else if (value && typeof value === 'object' && 'type' in value) {
        stack.push(value);
      }
    }
  }
};

const isIdentifier = (node: any, name: string) =>
  node?.type === 'Identifier' && node.name === name;

const getPropertyName = (node: any) => {
  if (!node) return null;
  if (node.type === 'Identifier') return node.name;
  if (node.type === 'Literal') return String(node.value);
  return null;
};

const resolveString = (node: any): string | null => {
  if (!node) return null;
  if (node.type === 'Literal' && typeof node.value === 'string') {
    return node.value;
  }
  if (node.type === 'TemplateLiteral') {
    const parts = node.quasis ?? [];
    const out: string[] = [];
    parts.forEach((part: any, index: number) => {
      out.push(part.value?.cooked ?? '');
      if (node.expressions?.[index]) out.push(':param');
    });
    return out.join('');
  }
  if (node.type === 'BinaryExpression' && node.operator === '+') {
    const left = resolveString(node.left);
    const right = resolveString(node.right);
    if (left && right) return `${left}${right}`;
  }
  return null;
};

const getObjectStringProperty = (node: any, key: string) => {
  if (!node || node.type !== 'ObjectExpression') return null;
  for (const prop of node.properties ?? []) {
    const propKey = getPropertyName(prop.key);
    if (propKey !== key) continue;
    return resolveString(prop.value);
  }
  return null;
};

const getMethodFromOptions = (node: any) => {
  const value = getObjectStringProperty(node, 'method');
  return value?.toUpperCase();
};
