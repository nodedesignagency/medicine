import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CloseIcon } from '../src/components/Icons';
import { Button, Card, Chip, Disclaimer, SectionLabel } from '../src/components/ui';
import { PROFILE_OPTIONS, ProfileKey } from '../src/logic/advisor';
import { HomeStyle, ShelfImages, useCabinet } from '../src/store/cabinet';
import { alpha, colors, font, radius, type } from '../src/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    settings, setApiKey, setProfile, setHomeStyle, setShelfImages, setCutoutKey,
    resetCabinet, medicines,
  } = useCabinet();
  const [draft, setDraft] = useState(settings.apiKey);
  const [saved, setSaved] = useState(false);
  const [cutDraft, setCutDraft] = useState(settings.cutoutKey);
  const [cutSaved, setCutSaved] = useState(false);

  const toggleProfile = (k: ProfileKey) =>
    setProfile({ ...settings.profile, [k]: !settings.profile[k] });

  return (
    <View style={styles.screen}>
      <View style={[styles.top, { paddingTop: insets.top + 10 }]}>
        <Text style={type.displaySm}>Settings</Text>
        <Pressable onPress={() => router.back()} style={styles.close} hitSlop={12} accessibilityLabel="Close">
          <CloseIcon />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 14, paddingBottom: insets.bottom + 40 }}
      >
        <Card>
          <SectionLabel>Home design</SectionLabel>
          <Text style={[type.bodySoft, { fontSize: 13.5, marginBottom: 12 }]}>
            Two versions of the cabinet screen. Switch freely — your medicines are the same in both.
          </Text>
          <View style={styles.wrap}>
            {([
              { id: 'glass', label: 'Glass shelves' },
              { id: 'shelf', label: 'Colour shelves' },
            ] as { id: HomeStyle; label: string }[]).map((o) => (
              <Chip
                key={o.id}
                label={o.label}
                active={settings.homeStyle === o.id}
                onPress={() => setHomeStyle(o.id)}
              />
            ))}
          </View>
        </Card>

        <Card style={{ marginTop: 12 }}>
          <SectionLabel>Camera recognition</SectionLabel>
          <Text style={[type.bodySoft, { fontSize: 13.5 }]}>
            Without a key the app runs in demo mode: the camera frames the shot and you pick the
            medicine from the built-in list. Paste an Anthropic API key and the camera reads the
            box itself, including medicines not in the list.
          </Text>

          <View style={styles.keyRow}>
            <TextInput
              value={draft}
              onChangeText={(t) => { setDraft(t); setSaved(false); }}
              placeholder="sk-ant-…"
              placeholderTextColor={colors.inkFaint}
              style={styles.keyInput}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
            />
          </View>

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            <View style={{ flex: 1 }}>
              <Button
                label={saved ? 'Saved' : 'Save key'}
                onPress={() => { setApiKey(draft.trim()); setSaved(true); }}
                disabled={!draft.trim() || saved}
              />
            </View>
            {settings.apiKey ? (
              <View style={{ flex: 1 }}>
                <Button
                  label="Clear"
                  tone="ghost"
                  onPress={() => { setApiKey(''); setDraft(''); setSaved(false); }}
                />
              </View>
            ) : null}
          </View>

          <Pressable onPress={() => Linking.openURL('https://console.anthropic.com/settings/keys')}>
            <Text style={styles.link}>Get a key at console.anthropic.com →</Text>
          </Pressable>

          <View style={styles.warnBox}>
            <Text style={styles.warnText}>
              The key is stored on this phone and sent straight to Anthropic from the app. That is
              fine for a prototype you are showing around — a shipped app would put a small server
              in between so the key never leaves it.
            </Text>
          </View>
        </Card>

        <Card style={{ marginTop: 12 }}>
          <SectionLabel>Shelf images</SectionLabel>
          <Text style={[type.bodySoft, { fontSize: 13.5, marginBottom: 12 }]}>
            Scanning keeps a photo of the pack. Photos show on the shelf when a medicine has
            one; everything else falls back to the drawn container.
          </Text>
          <View style={styles.wrap}>
            {([
              { id: 'photo', label: 'Photo when there is one' },
              { id: 'illustration', label: 'Always illustrations' },
            ] as { id: ShelfImages; label: string }[]).map((o) => (
              <Chip
                key={o.id}
                label={o.label}
                active={settings.shelfImages === o.id}
                onPress={() => setShelfImages(o.id)}
              />
            ))}
          </View>

          <Text style={[type.bodySoft, { fontSize: 13.5, marginTop: 16 }]}>
            With a remove.bg key, a photo of the pack in your hand is cut out — no hand, no
            background — so it stands on the shelf properly. The first 50 cutouts each month
            are free. Without a key the raw photo is kept instead.
          </Text>

          <View style={styles.keyRow}>
            <TextInput
              value={cutDraft}
              onChangeText={(t) => { setCutDraft(t); setCutSaved(false); }}
              placeholder="remove.bg API key"
              placeholderTextColor={colors.inkFaint}
              style={styles.keyInput}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
            />
          </View>

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            <View style={{ flex: 1 }}>
              <Button
                label={cutSaved ? 'Saved' : 'Save key'}
                onPress={() => { setCutoutKey(cutDraft.trim()); setCutSaved(true); }}
                disabled={!cutDraft.trim() || cutSaved}
              />
            </View>
            {settings.cutoutKey ? (
              <View style={{ flex: 1 }}>
                <Button
                  label="Clear"
                  tone="ghost"
                  onPress={() => { setCutoutKey(''); setCutDraft(''); setCutSaved(false); }}
                />
              </View>
            ) : null}
          </View>

          <Pressable onPress={() => Linking.openURL('https://www.remove.bg/api')}>
            <Text style={styles.link}>Get a free key at remove.bg →</Text>
          </Pressable>
        </Card>

        <Card style={{ marginTop: 12 }}>
          <SectionLabel>About you</SectionLabel>
          <Text style={[type.bodySoft, { fontSize: 13.5, marginBottom: 12 }]}>
            Used to flag medicines you should avoid. Stays on this phone.
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

        <Card style={{ marginTop: 12 }}>
          <SectionLabel>Cabinet</SectionLabel>
          <Text style={[type.bodySoft, { fontSize: 13.5, marginBottom: 12 }]}>
            {medicines.length} medicines on your shelves. Resetting puts back the starter set.
          </Text>
          <Button label="Reset to starter cabinet" tone="ghost" onPress={resetCabinet} />
        </Card>

        <View style={{ marginTop: 12 }}>
          <Disclaimer />
        </View>

        <Text style={styles.footer}>
          Cabinet · a concept build{'\n'}Medicine data is a hand-written reference set of common
          Indian household medicines.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  top: {
    paddingHorizontal: 20, paddingBottom: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  close: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: alpha(colors.ink, 0.06),
    alignItems: 'center', justifyContent: 'center',
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  keyRow: {
    marginTop: 14, height: 50, borderRadius: radius.md,
    backgroundColor: alpha(colors.ink, 0.045),
    paddingHorizontal: 14, justifyContent: 'center',
  },
  keyInput: { fontSize: 15, color: colors.ink, padding: 0 },
  link: { fontSize: 13, color: colors.accent, fontFamily: font.semibold, marginTop: 14 },
  warnBox: { marginTop: 14, padding: 12, borderRadius: radius.sm, backgroundColor: alpha(colors.warn, 0.1) },
  warnText: { fontSize: 12, lineHeight: 17, color: '#7A5400' },
  footer: { fontSize: 11.5, lineHeight: 17, color: colors.inkFaint, textAlign: 'center', marginTop: 24 },
});
