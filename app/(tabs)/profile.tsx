import { useEffect, useState } from 'react';
import { Image, Linking, Platform, ScrollView, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useEvents } from '../../contexts/EventsContext';
import { usePokemonApp } from '../../contexts/PokemonAppContext';
import { ApiError, getRegistrations } from '../../services/events-api';
import { indexEvents } from '../../services/event-database';
import type { Registration } from '../../types/event';
import { Action, Message, ui } from '../../components/JourneyUI';
const profile = { name: 'ธนกร ภิรมย์กุล', studentId: '643450789-0', program: 'วิทยาการคอมพิวเตอร์และสารสนเทศ', course: 'IN405109 Hybrid Mobile', interests: ['ท่องเที่ยว', 'ถ่ายภาพ', 'โปเกมอน'] };
export default function Profile() {
  const { session, ready, signOut, expire, error: authError } = useAuth(); const { events, favorites, updatedAt, clearCache } = useEvents(); const { team } = usePokemonApp();
  const [registrations, setRegistrations] = useState<Registration[]>([]); const [message, setMessage] = useState(''); const [loading, setLoading] = useState(false); const [revision, setRevision] = useState(0);
  useEffect(() => { setRegistrations([]); }, [session?.token]);
  useFocusEffect(useCallback(() => {
    if (!session) return;
    const controller = new AbortController(); setLoading(true);
    getRegistrations(session.token, controller.signal).then(result => { if (!controller.signal.aborted) setRegistrations(result); }).catch(e => {
      if (controller.signal.aborted) return;
      if (e instanceof ApiError && e.status === 401) void expire();
      setMessage(e instanceof Error ? e.message : 'โหลดประวัติไม่ได้');
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [session, revision, expire]));
  return <ScrollView style={ui.page} contentContainerStyle={[ui.content, { maxWidth: 800 }]}><View style={ui.hero}><Image source={require('../../assets/images/profile.png')} accessibilityLabel="รูปโปรไฟล์ผู้พัฒนา" style={{ width: 96, height: 96, borderRadius: 48 }} /><Text style={[ui.title, { color: '#FFF' }]}>{profile.name}</Text><Text style={{ color: '#E7F0E9', fontSize: 16 }}>{profile.studentId} · {profile.course}</Text><Text style={{ color: '#E7F0E9' }}>{profile.program}{'\n'}{profile.interests.join(' · ')}</Text><Action secondary title="ติดต่อผู้พัฒนาทาง Facebook" onPress={() => void Linking.openURL('https://www.facebook.com/korn.phiromkul').catch(() => setMessage('เปิดลิงก์ไม่ได้'))} /></View><View style={ui.row}><Text style={ui.heading}>★ {favorites.length} กิจกรรมโปรด</Text><Text style={ui.heading}>◉ {team.length} คู่หู</Text></View><View style={ui.card}><Text style={ui.heading}>บัญชีสมาชิกชมรม</Text>{!ready ? <Text style={ui.text}>กำลังตรวจสอบเซสชัน…</Text> : session ? <><Text style={ui.text}>{session.email}</Text><Text style={ui.muted}>เซสชันหมดอายุ {new Date(session.expiresAt).toLocaleTimeString('th-TH')}</Text><Action secondary title="ออกจากระบบ" onPress={() => void signOut().catch(() => setMessage('ลบเซสชันไม่สำเร็จ กรุณาลองใหม่'))} /><Action secondary title="สาธิตเซสชันหมดอายุบนเครื่อง" onPress={() => void expire().catch(() => setMessage('ลบเซสชันไม่สำเร็จ'))} /></> : <Action title="เข้าสู่ระบบ / สมัครสมาชิก" onPress={() => router.push('/login')} />}<Message text={authError} /></View>{session && <View style={ui.card}><Text style={ui.heading}>ทริปที่ลงทะเบียน ({registrations.length})</Text>{loading && <Text style={ui.muted}>กำลังโหลด…</Text>}{!loading && !registrations.length && <Text style={ui.text}>ยังไม่มีทริป ลงทะเบียนจากหน้ากิจกรรมได้เลย</Text>}{registrations.map(r => <View key={r.id} style={{ gap: 10, paddingVertical: 16, borderBottomWidth: 1, borderColor: '#DBE4DC' }}><Text style={ui.heading}>{events.find(e => e.id === r.eventId)?.title ?? r.eventId}</Text><Text style={ui.text}>{r.name} · {r.meetingPoint.name}</Text><Text style={ui.muted}>{r.note}{'\n'}คู่หู: {r.team.join(' · ') || 'ไม่มี'}{'\n'}ยืนยันเมื่อ {new Date(r.createdAt).toLocaleString('th-TH')}</Text>{r.photo && <Image source={{ uri: r.photo }} style={ui.photo} accessibilityLabel="ภาพทริปที่ลงทะเบียน" resizeMode="contain" />}<Action secondary title="เปิดกิจกรรม / ตั้งเตือน" onPress={() => router.push({ pathname: '/events/[id]', params: { id: r.eventId } })} /></View>)}<Action secondary title="โหลดประวัติใหม่" onPress={() => { setMessage(''); setRevision(v => v + 1); }} /></View>}<View style={ui.card}><Text style={ui.heading}>ข้อมูลในเครื่อง</Text><Text style={ui.muted}>แคชกิจกรรมล่าสุด: {updatedAt ? new Date(updatedAt).toLocaleString('th-TH') : 'ยังไม่มี'}{Platform.OS === 'web' ? '\nเว็บไม่บันทึก token ถาวร' : '\nเซสชันเก็บใน SecureStore'}</Text><Action secondary title="ล้างแคชกิจกรรม" onPress={() => void clearCache().then(() => setMessage('ล้างแคชแล้ว เปิดหน้ากิจกรรมเพื่อโหลดใหม่')).catch(() => setMessage('ล้างแคชไม่ได้'))} />{Platform.OS !== 'web' && <Action secondary title="สาธิตบันทึกดัชนีกิจกรรมใน SQLite" onPress={() => void indexEvents(events).then(n => setMessage(`SQLite บันทึกและอ่านกลับได้ ${n} กิจกรรม`)).catch(() => setMessage('บันทึก SQLite ไม่สำเร็จ'))} />}</View><Message text={message} /></ScrollView>;
}
