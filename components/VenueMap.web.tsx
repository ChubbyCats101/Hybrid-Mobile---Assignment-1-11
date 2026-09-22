import type { Venue } from '../types/event';
export default function VenueMap({ venue }: { venue: Venue; onChange?: (venue: Venue) => void }) {
  const bbox = `${venue.longitude - .025},${venue.latitude - .025},${venue.longitude + .025},${venue.latitude + .025}`;
  return <iframe title={`แผนที่ ${venue.name}`} loading="lazy" referrerPolicy="no-referrer" style={{ width: '100%', height: 260, border: 0, borderRadius: 14 }} src={`https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${venue.latitude},${venue.longitude}`} />;
}
