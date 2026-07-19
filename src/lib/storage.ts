import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'bloodbridge:';

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

/**
 * Only the first-run onboarding flag lives on the device now. Auth sessions are
 * handled by Better Auth (SecureStore / cookies); all other data is server-side.
 */
export const StorageKeys = {
  onboarded: 'onboarded',
} as const;
