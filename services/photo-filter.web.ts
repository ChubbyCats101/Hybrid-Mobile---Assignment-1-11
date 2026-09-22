import { getFilter, type FilterId } from '../constants/photo-filters';
export async function filterPhoto(base64: string, filter: FilterId): Promise<string> {
  const uri = `data:image/jpeg;base64,${base64}`;
  if (filter === 'normal') return uri;
  const image = new Image(); image.src = uri; await image.decode();
  const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
  const context = canvas.getContext('2d'); if (!context) throw new Error('เบราว์เซอร์ไม่รองรับการประมวลผลรูป');
  context.drawImage(image, 0, 0);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height); const m = getFilter(filter).matrix;
  for (let i = 0; i < pixels.data.length; i += 4) {
    const [r, g, b, a] = pixels.data.slice(i, i + 4);
    for (let c = 0; c < 4; c++) pixels.data[i + c] = m[c * 5] * r + m[c * 5 + 1] * g + m[c * 5 + 2] * b + m[c * 5 + 3] * a + m[c * 5 + 4] * 255;
  }
  context.putImageData(pixels, 0, 0); return canvas.toDataURL('image/jpeg', .85);
}
