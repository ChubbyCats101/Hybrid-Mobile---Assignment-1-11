import { useState, useEffect } from 'react';
import { ActivityIndicator, AppState, Linking, Platform, ScrollView, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEvent } from '../../hooks/useEvent';
import { useEvents } from '../../contexts/EventsContext';
import { usePokemonApp } from '../../contexts/PokemonAppContext';
import { Action, Message, ui } from '../../components/JourneyUI';
import VenueMap from '../../components/VenueMap';
import { cancelReminder, reminderId, scheduleReminder } from '../../services/reminders';
export default function EventDetail() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id ?? '';
  const { event, error, loading, refresh } = useEvent(id);
  const { favorites, toggle } = useEvents(); const { team } = usePokemonApp();
  const [reminder, setReminder] = useState<string | null>(null); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    const read = () => reminderId(id).then(value => { if (active) setReminder(value); }).catch(() => { if (active) setMessage('อ่านสถานะแจ้งเตือนไม่ได้'); });
    void read(); const sub = AppState.addEventListener('change', s => { if (s === 'active') void read(); });
    return () => { active = false; sub.remove(); };
  }, [id]);
  async function remind(test = false) {
    if (!event || busy) return; setBusy(true); setMessage('');
    try { setReminder(await scheduleReminder(event, test)); setMessage(test ? 'ตั้งเตือนทดสอบใน 15 วินาทีแล้ว' : 'ตั้งเตือนก่อนกิจกรรม 30 นาทีแล้ว'); }
    catch (e) { setMessage(e instanceof Error ? e.message : 'ตั้งเตือนไม่สำเร็จ'); } finally { setBusy(false); }
  }
  if (!event) return <View style={ui.content}>{loading ? <ActivityIndicator /> : <><Text style={ui.title}>ไม่พบกิจกรรม</Text><Message text={error} /><Action title="ลองใหม่" onPress={refresh} /><Action title="กลับไปดูกิจกรรม" onPress={() => router.replace('/events')} /></>}</View>;
  return <ScrollView style={ui.page} contentContainerStyle={ui.content}><Stack.Screen options={{ title: 'รายละเอียดกิจกรรม' }} /><View style={ui.hero}><Text style={{ color: '#D2E8B8' }}>{event.category}</Text><Text style={[ui.title, { color: '#FFF' }]}>{event.title}</Text><Text style={{ color: '#FFF', fontSize: 16 }}>{new Date(event.startsAt).toLocaleString('th-TH')}</Text></View><Message text={error ? `${error} · ข้อมูลที่แสดงอาจเป็นแคชเดิม` : ''} /><Text style={ui.text}>{event.description}</Text>
    <View style={ui.card}><Text style={ui.heading}>สถานที่จัดกิจกรรม</Text><Text style={ui.text}>{event.location.name}</Text><VenueMap venue={event.location} /><Action secondary title="เปิดเส้นทางในแผนที่" onPress={() => void Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${event.location.latitude},${event.location.longitude}`).catch(() => setMessage('เปิดแผนที่ไม่ได้'))} /></View>
    <View style={ui.card}><Text style={ui.heading}>คู่หูร่วมทริป · {team.length}/6</Text><Text style={ui.text}>{team.length ? team.join(' · ') : 'เลือกทีมได้ที่หน้า Pokédex หรือไปลงทะเบียนได้เลย'}</Text><View style={ui.row}><Action title="ลงทะเบียนกิจกรรม" onPress={() => router.push({ pathname: '/register/[id]', params: { id } })} /><Action secondary title={favorites.includes(id) ? '★ บันทึกแล้ว' : '☆ บันทึกกิจกรรม'} onPress={() => toggle(id)} /></View></View>
    <View style={ui.card}><Text style={ui.heading}>เตือนก่อนออกเดินทาง</Text>{Platform.OS === 'web' ? <Text style={ui.text}>เปิดแอปบน Android/iOS เพื่อตั้งการแจ้งเตือนเบื้องหลัง</Text> : <><Action title={reminder ? 'เปลี่ยนเป็นเตือนก่อน 30 นาที' : 'เตือนก่อนกิจกรรม 30 นาที'} disabled={busy} onPress={() => void remind()} /><Action secondary title="ทดสอบแจ้งเตือนใน 15 วินาที" disabled={busy} onPress={() => void remind(true)} />{reminder && <Action secondary title="ยกเลิกการเตือน" disabled={busy} onPress={() => { setBusy(true); void cancelReminder(id).then(() => { setReminder(null); setMessage('ยกเลิกแล้ว'); }).catch(() => setMessage('ยกเลิกไม่สำเร็จ')).finally(() => setBusy(false)); }} />}<Action secondary title="เปิดการตั้งค่าสิทธิ์" onPress={() => void Linking.openSettings().catch(() => setMessage('เปิดการตั้งค่าไม่ได้'))} /></>}<Message text={message} /></View></ScrollView>;
}
