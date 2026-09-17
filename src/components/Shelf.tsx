import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Medicine } from '../data/types';
import { alpha, colors, font, radius, shadow, type } from '../theme';
import MedicineBox, { BOX_H, BOX_W } from './MedicineBox';

const GAP = 11;
const PAD = 20;
/** How far the acrylic lip sits below the bottom of the boxes. */
const DROP = 14;
const SHELF_H = 46;
/** How much of each box the lip covers — mirrored as padding inside the box. */
const OVERLAP = SHELF_H - DROP;
const PAGE = (BOX_W + GAP) * 2;

/** A machine screw head, like the ones holding the acrylic strips in the reference. */
function Screw({ side }: { side: 'left' | 'right' }) {
  return (
    <View style={[styles.screw, side === 'left' ? { left: 9 } : { right: 9 }]}>
      <View style={styles.screwSlot} />
    </View>
  );
}

type Props = {
  title: string;
  tint: string;
  medicines: Medicine[];
  onPressItem: (m: Medicine) => void;
  /** Ids that should render dimmed — expired stock. */
  dimmedIds?: string[];
  onAdd?: () => void;
};

export default function Shelf({ title, tint, medicines, onPressItem, dimmedIds, onAdd }: Props) {
  const scroller = useRef<ScrollView>(null);
  const [offset, setOffset] = useState(0);
  const [viewport, setViewport] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const maxOffset = Math.max(0, contentWidth - viewport);

  const scrollBy = (delta: number) => {
    const next = Math.max(0, Math.min(offset + delta, maxOffset));
    scroller.current?.scrollTo({ x: next, animated: true });
  };

  const atStart = offset <= 2;
  const atEnd = maxOffset > 0 && offset >= maxOffset - 2;
  const scrollable = maxOffset > 2;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={type.h2}>{title}</Text>
        <View style={styles.headerRight}>
          <Text style={styles.count}>
            {medicines.length} {medicines.length === 1 ? 'item' : 'items'}
          </Text>
          {scrollable ? (
            <View style={styles.arrows}>
              <Pressable
                onPress={() => scrollBy(-PAGE)}
                hitSlop={8}
                disabled={atStart}
                accessibilityLabel={`Scroll ${title} left`}
              >
                <Text style={[styles.arrow, atStart && styles.arrowOff]}>‹</Text>
              </Pressable>
              <Pressable
                onPress={() => scrollBy(PAGE)}
                hitSlop={8}
                disabled={atEnd}
                accessibilityLabel={`Scroll ${title} right`}
              >
                <Text style={[styles.arrow, atEnd && styles.arrowOff]}>›</Text>
              </Pressable>
            </View>
          ) : null}
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
            <MedicineBox
              key={m.id}
              medicine={m}
              dimmed={dimmedIds?.includes(m.id)}
              footInset={OVERLAP}
              onPress={() => onPressItem(m)}
            />
          ))}
          {onAdd ? (
            <Pressable
              onPress={onAdd}
              style={({ pressed }) => [styles.ghost, pressed && { opacity: 0.6 }]}
              accessibilityLabel={`Add something to ${title}`}
            >
              <Text style={styles.ghostPlus}>+</Text>
              <Text style={styles.ghostLabel}>Scan</Text>
            </Pressable>
          ) : null}
        </ScrollView>

        {/* The acrylic lip. Sits above the boxes so they read as standing behind it. */}
        <View style={styles.shelfLayer} pointerEvents="none">
          <View
            style={[
              styles.shelf,
              { backgroundColor: alpha(tint, 0.34), borderColor: alpha(tint, 0.5) },
            ]}
          >
            <View style={styles.shelfGloss} />
            <View style={[styles.shelfBase, { backgroundColor: alpha(tint, 0.22) }]} />
            <Screw side="left" />
            <Screw side="right" />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 26 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: PAD,
    marginBottom: 12,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  count: { ...type.label, color: colors.inkFaint },
  arrows: { flexDirection: 'row', gap: 12 },
  arrow: { fontSize: 22, lineHeight: 24, color: colors.inkSoft, fontFamily: font.medium },
  arrowOff: { color: colors.inkFaint, opacity: 0.4 },

  stage: { height: BOX_H + DROP },
  rail: { paddingHorizontal: PAD, gap: GAP, alignItems: 'flex-start' },

  shelfLayer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: PAD - 6 },
  shelf: {
    height: SHELF_H,
    borderRadius: radius.sm + 2,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    ...shadow.card,
    shadowOpacity: 0.06,
  },
  shelfGloss: {
    position: 'absolute', left: 0, right: 0, top: 0, height: 1,
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  shelfBase: { position: 'absolute', left: 0, right: 0, bottom: 0, height: SHELF_H * 0.42 },

  screw: {
    position: 'absolute',
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#D5D8DE',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center', justifyContent: 'center',
  },
  screwSlot: { width: 7, height: 1.5, backgroundColor: '#8B9099', borderRadius: 1 },

  ghost: {
    width: BOX_W, height: BOX_H,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: alpha(colors.ink, 0.16),
    borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
    gap: 2,
  },
  ghostPlus: { fontSize: 24, fontFamily: font.regular, color: colors.inkFaint, marginTop: -6 },
  ghostLabel: { ...type.micro, color: colors.inkFaint },
});
