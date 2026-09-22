import type { ConfigContext, ExpoConfig } from 'expo/config';
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'PokéJourney Final', slug: 'pokejourney-final', scheme: 'pokejourney',
  android: { ...config.android, package: 'com.pokejourney.final', config: { googleMaps: { apiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY || '' } } },
  ios: { ...config.ios, bundleIdentifier: 'com.pokejourney.final' },
  plugins: [
    ...(config.plugins || []),
    ['expo-camera', { cameraPermission: 'ถ่ายภาพประกอบการลงทะเบียนทริป', recordAudioAndroid: false }],
    ['expo-media-library', { savePhotosPermission: 'บันทึกภาพที่คุณเลือกลงคลังภาพ', granularPermissions: ['photo'] }],
    ['expo-image-picker', { cameraPermission: 'ถ่ายภาพประกอบการลงทะเบียนทริป', photosPermission: 'เลือกภาพประกอบกิจกรรม', microphonePermission: false }],
    ['expo-location', { locationWhenInUsePermission: 'ใช้ตำแหน่งเพื่อเลือกจุดนัดพบเมื่อคุณกดปุ่มเท่านั้น' }],
    'expo-notifications',
  ],
});
