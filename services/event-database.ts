import * as SQLite from 'expo-sqlite';
import type { CampusEvent } from '../types/event';
export async function indexEvents(events: CampusEvent[]): Promise<number> {
  const db = await SQLite.openDatabaseAsync('journey-index.db');
  await db.execAsync('CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, title TEXT NOT NULL, startsAt TEXT NOT NULL)');
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM events');
    for (const event of events) await db.runAsync('INSERT INTO events VALUES (?,?,?)', event.id, event.title, event.startsAt);
  });
  const count = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM events');
  return count?.count ?? 0;
}
