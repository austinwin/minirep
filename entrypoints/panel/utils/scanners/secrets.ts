// Secrets Scanner based on Kingfisher patterns
import { NetworkEntry } from '../../types';
import { MAX_SCAN_BODY_CHARS } from '../../constants';
import { GENERATED_PATTERNS, GeneratedRuleRequirements } from './generated_rules';
import type { SecretLintCoreConfig, SecretLintCoreResultMessage } from '@secretlint/types';

export interface SecretFinding {
  id: string;
  type: string;
  match: string;
  confidence: 'low' | 'medium' | 'high';
  file: string;
  index: number;
  passesRequirements?: boolean;
}

type SecretScanOptions = {
  strict?: boolean;
  useSecretLint?: boolean;
};

const SECRET_LINT_CONFIG_ID = '@secretlint/secretlint-rule-preset-recommend';
const MAX_SECRET_LINT_MATCH_CHARS = 200;
const MAX_HEADER_SCAN_CHARS = 20000;
const MAX_URL_SCAN_CHARS = 4000;

type SecretLintRuntime = {
  lintSource: typeof import('@secretlint/core').lintSource;
  presetCreator: typeof import('@secretlint/secretlint-rule-preset-recommend').creator;
};

let secretlintRuntimePromise: Promise<SecretLintRuntime> | null = null;
let secretlintConfigCache: SecretLintCoreConfig | null = null;

const loadSecretlintRuntime = async (): Promise<SecretLintRuntime> => {
  if (!secretlintRuntimePromise) {
    secretlintRuntimePromise = Promise.all([
      import('@secretlint/core'),
      import('@secretlint/secretlint-rule-preset-recommend'),
    ]).then(([core, preset]) => ({
      lintSource: core.lintSource,
      presetCreator: preset.creator,
    }));
  }
  return secretlintRuntimePromise;
};

const getSecretlintConfig = (
  presetCreator: SecretLintRuntime['presetCreator'],
): SecretLintCoreConfig => {
  if (!secretlintConfigCache) {
    secretlintConfigCache = {
      rules: [
        {
          id: SECRET_LINT_CONFIG_ID,
          rule: presetCreator,
          options: {},
        },
      ],
    };
  }
  return secretlintConfigCache;
};

export const scanForSecrets = async (
  requests: NetworkEntry[],
  options: SecretScanOptions = {},
): Promise<SecretFinding[]> => {
  const results: SecretFinding[] = [];
  const seen = new Set<string>();

  requests.forEach((req) => {
    /* 
       Scanning 350+ regexes against every header/body is heavy.
       Optimization: Concatenate all headers into one string to scan once per rule?
       No, we need the source for reporting.
    */

    // Check Request URL
    if (req.url) {
      checkContent(req.url, 'Request URL', req.url, results, seen, options);
    }

    // Check Request Headers
    req.requestHeaders.forEach(header => {
      checkContent(
        header.value,
        `Request Header: ${header.key}`,
        req.url,
        results,
        seen,
        options,
      );
    });

    // Check Request Body
    if (req.requestBody) {
      checkContent(
        req.requestBody,
        'Request Body',
        req.url,
        results,
        seen,
        options,
      );
    }

    // Check Response Headers
    req.responseHeaders.forEach(header => {
      checkContent(
        header.value,
        `Response Header: ${header.key}`,
        req.url,
        results,
        seen,
        options,
      );
    });

    // Check Response Body
    if (req.responseBody) {
        checkContent(
          req.responseBody,
          'Response Body',
          req.url,
          results,
          seen,
          options,
        );
    }
  });

  if (options.useSecretLint !== false) {
    await scanWithSecretlint(requests, results, seen);
  }

  return results;
};

const MAX_SCAN_CHARS = MAX_SCAN_BODY_CHARS;
const CHUNK_SIZE = 100000;
const CHUNK_OVERLAP = 200;

const checkContent = (
  content: string,
  source: string,
  url: string,
  results: SecretFinding[],
  seen: Set<string>,
  options: SecretScanOptions,
) => {
  if (!content || typeof content !== 'string') return;
  const maxLength = Math.min(content.length, MAX_SCAN_CHARS);
  if (!maxLength) return;

  if (maxLength <= CHUNK_SIZE) {
    scanChunk(content.slice(0, maxLength), source, url, results, seen, 0, options);
    return;
  }

  for (let start = 0; start < maxLength; start += CHUNK_SIZE - CHUNK_OVERLAP) {
    const end = Math.min(start + CHUNK_SIZE, maxLength);
    const chunk = content.slice(start, end);
    scanChunk(chunk, source, url, results, seen, start, options);
    if (end === maxLength) break;
  }
};

