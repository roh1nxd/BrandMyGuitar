// In-memory cache manager for Next.js API routes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

let zonesCache: CacheEntry<any> | null = null;
let historyCache: CacheEntry<any> | null = null;

const CACHE_TTL_MS = 30000; // 30 seconds TTL

export function getCachedZonesData() {
  const now = Date.now();
  if (zonesCache && now - zonesCache.timestamp < CACHE_TTL_MS) {
    return { data: zonesCache.data, ageMs: now - zonesCache.timestamp };
  }
  return null;
}

export function setCachedZonesData(data: any) {
  zonesCache = { data, timestamp: Date.now() };
}

export function invalidateZonesCache() {
  zonesCache = null;
}

export function getCachedHistoryData() {
  const now = Date.now();
  if (historyCache && now - historyCache.timestamp < CACHE_TTL_MS) {
    return { data: historyCache.data, ageMs: now - historyCache.timestamp };
  }
  return null;
}

export function setCachedHistoryData(data: any) {
  historyCache = { data, timestamp: Date.now() };
}

export function invalidateHistoryCache() {
  historyCache = null;
}
