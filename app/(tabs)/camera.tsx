import { useState } from 'react';
import { ScrollView, Text } from 'react-native';
import EventPhoto from '../../components/EventPhoto';
import { ui } from '../../components/JourneyUI';

export default function CameraScreen() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return <ScrollView contentContainerStyle={ui.content}>
    <Text style={ui.title}>Camera · ภาพเตรียมทริป</Text>
    <Text style={ui.text}>ถ่ายรูปหรือเลือกจากคลัง แล้วลองปรับฟิลเตอร์ได้เลย</Text>
    <EventPhoto value={photo} onChange={setPhoto} disabled={busy} onBusyChange={setBusy} />
    <Text style={ui.muted}>รูปในหน้านี้เป็นภาพทดลอง ยังไม่บันทึกลงทริป หากต้องการแนบรูปกับทริป ให้เพิ่มรูปในหน้าลงทะเบียนกิจกรรม</Text>
  </ScrollView>;
}
