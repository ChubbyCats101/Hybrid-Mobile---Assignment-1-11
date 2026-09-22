export async function savePhoto(dataUri: string): Promise<boolean> {
  const link = document.createElement('a');
  link.href = dataUri;
  link.download = `pokejourney-${Date.now()}.jpg`;
  document.body.appendChild(link);
  try { link.click(); } finally { link.remove(); }
  return true;
}
