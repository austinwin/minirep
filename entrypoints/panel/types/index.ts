export type HeaderPair = {
  key: string;
  value: string;
};

export type NetworkEntry = {
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
  sequence?: number;
};

export type FilterMode = 'all' | 'xhr' | 'fetch' | 'errors' | 'assets';
export type RequestTabMode = 'pretty' | 'json' | 'runner';
export type ResponseTabMode = 'pretty' | 'json';

export type HeaderObject = Record<string, string | string[]>;
export type ParsedRequest = {
  method: string;
  url: string;
  headers: HeaderPair[];
  body: string;
  requestLine: string;
};
