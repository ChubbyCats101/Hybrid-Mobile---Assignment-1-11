import { isEvent, isVenue, validId, type CampusEvent, type Registration, type RegistrationDraft, type Session } from '../types/event';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { resolveApiUrl } from './api-config';
export const API_URL = resolveApiUrl(process.env.EXPO_PUBLIC_API_URL, Constants.expoConfig?.hostUri, Platform.OS);
export class ApiError extends Error { constructor(public status: number, message: string) { super(message); } }
async function request(path: string, options: RequestInit = {}): Promise<unknown> {
  if (!/^https?:\/\//.test(API_URL)) throw new Error('ตั้ง EXPO_PUBLIC_API_URL เป็น URL ของ API ที่ขึ้นต้นด้วย http:// หรือ https://');
  const timeout = new AbortController();
  const abort = () => timeout.abort();
  options.signal?.addEventListener('abort', abort);
  if (options.signal?.aborted) timeout.abort();
  const timer = setTimeout(abort, 12000);
  try {
    const response = await fetch(`${API_URL}${path}`, { ...options, signal: timeout.signal, headers: { 'Content-Type': 'application/json', ...options.headers } });
    let payload: unknown;
    try { payload = await response.json(); } catch { throw new Error('API ส่งข้อมูลที่ไม่ใช่ JSON'); }
    if (!response.ok) throw new ApiError(response.status, payload && typeof payload === 'object' && 'message' in payload ? String(payload.message) : `API error ${response.status}`);
    return payload;
  } catch (error) {
    if (timeout.signal.aborted && !options.signal?.aborted) throw new Error('เชื่อมต่อเกิน 12 วินาที กรุณาลองใหม่');
    throw error;
  } finally { clearTimeout(timer); options.signal?.removeEventListener('abort', abort); }
}
export async function getEvents(signal?: AbortSignal): Promise<CampusEvent[]> {
  const data = await request('/events', { signal });
  if (!Array.isArray(data) || !data.every(isEvent)) throw new Error('โครงสร้างข้อมูลกิจกรรมไม่ถูกต้อง');
  return data;
}
export async function getEvent(id: string, signal?: AbortSignal): Promise<CampusEvent> {
  if (!validId(id)) throw new Error('รหัสกิจกรรมไม่ถูกต้อง');
  const data = await request(`/events/${id}`, { signal });
  if (!isEvent(data)) throw new Error('โครงสร้างรายละเอียดกิจกรรมไม่ถูกต้อง');
  return data;
}
export function isSession(data: unknown): data is Session {
  if (!data || typeof data !== 'object') return false;
  const s = data as Session;
  return typeof s.token === 'string' && /^[a-f0-9]{64}$/.test(s.token) && typeof s.email === 'string' && Number.isFinite(s.expiresAt);
}
export async function authenticate(email: string, password: string, create: boolean): Promise<Session> {
  const data = await request(create ? '/auth/register' : '/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  if (!isSession(data)) throw new Error('ข้อมูลเซสชันไม่ถูกต้อง');
  return data;
}
export async function revokeSession(token: string) { await request('/auth/logout', { method: 'POST', body: '{}', headers: { Authorization: `Bearer ${token}` } }); }
export async function verifySession(token: string) { await request('/auth/me', { headers: { Authorization: `Bearer ${token}` } }); }
function isRegistration(v: unknown): v is Registration {
  if (!v || typeof v !== 'object') return false;
  const r = v as Registration;
  return typeof r.id === 'string' && validId(r.eventId) && typeof r.name === 'string' && typeof r.email === 'string' && typeof r.note === 'string' && Array.isArray(r.team) && r.team.every(n => typeof n === 'string') && isVenue(r.meetingPoint) && typeof r.createdAt === 'string' && (r.photo === null || typeof r.photo === 'string');
}
export async function registerEvent(draft: RegistrationDraft, token: string): Promise<Registration> {
  const data = await request('/registrations', { method: 'POST', body: JSON.stringify(draft), headers: { Authorization: `Bearer ${token}` } });
  if (!isRegistration(data)) throw new Error('ข้อมูลยืนยันการลงทะเบียนไม่ถูกต้อง');
  return data;
}
export async function getRegistrations(token: string, signal?: AbortSignal): Promise<Registration[]> {
  const data = await request('/registrations', { signal, headers: { Authorization: `Bearer ${token}` } });
  if (!Array.isArray(data) || !data.every(isRegistration)) throw new Error('ข้อมูลประวัติไม่ถูกต้อง');
  return data;
}
