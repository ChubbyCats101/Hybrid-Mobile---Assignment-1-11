import { createServer } from 'node:http';
import { randomBytes, randomUUID, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const venues = [
  ['bangkok', 'SEA LIFE Bangkok', 'กรุงเทพมหานคร', 13.74604, 100.53483],
  ['phuket', 'Aquaria Phuket', 'ภูเก็ต', 7.89133, 98.36815],
  ['bangsaen', 'สถาบันวิทยาศาสตร์ทางทะเล ม.บูรพา', 'ชลบุรี', 13.28452, 100.92394],
  ['pattaya', 'Underwater World Pattaya', 'ชลบุรี', 12.89672, 100.89613],
  ['buengchawak', 'สถานแสดงพันธุ์สัตว์น้ำบึงฉวาก', 'สุพรรณบุรี', 14.92551, 100.04782],
  ['rayong', 'สถานแสดงพันธุ์สัตว์น้ำระยอง', 'ระยอง', 12.62754, 101.43265],
  ['kungkrabaen', 'อ่าวคุ้งกระเบน', 'จันทบุรี', 12.57463, 101.89862],
  ['panwa', 'สถานแสดงพันธุ์สัตว์น้ำภูเก็ต', 'ภูเก็ต', 7.80281, 98.40794],
  ['trang', 'พิพิธภัณฑ์สัตว์น้ำตรัง', 'ตรัง', 7.52552, 99.31753],
  ['phayao', 'สถานแสดงพันธุ์สัตว์น้ำพะเยา', 'พะเยา', 19.16781, 99.89724],
];
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
const digest = token => createHash('sha256').update(token).digest('hex');
const validEmail = v => typeof v === 'string' && v.length <= 200 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const validVenue = v => v && typeof v.name === 'string' && v.name.length > 0 && v.name.length <= 200 && Number.isFinite(v.latitude) && Math.abs(v.latitude) <= 90 && Number.isFinite(v.longitude) && Math.abs(v.longitude) <= 180;

export function createApi({ database = ':memory:', sessionMs = 60 * 60 * 1000 } = {}) {
  const db = new DatabaseSync(database);
  db.exec(`CREATE TABLE IF NOT EXISTS users(email TEXT PRIMARY KEY, salt TEXT NOT NULL, hash TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(hash TEXT PRIMARY KEY, email TEXT NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS events(id TEXT PRIMARY KEY, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS registrations(id TEXT PRIMARY KEY, email TEXT NOT NULL, eventId TEXT NOT NULL, data TEXT NOT NULL, UNIQUE(email,eventId));`);
  const insert = db.prepare('INSERT OR IGNORE INTO events VALUES (?, ?)');
  venues.forEach(([id, name, province, latitude, longitude], i) => {
    insert.run(id, JSON.stringify({ id, title: `ทริปชมรม · ${name}`, description: `กิจกรรมตัวอย่างสำหรับการเรียน: สำรวจโลกใต้น้ำที่${province}กับชมรม PokéJourney เลือกทีมคู่หู ลงทะเบียนจุดนัดพบ และแนบภาพเตรียมตัวก่อนออกเดินทาง ไม่ใช่กิจกรรมที่เปิดรับจริง`, category: i % 2 ? 'ถ่ายภาพ' : 'สำรวจธรรมชาติ', startsAt: new Date(Date.now() + (i + 1) * 86400000).toISOString(), location: { name, latitude, longitude } }));
  });
  const attempts = new Map();
  const server = createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Demo API, bearer auth, no cookies.
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    const send = (status, data) => { res.writeHead(status); res.end(JSON.stringify(data)); };
    if (req.method === 'OPTIONS') return send(204, null);
    try {
      const path = new URL(req.url, 'http://localhost').pathname;
      let body = {};
      if (req.method === 'POST') {
        let size = 0; const chunks = [];
        for await (const chunk of req) { size += chunk.length; if (size > 3_000_000) fail(413, 'ไฟล์หรือข้อมูลใหญ่เกินไป'); chunks.push(chunk); }
        try { body = JSON.parse(Buffer.concat(chunks).toString()); } catch { fail(400, 'JSON ไม่ถูกต้อง'); }
        if (!body || typeof body !== 'object' || Array.isArray(body)) fail(400, 'ต้องส่ง JSON object');
      }
      if (path === '/health') return send(200, { ok: true });
      if (path === '/events' && req.method === 'GET') return send(200, db.prepare('SELECT data FROM events').all().map(r => JSON.parse(r.data)));
      if (path.startsWith('/events/') && req.method === 'GET') {
        const event = db.prepare('SELECT data FROM events WHERE id = ?').get(path.slice(8));
        if (!event) fail(404, 'ไม่พบกิจกรรม');
        return send(200, JSON.parse(event.data));
      }
      if ((path === '/auth/register' || path === '/auth/login') && req.method === 'POST') {
        const address = req.socket.remoteAddress;
        const now = Date.now(); const attempt = attempts.get(address) ?? { count: 0, reset: now + 60000 };
        if (attempt.reset < now) { attempt.count = 0; attempt.reset = now + 60000; }
        attempt.count++; attempts.set(address, attempt);
        if (attempt.count > 20) fail(429, 'ลองเข้าสู่ระบบใหม่ใน 1 นาที');
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
        if (!validEmail(email) || typeof body.password !== 'string' || body.password.length < 8 || body.password.length > 128) fail(400, 'ตรวจอีเมลและรหัสผ่าน 8–128 ตัวอักษร');
        let user = db.prepare('SELECT * FROM users WHERE email=?').get(email);
        if (path === '/auth/register') {
          if (user) fail(409, 'อีเมลนี้มีบัญชีแล้ว กรุณาเข้าสู่ระบบ');
          const salt = randomBytes(16).toString('hex');
          db.prepare('INSERT INTO users VALUES (?,?,?)').run(email, salt, scryptSync(body.password, salt, 64).toString('hex'));
          user = db.prepare('SELECT * FROM users WHERE email=?').get(email);
        }
        if (!user || !timingSafeEqual(Buffer.from(user.hash, 'hex'), scryptSync(body.password, user.salt, 64))) fail(401, 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        const token = randomBytes(32).toString('hex'); const expiresAt = Date.now() + sessionMs;
        db.prepare('INSERT INTO sessions VALUES (?,?,?)').run(digest(token), email, expiresAt);
        return send(200, { token, expiresAt, email });
      }
      const token = req.headers.authorization?.replace(/^Bearer /, '') ?? '';
      const session = db.prepare('SELECT * FROM sessions WHERE hash=?').get(digest(token));
      if (!session || session.expires <= Date.now()) fail(401, 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
      if (path === '/auth/me' && req.method === 'GET') return send(200, { email: session.email, expiresAt: session.expires });
      if (path === '/auth/logout' && req.method === 'POST') { db.prepare('DELETE FROM sessions WHERE hash=?').run(digest(token)); return send(200, { ok: true }); }
      if (path === '/registrations' && req.method === 'GET') return send(200, db.prepare('SELECT data FROM registrations WHERE email=?').all(session.email).map(r => JSON.parse(r.data)));
      if (path === '/registrations' && req.method === 'POST') {
        if (typeof body.eventId !== 'string' || !db.prepare('SELECT id FROM events WHERE id=?').get(body.eventId)) fail(404, 'ไม่พบกิจกรรม');
        if (typeof body.name !== 'string' || body.name.trim().length < 2 || body.name.length > 100 || !validEmail(body.email) || typeof body.note !== 'string' || body.note.length > 500 || !validVenue(body.meetingPoint) || !Array.isArray(body.team) || body.team.length > 6 || !body.team.every(n => typeof n === 'string' && /^[a-z0-9-]{1,64}$/.test(n))) fail(400, 'ข้อมูลลงทะเบียนไม่ถูกต้อง');
        if (body.photo !== null) {
          if (typeof body.photo !== 'string' || !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(body.photo) || body.photo.length > 2_800_000) fail(400, 'รองรับภาพ JPEG ไม่เกิน 2 MB');
          const bytes = Buffer.from(body.photo.split(',')[1], 'base64');
          if (bytes[0] !== 255 || bytes[1] !== 216 || bytes[2] !== 255 || bytes.at(-2) !== 255 || bytes.at(-1) !== 217) fail(400, 'เนื้อหาไฟล์ไม่ใช่ JPEG');
        }
        const previous = db.prepare('SELECT data FROM registrations WHERE email=? AND eventId=?').get(session.email, body.eventId);
        if (previous) return send(200, JSON.parse(previous.data)); // Retry-safe per account and event.
        const registration = { id: randomUUID(), eventId: body.eventId, name: body.name.trim(), email: body.email.trim(), note: body.note.trim(), team: [...new Set(body.team)], meetingPoint: body.meetingPoint, photo: body.photo, createdAt: new Date().toISOString() };
        db.prepare('INSERT INTO registrations VALUES (?,?,?,?)').run(registration.id, session.email, body.eventId, JSON.stringify(registration));
        return send(201, registration);
      }
      fail(404, 'ไม่พบเส้นทาง API');
    } catch (error) { send(error.status ?? 500, { message: error.status ? error.message : 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' }); }
  });
  server.on('close', () => db.close());
  return server;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const folder = join(dirname(fileURLToPath(import.meta.url)), '.data'); mkdirSync(folder, { recursive: true });
  const port = Number(process.env.PORT || 3001);
  createApi({ database: join(folder, 'journey.sqlite'), sessionMs: Number(process.env.SESSION_SECONDS || 3600) * 1000 }).listen(port, '0.0.0.0', () => console.log(`PokéJourney demo API ready on port ${port}`));
}
