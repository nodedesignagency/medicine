import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Form, Medicine } from '../data/types';
import { alpha, font, shade } from '../theme';

/** One column equals one shelf plate. */
export const VESSEL_W = 115;
/**
 * Measured off the Figma frame: the container is roughly 0.62 of the plate's width and
 * about 1.3x as tall as it is wide — a squat cylinder, not a tall bottle.
 */
export const VESSEL_H = 94;

type Shape = 'jar' | 'bottle' | 'tube' | 'packet' | 'spray';

function shapeFor(form: Form): Shape {
  switch (form) {
    case 'syrup':
    case 'liquid':
      return 'bottle';
    case 'gel':
    case 'cream':
    case 'rub':
      return 'tube';
    case 'sachet':
    case 'strip':
      return 'packet';
    case 'spray':
      return 'spray';
    default:
      return 'jar';
  }
}

/** Brightness 0-1, for hex or rgb() input. */
function luminance(color: string) {
  const rgb = color.match(/rgba?\(([^)]+)\)/);
  const [r, g, b] = rgb
    ? rgb[1].split(',').map((v) => parseInt(v.trim(), 10))
    : (() => {
        const h = color.replace('#', '');
        const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
      })();
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/** The curved side wall of a cylinder: lit on the left, falling away to the right. */
function Wall({
  color, w, h, radius = 0, topRadius, children,
}: {
  color: string; w: number; h: number; radius?: number; topRadius?: number; children?: React.ReactNode;
}) {
  const pale = luminance(color) > 0.86;
  return (
    <LinearGradient
      colors={[shade(color, 0.32), shade(color, 0.08), color, shade(color, -0.26)]}
      locations={[0, 0.2, 0.55, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={{
        width: w,
        height: h,
        borderTopLeftRadius: topRadius ?? radius,
        borderTopRightRadius: topRadius ?? radius,
        borderBottomLeftRadius: radius,
        borderBottomRightRadius: radius,
        overflow: 'hidden',
        ...(pale ? { borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(11,11,15,0.18)' } : null),
      }}
    >
      {children}
    </LinearGradient>
  );
}

/**
 * The top face of a cylinder, seen slightly from above. A percentage radius gives a true
 * ellipse — a numeric one is clamped to half the height and yields a stadium instead.
 */
function TopFace({ color, w, h }: { color: string; w: number; h: number }) {
  return (
    <LinearGradient
      colors={[shade(color, 0.4), shade(color, 0.12)]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={{ width: w, height: h, borderRadius: '50%' }}
    />
  );
}

/**
 * A lid: an elliptical top face over a short wall, with a seam where it meets the body.
 * This is what makes the container read as a cylinder rather than a rounded rectangle.
 */
function Lid({ color, w, h }: { color: string; w: number; h: number }) {
  const face = Math.max(8, w * 0.22);
  return (
    <View style={{ width: w, height: h }}>
      <View style={{ position: 'absolute', top: face / 2, left: 0 }}>
        <Wall color={shade(color, -0.1)} w={w} h={h - face / 2} radius={2} />
      </View>
      <View style={{ position: 'absolute', top: 0, left: 0 }}>
        <TopFace color={color} w={w} h={face} />
      </View>
    </View>
  );
}

/** Brand lockup printed on the container. */
function Print({ m, w }: { m: Medicine; w: number }) {
  const size = m.brand.length > 13 ? 8 : m.brand.length > 9 ? 9 : 10.5;
  return (
    <View style={{ width: w, paddingHorizontal: w * 0.1 }}>
      <Text style={[styles.maker, { color: alpha(m.ink, 0.62) }]} numberOfLines={1}>
        {m.maker}
      </Text>
      <Text
        style={[styles.brand, { color: m.ink, fontSize: size, lineHeight: size + 1.5 }]}
        numberOfLines={2}
      >
        {m.brand}
      </Text>
    </View>
  );
}

type Props = {
  medicine: Medicine;
  onPress?: () => void;
  dimmed?: boolean;
  width?: number;
  height?: number;
};

export default function Vessel({ medicine, onPress, dimmed, width = VESSEL_W, height = VESSEL_H }: Props) {
  const shape = shapeFor(medicine.form);
  const c = medicine.color;
  // Figma: the container occupies about 62% of the plate it stands on.
  const W = width * 0.62;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        { width, height, alignItems: 'center', justifyContent: 'flex-end' },
        pressed && { transform: [{ translateY: 2 }, { scale: 0.98 }] },
        dimmed && { opacity: 0.4 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${medicine.brand}, ${medicine.salt}`}
    >
      {shape === 'jar' ? (
        <>
          <Lid color={c} w={W} h={height * 0.34} />
          <Wall color={c} w={W * 0.97} h={height * 0.66} radius={4} topRadius={1}>
            <View style={{ height: height * 0.08 }} />
            <Print m={medicine} w={W * 0.97} />
          </Wall>
        </>
      ) : null}

      {shape === 'bottle' ? (
        <>
          <Lid color={c} w={W * 0.42} h={height * 0.16} />
          <View style={{ width: W * 0.3, height: height * 0.07, backgroundColor: shade(c, -0.1) }} />
          <Wall color={c} w={W * 0.86} h={height * 0.77} radius={7} topRadius={4}>
            <View style={{ height: height * 0.1 }} />
            <Print m={medicine} w={W * 0.86} />
          </Wall>
        </>
      ) : null}

      {shape === 'tube' ? (
        <>
          <Lid color={c} w={W * 0.34} h={height * 0.14} />
          <Wall color={c} w={W * 0.7} h={height * 0.86} radius={3} topRadius={9}>
            <View style={{ height: height * 0.12 }} />
            <Print m={medicine} w={W * 0.7} />
            {/* The crimped seal at the bottom of an ointment tube. */}
            <View style={styles.foot}>
              <View style={{ height: height * 0.06, backgroundColor: shade(c, -0.28) }} />
            </View>
          </Wall>
        </>
      ) : null}

      {shape === 'packet' ? (
        <Wall color={c} w={W} h={height * 0.92} radius={3}>
          <View style={{ height: height * 0.07, backgroundColor: shade(c, -0.24) }} />
          <View style={{ height: height * 0.07 }} />
          <Print m={medicine} w={W} />
          <View style={styles.foot}>
            <View style={{ height: height * 0.07, backgroundColor: shade(c, -0.24) }} />
          </View>
        </Wall>
      ) : null}

      {shape === 'spray' ? (
        <>
          <Lid color={c} w={W * 0.26} h={height * 0.12} />
          <View style={{ width: W * 0.5, height: height * 0.06, backgroundColor: shade(c, -0.16) }} />
          <Wall color={c} w={W * 0.68} h={height * 0.82} radius={5} topRadius={3}>
            <View style={{ height: height * 0.12 }} />
            <Print m={medicine} w={W * 0.68} />
          </Wall>
        </>
      ) : null}

      {medicine.rx ? (
        <View style={[styles.rx, { borderColor: alpha(medicine.ink, 0.4) }]}>
          <Text style={[styles.rxText, { color: medicine.ink }]}>℞</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  maker: { fontSize: 5.5, lineHeight: 8, fontFamily: font.bold, letterSpacing: 0.5, textTransform: 'uppercase' },
  brand: { fontFamily: font.bold, letterSpacing: -0.3, marginTop: 1 },
  foot: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  rx: {
    position: 'absolute', top: 0, right: 12,
    width: 13, height: 13, borderRadius: 7, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  rxText: { fontSize: 8, fontFamily: font.bold },
});
