import { Platform, TextStyle } from 'react-native';

/** Turn "#RRGGBB" into an rgba() string. Used everywhere for the acrylic shelves. */
export function alpha(hex: string, a: number) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
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
 * The reference art uses a tight, heavy grotesque. SF Pro Display Heavy (iOS) and
 * Roboto Black (Android) are the closest thing available without shipping webfonts,
 * so weight + negative tracking do the work instead of a custom family.
 */
const sans = Platform.select({ ios: undefined, default: undefined });
const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

export const type = {
  /** The oversized editorial headline from the reference. */
  display: {
    fontFamily: sans,
    fontSize: 44,
    lineHeight: 46,
    fontWeight: '800',
    letterSpacing: -1.8,
    color: colors.ink,
  } as TextStyle,
  displaySm: {
    fontFamily: sans,
    fontSize: 32,
    lineHeight: 35,
    fontWeight: '800',
    letterSpacing: -1.2,
    color: colors.ink,
  } as TextStyle,
  serifMark: {
    fontFamily: serif,
    fontSize: 26,
    letterSpacing: 0.5,
    color: colors.ink,
  } as TextStyle,
  h1: { fontSize: 22, fontWeight: '700', letterSpacing: -0.6, color: colors.ink } as TextStyle,
  h2: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3, color: colors.ink } as TextStyle,
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400', color: colors.ink } as TextStyle,
  bodySoft: { fontSize: 15, lineHeight: 22, fontWeight: '400', color: colors.inkSoft } as TextStyle,
  label: { fontSize: 13, fontWeight: '600', letterSpacing: -0.1, color: colors.inkSoft } as TextStyle,
  micro: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, color: colors.inkFaint } as TextStyle,
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
