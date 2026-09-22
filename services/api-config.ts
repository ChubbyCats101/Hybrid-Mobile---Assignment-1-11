// Expo Go and the API run on the same development computer over LAN.
export function resolveApiUrl(configured: string | undefined, hostUri: string | null | undefined, platform: string): string {
  if (configured?.trim()) return configured.trim().replace(/\/$/, '');
  if (platform === 'web') return 'http://localhost:3001';
  if (hostUri) {
    try { return `http://${new URL(`http://${hostUri}`).hostname}:3001`; }
    catch { return ''; }
  }
  return '';
}
