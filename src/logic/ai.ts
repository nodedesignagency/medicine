import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { CategoryId, FlagId, Form, Medicine, SymptomId } from '../data/types';
import { MEDICINES } from '../data/medicines';

/**
 * The official @anthropic-ai/sdk states "React Native is not supported at this time",
 * so this talks to the Messages API over plain fetch instead. RN has no CORS, so the
 * x-api-key header works directly — but that also means the key ships inside the app.
 * Fine for a local concept build; put a small server in front before this goes near a store.
 */
const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-opus-5';

const CATEGORIES: CategoryId[] = ['pain', 'cold', 'stomach', 'allergy', 'firstaid', 'daily', 'antibiotic'];
const FORMS: Form[] = ['tablet', 'capsule', 'syrup', 'gel', 'cream', 'sachet', 'spray', 'lozenge', 'liquid', 'strip', 'rub'];
const SYMPTOM_IDS: SymptomId[] = [
  'fever', 'headache', 'bodyache', 'toothache', 'cramps', 'sprain',
  'dry-cough', 'wet-cough', 'blocked-nose', 'runny-nose', 'sore-throat',
  'gas', 'acidity', 'indigestion', 'loose-motions', 'constipation', 'nausea', 'dehydration',
  'sneezing', 'itch-rash', 'fungal', 'cut', 'burn', 'motion-sickness', 'low-energy',
];
const FLAG_IDS: FlagId[] = [
  'liver', 'kidney', 'ulcer', 'asthma', 'pregnancy', 'alcohol',
  'drowsy', 'bp', 'diabetes', 'thinner', 'kids', 'thyroid', 'longterm',
];

/** Structured outputs — the response comes back as JSON guaranteed to match this. */
const SCHEMA = {
  type: 'object',
  properties: {
    found: { type: 'boolean', description: 'True only if a medicine name is actually legible in the photo.' },
    brand: { type: 'string' },
    salt: { type: 'string', description: 'Active ingredients with strengths, e.g. "Paracetamol 650 mg".' },
    maker: { type: 'string' },
    category: { type: 'string', enum: CATEGORIES },
    form: { type: 'string', enum: FORMS },
    rx: { type: 'boolean', description: 'Prescription-only in India (Schedule H / H1).' },
    whatItDoes: { type: 'string', description: 'One plain-English sentence. No medical jargon.' },
    treats: { type: 'array', items: { type: 'string', enum: SYMPTOM_IDS } },
    dose: { type: 'string' },
    every: { type: 'string' },
    maxPerDay: { type: 'string' },
    food: { type: 'string', enum: ['before', 'after', 'either'] },
    avoid: { type: 'array', items: { type: 'string' }, description: '2-4 plain-English cautions.' },
    flags: { type: 'array', items: { type: 'string', enum: FLAG_IDS } },
    confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
  },
  required: [
    'found', 'brand', 'salt', 'maker', 'category', 'form', 'rx', 'whatItDoes',
    'treats', 'dose', 'every', 'maxPerDay', 'food', 'avoid', 'flags', 'confidence',
  ],
  additionalProperties: false,
} as const;

const SYSTEM = `You read photos of medicine boxes and strips, mostly Indian brands, and explain them to someone with no medical training.

Rules:
- Read the actual text on the packaging. Never guess a brand from the colours alone.
- If no medicine name is legible, set found to false and leave the other fields as empty strings or empty arrays.
- whatItDoes must be one sentence a 12-year-old could follow. No jargon.
- avoid must list the cautions that genuinely matter for a household — food timing, alcohol, pregnancy, children, doubling up on the same ingredient.
- Set rx true for anything Schedule H or H1 in India, including all antibiotics.
- Dosing must be the standard adult label dose. When unsure, say so in the avoid list rather than inventing a number.`;

export type Recognized = {
  medicine: Medicine;
  confidence: 'low' | 'medium' | 'high';
  /** Set when the photo resolved to something already in the bundled database. */
  knownFromDb: boolean;
};

export type RecognizeOutcome =
  | { status: 'ok'; result: Recognized }
  | { status: 'not-found' }
  | { status: 'error'; message: string };

/** Deterministic cover colours for AI-recognised medicines, so they still look designed. */
const PALETTE = [
  { color: '#2B59C3', ink: '#FFFFFF' },
  { color: '#F0532B', ink: '#FFFFFF' },
  { color: '#1E6F5C', ink: '#DFF5EA' },
  { color: '#F5D547', ink: '#1B1B1B' },
  { color: '#7B287D', ink: '#F3D9F5' },
  { color: '#124E78', ink: '#8FE3C4' },
  { color: '#E84855', ink: '#FFFFFF' },
  { color: '#EDEDEF', ink: '#2C6E49' },
];
const COVERS: Medicine['cover'][] = ['block', 'stripe', 'split', 'band', 'circle'];

