import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MedicineBox from '../components/MedicineBox';
import Shelf from '../components/Shelf';
import { CameraIcon } from '../components/Icons';
import { Chip } from '../components/ui';
import { CATEGORIES } from '../data/medicines';
import { CategoryId, Medicine } from '../data/types';
import { expiryStatus, useCabinet } from '../store/cabinet';
import { alpha, colors, font, radius, shadow, shelfTints, type } from '../theme';

export default function HomeShelf() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { medicines, items, ready } = useCabinet();
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

  const expiredIds = useMemo(
    () => items.filter((i) => expiryStatus(i) === 'expired').map((i) => i.medicineId),
    [items]
  );
  const soonCount = useMemo(
    () => items.filter((i) => expiryStatus(i) === 'soon').length,
    [items]
  );

  const visible = CATEGORIES.filter((c) => (grouped.get(c.id)?.length ?? 0) > 0);
  const shown = tab === 'all' ? visible : visible.filter((c) => c.id === tab);

  const statusCount = expiredIds.length || soonCount;
  const statusTitle = expiredIds.length
    ? `${expiredIds.length} ${expiredIds.length === 1 ? 'medicine has' : 'medicines have'} expired`
    : soonCount
    ? `${soonCount} running out of date soon`
    : 'Your cabinet is in good shape';
  const statusSub = expiredIds.length
    ? 'Throw them out — they are on the shelf, faded.'
    : soonCount
    ? 'Still fine to use, but keep an eye on them.'
    : `${medicines.length} medicines, all in date.`;

  if (!ready) return <View style={styles.screen} />;

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
      >
        <LinearGradient
          colors={[colors.heroTop, colors.heroMid, colors.heroFade]}
          locations={[0, 0.55, 1]}
          style={[styles.hero, { paddingTop: insets.top + 12 }]}
        >
          <View style={styles.statusRow}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>{statusCount || '✓'}</Text>
            </View>
            <View style={styles.statusCopy}>
              <Text style={styles.statusTitle} numberOfLines={1}>{statusTitle}</Text>
              <Text style={styles.statusSub} numberOfLines={1}>{statusSub}</Text>
            </View>
            <Pressable
              onPress={() => router.push('/settings')}
              hitSlop={12}
              style={styles.dots}
              accessibilityLabel="Settings"
            >
              {[0, 1, 2].map((i) => (
                <View key={i} style={[styles.dot, i === 0 && styles.dotOn]} />
              ))}
            </Pressable>
          </View>

          <Text style={styles.headline}>
            You have {medicines.length}{'\n'}medicines{'\n'}at home
          </Text>
        </LinearGradient>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
        >
          <Chip
            label="All"
            count={medicines.length}
            active={tab === 'all'}
            onPress={() => setTab('all')}
          />
          {visible.map((c) => (
            <Chip
              key={c.id}
              label={c.short}
              count={grouped.get(c.id)!.length}
              active={tab === c.id}
              tone={shelfTints[c.id]}
              onPress={() => setTab(c.id)}
            />
          ))}
        </ScrollView>

        <View style={styles.shelves}>
          {shown.map((c) => (
            <Shelf
              key={c.id}
              title={c.title}
              tint={shelfTints[c.id]}
              medicines={grouped.get(c.id) ?? []}
              dimmedIds={expiredIds}
              onAdd={() => router.push('/scan')}
              onPressItem={(m) => router.push(`/medicine/${m.id}`)}
            />
          ))}

          {medicines.length === 0 ? (
            <View style={styles.empty}>
              <Text style={type.h1}>Your cabinet is empty</Text>
              <Text style={[type.bodySoft, { marginTop: 6, textAlign: 'center' }]}>
                Scan a strip or a box to put your first medicine on the shelf.
              </Text>
            </View>
          ) : null}
        </View>

        <AskCard
          count={medicines.length}
          covers={medicines.slice(0, 4)}
          onPress={() => router.push('/ask')}
        />
      </ScrollView>

      <View style={[styles.dock, { paddingBottom: insets.bottom + 10 }]}>
        <Pressable
          onPress={() => router.push('/scan')}
          style={({ pressed }) => [styles.scanBtn, shadow.card, pressed && { opacity: 0.9 }]}
          accessibilityLabel="Scan a medicine"
        >
          <CameraIcon />
          <Text style={styles.scanBtnText}>Scan a medicine</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/ask')}
          style={({ pressed }) => [styles.askBtn, shadow.card, pressed && { opacity: 0.9 }]}
          accessibilityLabel="Ask what to take"
        >
          <Text style={styles.askBtnText}>?</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** The white sheet at the bottom of the reference, reworked as the symptom-check entry point. */