const scanWithSecretlint = async (
  requests: NetworkEntry[],
  results: SecretFinding[],
  seen: Set<string>,
) => {
  let runtime: SecretLintRuntime;
  try {
    runtime = await loadSecretlintRuntime();
  } catch {
    return;
  }

  const config = getSecretlintConfig(runtime.presetCreator);

  for (const request of requests) {
    const targets = buildSecretlintTargets(request);
    if (!targets.length) continue;

    for (const target of targets) {
      const content = trimContent(target.content, MAX_SCAN_BODY_CHARS);
      if (!content) continue;

      try {
        const lintResult = await runtime.lintSource({
          source: {
            content,
            filePath: target.filePath,
            ext: target.ext,
            contentType: 'text',
          },
          options: {
            config,
            locale: 'en',
            maskSecrets: false,
            noPhysicFilePath: true,
          },
        });

        if (!lintResult?.messages?.length) continue;

        lintResult.messages.forEach((message) => {
          const match =
            extractSecretlintMatch(content, message) || message.message;
          const type = formatSecretlintType(message.ruleId, message.messageId);
          const key = `secretlint:${type}:${match}:${target.filePath}`;

          if (seen.has(key)) return;
          seen.add(key);

          results.push({
            id: `secretlint-${Date.now()}-${results.length}`,
            type,
            match,
            confidence: severityToConfidence(message.severity),
            file: target.filePath,
            index: message.range?.[0] ?? 0,
          });
        });
      } catch {
        // Ignore secretlint errors to keep scanning resilient.
      }
    }
  }
};

const buildSecretlintTargets = (request: NetworkEntry) => {
  const targets: Array<{
    content: string;
    ext: string;
    filePath: string;
  }> = [];
  const filePath = request.url || 'network-entry';

  const responseHeaders = formatHeaders(
    request.responseHeaders,
    MAX_HEADER_SCAN_CHARS,
  );
  const requestHeaders = formatHeaders(
    request.requestHeaders,
    MAX_HEADER_SCAN_CHARS,
  );

  const responseBody = trimContent(
    request.responseBody,
    MAX_SCAN_BODY_CHARS,
  );
  const requestBody = trimContent(
    request.requestBody,
    MAX_SCAN_BODY_CHARS,
  );

  if (responseBody) {
    targets.push({
      content: responseBody,
      ext: guessExtension(request, 'response'),
      filePath,
    });
  }
  if (requestBody) {
    targets.push({
      content: requestBody,
      ext: guessExtension(request, 'request'),
      filePath,
    });
  }
  if (responseHeaders) {
    targets.push({ content: responseHeaders, ext: '.txt', filePath });
  }
  if (requestHeaders) {
    targets.push({ content: requestHeaders, ext: '.txt', filePath });
  }
  if (request.url) {
    targets.push({
      content: request.url.slice(0, MAX_URL_SCAN_CHARS),
      ext: '.txt',
      filePath,
    });
  }

  return targets;
};

const formatHeaders = (headers: NetworkEntry['requestHeaders'], limit: number) => {
  if (!headers?.length) return '';
  const joined = headers.map((header) => `${header.key}: ${header.value}`).join('\n');
  return joined.length > limit ? joined.slice(0, limit) : joined;
};

const trimContent = (value?: string, limit = MAX_SCAN_BODY_CHARS) => {
  if (!value || typeof value !== 'string') return '';
  return value.length > limit ? value.slice(0, limit) : value;
};

const guessExtension = (request: NetworkEntry, scope: 'request' | 'response') => {
  const headerValue =
    scope === 'response'
      ? getHeaderValue(request.responseHeaders, 'content-type') ||
        request.mimeType ||
        ''
      : getHeaderValue(request.requestHeaders, 'content-type') || '';
  const mimeType = headerValue.split(';')[0]?.trim().toLowerCase();
  const urlExt = extractExtensionFromUrl(request.url || '');
  const ext =
    urlExt ||
    mimeTypeToExtension(mimeType || '') ||
    '.txt';
  return normalizeExtension(ext);
};

const extractExtensionFromUrl = (url: string) => {
  if (!url) return '';
  const base = url.split('?')[0]?.split('#')[0] || url;
  const match = base.match(/\.([a-z0-9]{1,6})$/i);
  return match ? `.${match[1].toLowerCase()}` : '';
};

const mimeTypeToExtension = (mimeType: string) => {
  if (!mimeType) return '';
  if (mimeType.includes('json')) return '.json';
  if (mimeType.includes('javascript')) return '.js';
  if (mimeType.includes('xml')) return '.xml';
  if (mimeType.includes('html')) return '.html';
  if (mimeType.includes('css')) return '.css';
  if (mimeType.includes('text/')) return '.txt';
  return '';
};

