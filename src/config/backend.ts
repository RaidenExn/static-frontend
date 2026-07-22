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
 * Normalizes an IP address, hostname, or full URL input into a canonical backend URL (e.g. "192.168.10.13" -> "https://192.168.10.13:8788")
 */
export function normalizeIpToBackendUrl(input: string, defaultPort: number = 8788): string {
  let cleaned = input.trim();
  if (!cleaned) return '';

  let protocol = 'https:';
  if (cleaned.startsWith('http://')) {
    protocol = 'http:';
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('https://')) {
    protocol = 'https:';
    cleaned = cleaned.slice(8);
  }

  cleaned = cleaned.split('/')[0];

  if (cleaned.includes(':')) {
    return `${protocol}//${cleaned}`;
  }

  return `${protocol}//${cleaned}:${defaultPort}`;
}

/**
 * Extracts a clean IP address or hostname from a stored backend URL for user-friendly UI display
 */
export function extractIpFromBackendUrl(urlStr: string | null): string {
  if (!urlStr) return '';
  try {
    const url = new URL(urlStr.includes('://') ? urlStr : `https://${urlStr}`);
    return url.hostname;
  } catch (_) {
    return urlStr
      .replace(/^https?:\/\//i, '')
      .split(':')[0]
      .split('/')[0]
      .trim();
  }
}

/**
 * Validates whether an input is a valid IPv4 address, hostname, or local address
 */
export function validateIpOrHost(input: string): boolean {
  const cleaned = extractIpFromBackendUrl(input.trim());
  if (!cleaned) return false;

  if (cleaned === 'localhost') return true;

  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  if (ipv4Regex.test(cleaned)) return true;

  const hostnameRegex = /^(?=[a-zA-Z0-9-]{1,63}\.)[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/;
  return hostnameRegex.test(cleaned);
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
