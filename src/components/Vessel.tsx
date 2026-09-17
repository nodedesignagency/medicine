import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Form, Medicine } from '../data/types';
import { alpha, font, shade } from '../theme';

/** Perceived brightness, 0–1. */
function luminance(hex: string) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
}

export const VESSEL_W = 109;
export const VESSEL_H = 134;

type Shape = 'jar' | 'bottle' | 'tube' | 'packet' | 'spray';

/** The container each form actually comes in. */
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

/** Left-lit cylinder shading — the thing that stops these reading as flat rectangles. */
function Body({
  color, w, h, radius, topRadius, children,
}: {
  color: string;
  w: number;
  h: number;
  radius: number;
  topRadius?: number;
  children?: React.ReactNode;
}) {
  // A near-white container would otherwise disappear against the plate behind it.
  const pale = luminance(color) > 0.86;
  return (
    <LinearGradient
      colors={[shade(color, 0.3), shade(color, 0.06), color, shade(color, -0.24)]}
      locations={[0, 0.22, 0.55, 1]}
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
        ...(pale ? { borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(11,11,15,0.2)' } : null),
      }}
    >
      {children}
    </LinearGradient>
  );
}

function Cap({
  color, w, h, radius = 5, lid,
}: {
  color: string; w: number; h: number; radius?: number; lid?: boolean;
}) {
  const ellipse = w * 0.1;
  return (
    <View style={{ width: w, height: h }}>
      <LinearGradient
        colors={[shade(color, 0.2), shade(color, -0.16), shade(color, -0.34)]}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          width: w,
          height: h,
          borderTopLeftRadius: lid ? w * 0.24 : radius,
          borderTopRightRadius: lid ? w * 0.24 : radius,
          borderBottomLeftRadius: radius,
          borderBottomRightRadius: radius,
          overflow: 'hidden',
        }}
      />
      {lid ? (
        // The lit top face of the cylinder.
        <LinearGradient
          colors={[shade(color, 0.34), shade(color, 0.04)]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={{
            position: 'absolute', top: 0, left: 0,
            width: w, height: ellipse * 2,
            borderRadius: ellipse,
          }}
        />
      ) : null}
    </View>
  );
}

/** Brand lockup printed on the container, small enough to read as packaging. */
function Print({ m, w, tight }: { m: Medicine; w: number; tight?: boolean }) {
  const ink = m.ink;
  const size = m.brand.length > 13 ? 9 : m.brand.length > 9 ? 10 : 11.5;
  return (
    <View style={[styles.print, { width: w, paddingHorizontal: w * 0.1 }]}>
      <Text style={[styles.maker, { color: alpha(ink, 0.6) }]} numberOfLines={1}>
        {m.maker}
      </Text>
      <Text style={[styles.brand, { color: ink, fontSize: size, lineHeight: size + 2 }]} numberOfLines={2}>
        {m.brand}
      </Text>
      {!tight ? (
        <Text style={[styles.salt, { color: alpha(ink, 0.5) }]} numberOfLines={1}>
          {m.salt}
        </Text>
      ) : null}
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
          <Cap color={c} w={width * 0.68} h={height * 0.26} radius={3} lid />
          <Body color={c} w={width * 0.63} h={height * 0.74} radius={7} topRadius={2}>
            <View style={{ height: height * 0.05 }} />
            <Print m={medicine} w={width * 0.63} />
          </Body>
        </>
      ) : null}

      {shape === 'bottle' ? (
        <>
          <Cap color={c} w={width * 0.3} h={height * 0.11} radius={3} lid />
          <View style={{ width: width * 0.22, height: height * 0.07, backgroundColor: shade(c, -0.08) }} />
          <Body color={c} w={width * 0.64} h={height * 0.8} radius={10}>
            <View style={{ height: height * 0.09 }} />
            <Print m={medicine} w={width * 0.64} />
          </Body>
        </>
      ) : null}

      {shape === 'tube' ? (
        <>
          <Cap color={c} w={width * 0.26} h={height * 0.1} radius={3} lid />
          <Body color={c} w={width * 0.58} h={height * 0.86} radius={4}>
            {/* The crimped seal at the top of every ointment tube. */}
            <View style={{ height: height * 0.05, backgroundColor: shade(c, -0.26) }} />
            <View style={{ height: height * 0.06 }} />
            <Print m={medicine} w={width * 0.58} />
          </Body>
        </>
      ) : null}

      {shape === 'packet' ? (
        <View style={{ marginTop: height * 0.08 }}>
          <Body color={c} w={width * 0.68} h={height * 0.9} radius={4}>
            <View style={{ height: height * 0.06, backgroundColor: shade(c, -0.22) }} />
            <View style={{ height: height * 0.07 }} />
            <Print m={medicine} w={width * 0.68} />
            <View style={styles.packetFoot}>
              <View style={{ height: height * 0.05, backgroundColor: shade(c, -0.22) }} />
            </View>
          </Body>
        </View>
      ) : null}

      {shape === 'spray' ? (
        <>
          <Cap color={c} w={width * 0.16} h={height * 0.08} radius={2} />
          <Cap color={c} w={width * 0.34} h={height * 0.06} radius={2} />
          <Body color={c} w={width * 0.54} h={height * 0.82} radius={7}>
            <View style={{ height: height * 0.08 }} />
            <Print m={medicine} w={width * 0.54} tight />
          </Body>
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
  print: { gap: 1 },
  maker: { fontSize: 5.5, lineHeight: 8, fontFamily: font.bold, letterSpacing: 0.5, textTransform: 'uppercase' },
  brand: { fontFamily: font.bold, letterSpacing: -0.3, marginTop: 1 },
  salt: { fontSize: 5.5, lineHeight: 7.5, fontFamily: font.semibold, letterSpacing: 0.3, textTransform: 'uppercase', marginTop: 2 },
  packetFoot: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  rx: {
    position: 'absolute', top: 2, right: 4,
    width: 14, height: 14, borderRadius: 7, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  rxText: { fontSize: 8.5, fontFamily: font.bold },
});
