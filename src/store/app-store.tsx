import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  mockAppointments,
  mockDonations,
  mockRequests,
} from '@/data/mock';
import { getItem, removeItem, setItem, StorageKeys } from '@/lib/storage';
import {
  Appointment,
  Donation,
  EmergencyRequest,
  UserProfile,
} from '@/types/domain';

interface AppState {
  hydrated: boolean;
  onboarded: boolean;
  profile: UserProfile | null;
  requests: EmergencyRequest[];
  appointments: Appointment[];
  donations: Donation[];
  respondedRequestIds: string[];
}

interface AppActions {
  completeOnboarding: () => Promise<void>;
  signIn: (profile: UserProfile) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
  addRequest: (req: EmergencyRequest) => Promise<void>;
  respondToRequest: (id: string) => Promise<void>;
  bookAppointment: (apt: Appointment) => Promise<void>;
  cancelAppointment: (id: string) => Promise<void>;
}

type AppContextValue = AppState & AppActions;

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [requests, setRequests] = useState<EmergencyRequest[]>(mockRequests);
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
  const [donations, setDonations] = useState<Donation[]>(mockDonations);
  const [respondedRequestIds, setResponded] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const [ob, pf, rq, ap, dn, rr] = await Promise.all([
        getItem<boolean>(StorageKeys.onboarded),
        getItem<UserProfile>(StorageKeys.profile),
        getItem<EmergencyRequest[]>(StorageKeys.requests),
        getItem<Appointment[]>(StorageKeys.appointments),
        getItem<Donation[]>(StorageKeys.donations),
        getItem<string[]>(StorageKeys.respondedRequests),
      ]);
      if (!active) return;
      if (ob) setOnboarded(true);
      if (pf) setProfile(pf);
      if (rq) setRequests(rq);
      if (ap) setAppointments(ap);
      if (dn) setDonations(dn);
      if (rr) setResponded(rr);
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

  const signIn = useCallback(async (p: UserProfile) => {
    setProfile(p);
    await setItem(StorageKeys.profile, p);
  }, []);

  const signOut = useCallback(async () => {
    setProfile(null);
    await removeItem(StorageKeys.profile);
  }, []);

  const updateProfile = useCallback(
    async (patch: Partial<UserProfile>) => {
      setProfile((prev) => {
        if (!prev) return prev;
        const next = { ...prev, ...patch };
        void setItem(StorageKeys.profile, next);
        return next;
      });
    },
    [],
  );

  const addRequest = useCallback(async (req: EmergencyRequest) => {
    setRequests((prev) => {
      const next = [req, ...prev];
      void setItem(StorageKeys.requests, next);
      return next;
    });
  }, []);

  const respondToRequest = useCallback(async (id: string) => {
    setResponded((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      void setItem(StorageKeys.respondedRequests, next);
      return next;
    });
    setRequests((prev) => {
      const next = prev.map((r) =>
        r.id === id
          ? {
              ...r,
              respondersCount: r.respondersCount + 1,
              unitsFulfilled: Math.min(r.unitsNeeded, r.unitsFulfilled + 1),
              status:
                r.unitsFulfilled + 1 >= r.unitsNeeded ? ('fulfilled' as const) : ('partial' as const),
            }
          : r,
      );
      void setItem(StorageKeys.requests, next);
      return next;
    });
  }, []);

  const bookAppointment = useCallback(async (apt: Appointment) => {
    setAppointments((prev) => {
      const next = [apt, ...prev];
      void setItem(StorageKeys.appointments, next);
      return next;
    });
  }, []);

  const cancelAppointment = useCallback(async (id: string) => {
    setAppointments((prev) => {
      const next = prev.map((a) => (a.id === id ? { ...a, status: 'cancelled' as const } : a));
      void setItem(StorageKeys.appointments, next);
      return next;
    });
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      hydrated,
      onboarded,
      profile,
      requests,
      appointments,
      donations,
      respondedRequestIds,
      completeOnboarding,
      signIn,
      signOut,
      updateProfile,
      addRequest,
      respondToRequest,
      bookAppointment,
      cancelAppointment,
    }),
    [
      hydrated,
      onboarded,
      profile,
      requests,
      appointments,
      donations,
      respondedRequestIds,
      completeOnboarding,
      signIn,
      signOut,
      updateProfile,
      addRequest,
      respondToRequest,
      bookAppointment,
      cancelAppointment,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppStore(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppStore must be used within AppProvider');
  return ctx;
}
