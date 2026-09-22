import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useState, useEffect, useRef, useCallback, type PropsWithChildren } from 'react';
import { getEvents } from '../services/events-api';
import { readEventCache, writeEventCache, clearEventCache } from '../services/event-cache';
import type { CampusEvent } from '../types/event';
type EventsState = { events: CampusEvent[]; favorites: string[]; ready: boolean; loading: boolean; error: string; offline: boolean; updatedAt: string; refresh: () => Promise<void>; toggle: (id: string) => void; clearCache: () => Promise<void> };
const Context = createContext<EventsState | null>(null);
const KEY = '@pokejourney/event-favorites';
export function EventsProvider({ children }: PropsWithChildren) {
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [offline, setOffline] = useState(false);
  const [updatedAt, setUpdatedAt] = useState('');
  const controller = useRef<AbortController | null>(null);
  const queue = useRef(Promise.resolve());
  const refresh = useCallback(async () => {
    controller.current?.abort();
    const next = new AbortController(); controller.current = next;
    setLoading(true); setError('');
    try {
      const data = await getEvents(next.signal);
      if (next.signal.aborted) return;
      const now = new Date().toISOString();
      setEvents(data); setUpdatedAt(now); setOffline(false);
      try { await writeEventCache({ events: data, updatedAt: now }); } catch { if (!next.signal.aborted) setError('โหลดสำเร็จ แต่บันทึกแคชไม่ได้'); }
    } catch (e) {
      if (!next.signal.aborted) { setOffline(true); setError(e instanceof Error ? e.message : 'ติดต่อ API ไม่ได้'); }
    } finally { if (!next.signal.aborted) setLoading(false); }
  }, []);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [cache, raw] = await Promise.all([readEventCache(), AsyncStorage.getItem(KEY)]);
        if (!active) return;
        if (cache) { setEvents(cache.events); setUpdatedAt(cache.updatedAt); }
        if (raw) { const ids: unknown = JSON.parse(raw); if (Array.isArray(ids) && ids.every(id => typeof id === 'string')) setFavorites([...new Set(ids)]); }
      } catch { if (active) setError('อ่านข้อมูลในเครื่องไม่ได้'); }
      finally { if (active) { setReady(true); void refresh(); } }
    })();
    return () => { active = false; controller.current?.abort(); };
  }, [refresh]);
  function toggle(id: string) {
    if (!ready) return;
    setFavorites(current => current.includes(id) ? current.filter(x => x !== id) : [...current, id]);
  }
  useEffect(() => {
    if (!ready) return;
    queue.current = queue.current.then(() => AsyncStorage.setItem(KEY, JSON.stringify(favorites))).catch(() => { setError('บันทึกรายการโปรดไม่ได้ กรุณาลองใหม่'); });
  }, [favorites, ready]);
  async function clearCache() { controller.current?.abort(); await clearEventCache(); setEvents([]); setUpdatedAt(''); setLoading(false); }
  return <Context.Provider value={{ events, favorites, ready, loading, error, offline, updatedAt, refresh, toggle, clearCache }}>{children}</Context.Provider>;
}
export function useEvents() { const value = useContext(Context); if (!value) throw new Error('EventsProvider missing'); return value; }
