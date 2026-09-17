import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Aurora from '../components/Aurora';
import Dock, { DockTab } from '../components/Dock';
import GlassShelf from '../components/GlassShelf';
import HeroSentence from '../components/HeroSentence';
import { CATEGORIES } from '../data/medicines';
import { CategoryId, Medicine } from '../data/types';
import { expiryStatus, quantityOf, useCabinet } from '../store/cabinet';
import { colors, font, glass, type } from '../theme';

/** Tab pill: label, a hairline rule, then the count — active inverts to black. */
function TabPill({
  label, count, active, onPress,
}: {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tabPill, active && styles.tabPillOn, pressed && { opacity: 0.75 }]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.tabLabel, active && styles.tabLabelOn]}>{label}</Text>
      <View style={[styles.tabRule, active && styles.tabRuleOn]} />
      <Text style={[styles.tabCount, active && styles.tabCountOn]}>{count}</Text>
    </Pressable>
  );
}

export default function HomeGlass() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { medicines, items, ready, resolve } = useCabinet();
  const [tab, setTab] = useState<CategoryId | 'all'>('all');

  const grouped = useMemo(() => {
    const map = new Map<CategoryId, Medicine[]>();
    for (const m of medicines) {
      const list = map.get(m.category) ?? [];
      list.push(m);
      map.set(m.category, list);
    }
    return map;
  }, [medicines]);

  const counts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const i of items) out[i.medicineId] = quantityOf(i, resolve(i.medicineId));
    return out;
  }, [items, resolve]);

  const expired = items.filter((i) => expiryStatus(i) === 'expired');
  const soon = items.filter((i) => expiryStatus(i) === 'soon').length;
  const expiredIds = expired.map((i) => i.medicineId);

  const visible = CATEGORIES.filter((c) => (grouped.get(c.id)?.length ?? 0) > 0);
  const shown = tab === 'all' ? visible : visible.filter((c) => c.id === tab);

  const goTab = (next: DockTab) => {
    if (next === 'ask') router.push('/ask');
    if (next === 'settings') router.push('/settings');
  };

  if (!ready) return <View style={styles.screen}><Aurora /></View>;

  return (
    <View style={styles.screen}>
      <Aurora />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: insets.bottom + 120 }}
      >
        <View style={styles.hero}>
          <HeroSentence total={medicines.length} expired={expired.length} soon={soon} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          <TabPill label="All" count={medicines.length} active={tab === 'all'} onPress={() => setTab('all')} />
          {visible.map((c) => (
            <TabPill
              key={c.id}
              label={c.short}
              count={grouped.get(c.id)!.length}
              active={tab === c.id}
              onPress={() => setTab(c.id)}
            />
          ))}
        </ScrollView>

        {shown.map((c, i) => (
          <GlassShelf
            key={c.id}
            title={c.title}
            medicines={grouped.get(c.id) ?? []}
            counts={counts}
            dimmedIds={expiredIds}
            showRule={i < shown.length - 1}
            onPressItem={(m) => router.push(`/medicine/${m.id}`)}
          />
        ))}

        {medicines.length === 0 ? (
          <View style={styles.empty}>
            <Text style={type.h1}>Nothing on the shelves</Text>
            <Text style={[type.bodySoft, { marginTop: 6, textAlign: 'center' }]}>
              Scan a strip or a box to put your first medicine away.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <Dock active="cabinet" onSelect={goTab} onScan={() => router.push('/scan')} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: glass.base },
  hero: { paddingHorizontal: 20, paddingBottom: 26 },
  tabs: { paddingHorizontal: 20, gap: 8, paddingBottom: 26 },

  /**
   * Figma: 10px padding, 13px radius, Instrument Sans 14 at -1.5%, #131927 / white.
   * Figma's 10px gap is split either side of the divider, and its 10px vertical padding
   * assumes a 10px-tall text box — React Native's line box is ~17, so 6 lands the same 30.
   */
  tabPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 13,
    backgroundColor: glass.tabIdle,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.85)',
  },
  tabPillOn: { backgroundColor: glass.tabInk, borderColor: glass.tabInk },
  tabLabel: { fontSize: 14, fontFamily: font.regular, color: glass.tabInk, letterSpacing: -0.21 },
  tabLabelOn: { color: '#FFFFFF' },
  tabRule: { width: 1, height: 12, backgroundColor: 'rgba(19,25,39,0.2)' },
  tabRuleOn: { backgroundColor: 'rgba(255,255,255,0.3)' },
  tabCount: { fontSize: 14, fontFamily: font.regular, color: glass.tabInk, letterSpacing: -0.21 },
  tabCountOn: { color: '#FFFFFF' },

  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
});
