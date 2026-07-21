import { getRuntimeConfig } from './runtime';

/**
 * Validates whether a given string is a valid backend URL format
 */
export function validateBackendUrl(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

/**
 * Explicitly resolves a relative API endpoint path to the configured backend URL
 */
export function resolveApiUrl(path: string): string {
  const config = getRuntimeConfig();
  if (!config.backendUrl) return path;
  
  const base = config.backendUrl.endsWith('/') ? config.backendUrl.slice(0, -1) : config.backendUrl;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

/**
 * Explicitly maps and resolves a WebSocket endpoint path to the configured backend URL and correct scheme (ws/wss)
 */
export function resolveWsUrl(path: string): string {
  const config = getRuntimeConfig();
  if (!config.backendUrl) return path;
  
  try {
    const parsed = new URL(config.backendUrl);
    const wsProto = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${wsProto}//${parsed.host}${cleanPath}`;
  } catch (_) {
    return path;
  }
}

/**
 * Clean and explicit fetch wrapper to resolve relative /api/ endpoints to backend Url at runtime.
 */
export function customFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  
  const originPrefix = typeof window !== 'undefined' ? window.location.origin : '';
  if (url.startsWith('/api/')) {
    url = resolveApiUrl(url);
  } else if (originPrefix && url.startsWith(`${originPrefix}/api/`)) {
    const path = url.slice(originPrefix.length);
    url = resolveApiUrl(path);
  }

  if (typeof input === 'string' || input instanceof URL) {
    return fetch(url, init);
  } else {
    return fetch(new Request(url, input), init);
  }
}
