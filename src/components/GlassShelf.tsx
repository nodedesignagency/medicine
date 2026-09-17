import { BlurTargetView, BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import React, { useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Medicine } from '../data/types';
import { font, glass } from '../theme';
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
const STAGE_H = LABEL_TOP + 36;
const PAGE = (VESSEL_W + GAP) * 2;

const PLATE = require('../../assets/shelf-plate.png');

/** "Crocin Advance" on a shelf edge is just "Crocin". */
const shelfLabel = (brand: string) => (brand.length > 12 ? brand.split(' ')[0] : brand);

/**
 * Figma sets the label at 16, sized for "Asprin". Indian brands run longer, so anything
 * that would not fit beside the count steps down rather than truncating.
 */
const labelSize = (name: string) => (name.length > 8 ? 13 : 16);

/**
 * One container on its own glass plate.
 *
 * The plate is the Figma export — it carries the glass tint, edge and screws — but a PNG
 * cannot frost what is behind it, so a BlurView sits underneath it and blurs the container.
 * On Android that blur needs an explicit target, which is why each item wraps its own
 * container in a BlurTargetView; iOS blurs whatever is behind and ignores the ref.
 */
function ShelfItem({
  medicine, count, photo, dimmed, onPress,
}: {
  medicine: Medicine;
  count: number;
  /** A cutout of the real pack. Falls back to the drawn container when absent. */
  photo?: string;
  dimmed?: boolean;
  onPress: () => void;
}) {
  const target = useRef<View>(null);

  return (
    <View style={styles.column}>
      <BlurTargetView ref={target} style={styles.stand}>
        {photo ? (
          <Pressable
            onPress={onPress}
            style={({ pressed }) => [
              styles.stand,
              pressed && { transform: [{ translateY: 2 }, { scale: 0.98 }] },
              dimmed && { opacity: 0.4 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${medicine.brand}, ${medicine.salt}`}
          >
            {/* contain, and bottom-aligned, so the pack sits on the plate rather than floating. */}
            <Image source={{ uri: photo }} style={styles.photo} contentFit="contain" />
          </Pressable>
        ) : (
          <Vessel medicine={medicine} dimmed={dimmed} onPress={onPress} />
        )}
      </BlurTargetView>

      <View style={styles.plate} pointerEvents="none">
        <BlurView
          blurTarget={target}
          intensity={Platform.OS === 'android' ? 60 : 24}
          tint="light"
          blurMethod="dimezisBlurViewSdk31Plus"
          style={StyleSheet.absoluteFill}
        />
        <Image source={PLATE} style={StyleSheet.absoluteFill} contentFit="fill" />
      </View>

      {/* The label sits clear of the plate, the way a shelf edge label does. */}
      <View style={styles.labelSlot}>
        <Text
          style={[styles.labelName, { fontSize: labelSize(shelfLabel(medicine.brand)) }]}
          numberOfLines={1}
        >
          {shelfLabel(medicine.brand)}
        </Text>
        <View style={styles.labelPill}>
          <Text style={styles.labelPillText}>{count}</Text>
        </View>
      </View>
    </View>
  );
}

type Props = {
  title: string;
  medicines: Medicine[];
  onPressItem: (m: Medicine) => void;
  /** Units left, keyed by medicine id. */
  counts: Record<string, number>;
  /** Photo uris, keyed by medicine id. Empty when the shelf is set to illustrations. */
  photos?: Record<string, string | undefined>;
  dimmedIds?: string[];
  showRule?: boolean;
};

export default function GlassShelf({
  title, medicines, onPressItem, counts, photos, dimmedIds, showRule = true,
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
            <ShelfItem
              key={m.id}
              medicine={m}
              count={counts[m.id] ?? 0}
              photo={photos?.[m.id]}
              dimmed={dimmedIds?.includes(m.id)}
              onPress={() => onPressItem(m)}
            />
          ))}
        </ScrollView>
      </View>

      {showRule ? <View style={styles.rule} /> : null}
    </View>
  );
}

// Figma type values, all Instrument Sans at -1.5% tracking on #131927.
const INK = '#131927';

const styles = StyleSheet.create({
  wrap: { marginBottom: 6 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: PAD, marginBottom: 10,
  },
  /** Figma: Medium 20. */
  title: { fontSize: 20, fontFamily: font.medium, letterSpacing: -0.3, color: INK },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  /** Figma: Regular 12. */
  count: { fontSize: 12, fontFamily: font.regular, letterSpacing: -0.18, color: INK },
  arrow: { fontSize: 26, lineHeight: 28, color: INK, fontFamily: font.regular },
  arrowOff: { color: glass.muted, opacity: 0.45 },

  stage: { height: STAGE_H },
  rail: { paddingHorizontal: PAD, gap: GAP, alignItems: 'flex-start' },
  column: { width: VESSEL_W, height: STAGE_H },
  stand: { width: VESSEL_W, height: VESSEL_H },
  photo: { width: VESSEL_W, height: VESSEL_H },

  plate: {
    position: 'absolute', top: PLATE_TOP, left: 0,
    width: PLATE_W, height: PLATE_H,
    overflow: 'hidden',
    borderRadius: 8,
  },

  labelSlot: {
    position: 'absolute', top: LABEL_TOP, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', gap: 7,
  },
  /** Figma: Regular 16. */
  labelName: { fontSize: 16, lineHeight: 20, fontFamily: font.regular, letterSpacing: -0.24, color: INK, flexShrink: 1 },
  /**
   * Figma: 26 x 18, 4px padding, 45 radius, #F6F6F6. minWidth rather than a fixed 26 so a
   * three-digit count (100 ml of syrup) grows instead of clipping.
   */
  labelPill: {
    minWidth: 26, height: 18, paddingHorizontal: 4,
    borderRadius: 45, backgroundColor: '#F6F6F6',
    alignItems: 'center', justifyContent: 'center',
  },
  /** Figma: Regular 12 on #131927 at full strength. */
  labelPillText: { fontSize: 12, fontFamily: font.regular, letterSpacing: -0.18, color: INK },

  rule: { height: 1, backgroundColor: glass.rule, marginHorizontal: PAD, marginTop: 18, marginBottom: 20 },
});
