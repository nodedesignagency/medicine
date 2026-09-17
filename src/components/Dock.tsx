import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
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
 * The two lights inside the scan button, to the Figma values: a 27.82 ellipse of #A5CDFF
 * with a 23.56 layer blur, stacked twice under Plus lighter.
 *
 * A blurred circle is a radial gradient, which React Native has no native primitive for —
 * hence SVG. The blur widens the 27.82 circle to roughly a 37 radius, and the second
 * stacked copy is what makes the core read bright rather than washed.
 */
const GLOW_R = 37;

function Glows() {
  const stops = (id: string, cx: number, cy: number) => (
    <RadialGradient key={id} id={id} cx={cx} cy={cy} r={GLOW_R} gradientUnits="userSpaceOnUse">
      <Stop offset="0" stopColor={GLOW} stopOpacity="1" />
      <Stop offset="0.45" stopColor={GLOW} stopOpacity="0.5" />
      <Stop offset="1" stopColor={GLOW} stopOpacity="0" />
    </RadialGradient>
  );

  return (
    <Svg width={FAB} height={FAB} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        {/* Figma frame origins plus half the ellipse: (14.09 + 13.91, 51.09 + 13.91) and (-8 + 13.91, -22 + 13.91). */}
        {stops('glowBottom', 28, 65)}
        {stops('glowTop', 5.91, -8.09)}
      </Defs>
      <Rect width={FAB} height={FAB} fill="url(#glowBottom)" />
      <Rect width={FAB} height={FAB} fill="url(#glowBottom)" />
      <Rect width={FAB} height={FAB} fill="url(#glowTop)" />
    </Svg>
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
        <Glows />
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
    shadowColor: '#4C7DF0', shadowOpacity: 0.22, shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 }, elevation: 10,
  },
});
