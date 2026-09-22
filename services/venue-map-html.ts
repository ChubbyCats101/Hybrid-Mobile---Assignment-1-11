export const venueMapHtml = `<!doctype html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<style>html,body,#map{height:100%;margin:0}body{background:#e5eee8}</style>
</head><body><div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" onerror="window.ReactNativeWebView.postMessage(JSON.stringify({type:'script-error'}))"></script><script>
const send = value => window.ReactNativeWebView.postMessage(JSON.stringify(value));
const map = L.map('map');
const marker = L.marker([0,0], {draggable:true}).addTo(map);
let editable = false;
window.updateVenue = (lat,lng,canEdit) => {
  editable = canEdit; marker.setLatLng([lat,lng]);
  // The first setView mounts pending layers and creates marker.dragging.
  map.setView([lat,lng], map.getZoom() || 14);
  if(canEdit) marker.dragging.enable(); else marker.dragging.disable();
};
const select = point => {
  if(!editable) return;
  const p = map.wrapLatLng(point); marker.setLatLng(p);
  send({type:'point',latitude:p.lat,longitude:p.lng});
};
map.on('click', e => select(e.latlng));
marker.on('dragend', () => select(marker.getLatLng()));
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom:19, attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).on('tileload', () => send({type:'loaded'})).on('tileerror', () => send({type:'error'})).addTo(map);
send({type:'ready'});
</script></body></html>`;
