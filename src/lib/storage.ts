import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'vesta:';

export async function getItem<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function setItem<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // best-effort persistence
  }
}

export async function removeItem(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(PREFIX + key);
  } catch {
    // ignore
  }
}

export const StorageKeys = {
  onboarded: 'onboarded',
  profile: 'profile',
  requests: 'requests',
  appointments: 'appointments',
  donations: 'donations',
  respondedRequests: 'respondedRequests',
} as const;
