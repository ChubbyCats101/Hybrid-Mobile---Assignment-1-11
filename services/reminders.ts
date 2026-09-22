import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from './local-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { validId, type CampusEvent } from '../types/event';
Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }) });
const channelId = 'journey-reminders';
const expoGoMessage = 'การแจ้งเตือนต้องใช้ Development Build ของ PokéJourney ไม่รองรับการตั้งแจ้งเตือน Android ใน Expo Go';
export async function reminderId(eventId: string): Promise<string | null> {
  const id = await AsyncStorage.getItem(`@journey/reminder/${eventId}`);
  if (!id) return null;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  if (scheduled.some(n => n.identifier === id)) return id;
  await AsyncStorage.removeItem(`@journey/reminder/${eventId}`); return null;
}
export async function scheduleReminder(event: CampusEvent, test = false) {
  const date = new Date(test ? Date.now() + 15000 : Date.parse(event.startsAt) - 30 * 60000);
  if (date.getTime() <= Date.now()) throw new Error('เวลาที่จะเตือนผ่านไปแล้ว');
  if (Platform.OS === 'android' && Constants.appOwnership === 'expo') throw new Error(expoGoMessage);
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync(channelId, { name: 'เตือนกิจกรรม PokéJourney', importance: Notifications.AndroidImportance.HIGH });
    } catch (error) {
      if (error instanceof Error && error.message.includes('NotificationsChannelsProvider')) {
        throw new Error(expoGoMessage);
      }
      throw error;
    }
  }
  const permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) throw new Error('ไม่ได้รับสิทธิ์แจ้งเตือน กรุณาเปิดในการตั้งค่า');
  await cancelReminder(event.id);
  const id = await Notifications.scheduleNotificationAsync({ content: { title: test ? 'ทดสอบการเตือน PokéJourney' : 'กิจกรรมจะเริ่มในอีก 30 นาที', body: event.title, data: { eventId: event.id } }, trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId } });
  try { await AsyncStorage.setItem(`@journey/reminder/${event.id}`, id); }
  catch (e) { await Notifications.cancelScheduledNotificationAsync(id); throw e; }
  return id;
}
export async function cancelReminder(eventId: string) {
  const id = await AsyncStorage.getItem(`@journey/reminder/${eventId}`);
  if (id) await Notifications.cancelScheduledNotificationAsync(id);
  await AsyncStorage.removeItem(`@journey/reminder/${eventId}`);
}
export function observeReminders(open: (id: string) => void) {
  let last = '';
  function handle(response: Notifications.NotificationResponse | null) {
    if (!response || response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER || response.notification.request.identifier === last) return;
    last = response.notification.request.identifier;
    const id = response.notification.request.content.data?.eventId;
    if (validId(id)) open(id);
    void Notifications.clearLastNotificationResponseAsync();
  }
  handle(Notifications.getLastNotificationResponse());
  const sub = Notifications.addNotificationResponseReceivedListener(handle);
  return () => sub.remove();
}
