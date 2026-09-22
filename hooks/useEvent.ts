import { useEffect, useState } from 'react';
import { useEvents } from '../contexts/EventsContext';
import { ApiError, getEvent } from '../services/events-api';
import { validId, type CampusEvent } from '../types/event';
export function useEvent(id: unknown) {
  const { events } = useEvents();
  const cached = events.find(e => e.id === id);
  const [event, setEvent] = useState<CampusEvent | undefined>(cached);
  const [error, setError] = useState(''); const [loading, setLoading] = useState(true); const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setEvent(cached); setError('');
    if (!validId(id)) { setError('รหัสกิจกรรมไม่ถูกต้อง'); setLoading(false); return; }
    setLoading(true);
    getEvent(id, controller.signal).then(data => { if (!controller.signal.aborted) setEvent(data); }).catch(e => {
      if (controller.signal.aborted) return;
      if (e instanceof ApiError && e.status === 404) setEvent(undefined);
      setError(e instanceof Error ? e.message : 'โหลดกิจกรรมไม่ได้');
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, cached, retry]);
  return { event, error, loading, refresh: () => setRetry(v => v + 1) };
}
