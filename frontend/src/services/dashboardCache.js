let dashboardCache = null;

const CACHE_TIME = 30 * 1000; // 30 seconds

export function getDashboardCache() {
  if (!dashboardCache) {
    return null;
  }

  const age = Date.now() - dashboardCache.cachedAt;

  if (age > CACHE_TIME) {
    dashboardCache = null;
    return null;
  }

  return dashboardCache;
}

export function setDashboardCache(data) {
  dashboardCache = {
    data,   
    cachedAt: Date.now(),
  };
}

export function clearDashboardCache() {
  dashboardCache = null;
}
