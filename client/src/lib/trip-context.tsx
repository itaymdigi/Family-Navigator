import { createContext, useContext, useEffect } from "react";

export const AdminContext = createContext<{
  isAdmin: boolean;
  toggleAdmin: () => void;
  isOnline: boolean;
}>({ isAdmin: false, toggleAdmin: () => {}, isOnline: true });

export function useAdmin() {
  return useContext(AdminContext);
}

export function useWithCache<T>(liveData: T | undefined, cacheKey: string): T | undefined {
  useEffect(() => {
    if (liveData !== undefined) {
      try { localStorage.setItem(cacheKey, JSON.stringify(liveData)); } catch {}
    }
  }, [liveData, cacheKey]);
  if (liveData !== undefined) return liveData;
  try {
    const cached = localStorage.getItem(cacheKey);
    return cached ? (JSON.parse(cached) as T) : undefined;
  } catch { return undefined; }
}
