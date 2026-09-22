import { useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Linking, Platform, ScrollView, Text, View } from 'react-native';
import { Redirect, Stack, router, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import { useAuth } from '../../contexts/AuthContext';
import { usePokemonApp } from '../../contexts/PokemonAppContext';
import { useEvent } from '../../hooks/useEvent';
import { ApiError, registerEvent } from '../../services/events-api';
import { isVenue, registrationErrors, type CampusEvent, type Venue } from '../../types/event';
import EventPhoto from '../../components/EventPhoto';
import VenueMap from '../../components/VenueMap';
import { Action, Field, Message, ui } from '../../components/JourneyUI';
export default function Register() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { ready, session } = useAuth(); const { event, error, loading, refresh } = useEvent(id);
  if (!ready) return <ActivityIndicator accessibilityLabel="กำลังตรวจสอบเซสชัน" />;
  if (!session) return <Redirect href={{ pathname: '/login', params: { eventId: id } }} />;
  if (!event) return <View style={ui.content}>{loading ? <ActivityIndicator /> : <><Message text={error} /><Action title="ลองใหม่" onPress={refresh} /><Action title="กลับไปดูกิจกรรม" onPress={() => router.replace('/events')} /></>}</View>;
  return <RegistrationForm key={event.id} event={event} />;
}
function RegistrationForm({ event }: { event: CampusEvent }) {
  const { session, expire } = useAuth(); const { team } = usePokemonApp();
  const [name, setName] = useState(''); const [email, setEmail] = useState(session?.email ?? ''); const [note, setNote] = useState('');
  const [point, setPoint] = useState<Venue>(event.location); const [lat, setLat] = useState(String(point.latitude)); const [lng, setLng] = useState(String(point.longitude));
  const [photo, setPhoto] = useState<string | null>(null); const [submitted, setSubmitted] = useState(false); const [busy, setBusy] = useState(false); const [locating, setLocating] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [message, setMessage] = useState(''); const [locationError, setLocationError] = useState(''); const [settings, setSettings] = useState(false); const [receipt, setReceipt] = useState(''); const lock = useRef(false);
  const meetingPoint = { name: point.name, latitude: lat.trim() ? Number(lat) : NaN, longitude: lng.trim() ? Number(lng) : NaN };
  const draft = { eventId: event.id, name, email, note, meetingPoint, photo, team };
  const errors = registrationErrors(draft);
  const choosePoint = (next: Venue) => { setPoint(next); setLat(String(next.latitude)); setLng(String(next.longitude)); };
  async function locate() {
    if (locating) return; setLocating(true); setLocationError(''); setSettings(false);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) { setSettings(!permission.canAskAgain); throw new Error('ไม่ได้รับสิทธิ์ตำแหน่ง เลือกจุดบนแผนที่หรือกรอกพิกัดเองได้'); }
      const result = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      choosePoint({ name: 'จุดนัดพบจากตำแหน่งของฉัน', latitude: result.coords.latitude, longitude: result.coords.longitude });
    } catch (e) { setLocationError(e instanceof Error ? e.message : 'อ่านตำแหน่งไม่ได้'); } finally { setLocating(false); }
  }
  async function submit() {
    setSubmitted(true); if (!session || lock.current || photoBusy || Object.values(errors).some(Boolean)) return;
    lock.current = true; setBusy(true); setMessage('');
    try { const result = await registerEvent(draft, session.token); setReceipt(result.id); }
    catch (e) { if (e instanceof ApiError && e.status === 401) await expire(); setMessage(e instanceof Error ? e.message : 'ส่งไม่สำเร็จ ลองใหม่ได้โดยไม่ลงทะเบียนซ้ำ'); }
    finally { lock.current = false; setBusy(false); }
  }
  if (receipt) return <ScrollView contentContainerStyle={ui.content}><Text style={ui.title}>ลงทะเบียนเรียบร้อย</Text><Text style={ui.text}>{event.title}</Text><Text style={ui.muted}>เลขยืนยัน: {receipt}</Text><Action title="ดูทริปของฉัน" onPress={() => router.replace('/profile')} /><Action secondary title="กลับไปตั้งการเตือน" onPress={() => router.replace({ pathname: '/events/[id]', params: { id: event.id } })} /></ScrollView>;
  return <KeyboardAvoidingView style={ui.page} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}><Stack.Screen options={{ title: 'ลงทะเบียนทริป' }} /><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[ui.content, { maxWidth: 720 }]}><Text style={ui.title}>{event.title}</Text><Text style={ui.muted}>ข้อมูลตัวอย่างสำหรับการเรียน · ไม่ใช่การจองหรือชำระเงินจริง</Text><Field label="ชื่อผู้ร่วมทริป" value={name} onChangeText={setName} editable={!busy} maxLength={100} error={submitted ? errors.name : ''} /><Field label="อีเมลติดต่อ" value={email} onChangeText={setEmail} editable={!busy} keyboardType="email-address" autoCapitalize="none" maxLength={200} error={submitted ? errors.email : ''} /><Field label="หมายเหตุ" value={note} onChangeText={setNote} editable={!busy} multiline maxLength={500} error={submitted ? errors.note : ''} /><Text style={ui.text}>ทีมที่จะบันทึก: {team.length ? team.join(' · ') : 'ยังไม่ได้เลือกคู่หู (ไม่บังคับ)'}</Text><EventPhoto value={photo} onChange={setPhoto} disabled={busy} onBusyChange={setPhotoBusy} /><View style={ui.card}><Text style={ui.heading}>เลือกจุดนัดพบ</Text><Text style={ui.muted}>{Platform.OS === 'web' ? 'กรอกพิกัดด้านล่างเพื่อเลื่อนหมุด' : 'แตะแผนที่หรือลากหมุดเพื่อเลือกจุดนัดพบ'}</Text><VenueMap venue={isVenue(meetingPoint) ? meetingPoint : point} onChange={busy ? undefined : choosePoint} /><Field label="ละติจูด" value={lat} onChangeText={setLat} editable={!busy} keyboardType="numbers-and-punctuation" /><Field label="ลองจิจูด" value={lng} onChangeText={setLng} editable={!busy} keyboardType="numbers-and-punctuation" />{submitted && <Message text={errors.meetingPoint} />}<Action secondary title={locating ? 'กำลังหาตำแหน่ง…' : 'ใช้ตำแหน่งปัจจุบัน'} onPress={() => void locate()} disabled={busy || locating} /><Action secondary title="ใช้สถานที่จัดกิจกรรม" onPress={() => choosePoint(event.location)} disabled={busy} /><Message text={locationError} />{settings && Platform.OS !== 'web' && <Action secondary title="เปิดการตั้งค่าสิทธิ์ตำแหน่ง" onPress={() => void Linking.openSettings().catch(() => setLocationError('เปิดการตั้งค่าไม่ได้'))} />}<Text style={ui.muted}>ส่งเฉพาะจุดที่ยืนยันเป็นจุดนัดพบ ไม่มีการติดตามตำแหน่งเบื้องหลัง</Text></View><Message text={message} /><Action title={busy ? 'กำลังส่งข้อมูล…' : 'ยืนยันลงทะเบียน'} disabled={busy || locating || photoBusy} onPress={() => void submit()} /></ScrollView></KeyboardAvoidingView>;
}

