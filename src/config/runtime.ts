export interface RuntimeConfig {
  backendUrl: string | null;
  connectionMethod: 'manual';
  discoveryPort: number;
}

export function getRuntimeConfig(): RuntimeConfig {
  const backendUrl = localStorage.getItem('lt-local-backend-url');
  return {
    backendUrl,
    connectionMethod: 'manual',
    discoveryPort: 8787,
  };
}

export function setBackendUrl(url: string | null): void {
  if (url) {
    localStorage.setItem('lt-local-backend-url', url);
  } else {
    localStorage.removeItem('lt-local-backend-url');
  }
}
