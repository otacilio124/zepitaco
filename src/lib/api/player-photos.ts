const cache = new Map<string, string | null>();

export async function getPlayerPhoto(name: string): Promise<string | null> {
  if (cache.has(name)) return cache.get(name) || null;

  try {
    const res = await fetch(
      `https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(name)}`,
      { next: { revalidate: 86400 } }
    );
    const data = await res.json();
    const player = data.player?.[0];
    const photo = player?.strCutout || player?.strThumb || null;
    cache.set(name, photo);
    return photo;
  } catch {
    cache.set(name, null);
    return null;
  }
}

export async function getPlayerPhotos(names: string[]): Promise<Record<string, string | null>> {
  const results: Record<string, string | null> = {};
  await Promise.all(
    names.map(async (name) => {
      results[name] = await getPlayerPhoto(name);
    })
  );
  return results;
}
