import { useState } from 'react';
import { Image, Text, View } from 'react-native';
import type { CampusEvent } from '../types/event';
import { Action, ui } from './JourneyUI';
export default function EventCard({ event, favorite, onOpen, onToggle }: { event: CampusEvent; favorite: boolean; onOpen: (id: string) => void; onToggle: (id: string) => void }) {
  const [failedImage, setFailedImage] = useState(false);
  return <View style={[ui.card, { flex: 1 }]}>
    {event.imageUrl && !failedImage ? <Image accessibilityLabel={`ภาพ ${event.title}`} source={{ uri: event.imageUrl }} style={ui.photo} onError={() => setFailedImage(true)} /> : <View style={{ backgroundColor: '#EAF0DF', padding: 22, borderRadius: 14 }}><Text style={{ fontSize: 34 }}>🌿</Text><Text style={ui.muted}>{event.category}</Text></View>}
    <Text style={ui.heading}>{event.title}</Text><Text style={ui.muted}>{new Date(event.startsAt).toLocaleString('th-TH')}</Text><Text style={ui.text}>{event.location.name}</Text>
    <View style={ui.row}><Action title="ดูรายละเอียด" onPress={() => onOpen(event.id)} /><Action secondary title={favorite ? '★ บันทึกแล้ว' : '☆ บันทึกกิจกรรม'} onPress={() => onToggle(event.id)} /></View>
  </View>;
}
