import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  mockAppointments,
  mockDonations,
  mockRequests,
  personalizeRequests,
} from '@/data/mock';
import { clearAll, getItem, setItem, StorageKeys } from '@/lib/storage';
import {
  Appointment,
  Donation,
  EmergencyRequest,
  Responder,
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
  confirmResponder: (requestId: string, responderId: string) => Promise<void>;
  cancelRequest: (id: string) => Promise<void>;
  markRequestFulfilled: (id: string) => Promise<void>;
  bookAppointment: (apt: Appointment) => Promise<void>;
  cancelAppointment: (id: string) => Promise<void>;
  /** Dev-only: reload seed data (requests/appointments/donations) for the current profile. */
  resetDemoData: () => Promise<void>;
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
      // Adopt any seeded self-owned requests to the live profile id.
      const baseRequests = rq ?? mockRequests;
      setRequests(pf ? personalizeRequests(baseRequests, pf.id) : baseRequests);
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
    // Adopt seeded self-owned requests to this profile so the owner flow is live.
    setRequests((prev) => {
      const next = personalizeRequests(prev, p.id);
      void setItem(StorageKeys.requests, next);
      return next;
    });
  }, []);

  const signOut = useCallback(async () => {
    setProfile(null);
    setOnboarded(false);
    setRequests(mockRequests);
    setAppointments(mockAppointments);
    setDonations(mockDonations);
    setResponded([]);
    await clearAll();
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

  const respondToRequest = useCallback(
    async (id: string) => {
      if (!profile) return;
      setResponded((prev) => {
        if (prev.includes(id)) return prev;
        const next = [...prev, id];
        void setItem(StorageKeys.respondedRequests, next);
        return next;
      });
      setRequests((prev) => {
        const next = prev.map((r) => {
          if (r.id !== id) return r;
          const existing = r.responders ?? [];
          // Guard: never add the same donor twice.
          if (existing.some((x) => x.id === profile.id)) return r;
          const responder: Responder = {
            id: profile.id,
            fullName: profile.fullName,
            bloodType: profile.bloodType,
            city: profile.city,
            distanceKm: r.distanceKm,
            avatarColor: profile.avatarColor,
            respondedAt: new Date().toISOString(),
            status: 'offered',
          };
          const responders = [responder, ...existing];
          return { ...r, responders, respondersCount: responders.length };
        });
        void setItem(StorageKeys.requests, next);
        return next;
      });
    },
    [profile],
  );

  const confirmResponder = useCallback(async (requestId: string, responderId: string) => {
    setRequests((prev) => {
      const next = prev.map((r) => {
        if (r.id !== requestId) return r;
        const responders = (r.responders ?? []).map((x) =>
          x.id === responderId ? { ...x, status: 'confirmed' as const } : x,
        );
        const confirmedCount = responders.filter((x) => x.status === 'confirmed').length;
        const unitsFulfilled = Math.min(r.unitsNeeded, confirmedCount);
        const status =
          unitsFulfilled >= r.unitsNeeded ? ('fulfilled' as const) : ('partial' as const);
        return { ...r, responders, respondersCount: responders.length, unitsFulfilled, status };
      });
      void setItem(StorageKeys.requests, next);
      return next;
    });
  }, []);

  const cancelRequest = useCallback(async (id: string) => {
    setRequests((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, status: 'expired' as const } : r));
      void setItem(StorageKeys.requests, next);
      return next;
    });
  }, []);

  const markRequestFulfilled = useCallback(async (id: string) => {
    setRequests((prev) => {
      const next = prev.map((r) =>
        r.id === id
          ? { ...r, status: 'fulfilled' as const, unitsFulfilled: r.unitsNeeded }
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

  // Dev-only: reload the fresh mock seed (re-personalized to the current
  // profile) without signing out. Keeps the profile; resets requests,
  // appointments, donations, and responded state.
  const resetDemoData = useCallback(async () => {
    const seeded = profile ? personalizeRequests(mockRequests, profile.id) : mockRequests;
    setRequests(seeded);
    setAppointments(mockAppointments);
    setDonations(mockDonations);
    setResponded([]);
    await Promise.all([
      setItem(StorageKeys.requests, seeded),
      setItem(StorageKeys.appointments, mockAppointments),
      setItem(StorageKeys.donations, mockDonations),
      setItem(StorageKeys.respondedRequests, []),
    ]);
  }, [profile]);

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
      confirmResponder,
      cancelRequest,
      markRequestFulfilled,
      bookAppointment,
      cancelAppointment,
      resetDemoData,
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
      confirmResponder,
      cancelRequest,
      markRequestFulfilled,
      bookAppointment,
      cancelAppointment,
      resetDemoData,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppStore(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppStore must be used within AppProvider');
  return ctx;
}
