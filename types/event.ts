export type Venue = { name: string; latitude: number; longitude: number };
export type CampusEvent = {
  id: string; title: string; description: string; startsAt: string;
  category: string; location: Venue; imageUrl?: string;
};
export type Session = { token: string; expiresAt: number; email: string };
export type Registration = {
  id: string; eventId: string; name: string; email: string; note: string;
  team: string[]; meetingPoint: Venue; photo: string | null; createdAt: string;
};
export type RegistrationDraft = Omit<Registration, 'id' | 'createdAt'>;

export function validId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z0-9-]{1,64}$/.test(value);
}
export function isVenue(value: unknown): value is Venue {
  if (!value || typeof value !== 'object') return false;
  const v = value as Venue;
  return typeof v.name === 'string' && v.name.length > 0 && v.name.length <= 200 &&
    Number.isFinite(v.latitude) && Math.abs(v.latitude) <= 90 &&
    Number.isFinite(v.longitude) && Math.abs(v.longitude) <= 180;
}
export function isEvent(value: unknown): value is CampusEvent {
  if (!value || typeof value !== 'object') return false;
  const e = value as CampusEvent;
  return validId(e.id) && typeof e.title === 'string' && typeof e.description === 'string' &&
    typeof e.category === 'string' && typeof e.startsAt === 'string' && Number.isFinite(Date.parse(e.startsAt)) &&
    isVenue(e.location) && (e.imageUrl === undefined || typeof e.imageUrl === 'string');
}
export function registrationErrors(d: RegistrationDraft) {
  return {
    name: d.name.trim().length < 2 || d.name.length > 100 ? 'กรอกชื่อ 2–100 ตัวอักษร' : '',
    email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email) || d.email.length > 200 ? 'กรอกอีเมลให้ถูกต้อง' : '',
    note: d.note.length > 500 ? 'ข้อความไม่เกิน 500 ตัวอักษร' : '',
    meetingPoint: !isVenue(d.meetingPoint) ? 'กรอกพิกัดละติจูด −90 ถึง 90 และลองจิจูด −180 ถึง 180' : '',
  };
}