function AskCard({ count, covers, onPress }: { count: number; covers: Medicine[]; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.askCard, shadow.card, pressed && { opacity: 0.95 }]}
    >
      <View style={styles.askLeft}>
        <View style={styles.askChips}>
          <View style={styles.askChip}><Text style={styles.askChipText}>Symptoms</Text></View>
          <View style={styles.askChip}><Text style={styles.askChipText}>Safety</Text></View>
        </View>
        <Text style={styles.askTitle}>Not feeling{'\n'}great?</Text>
        <Text style={styles.askSub}>Tell me what is wrong and I will check what you already have.</Text>
        <View style={styles.askNumber}>
          <Text style={styles.askBig}>{count}</Text>
          <Text style={styles.askBigLabel}>on your{'\n'}shelves</Text>
        </View>
      </View>

      <View style={styles.askGrid}>
        {covers.map((m) => (
          <MedicineBox key={m.id} medicine={m} width={68} height={92} onPress={onPress} />
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },

  hero: { paddingHorizontal: 20, paddingBottom: 26 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusBadge: {
    width: 34, height: 34, borderRadius: 11,
    backgroundColor: alpha(colors.ink, 0.82),
    alignItems: 'center', justifyContent: 'center',
  },
  statusBadgeText: { color: '#FFFFFF', fontSize: 15, fontFamily: font.bold },
  statusCopy: { flex: 1 },
  statusTitle: { fontSize: 14.5, fontFamily: font.bold, color: colors.ink, letterSpacing: -0.3 },
  statusSub: { fontSize: 12.5, color: alpha(colors.ink, 0.5), marginTop: 1 },
  dots: { flexDirection: 'row', gap: 4, padding: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: alpha(colors.ink, 0.22) },
  dotOn: { backgroundColor: alpha(colors.ink, 0.5) },

  headline: { ...type.display, marginTop: 26 },

  tabs: { paddingHorizontal: 20, gap: 8, paddingVertical: 18 },

  shelves: { paddingTop: 4 },
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },

  askCard: {
    marginHorizontal: 14, marginTop: 6,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: 18,
    flexDirection: 'row',
    gap: 14,
  },
  askLeft: { flex: 1 },
  askChips: { flexDirection: 'row', gap: 6 },
  askChip: {
    paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999,
    backgroundColor: alpha(colors.ink, 0.05),
  },
  askChipText: { fontSize: 11.5, fontFamily: font.semibold, color: colors.inkSoft },
  askTitle: { ...type.displaySm, marginTop: 14 },
  askSub: { fontSize: 13, lineHeight: 18, color: colors.inkFaint, marginTop: 8 },
  askNumber: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 18 },
  askBig: { fontSize: 54, lineHeight: 56, fontFamily: font.bold, letterSpacing: -3, color: colors.ink },
  askBigLabel: { fontSize: 11, lineHeight: 13, color: colors.inkFaint, fontFamily: font.semibold, paddingBottom: 8 },

  askGrid: { width: 142, flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignContent: 'flex-start' },

  dock: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 20, paddingTop: 10,
  },
  scanBtn: {
    flex: 1, height: 56, borderRadius: 999,
    backgroundColor: colors.ink,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  scanBtnText: { color: '#FFFFFF', fontSize: 15.5, fontFamily: font.bold, letterSpacing: -0.3 },
  askBtn: {
    width: 56, height: 56, borderRadius: 999,
    backgroundColor: colors.card,
    alignItems: 'center', justifyContent: 'center',
  },
  askBtnText: { fontSize: 20, fontFamily: font.bold, color: colors.ink },
});
