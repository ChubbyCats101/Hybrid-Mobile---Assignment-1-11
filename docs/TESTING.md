# ผลทดสอบการแจ้งเตือน — 23 กันยายน 2026

- แก้ Local notification บน Expo SDK 57 ให้ใช้ช่องแจ้งเตือนเริ่มต้นใน Android Expo Go และสร้างช่องเฉพาะเมื่อ build แอปเอง
- ใช้ API แจ้งเตือนในเครื่องโดยไม่เริ่มระบบ Remote push
- ตรวจ TypeScript และ tests/local-notifications.test.mjs ผ่าน 2/2 ในโปรเจกต์ที่แก้ไข
- ผู้ใช้ยืนยันว่าทดสอบบนมือถือ Android ผ่าน Expo Go แล้วใช้งานได้ ยังไม่ได้ระบุผลแยกทุกกรณี lifecycle
