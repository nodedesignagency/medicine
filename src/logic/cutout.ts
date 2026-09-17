import { Directory, File, Paths } from 'expo-file-system';

/**
 * remove.bg takes a multipart file straight from the device, so the cutout needs no
 * server of our own. Magnific's remove-background was the first choice but it only
 * accepts a publicly reachable image_url, which a photo on a phone does not have.
 *
 * The free tier covers 50 calls a month, which is more than a demo needs.
 */
const API = 'https://api.remove.bg/v1.0/removebg';

/** Where kept photos live — Paths.document survives restarts, the camera cache does not. */
function photoDir(): Directory {
  const dir = new Directory(Paths.document, 'medicine-photos');
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

function fresh(name: string): File {
  const file = new File(photoDir(), name);
  if (file.exists) file.delete();
  return file;
}

/** Copy a camera shot out of the cache into permanent storage. */
export function keepPhoto(sourceUri: string, id: string): string {
  const source = new File(sourceUri);
  const target = fresh(`${id}.jpg`);
  source.copy(target);
  return target.uri;
}

export type CutoutOutcome =
  | { status: 'ok'; uri: string }
  | { status: 'no-key' }
  | { status: 'error'; message: string };

/** Send the photo for background (and hand) removal, and keep the transparent PNG. */
export async function cutout(photoUri: string, apiKey: string, id: string): Promise<CutoutOutcome> {
  if (!apiKey) return { status: 'no-key' };

  const form = new FormData();
  // React Native's FormData takes a file descriptor object rather than a Blob.
  form.append('image_file', { uri: photoUri, name: 'photo.jpg', type: 'image/jpeg' } as any);
  form.append('size', 'auto');
  // "product" is the right matte for a box or a bottle; it also drops the hand holding it.
  form.append('type', 'product');
  form.append('format', 'png');

  let res: Response;
  try {
    res = await fetch(API, { method: 'POST', headers: { 'X-API-Key': apiKey }, body: form });
  } catch {
    return { status: 'error', message: 'Could not reach remove.bg. Check your connection.' };
  }

  if (!res.ok) {
    const message =
      res.status === 403 ? 'That remove.bg key was rejected, or the free quota is used up.'
      : res.status === 402 ? 'remove.bg credits are exhausted for this month.'
      : res.status === 429 ? 'remove.bg is rate limiting — wait a moment.'
      : `remove.bg failed (${res.status}).`;
    return { status: 'error', message };
  }

  try {
    const bytes = new Uint8Array(await res.arrayBuffer());
    const file = fresh(`${id}.png`);
    file.create();
    file.write(bytes);
    return { status: 'ok', uri: file.uri };
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Could not save the cutout.' };
  }
}

/** Remove a stored photo and its cutout. */
export function dropPhoto(id: string) {
  for (const name of [`${id}.jpg`, `${id}.png`]) {
    try {
      const file = new File(photoDir(), name);
      if (file.exists) file.delete();
    } catch {
      // A missing or already-removed file is not worth surfacing.
    }
  }
}
