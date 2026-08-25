import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Medicine } from '../data/types';
import { alpha, radius, shadow } from '../theme';

export const BOX_W = 98;
export const BOX_H = 150;

/** Readable ink for the small print, derived from the cover's own ink colour. */
const soft = (ink: string) => alpha(ink, 0.62);

/** Perceived brightness of a hex colour, 0–1. */
function luminance(hex: string) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/**
 * A medicine rendered like a book spine on a shelf: flat colour field, a graphic
 * treatment that varies per item, brand name set large, ingredients in small caps.
 */
function Art({ m, w, h }: { m: Medicine; w: number; h: number }) {
  const tint = alpha(m.ink, 0.16);
  switch (m.cover) {
    case 'block':
      return <View style={[styles.fillX, { top: h * 0.38, height: h * 0.3, backgroundColor: tint }]} />;
    case 'stripe':
      return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={[styles.stripe, { width: w * 2, height: h * 0.12, top: h * 0.3, left: -w * 0.3, backgroundColor: tint }]} />
          <View style={[styles.stripe, { width: w * 2, height: h * 0.12, top: h * 0.64, left: -w * 0.3, backgroundColor: tint }]} />
        </View>
      );
    case 'split':
      return <View style={[styles.fillX, { bottom: 0, height: h * 0.42, backgroundColor: tint }]} />;
    case 'band':
      return <View style={[styles.fillX, { top: h * 0.52, height: h * 0.08, backgroundColor: tint }]} />;
    case 'circle':
      return (
        <View
          style={{
            position: 'absolute', width: w, height: w, borderRadius: w / 2,
            bottom: -w * 0.27, right: -w * 0.27, backgroundColor: tint,
          }}
        />
      );
  }
}

type Props = {
  medicine: Medicine;
  onPress?: () => void;
  /** Dims the box and fades it back — used for expired stock. */
  dimmed?: boolean;
  width?: number;
  height?: number;
  /** Space kept clear at the bottom so a shelf lip does not cover the ingredients. */
  footInset?: number;
};

/** Rough width of a bold glyph as a fraction of font size — enough to size text to fit. */
const GLYPH = 0.6;

export default function MedicineBox({
  medicine, onPress, dimmed, width = BOX_W, height = BOX_H, footInset = 0,
}: Props) {
  const k = width / BOX_W;
  const pad = 9 * k;
  // Size to the longest word, so a name like "Combiflam" never breaks across lines.
  const longest = Math.max(...medicine.brand.split(' ').map((w) => w.length));
  const fits = (width - pad * 2) / (longest * GLYPH);
  const nameSize = Math.round(Math.max(10, Math.min(20 * k, fits)));
  // Very pale covers vanish against the page without an edge.
  const pale = luminance(medicine.color) > 0.88;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.box,
        { width, height, backgroundColor: medicine.color },
        pale && { borderWidth: StyleSheet.hairlineWidth, borderColor: alpha(medicine.ink, 0.25) },
        shadow.box,
        pressed && styles.pressed,
        dimmed && styles.dimmed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${medicine.brand}, ${medicine.salt}`}
    >
      <Art m={medicine} w={width} h={height} />

      <View style={[styles.boxInner, { padding: pad, paddingBottom: pad + footInset }]}>
        <Text style={[styles.maker, { color: soft(medicine.ink), fontSize: Math.max(6, 7 * k) }]} numberOfLines={1}>
          {medicine.maker}
        </Text>

        <Text
          style={[styles.brand, { color: medicine.ink, fontSize: nameSize, lineHeight: nameSize + 2 }]}
          numberOfLines={3}
        >
          {medicine.brand}
        </Text>

        <View style={styles.boxFoot}>
          <Text
            style={[styles.salt, { color: soft(medicine.ink), fontSize: Math.max(6, 7 * k), lineHeight: Math.max(8, 9 * k) }]}
            numberOfLines={2}
          >
            {medicine.salt}
          </Text>
        </View>
      </View>

      {medicine.rx ? (
        <View style={[styles.rx, { borderColor: alpha(medicine.ink, 0.35) }]}>
          <Text style={[styles.rxText, { color: medicine.ink }]}>℞</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: radius.sm, overflow: 'hidden', justifyContent: 'flex-start' },
  pressed: { transform: [{ translateY: 2 }, { scale: 0.985 }] },
  dimmed: { opacity: 0.42 },
  boxInner: { flex: 1, justifyContent: 'space-between' },
  maker: { fontWeight: '700', letterSpacing: 0.7, textTransform: 'uppercase' },
  brand: { fontWeight: '800', letterSpacing: -0.6, marginTop: 4 },
  boxFoot: { marginTop: 'auto' },
  salt: { fontWeight: '600', letterSpacing: 0.4, textTransform: 'uppercase' },

  rx: {
    position: 'absolute', top: 7, right: 7,
    width: 15, height: 15, borderRadius: 8, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  rxText: { fontSize: 9, fontWeight: '800' },

  fillX: { position: 'absolute', left: 0, right: 0 },
  stripe: { position: 'absolute', transform: [{ rotate: '-32deg' }] },
});
