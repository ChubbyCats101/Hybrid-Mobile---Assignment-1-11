import type { CampusEvent } from '../types/event';
export async function indexEvents(_events: CampusEvent[]): Promise<number> {
  throw new Error('การสาธิต SQLite ใช้บน Android/iOS; เว็บใช้ AsyncStorage สำหรับแคช');
}
