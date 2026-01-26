import AsyncStorage from '@react-native-async-storage/async-storage';

export async function storageSetJSON<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function storageGetJSON<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (raw == null) return null;
  return JSON.parse(raw) as T;
}

export async function storageRemove(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}

