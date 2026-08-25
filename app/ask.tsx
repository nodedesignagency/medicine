import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CloseIcon } from '../src/components/Icons';
import MedicineBox from '../src/components/MedicineBox';
import { Card, Chip, Disclaimer, SectionLabel, VerdictBadge, verdictColor } from '../src/components/ui';
import { MEDICINES } from '../src/data/medicines';
import { SYMPTOMS, symptomLabel } from '../src/data/symptoms';
import { SymptomId } from '../src/data/types';
import { overlapWarnings, PROFILE_OPTIONS, ProfileKey, RED_FLAGS, suggestFrom } from '../src/logic/advisor';
import { useCabinet } from '../src/store/cabinet';
import { alpha, colors, radius, type } from '../src/theme';

const tap = () => {
  if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
};

export default function AskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { medicines, settings, setProfile, has } = useCabinet();
  const [picked, setPicked] = useState<SymptomId[]>([]);
  // Once something is picked the 25-chip grid collapses to just the choices, so the
  // answer sits right under them instead of below a screen and a half of chips.
  const [expanded, setExpanded] = useState(true);

  const suggestions = useMemo(
    () => suggestFrom(medicines, picked, settings.profile),
    [medicines, picked, settings.profile]
  );

  const usable = suggestions.filter((s) => s.advice.verdict !== 'no');

  // When the cabinet comes up short, say what would actually help.
  const elsewhere = useMemo(() => {
    if (!picked.length || usable.length) return [];
    return suggestFrom(MEDICINES.filter((m) => !has(m.id)), picked, settings.profile)
      .filter((s) => s.advice.verdict !== 'no' && !s.medicine.rx)
      .slice(0, 4);
  }, [picked, usable.length, has, settings.profile]);

  const overlaps = useMemo(
    () => overlapWarnings(usable.slice(0, 3).map((s) => s.medicine)),
    [usable]
  );

  const grouped = SYMPTOMS.reduce<Record<string, typeof SYMPTOMS>>((acc, s) => {
    (acc[s.group] ??= []).push(s);
    return acc;
  }, {});

  const toggleSymptom = (s: SymptomId) => {
    tap();
    const next = picked.includes(s) ? picked.filter((x) => x !== s) : [...picked, s];
    setPicked(next);
    if (!picked.length && next.length) setExpanded(false);
  };

  const toggleProfile = (k: ProfileKey) => {
    tap();
    setProfile({ ...settings.profile, [k]: !settings.profile[k] });
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.top, { paddingTop: insets.top + 10 }]}>
        <Text style={type.displaySm}>What is{'\n'}wrong?</Text>
        <Pressable onPress={() => router.back()} style={styles.close} hitSlop={12} accessibilityLabel="Close">
          <CloseIcon />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 14, paddingBottom: insets.bottom + 40 }}
      >
        <Card>
          {expanded ? (
            <>
              {Object.entries(grouped).map(([group, list]) => (
                <View key={group} style={{ marginBottom: 14 }}>
                  <SectionLabel>{group}</SectionLabel>
                  <View style={styles.wrap}>
                    {list.map((s) => (
                      <Chip
                        key={s.id}
                        label={s.label}
                        active={picked.includes(s.id)}
                        onPress={() => toggleSymptom(s.id)}
                      />
                    ))}
                  </View>
                </View>
              ))}
              {picked.length ? (
                <Pressable onPress={() => setExpanded(false)} style={styles.doneBtn}>
                  <Text style={styles.doneText}>Done</Text>
                </Pressable>
              ) : null}
            </>
          ) : (
            <>
              <SectionLabel>You said</SectionLabel>
              <View style={styles.wrap}>
                {picked.map((id) => (
                  <Chip key={id} label={symptomLabel(id)} active onPress={() => toggleSymptom(id)} />
                ))}
                <Chip label="+ Add another" onPress={() => setExpanded(true)} />
              </View>
            </>
          )}
        </Card>

        {picked.map((s) =>
          RED_FLAGS[s] ? (
            <View key={s} style={styles.redFlag}>
              <Text style={styles.redFlagText}>{RED_FLAGS[s]}</Text>
            </View>
          ) : null
        )}

        {picked.length ? (
          <View
            style={{ marginTop: 12 }}
          >
            <Text style={styles.resultsTitle}>
              {usable.length
                ? `From your cabinet`
                : elsewhere.length
                ? `Nothing at home fits`
                : `Nothing here matches that`}
            </Text>

            {usable.map(({ medicine, advice }) => (
              <Pressable
                key={medicine.id}
                onPress={() => router.push(`/medicine/${medicine.id}`)}
                style={({ pressed }) => [styles.row, pressed && { opacity: 0.9 }]}
              >
                <MedicineBox medicine={medicine} width={64} height={94} onPress={() => router.push(`/medicine/${medicine.id}`)} />
                <View style={styles.rowBody}>
                  <VerdictBadge verdict={advice.verdict} label={advice.headline} />
                  <Text style={styles.rowName}>{medicine.brand}</Text>
                  <Text style={styles.rowReason} numberOfLines={3}>{advice.reason}</Text>
                  {advice.warnings.length ? (
                    <Text style={[styles.rowWarn, { color: verdictColor(advice.verdict) }]} numberOfLines={2}>
                      {advice.warnings[0]}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            ))}

            {suggestions.filter((s) => s.advice.verdict === 'no').map(({ medicine, advice }) => (
              <View key={medicine.id} style={styles.blockedRow}>
                <VerdictBadge verdict="no" />
                <Text style={styles.blockedText}>
                  <Text style={{ fontWeight: '700' }}>{medicine.brand}</Text> would help, but {advice.warnings[0]?.toLowerCase()}
                </Text>
              </View>
            ))}

            {overlaps.map((w, i) => (
              <View key={i} style={styles.overlap}>
                <Text style={styles.overlapText}>{w}</Text>
              </View>
            ))}

            {elsewhere.length ? (
              <Card style={{ marginTop: 12 }}>
                <SectionLabel>What would help</SectionLabel>
                <Text style={[type.bodySoft, { fontSize: 13, marginBottom: 14 }]}>
                  You do not have these, but this is what a chemist would reach for.
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                  {elsewhere.map(({ medicine }) => (
                    <MedicineBox
                      key={medicine.id}
                      medicine={medicine}
                      width={84}
                      height={126}
                      onPress={() => router.push(`/medicine/${medicine.id}`)}
                    />
                  ))}
                </ScrollView>
              </Card>
            ) : null}
          </View>
        ) : (
          <View style={styles.hintBox}>
            <Text style={[type.bodySoft, { textAlign: 'center' }]}>
              Pick one or more symptoms above and I will go through what is on your shelves.
            </Text>
          </View>
        )}

        <Card style={{ marginTop: 12 }}>
          <SectionLabel>Anything I should know?</SectionLabel>
          <Text style={[type.bodySoft, { fontSize: 13, marginBottom: 12 }]}>
            These sharpen the answer above. They stay on your phone.
          </Text>
          <View style={styles.wrap}>
            {PROFILE_OPTIONS.map((p) => (
              <Chip
                key={p.key}
                label={p.label}
                active={!!settings.profile[p.key]}
                tone={colors.bad}
                onPress={() => toggleProfile(p.key)}
              />
            ))}
          </View>
        </Card>

        <View style={{ marginTop: 16 }}>
          <Disclaimer />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  top: {
    paddingHorizontal: 20, paddingBottom: 16,
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
  },
  close: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: alpha(colors.ink, 0.06),
    alignItems: 'center', justifyContent: 'center',
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },

  resultsTitle: { ...type.h1, marginBottom: 12, marginTop: 4 },
  row: {
    flexDirection: 'row', gap: 14,
    backgroundColor: colors.card, borderRadius: radius.lg,
    padding: 14, marginBottom: 10,
  },
  rowBody: { flex: 1, gap: 5 },
  rowName: { ...type.h2, marginTop: 2 },
  rowReason: { fontSize: 13.5, lineHeight: 19, color: colors.inkSoft },
  rowWarn: { fontSize: 12.5, lineHeight: 17, fontWeight: '600', marginTop: 2 },

  blockedRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    padding: 13, borderRadius: radius.md,
    backgroundColor: alpha(colors.bad, 0.06), marginBottom: 10,
  },
  blockedText: { flex: 1, fontSize: 13, lineHeight: 18, color: colors.ink },

  overlap: {
    padding: 13, borderRadius: radius.md,
    backgroundColor: alpha(colors.warn, 0.12), marginBottom: 10,
  },
  overlapText: { fontSize: 13, lineHeight: 18, color: '#7A5400', fontWeight: '500' },

  redFlag: {
    marginTop: 12, padding: 13, borderRadius: radius.md,
    backgroundColor: alpha(colors.bad, 0.08),
  },
  redFlagText: { fontSize: 13, lineHeight: 18, color: '#A32226', fontWeight: '500' },

  hintBox: { paddingVertical: 40, paddingHorizontal: 30 },
  doneBtn: {
    alignSelf: 'flex-start', marginTop: 2,
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999,
    backgroundColor: colors.ink,
  },
  doneText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