function pick<T>(list: T[], seed: string): T {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return list[h % list.length];
}

/** Normalise a brand name so "Dolo 650" and "dolo-650" land on the same entry. */
const key = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

function findInDb(brand: string, salt: string): Medicine | undefined {
  const b = key(brand);
  if (!b) return undefined;
  const exact = MEDICINES.find((m) => key(m.brand) === b);
  if (exact) return exact;
  // "Dolo" should still find "Dolo 650".
  const partial = MEDICINES.find((m) => key(m.brand).startsWith(b) || b.startsWith(key(m.brand)));
  if (partial) return partial;
  const s = key(salt);
  return s ? MEDICINES.find((m) => key(m.salt) === s) : undefined;
}

/** Shrink before upload — a raw phone photo is several MB and makes the scan feel broken. */
export async function prepareImage(uri: string): Promise<string> {
  const context = ImageManipulator.manipulate(uri);
  const resized = context.resize({ width: 1024 });
  const rendered = await resized.renderAsync();
  const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.6, base64: true });
  if (!saved.base64) throw new Error('Could not read the photo.');
  return saved.base64;
}

export async function recognizeMedicine(photoUri: string, apiKey: string): Promise<RecognizeOutcome> {
  let base64: string;
  try {
    base64 = await prepareImage(photoUri);
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Could not read the photo.' };
  }

  let res: Response;
  try {
    res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4000,
        system: SYSTEM,
        output_config: {
          effort: 'low',
          format: { type: 'json_schema', schema: SCHEMA },
        },
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
              { type: 'text', text: 'What medicine is this? Read the packaging and fill in the fields.' },
            ],
          },
        ],
      }),
    });
  } catch {
    return { status: 'error', message: 'Could not reach the internet. Check your connection and try again.' };
  }

  if (!res.ok) {
    const message =
      res.status === 401 ? 'That API key was rejected. Check it in Settings.'
      : res.status === 429 ? 'Rate limited — wait a moment and scan again.'
      : res.status >= 500 ? 'Anthropic had a problem. Try again in a minute.'
      : `Request failed (${res.status}).`;
    return { status: 'error', message };
  }

  const body = await res.json();
  if (body.stop_reason === 'refusal') {
    return { status: 'error', message: 'The model declined to read this image.' };
  }

  const text = (body.content ?? []).find((b: any) => b.type === 'text')?.text;
  if (!text) return { status: 'not-found' };

  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { status: 'error', message: 'Got an unreadable answer back. Try scanning again.' };
  }
  if (!parsed.found || !parsed.brand) return { status: 'not-found' };

  // A photo of something we already know about should get the hand-written entry, not the AI one.
  const known = findInDb(parsed.brand, parsed.salt);
  if (known) {
    return { status: 'ok', result: { medicine: known, confidence: parsed.confidence, knownFromDb: true } };
  }

  const swatch = pick(PALETTE, parsed.brand);
  const medicine: Medicine = {
    id: `ai-${key(parsed.brand)}`,
    brand: parsed.brand,
    salt: parsed.salt,
    maker: parsed.maker || 'Unknown',
    category: parsed.category,
    form: parsed.form,
    rx: parsed.rx,
    whatItDoes: parsed.whatItDoes,
    treats: parsed.treats ?? [],
    dose: parsed.dose,
    every: parsed.every,
    maxPerDay: parsed.maxPerDay,
    food: parsed.food,
    avoid: parsed.avoid ?? [],
    flags: parsed.flags ?? [],
    shelfLifeMonths: 18,
    color: swatch.color,
    ink: swatch.ink,
    cover: pick(COVERS, parsed.salt || parsed.brand),
    synthetic: true,
  };
  return { status: 'ok', result: { medicine, confidence: parsed.confidence, knownFromDb: false } };
}

/** Local text search, used by the manual picker and the catalogue screen. */
export function searchMedicines(query: string): Medicine[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const scored = MEDICINES.map((m) => {
    const brand = m.brand.toLowerCase();
    const salt = m.salt.toLowerCase();
    let score = 0;
    if (brand.startsWith(q)) score = 100;
    else if (brand.includes(q)) score = 70;
    else if (salt.includes(q)) score = 50;
    else if (m.whatItDoes.toLowerCase().includes(q)) score = 20;
    return { m, score };
  }).filter((s) => s.score > 0);
  scored.sort((a, b) => b.score - a.score || a.m.brand.localeCompare(b.m.brand));
  return scored.map((s) => s.m);
}
