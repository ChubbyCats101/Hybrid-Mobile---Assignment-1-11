import AsyncStorage from '@react-native-async-storage/async-storage';
import { isEvent, type CampusEvent } from '../types/event';
const KEY = '@pokejourney/events-v1';
export type EventCache = { events: CampusEvent[]; updatedAt: string };
export async function readEventCache(): Promise<EventCache | null> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    return data && Array.isArray(data.events) && data.events.every(isEvent) && typeof data.updatedAt === 'string' && Number.isFinite(Date.parse(data.updatedAt)) ? data : null;
  } catch { return null; }
}
export async function writeEventCache(data: EventCache) { await AsyncStorage.setItem(KEY, JSON.stringify(data)); }
export async function clearEventCache() { await AsyncStorage.removeItem(KEY); }
