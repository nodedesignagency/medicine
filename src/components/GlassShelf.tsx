import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Medicine } from '../data/types';
import { colors, font, glass, radius, type } from '../theme';
import Vessel, { VESSEL_H, VESSEL_W } from './Vessel';

const GAP = 10;
const PAD = 20;
/** How much of each container the glass plate covers. */
const OVERLAP = 38;
/** Figma: the plate is 115 x 56. */
const PLATE_H = 56;
const PLATE_TOP = VESSEL_H - OVERLAP;
const LABEL_TOP = PLATE_TOP + PLATE_H + 12;
const STAGE_H = LABEL_TOP + 40;
const PAGE = (VESSEL_W + GAP) * 2;
/** Each container gets its own plate; they sit shoulder to shoulder with a hairline gap. */
const PLATE_W = 115;

/** "Crocin Advance" on a shelf edge is just "Crocin". */
const shelfLabel = (brand: string) => (brand.length > 12 ? brand.split(' ')[0] : brand);

/** One of the four machine screws holding the plate to the wall. */
function Screw({ x, y }: { x: 'l' | 'r'; y: 't' | 'b' }) {
  return (
    <View
      style={[
        styles.screw,
        x === 'l' ? { left: 3 } : { right: 3 },
        y === 't' ? { top: 3 } : { bottom: 3 },
      ]}
    >
      <LinearGradient
        colors={[glass.screwLight, glass.screwDark]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={styles.screwFace}
      >
        <View style={styles.screwSlotA} />
        <View style={styles.screwSlotB} />
      </LinearGradient>
    </View>
  );
}

type Props = {
  title: string;
  medicines: Medicine[];
  onPressItem: (m: Medicine) => void;
  /** Units left, keyed by medicine id. */
  counts: Record<string, number>;
  dimmedIds?: string[];
  showRule?: boolean;
};

export default function GlassShelf({
  title, medicines, onPressItem, counts, dimmedIds, showRule = true,
}: Props) {
  const scroller = useRef<ScrollView>(null);
  const [offset, setOffset] = useState(0);
  const [viewport, setViewport] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const maxOffset = Math.max(0, contentWidth - viewport);

  const scrollBy = (delta: number) =>
    scroller.current?.scrollTo({ x: Math.max(0, Math.min(offset + delta, maxOffset)), animated: true });

  const atStart = offset <= 2;
  const atEnd = maxOffset > 0 && offset >= maxOffset - 2;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.headerRight}>
          <Text style={styles.count}>
            {medicines.length} {medicines.length === 1 ? 'Item' : 'Items'}
          </Text>
          <Pressable onPress={() => scrollBy(-PAGE)} hitSlop={10} disabled={atStart}
            accessibilityLabel={`Scroll ${title} left`}>
            <Text style={[styles.arrow, atStart && styles.arrowOff]}>‹</Text>
          </Pressable>
          <Pressable onPress={() => scrollBy(PAGE)} hitSlop={10} disabled={atEnd}
            accessibilityLabel={`Scroll ${title} right`}>
            <Text style={[styles.arrow, atEnd && styles.arrowOff]}>›</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.stage}>
        <ScrollView
          ref={scroller}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rail}
          scrollEventThrottle={16}
          onScroll={(e) => setOffset(e.nativeEvent.contentOffset.x)}
          onContentSizeChange={(w) => setContentWidth(w)}
          onLayout={(e) => setViewport(e.nativeEvent.layout.width)}
        >
          {medicines.map((m) => (
            <View key={m.id} style={styles.column}>
              <Vessel medicine={m} dimmed={dimmedIds?.includes(m.id)} onPress={() => onPressItem(m)} />

              {/* Drawn over the container so it reads as standing behind glass. */}
              <View style={styles.plateLayer} pointerEvents="none">
                <LinearGradient
                  colors={[glass.plateTop, glass.plate, glass.plateFoot]}
                  locations={[0, 0.55, 1]}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={styles.plate}
                >
                  <View style={styles.plateSheen} />
                  <Screw x="l" y="t" /><Screw x="r" y="t" />
                  <Screw x="l" y="b" /><Screw x="r" y="b" />
                </LinearGradient>
              </View>

              {/* The label sits clear of the plate, the way a shelf edge label does. */}
              <View style={styles.labelSlot}>
                <Text style={styles.labelName} numberOfLines={1}>{shelfLabel(m.brand)}</Text>
                <View style={styles.labelPill}>
                  <Text style={styles.labelPillText}>{counts[m.id] ?? 0}</Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {showRule ? <View style={styles.rule} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 6 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: PAD, marginBottom: 10,
  },
  title: { fontSize: 23, fontFamily: font.bold, letterSpacing: -0.7, color: colors.ink },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  count: { fontSize: 14, fontFamily: font.medium, color: glass.muted },
  arrow: { fontSize: 23, lineHeight: 25, color: colors.ink, fontFamily: font.regular },
  arrowOff: { color: glass.muted, opacity: 0.45 },

  stage: { height: STAGE_H },
  rail: { paddingHorizontal: PAD, gap: GAP, alignItems: 'flex-start' },
  column: { width: VESSEL_W, height: STAGE_H },

  labelSlot: {
    position: 'absolute', top: LABEL_TOP, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', gap: 5,
  },
  labelName: { fontSize: 14, lineHeight: 18, fontFamily: font.medium, color: colors.ink, letterSpacing: -0.3, flexShrink: 1 },
  labelPill: {
    minWidth: 20, paddingHorizontal: 5, paddingVertical: 1.5,
    borderRadius: 999, backgroundColor: 'rgba(11,11,15,0.07)', alignItems: 'center',
  },
  labelPillText: { fontSize: 10.5, fontFamily: font.semibold, color: glass.muted },

  plateLayer: { position: 'absolute', top: PLATE_TOP, left: -3, width: PLATE_W },
  plate: {
    height: PLATE_H, borderRadius: 8,
    borderWidth: 1, borderColor: glass.plateEdge,
    overflow: 'hidden',
    shadowColor: '#3A4A6B', shadowOpacity: 0.1, shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 }, elevation: 3,
  },
  plateSheen: {
    position: 'absolute', left: 0, right: 0, top: 0, height: 1.5,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },

  screw: {
    position: 'absolute', width: 12, height: 12, borderRadius: 6,
    backgroundColor: glass.screwRim,
    alignItems: 'center', justifyContent: 'center',
  },
  screwFace: {
    width: 10, height: 10, borderRadius: 5,
    alignItems: 'center', justifyContent: 'center',
  },
  screwSlotA: { position: 'absolute', width: 7, height: 1.3, backgroundColor: glass.screwSlot, borderRadius: 1 },
  screwSlotB: { position: 'absolute', width: 1.3, height: 7, backgroundColor: glass.screwSlot, borderRadius: 1 },

  rule: { height: 1, backgroundColor: glass.rule, marginHorizontal: PAD, marginTop: 18, marginBottom: 20 },
});
