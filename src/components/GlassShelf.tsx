import { Image } from 'expo-image';
import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Medicine } from '../data/types';
import { colors, font, glass } from '../theme';
import Vessel, { VESSEL_H, VESSEL_W } from './Vessel';

const GAP = 4;
const PAD = 20;
/**
 * The container stands ON the plate rather than behind it — in the Figma frame it ends
 * just past the plate's top edge, so only a sliver is hidden.
 */
const OVERLAP = 10;
/** Figma: the plate is 115 x 56, one per container. */
const PLATE_W = VESSEL_W;
const PLATE_H = 56;
const PLATE_TOP = VESSEL_H - OVERLAP;
const LABEL_TOP = PLATE_TOP + PLATE_H + 14;
const STAGE_H = LABEL_TOP + 34;
const PAGE = (VESSEL_W + GAP) * 2;

const PLATE = require('../../assets/shelf-plate.png');

/** "Crocin Advance" on a shelf edge is just "Crocin". */
const shelfLabel = (brand: string) => (brand.length > 12 ? brand.split(' ')[0] : brand);

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

              {/* The plate exported from Figma — glass effect and screws are baked in. */}
              <Image
                source={PLATE}
                style={styles.plate}
                contentFit="fill"
                pointerEvents="none"
              />

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
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  count: { fontSize: 14, fontFamily: font.medium, color: glass.muted },
  arrow: { fontSize: 30, lineHeight: 32, color: colors.ink, fontFamily: font.regular },
  arrowOff: { color: glass.muted, opacity: 0.45 },

  stage: { height: STAGE_H },
  rail: { paddingHorizontal: PAD, gap: GAP, alignItems: 'flex-start' },
  column: { width: VESSEL_W, height: STAGE_H },

  labelSlot: {
    position: 'absolute', top: LABEL_TOP, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', gap: 7,
  },
  labelName: { fontSize: 15, lineHeight: 19, fontFamily: font.regular, color: colors.ink, letterSpacing: -0.22, flexShrink: 1 },
  labelPill: {
    minWidth: 26, paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 999, backgroundColor: 'rgba(11,11,15,0.06)', alignItems: 'center',
  },
  labelPillText: { fontSize: 12, fontFamily: font.regular, color: 'rgba(19,25,39,0.5)' },

  plate: {
    position: 'absolute', top: PLATE_TOP, left: 0,
    width: PLATE_W, height: PLATE_H,
  },


  rule: { height: 1, backgroundColor: glass.rule, marginHorizontal: PAD, marginTop: 18, marginBottom: 20 },
});
