import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackIcon } from '../../src/components/Icons';
import MedicineBox from '../../src/components/MedicineBox';
import { Button, Card, Chip, Disclaimer, Divider, SectionLabel, VerdictBadge, verdictColor } from '../../src/components/ui';
import { CATEGORY_BY_ID, MEDICINE_BY_ID } from '../../src/data/medicines';
import { SYMPTOMS, symptomLabel } from '../../src/data/symptoms';
import { SymptomId } from '../../src/data/types';
import { advise, PROFILE_OPTIONS, RED_FLAGS } from '../../src/logic/advisor';
import { expiryLabel, expiryStatus, useCabinet } from '../../src/store/cabinet';
import { getPending } from '../../src/store/pending';
import { alpha, colors, radius, shelfTints, type } from '../../src/theme';

const tap = () => {
  if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
};

export default function MedicineScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { resolve, has, add, remove, itemFor, settings } = useCabinet();

  const medicine = useMemo(
    () => (id ? resolve(id) ?? MEDICINE_BY_ID[id] ?? getPending(id) : undefined),
    [id, resolve]
  );

  const [checking, setChecking] = useState(false);
  const [picked, setPicked] = useState<SymptomId[]>([]);
  // Collapse the 25-chip grid once something is picked, so the verdict is not below the fold.
  const [expanded, setExpanded] = useState(true);

  if (!medicine) {
    return (
      <View style={[styles.screen, styles.center]}>
        <Text style={type.h1}>Not found</Text>
        <View style={{ height: 12 }} />
        <Button label="Go back" tone="ghost" onPress={() => router.back()} />
      </View>
    );
  }

  const inCabinet = has(medicine.id);
  const item = itemFor(medicine.id);
  const tint = shelfTints[medicine.category];
  const category = CATEGORY_BY_ID[medicine.category];
  const advice = picked.length ? advise(medicine, picked, settings.profile) : null;
  const activeProfile = PROFILE_OPTIONS.filter((p) => settings.profile[p.key]);

  const toggle = (s: SymptomId) => {
    tap();
    const next = picked.includes(s) ? picked.filter((x) => x !== s) : [...picked, s];
    setPicked(next);
    if (!picked.length && next.length) setExpanded(false);
  };

  const grouped = SYMPTOMS.reduce<Record<string, typeof SYMPTOMS>>((acc, s) => {
    (acc[s.group] ??= []).push(s);
    return acc;
  }, {});

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        <View style={[styles.hero, { backgroundColor: alpha(tint, 0.16), paddingTop: insets.top + 10 }]}>
          <Pressable onPress={() => router.back()} hitSlop={14} style={styles.back} accessibilityLabel="Back">
            <BackIcon />
          </Pressable>

          <View style={styles.heroBody}>
            <MedicineBox medicine={medicine} width={112} height={172} />
            <View style={styles.heroCopy}>
              <Text style={styles.maker}>{medicine.maker}</Text>
              <Text style={styles.brand}>{medicine.brand}</Text>
              <Text style={styles.salt}>{medicine.salt}</Text>
              <View style={styles.tags}>
                <Tag label={category?.title ?? medicine.category} tone={tint} />
                <Tag label={medicine.form} />
                {medicine.rx ? <Tag label="Prescription" tone={colors.bad} /> : null}
              </View>
            </View>
          </View>

          {item ? (
            <View style={styles.expiryRow}>
              <View
                style={[
                  styles.expiryDot,
                  {
                    backgroundColor:
                      expiryStatus(item) === 'expired' ? colors.bad
                      : expiryStatus(item) === 'soon' ? colors.warn
                      : colors.good,
                  },
                ]}
              />
              <Text style={styles.expiryText}>{expiryLabel(item)}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          <Card>
            <SectionLabel>What it is for</SectionLabel>
            <Text style={type.body}>{medicine.whatItDoes}</Text>

            {medicine.treats.length ? (
              <>
                <Divider />
                <SectionLabel>Helps with</SectionLabel>
                <View style={styles.wrap}>
                  {medicine.treats.map((s) => (
                    <View key={s} style={[styles.treatChip, { backgroundColor: alpha(tint, 0.14) }]}>
                      <Text style={[styles.treatText, { color: colors.ink }]}>{symptomLabel(s)}</Text>
                    </View>
                  ))}
                  {(medicine.alsoHelps ?? []).map((s) => (
                    <View key={s} style={styles.treatChipSoft}>
                      <Text style={styles.treatTextSoft}>{symptomLabel(s)} · a bit</Text>
                    </View>
                  ))}
                </View>
              </>
            ) : null}
          </Card>

          <Card style={{ marginTop: 12 }}>
            <SectionLabel>How to take it</SectionLabel>
            <View style={styles.doseGrid}>
              <Dose label="Dose" value={medicine.dose} />
              <Dose label="How often" value={medicine.every} />
              <Dose label="Most in a day" value={medicine.maxPerDay} />
              <Dose
                label="Food"
                value={
                  medicine.food === 'before' ? 'Before food'
                  : medicine.food === 'after' ? 'After food'
                  : 'With or without food'
                }
              />
            </View>
          </Card>

          {medicine.avoid.length ? (
            <Card style={{ marginTop: 12 }}>
              <SectionLabel>Watch out for</SectionLabel>
              {medicine.avoid.map((a, i) => (
                <View key={i} style={styles.avoidRow}>
                  <View style={styles.avoidDot} />
                  <Text style={[type.body, { flex: 1 }]}>{a}</Text>
                </View>
              ))}
            </Card>
          ) : null}

          {/* The question this whole app exists to answer. */}
          <Card style={{ marginTop: 12 }}>
            {!checking ? (
              <Pressable onPress={() => { tap(); setChecking(true); }} style={styles.checkCta}>
                <View style={{ flex: 1 }}>
                  <Text style={type.h2}>Can I take this right now?</Text>
                  <Text style={[type.bodySoft, { fontSize: 13, marginTop: 3 }]}>
                    Pick what is wrong and I will check it against this medicine.
                  </Text>
                </View>
                <Text style={styles.checkArrow}>›</Text>
              </Pressable>
            ) : (
              <>
                {picked.length && !expanded ? (
                  <>
                    <SectionLabel>You said</SectionLabel>
                    <View style={[styles.wrap, { marginBottom: 16 }]}>
                      {picked.map((id) => (
                        <Chip key={id} label={symptomLabel(id)} active tone={tint} onPress={() => toggle(id)} />
                      ))}
                      <Chip label="+ Add another" onPress={() => setExpanded(true)} />
                    </View>
                  </>
                ) : (
                  <>
                    <SectionLabel>What is wrong?</SectionLabel>
                    {Object.entries(grouped).map(([group, list]) => (
                      <View key={group} style={{ marginBottom: 12 }}>
                        <Text style={styles.groupLabel}>{group}</Text>
                        <View style={styles.wrap}>
                          {list.map((s) => (
                            <Chip
                              key={s.id}
                              label={s.label}
                              active={picked.includes(s.id)}
                              tone={tint}
                              onPress={() => toggle(s.id)}
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
                )}

                {advice ? (
                  <View style={[styles.verdict, { borderColor: alpha(verdictColor(advice.verdict), 0.3) }]}>
                    <VerdictBadge verdict={advice.verdict} label={advice.headline} />
                    <Text style={[type.body, { marginTop: 10 }]}>{advice.reason}</Text>

                    {advice.warnings.map((w, i) => (
                      <View key={i} style={styles.warnRow}>
                        <Text style={styles.warnMark}>!</Text>
                        <Text style={[type.body, { flex: 1, fontSize: 14 }]}>{w}</Text>
                      </View>
                    ))}

                    {picked.map((s) =>
                      RED_FLAGS[s] ? (
                        <View key={s} style={styles.redFlag}>
                          <Text style={styles.redFlagText}>{RED_FLAGS[s]}</Text>
                        </View>
                      ) : null
                    )}

                    {activeProfile.length ? (
                      <Text style={styles.profileNote}>
                        Checked against: {activeProfile.map((p) => p.label.toLowerCase()).join(', ')}.
                      </Text>
                    ) : (
                      <Pressable onPress={() => router.push('/settings')}>
                        <Text style={styles.profileLink}>
                          Add your health details for a sharper answer →
                        </Text>
                      </Pressable>
                    )}
                  </View>
                ) : null}
              </>
            )}
          </Card>

          <View style={{ marginTop: 12 }}>
            <Disclaimer />
          </View>

          <View style={{ marginTop: 16 }}>
            {inCabinet ? (
              <Button
                label="Remove from cabinet"
                tone="danger"
                onPress={() => { tap(); remove(medicine.id); }}
              />
            ) : (
              <Button
                label="Add to my cabinet"
                onPress={() => { tap(); add(medicine); }}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Tag({ label, tone }: { label: string; tone?: string }) {
  return (
    <View style={[styles.tag, tone ? { backgroundColor: alpha(tone, 0.18) } : null]}>
      <Text style={[styles.tagText, tone ? { color: colors.ink } : null]}>{label}</Text>
    </View>
  );
}

function Dose({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.doseCell}>
      <Text style={styles.doseLabel}>{label}</Text>
      <Text style={styles.doseValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  center: { alignItems: 'center', justifyContent: 'center' },

  hero: { paddingHorizontal: 20, paddingBottom: 22, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  back: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: alpha('#FFFFFF', 0.7),
    alignItems: 'center', justifyContent: 'center',
  },
  heroBody: { flexDirection: 'row', gap: 16, marginTop: 18, alignItems: 'flex-start' },
  heroCopy: { flex: 1, paddingTop: 4 },
  maker: { ...type.micro, textTransform: 'uppercase' },
  brand: { ...type.displaySm, fontSize: 28, lineHeight: 30, marginTop: 5 },
  salt: { fontSize: 13, color: colors.inkSoft, marginTop: 6, lineHeight: 18 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  tag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: alpha(colors.ink, 0.07) },
  tagText: { fontSize: 11.5, fontWeight: '600', color: colors.inkSoft, textTransform: 'capitalize' },

  expiryRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 16 },
  expiryDot: { width: 7, height: 7, borderRadius: 4 },
  expiryText: { fontSize: 12.5, fontWeight: '600', color: colors.inkSoft },

  body: { padding: 14 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  groupLabel: { ...type.micro, marginBottom: 7 },

  treatChip: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999 },
  treatText: { fontSize: 13, fontWeight: '600' },
  treatChipSoft: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999, backgroundColor: alpha(colors.ink, 0.05) },
  treatTextSoft: { fontSize: 13, fontWeight: '500', color: colors.inkFaint },

  doseGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  doseCell: { width: '50%', paddingRight: 10, marginBottom: 14 },
  doseLabel: { ...type.micro, marginBottom: 4 },
  doseValue: { fontSize: 14, fontWeight: '600', color: colors.ink, lineHeight: 19 },

  avoidRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  avoidDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.warn, marginTop: 8 },

  checkCta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkArrow: { fontSize: 26, color: colors.inkFaint },

  verdict: { borderWidth: 1, borderRadius: radius.md, padding: 14, marginTop: 4 },
  warnRow: { flexDirection: 'row', gap: 9, marginTop: 10, alignItems: 'flex-start' },
  warnMark: {
    width: 18, height: 18, borderRadius: 9, textAlign: 'center', lineHeight: 18,
    backgroundColor: alpha(colors.warn, 0.18), color: '#9A6B00', fontSize: 11, fontWeight: '800',
  },
  redFlag: {
    marginTop: 12, padding: 11, borderRadius: radius.sm,
    backgroundColor: alpha(colors.bad, 0.08),
  },
  redFlagText: { fontSize: 13, lineHeight: 18, color: '#A32226', fontWeight: '500' },
  profileNote: { fontSize: 12, color: colors.inkFaint, marginTop: 12 },
  profileLink: { fontSize: 12.5, color: colors.accent, marginTop: 12, fontWeight: '600' },
  doneBtn: {
    alignSelf: 'flex-start', marginBottom: 16,
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999,
    backgroundColor: colors.ink,
  },
  doneText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
