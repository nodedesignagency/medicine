import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, glass } from '../theme';
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

/** Floating tab pill on the left, scan button on the right. */
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
  // Figma: a 160 x 56 row — 4px padding, three 48px tabs, 4px gaps.
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    padding: 4, borderRadius: 28,
    backgroundColor: 'rgba(240,240,243,0.93)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#3A4A6B', shadowOpacity: 0.12, shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 }, elevation: 5,
  },
  tab: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  tabOn: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#3A4A6B', shadowOpacity: 0.14, shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  fab: {
    width: 62, height: 62, borderRadius: 999,
    backgroundColor: '#0E1320',
    alignItems: 'center', justifyContent: 'center',
    // The halo in the reference — a coloured shadow rather than a second layer.
    shadowColor: '#4C7DF0', shadowOpacity: 0.55, shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 }, elevation: 10,
  },
});
