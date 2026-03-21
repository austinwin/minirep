export const MAX_ITEMS = 300;
export const MAX_BODY_CHARS = 20000;
export const MAX_SCAN_BODY_CHARS = 300000;
export const RESIZER_WIDTH = 8;
export const COLUMN_GAP = 8;
export const MIN_COL_1 = 240;
export const MIN_COL_2 = 320;
export const MIN_COL_3 = 320;

export const METHOD_OPTIONS = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS',
];

export const HEADER_NAME_REGEX = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;
export const FORBIDDEN_HEADERS = new Set([
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

export const ASSET_TYPES = new Set(['stylesheet', 'image', 'font', 'script', 'media']);
export const ASSET_EXTENSIONS = [
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
