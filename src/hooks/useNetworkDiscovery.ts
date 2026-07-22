import { useState, useEffect, useCallback, useRef } from 'react';
import {
  DiscoveredServer,
  LT_DISCOVERY_CONFIG,
  AUTOSCAN_KEY,
  scanNetwork,
  getCachedDiscoveredServers,
  saveDiscoveredServersCache,
  addDiscoveredServerToCache,
  validateCachedServers
} from '../services/discoveryService';

export function useNetworkDiscovery() {
  const [subnetInput, setSubnetInput] = useState(LT_DISCOVERY_CONFIG.defaultSubnet);
  const [isScanning, setIsScanning] = useState(false);
  const [checkedCount, setCheckedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(254);
  const [currentIp, setCurrentIp] = useState('-');
  const [discoveredServers, setDiscoveredServers] = useState<DiscoveredServer[]>([]);
  const [autoscanEnabled, setAutoscanEnabled] = useState(false);
  const [initialValidating, setInitialValidating] = useState(true);

  const activeScanRef = useRef<{ abort: () => void } | null>(null);

  useEffect(() => {
    const storedAutoscan = localStorage.getItem(AUTOSCAN_KEY);
    setAutoscanEnabled(storedAutoscan === 'true');
  }, []);

  const handleToggleAutoscan = (val: boolean) => {
    setAutoscanEnabled(val);
    localStorage.setItem(AUTOSCAN_KEY, val ? 'true' : 'false');
  };

  const startScan = useCallback((subnet?: string) => {
    if (activeScanRef.current) {
      activeScanRef.current.abort();
      activeScanRef.current = null;
    }

    const targetSubnet = (subnet || subnetInput).trim().replace(/\.$/, '');
    if (!targetSubnet || targetSubnet.split('.').length !== 3) {
      return false;
    }

    setIsScanning(true);
    setCheckedCount(0);
    setTotalCount(254);
    setCurrentIp('-');

    activeScanRef.current = scanNetwork(
      targetSubnet,
      (ip, checked, total) => {
        setCurrentIp(ip);
        setCheckedCount(checked);
        setTotalCount(total);
      },
      (server) => {
        setDiscoveredServers((prev) => {
          const exists = prev.some((s) => s.ip === server.ip);
          if (exists) return prev;
          return [...prev, server];
        });
        addDiscoveredServerToCache(server);
      },
      () => {
        setIsScanning(false);
        activeScanRef.current = null;
      }
    );
    return true;
  }, [subnetInput]);

  const stopScan = useCallback(() => {
    if (activeScanRef.current) {
      activeScanRef.current.abort();
      activeScanRef.current = null;
    }
    setIsScanning(false);
  }, []);

  useEffect(() => {
    let unmounted = false;

    const runStartup = async () => {
      const cached = getCachedDiscoveredServers();
      if (cached.length > 0) {
        const valid = await validateCachedServers(cached);
        if (!unmounted) {
          setDiscoveredServers(valid);
          saveDiscoveredServersCache(valid);
        }
        if (valid.length > 0) {
          if (!unmounted) setInitialValidating(false);
          return;
        }
      }

      if (!unmounted) setInitialValidating(false);

      const storedAutoscan = localStorage.getItem(AUTOSCAN_KEY) === 'true';
      if (storedAutoscan && !unmounted) {
        startScan(LT_DISCOVERY_CONFIG.defaultSubnet);
      }
    };

    runStartup();

    return () => {
      unmounted = true;
      if (activeScanRef.current) {
        activeScanRef.current.abort();
      }
    };
  }, [startScan]);

  const progressPercent = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  return {
    subnetInput,
    setSubnetInput,
    isScanning,
    checkedCount,
    totalCount,
    progressPercent,
    currentIp,
    discoveredServers,
    autoscanEnabled,
    toggleAutoscan: handleToggleAutoscan,
    startScan,
    stopScan,
    initialValidating
  };
}
