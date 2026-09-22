import { useState } from 'react';
import { ActivityIndicator, FlatList, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useEvents } from '../../contexts/EventsContext';
import EventCard from '../../components/EventCard';
import { Action, Field, Message, ui } from '../../components/JourneyUI';
export default function EventsScreen({ onlyFavorites = false }: { onlyFavorites?: boolean }) {
  const { events, favorites, ready, loading, error, offline, updatedAt, refresh, toggle } = useEvents();
  const [query, setQuery] = useState(''); const [savedOnly, setSavedOnly] = useState(onlyFavorites);
  const { width, fontScale } = useWindowDimensions(); const columns = width > 780 && fontScale < 1.5 ? 2 : 1;
  const data = events.filter(e => (!savedOnly || favorites.includes(e.id)) && `${e.title} ${e.location.name} ${e.category}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <View style={ui.page}><FlatList key={columns} numColumns={columns} columnWrapperStyle={columns === 2 ? { gap: 16 } : undefined} data={data} keyExtractor={e => e.id} contentContainerStyle={ui.content} refreshing={loading} onRefresh={() => void refresh()} ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
    ListHeaderComponent={<View style={{ gap: 16, marginBottom: 16 }}><View style={ui.hero}><Text style={{ color: '#C9E3AB', fontWeight: '700', letterSpacing: 2 }}>POKÉJOURNEY / CLUB TRIPS</Text><Text style={[ui.title, { color: '#FFF', fontSize: 34 }]}>พาทีมคู่หูออกเดินทาง</Text><Text style={{ color: '#E4EEE8', fontSize: 16, lineHeight: 26 }}>เลือกทริปของชมรม จัดทีม ลงทะเบียน และบันทึกความทรงจำในแอปเดียว</Text><Action secondary title="จัดทีมโปเกมอนของฉัน →" onPress={() => router.push('/team')} /></View><Field label="ค้นหากิจกรรมหรือสถานที่" value={query} onChangeText={setQuery} /><View style={ui.row}><Action secondary title={savedOnly ? `★ รายการโปรด (${favorites.length})` : `ทั้งหมด (${events.length})`} onPress={() => setSavedOnly(v => !v)} /><Text style={ui.muted}>{data.length} กิจกรรม</Text></View>{offline && <Text style={ui.text}>ติดต่อเซิร์ฟเวอร์ไม่ได้ · แสดงข้อมูลที่เก็บไว้{updatedAt ? `\nอัปเดต ${new Date(updatedAt).toLocaleString('th-TH')}` : ''}</Text>}<Message text={error} />{error && <Action title="ลองเชื่อมต่ออีกครั้ง" onPress={() => void refresh()} />}</View>}
    renderItem={({ item }) => <EventCard event={item} favorite={favorites.includes(item.id)} onOpen={id => router.push({ pathname: '/events/[id]', params: { id } })} onToggle={toggle} />}
    ListEmptyComponent={!ready || loading ? <ActivityIndicator accessibilityLabel="กำลังโหลดกิจกรรม" /> : <View style={ui.card}><Text style={ui.heading}>ยังไม่พบกิจกรรม</Text><Text style={ui.text}>{events.length ? 'ลองเปลี่ยนคำค้นหรือแสดงกิจกรรมทั้งหมด' : 'ตรวจว่า API เปิดอยู่ แล้วลองโหลดใหม่'}</Text><Action title={events.length ? 'ล้างตัวกรอง' : 'โหลดกิจกรรม'} onPress={() => { setQuery(''); setSavedOnly(false); if (!events.length) void refresh(); }} /></View>} /></View>;
}
