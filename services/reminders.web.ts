import type { CampusEvent } from '../types/event';
export async function reminderId(_id: string): Promise<string | null> { return null; }
export async function scheduleReminder(_event: CampusEvent, _test = false): Promise<string> { throw new Error('การเตือนเบื้องหลังต้องใช้แอป Android/iOS'); }
export async function cancelReminder(_id: string) { /* No native schedules on web. */ }
export function observeReminders(_open: (id: string) => void) { return () => {}; }