const normalizeExtension = (ext: string) => {
  if (!ext) return '.txt';
  const lowered = ext.startsWith('.') ? ext.toLowerCase() : `.${ext.toLowerCase()}`;
  if (lowered === '.p12' || lowered === '.pfx') return '.bin';
  return lowered;
};

const getHeaderValue = (headers: NetworkEntry['requestHeaders'], key: string) => {
  if (!headers?.length) return '';
  const normalized = key.toLowerCase();
  const found = headers.find(
    (header) => header.key.toLowerCase() === normalized,
  );
  return found?.value || '';
};

const severityToConfidence = (severity: SecretLintCoreResultMessage['severity']) => {
  if (severity === 'error') return 'high';
  if (severity === 'warning') return 'medium';
  return 'low';
};

const formatSecretlintType = (ruleId: string, messageId?: string) => {
  const shortRule = ruleId
    .replace(/^@secretlint\//, '')
    .replace(/^secretlint-rule-/, '');
  return messageId ? `SecretLint ${shortRule} (${messageId})` : `SecretLint ${shortRule}`;
};

const extractSecretlintMatch = (
  content: string,
  message: SecretLintCoreResultMessage,
) => {
  if (!content) return '';
  const range = message.range;
  if (!Array.isArray(range) || range.length < 2) return '';
  const start = Math.max(0, Math.min(range[0], content.length));
  const end = Math.max(start, Math.min(range[1], content.length));
  if (end <= start) return '';
  let match = content.slice(start, end);
  match = match.replace(/\s+/g, ' ').trim();
  if (!match) return '';
  if (match.length <= MAX_SECRET_LINT_MATCH_CHARS) return match;
  const head = match.slice(0, 120);
  const tail = match.slice(-60);
  return `${head}...${tail}`;
};

const scanChunk = (
  content: string,
  source: string,
  url: string,
  results: SecretFinding[],
  seen: Set<string>,
  offset: number,
  options: SecretScanOptions,
) => {
  GENERATED_PATTERNS.forEach((pattern) => {
    let match;
    const regex = new RegExp(pattern.regex);
    let limit = 0;

    try {
      while ((match = regex.exec(content)) !== null) {
        limit++;
        if (limit > 50) break;

        let secret = match[0];
        if (match[1]) {
          secret = match[1];
        }

        const key = `${pattern.name}:${secret}:${url}`;
        const passesRequirements = meetsRequirements(
          secret,
          pattern.requirements,
        );
        if (options.strict && !passesRequirements) continue;

        if (!seen.has(key)) {
          seen.add(key);
          results.push({
            id: `secret-${Date.now()}-${results.length}`,
            type: pattern.name,
            match: secret,
            confidence: pattern.confidence,
            file: url,
            index: match.index + offset,
            passesRequirements,
          });
        }
      }
    } catch (e) {}
  });
};

const meetsRequirements = (
  value: string,
  requirements?: GeneratedRuleRequirements,
) => {
  if (!requirements) return true;
  if (!value) return false;

  const length = value.length;
  if (requirements.min_length && length < requirements.min_length) return false;
  if (requirements.max_length && length > requirements.max_length) return false;

  let digits = 0;
  let lower = 0;
  let upper = 0;
  let symbols = 0;

  for (const char of value) {
    if (char >= '0' && char <= '9') {
      digits += 1;
    } else if (char >= 'a' && char <= 'z') {
      lower += 1;
    } else if (char >= 'A' && char <= 'Z') {
      upper += 1;
    } else {
      symbols += 1;
    }
  }

  if (requirements.min_digits && digits < requirements.min_digits) return false;
  if (requirements.min_lowercase && lower < requirements.min_lowercase) return false;
  if (requirements.min_uppercase && upper < requirements.min_uppercase) return false;
  if (requirements.min_symbols && symbols < requirements.min_symbols) return false;

  if (requirements.min_entropy) {
    const entropy = shannonEntropy(value);
    if (entropy < requirements.min_entropy) return false;
  }

  return true;
};

const shannonEntropy = (value: string) => {
  if (!value.length) return 0;
  const frequency: Record<string, number> = {};
  for (const char of value) {
    frequency[char] = (frequency[char] || 0) + 1;
  }
  const length = value.length;
  let entropy = 0;
  Object.values(frequency).forEach((count) => {
    const p = count / length;
    entropy -= p * Math.log2(p);
  });
  return entropy;
};
