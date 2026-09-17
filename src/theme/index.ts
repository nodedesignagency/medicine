import { TextStyle } from 'react-native';

/** Turn "#RRGGBB" into an rgba() string. Used everywhere for the acrylic shelves. */
export function alpha(hex: string, a: number) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

/** Parse "#RGB", "#RRGGBB" or "rgb(r, g, b)" into channels. */
function channels(color: string): [number, number, number] {
  const rgb = color.match(/rgba?\(([^)]+)\)/);
  if (rgb) {
    const [r, g, b] = rgb[1].split(',').map((v) => parseInt(v.trim(), 10));
    return [r, g, b];
  }
  const h = color.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * Mix a colour toward white (t > 0) or black (t < 0). Used for the 3D container shading.
 * Accepts its own output as input, since shading is applied in layers.
 */
export function shade(color: string, t: number) {
  const mix = (c: number) => Math.round(t >= 0 ? c + (255 - c) * t : c * (1 + t));
  const [r, g, b] = channels(color).map(mix);
  return `rgb(${r}, ${g}, ${b})`;
}

export const colors = {
  page: '#F1F1F4',
  heroTop: '#D8D2FF',
  heroMid: '#E6E3FF',
  heroFade: '#F1F1F4',
  card: '#FFFFFF',
  ink: '#0B0B0F',
  inkSoft: '#63636E',
  inkFaint: '#A3A3AE',
  line: '#E3E3E8',
  accent: '#5B4BFF',
  good: '#12A150',
  warn: '#E8A317',
  bad: '#E5484D',
};

/**
 * Instrument Sans and Instrument Serif, matching the Figma file. Custom fonts do not
 * synthesise weights in React Native — each weight is its own family name, so styles
 * set `fontFamily` rather than `fontWeight`. Instrument Sans ships 400–700, so the
 * old 800 display weight maps to Bold.
 */
export const font = {
  regular: 'InstrumentSans_400Regular',
  medium: 'InstrumentSans_500Medium',
  semibold: 'InstrumentSans_600SemiBold',
  bold: 'InstrumentSans_700Bold',
  serif: 'InstrumentSerif_400Regular',
} as const;

export const type = {
  /** The oversized editorial headline from the reference. */
  display: {
    fontSize: 44,
    lineHeight: 46,
    fontFamily: font.bold,
    letterSpacing: -1.8,
    color: colors.ink,
  } as TextStyle,
  displaySm: {
    fontSize: 32,
    lineHeight: 35,
    fontFamily: font.bold,
    letterSpacing: -1.2,
    color: colors.ink,
  } as TextStyle,
  /** The editorial serif sentence that heads the glass home screen. */
  serifDisplay: {
    fontSize: 38,
    lineHeight: 46,
    fontFamily: font.serif,
    letterSpacing: -0.2,
    color: colors.ink,
  } as TextStyle,
  serifMark: {
    fontFamily: font.serif,
    fontSize: 26,
    letterSpacing: 0.5,
    color: colors.ink,
  } as TextStyle,
  h1: { fontSize: 22, fontFamily: font.bold, letterSpacing: -0.6, color: colors.ink } as TextStyle,
  h2: { fontSize: 17, fontFamily: font.bold, letterSpacing: -0.3, color: colors.ink } as TextStyle,
  body: { fontSize: 15, lineHeight: 22, fontFamily: font.regular, color: colors.ink } as TextStyle,
  bodySoft: { fontSize: 15, lineHeight: 22, fontFamily: font.regular, color: colors.inkSoft } as TextStyle,
  label: { fontSize: 13, fontFamily: font.semibold, letterSpacing: -0.1, color: colors.inkSoft } as TextStyle,
  micro: { fontSize: 10, fontFamily: font.bold, letterSpacing: 0.8, color: colors.inkFaint } as TextStyle,
};

export const radius = { sm: 8, md: 14, lg: 22, xl: 30 };
export const space = (n: number) => n * 4;

/** One palette per shelf. The tinted acrylic strip is the signature of the design. */
export const shelfTints = {
  pain: '#FF9F1C',
  cold: '#2E9BFF',
  stomach: '#2FBF71',
  allergy: '#FF5D8F',
  firstaid: '#8B5CF6',
  daily: '#14B8A6',
  antibiotic: '#6E7B8B',
} as const;

/**
 * The second home design: an iridescent wash under white frosted shelves.
 * Kept separate from `colors` so the original shelf home keeps its own palette.
 */
export const glass = {
  base: '#EDF5FA',
  washPink: '#F6D2E4',
  washCyan: '#BCE8F3',
  washLilac: '#D9D6F8',
  washWarm: '#FDF0F5',
  // Figma: linear #E7E7E7 -> #DFDFDF at 60%, with a glass effect over it.
  plateTop: 'rgba(237, 238, 240, 0.97)',
  plate: 'rgba(228, 230, 233, 0.95)',
  plateFoot: 'rgba(214, 217, 222, 0.96)',
  plateEdge: 'rgba(255, 255, 255, 0.7)',
  screwRim: '#767F8A',
  screwLight: '#FDFDFE',
  screwDark: '#AAB3BE',
  screwSlot: '#69717B',
  /** Figma: active tab #131927, inactive #FFFFFF at 70%. */
  tabInk: '#131927',
  tabIdle: 'rgba(255, 255, 255, 0.7)',
  rule: 'rgba(11, 11, 15, 0.08)',
  chipIdle: 'rgba(255, 255, 255, 0.62)',
  chipEdge: 'rgba(255, 255, 255, 0.9)',
  underline: '#6C5CE7',
  muted: '#9AA0AA',
};

export const shadow = {
  card: {
    shadowColor: '#1B1B2A',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  box: {
    shadowColor: '#1B1B2A',
    shadowOpacity: 0.16,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
};
