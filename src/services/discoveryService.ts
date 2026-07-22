export interface DiscoveredServer {
  ip: string;
  url: string;
  lastSeen: string;
}

export interface DiscoveryConfig {
  defaultSubnet: string;
  startRange: number;
  endRange: number;
  discoveryPort: number;
  discoveryPath: string;
  appPort: number;
  scanTimeoutMs: number;
  pingTimeoutMs: number;
}

export const LT_DISCOVERY_CONFIG: DiscoveryConfig = {
  defaultSubnet: '192.168.10',
  startRange: 1,
  endRange: 254,
  discoveryPort: 8787,
  discoveryPath: '/lt-local/ping',
  appPort: 8788,
  scanTimeoutMs: 1000,
  pingTimeoutMs: 1200
};

export const FOUND_SERVERS_KEY = 'lt-local-found-servers';
export const AUTOSCAN_KEY = 'lt-local-autoscan';

export function generateSubnetHosts(subnetPrefix: string, start = 1, end = 254): string[] {
  const prefix = subnetPrefix.trim().replace(/\.$/, '');
  const hosts: string[] = [];
  for (let i = start; i <= end; i++) {
    hosts.push(`${prefix}.${i}`);
  }
  return hosts;
}

export async function pingServer(
  ip: string,
  timeoutMs = LT_DISCOVERY_CONFIG.pingTimeoutMs,
  signal?: AbortSignal
): Promise<DiscoveredServer | null> {
  const { discoveryPort, discoveryPath, appPort } = LT_DISCOVERY_CONFIG;
  const pingUrl = `http://${ip}:${discoveryPort}${discoveryPath}`;
  const controller = new AbortController();

  const timer = setTimeout(() => controller.abort(), timeoutMs);
  if (signal) {
    signal.addEventListener('abort', () => controller.abort());
  }

  try {
    const res = await fetch(pingUrl, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      signal: controller.signal
    });
    clearTimeout(timer);

    if (res.ok) {
      const text = await res.text();
      if (text.includes('LT_LOCAL_OK') || text.includes('OK')) {
        return {
          ip,
          url: `https://${ip}:${appPort}`,
          lastSeen: 'now'
        };
      }
    }
  } catch (_) {
    clearTimeout(timer);
  }
  return null;
}

export function scanNetwork(
  subnetPrefix: string,
  onProgress: (currentIp: string, checkedCount: number, total: number) => void,
  onFound: (server: DiscoveredServer) => void,
  onComplete: (servers: DiscoveredServer[]) => void
): { abort: () => void } {
  const ips = generateSubnetHosts(subnetPrefix);
  let checkedCount = 0;
  const foundServers: DiscoveredServer[] = [];
  let stopped = false;
  const controllers: AbortController[] = [];

  const scanIp = async (ip: string) => {
    if (stopped) return;
    const controller = new AbortController();
    controllers.push(controller);

    const server = await pingServer(ip, LT_DISCOVERY_CONFIG.scanTimeoutMs, controller.signal);

    if (!stopped) {
      checkedCount++;
      if (server) {
        foundServers.push(server);
        onFound(server);
      }
      onProgress(ip, checkedCount, ips.length);
    }
  };

  const startScan = async () => {
    const promises = ips.map((ip) => scanIp(ip));
    await Promise.all(promises);
    if (!stopped) {
      onComplete(foundServers);
    }
  };

  startScan();

  return {
    abort: () => {
      stopped = true;
      controllers.forEach((ctrl) => {
        try {
          ctrl.abort();
        } catch (_) {}
      });
    }
  };
}

export async function validateCachedServers(
  cachedServers: DiscoveredServer[]
): Promise<DiscoveredServer[]> {
  const validated: DiscoveredServer[] = [];
  const pingPromises = cachedServers.map(async (srv) => {
    const active = await pingServer(srv.ip, LT_DISCOVERY_CONFIG.pingTimeoutMs);
    if (active) {
      validated.push({ ...srv, lastSeen: 'now' });
    }
  });
  await Promise.all(pingPromises);
  return validated;
}

export function getCachedDiscoveredServers(): DiscoveredServer[] {
  try {
    const raw = localStorage.getItem(FOUND_SERVERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (_) {}
  return [];
}

export function saveDiscoveredServersCache(servers: DiscoveredServer[]): void {
  try {
    localStorage.setItem(FOUND_SERVERS_KEY, JSON.stringify(servers));
  } catch (_) {}
}

export function addDiscoveredServerToCache(server: DiscoveredServer): void {
  const current = getCachedDiscoveredServers();
  const filtered = current.filter((s) => s.ip !== server.ip);
  filtered.push(server);
  saveDiscoveredServersCache(filtered);
}
