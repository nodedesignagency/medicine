import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { AskIcon, CameraIcon, ShelfIcon, SlidersIcon } from './Icons';

export type DockTab = 'cabinet' | 'ask' | 'settings';

type Props = {
  active: DockTab;
  onSelect: (tab: DockTab) => void;
  onScan: () => void;
};

const TABS: { id: DockTab; label: string; Icon: typeof ShelfIcon }[] = [
  { id: 'cabinet', label: 'Cabinet', Icon: ShelfIcon },
  { id: 'ask', label: 'Ask', Icon: AskIcon },
  { id: 'settings', label: 'Settings', Icon: SlidersIcon },
];

/** Figma values for the dock. */
const PILL_H = 56;
const TAB = 48;
const FAB = 56;
const GLOW = '#A5CDFF';

/**
 * A soft light. Figma blurs an ellipse; React Native has no radial gradient, so a linear
 * one inside a circle stands in — the circle gives the sideways falloff, the gradient the
 * vertical. Stacked flat circles were tried first and banded visibly at this size.
 */
function Glow({
  d, left, top, alpha, diagonal,
}: {
  d: number; left: number; top: number; alpha: number; diagonal?: boolean;
}) {
  return (
    <LinearGradient
      colors={[`rgba(165,205,255,0)`, `rgba(165,205,255,${alpha * 0.4})`, `rgba(165,205,255,${alpha})`]}
      locations={[0, 0.55, 1]}
      start={diagonal ? { x: 1, y: 1 } : { x: 0.5, y: 0 }}
      end={diagonal ? { x: 0, y: 0 } : { x: 0.5, y: 1 }}
      style={{ position: 'absolute', width: d, height: d, borderRadius: d / 2, left, top }}
      pointerEvents="none"
    />
  );
}

/** Tab pill on the left, scan button on the right. */
export default function Dock({ active, onSelect, onScan }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingBottom: insets.bottom + 10 }]} pointerEvents="box-none">
      <View style={styles.pill}>
        {TABS.map(({ id, label, Icon }) => {
          const on = id === active;
          return (
            <Pressable
              key={id}
              onPress={() => onSelect(id)}
              style={[styles.tab, on && styles.tabOn]}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ selected: on }}
            >
              <Icon color={on ? colors.ink : '#6E7681'} size={20} />
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={onScan}
        style={({ pressed }) => [styles.fab, pressed && { transform: [{ scale: 0.95 }] }]}
        accessibilityRole="button"
        accessibilityLabel="Scan a medicine"
      >
        {/* Figma centres one glow just below the bottom edge and one above the top-left;
            clipping turns them into a bright arc and a faint highlight. */}
        <Glow d={56} left={0} top={16} alpha={0.92} />
        <Glow d={40} left={-12} top={-14} alpha={0.4} diagonal />
        <CameraIcon size={22} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 10,
  },
  // Figma: a 160 x 56 row filled #E8EAED — three 48px tabs, ~6px gaps, 2px inset.
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 2,
    height: PILL_H, borderRadius: PILL_H / 2,
    backgroundColor: '#E8EAED',
    shadowColor: '#3A4A6B', shadowOpacity: 0.12, shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 }, elevation: 5,
  },
  tab: {
    width: TAB, height: TAB, borderRadius: TAB / 2,
    alignItems: 'center', justifyContent: 'center',
  },
  tabOn: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#3A4A6B', shadowOpacity: 0.14, shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  // Figma: 56 x 56, radius 48, fill #131927, clip content on.
  fab: {
    width: FAB, height: FAB, borderRadius: FAB / 2,
    backgroundColor: '#131927',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#4C7DF0', shadowOpacity: 0.4, shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 }, elevation: 10,
  },
});
