/**
 * Device-local app state. With real auth + server data, the only thing that
 * lives on the device is the first-run onboarding flag — everything else comes
 * from the API via TanStack Query.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { getItem, setItem, StorageKeys } from '@/lib/storage';

interface AppState {
  hydrated: boolean;
  onboarded: boolean;
}

interface AppActions {
  completeOnboarding: () => Promise<void>;
}

type AppContextValue = AppState & AppActions;

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [onboarded, setOnboarded] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const ob = await getItem<boolean>(StorageKeys.onboarded);
      if (!active) return;
      if (ob) setOnboarded(true);
      setHydrated(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  const completeOnboarding = useCallback(async () => {
    setOnboarded(true);
    await setItem(StorageKeys.onboarded, true);
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({ hydrated, onboarded, completeOnboarding }),
    [hydrated, onboarded, completeOnboarding],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppStore(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppStore must be used within AppProvider');
  return ctx;
}
