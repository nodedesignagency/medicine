import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, Easing, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CloseIcon, SearchIcon } from '../src/components/Icons';
import MedicineBox from '../src/components/MedicineBox';
import { Button } from '../src/components/ui';
import { MEDICINE_BY_ID } from '../src/data/medicines';
import { Medicine } from '../src/data/types';
import { recognizeMedicine, searchMedicines } from '../src/logic/ai';
import { cutout, keepPhoto } from '../src/logic/cutout';
import { useCabinet } from '../src/store/cabinet';
import { rememberPending } from '../src/store/pending';
import { alpha, colors, font, radius, shadow, type } from '../src/theme';

const FRAME_H = 250;
/** Shown in the picker before the user types anything. */
const COMMON = ['dolo650', 'combiflam', 'digene', 'cetzine', 'sinarest', 'eno', 'pudinhara', 'volini'];

type Phase =
  | { k: 'camera' }
  | { k: 'reading' }
  | { k: 'cutting' }
  | { k: 'picker'; note?: string }
  | { k: 'error'; message: string };

const buzz = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium) => {
  if (Platform.OS !== 'web') Haptics.impactAsync(style).catch(() => {});
};

export default function ScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { settings, add, has, setPhoto } = useCabinet();
  const camera = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<Phase>({ k: 'camera' });
  // Held between the shot and the moment a medicine is chosen.
  const [shot, setShot] = useState<string | undefined>();

  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sweep, { toValue: 1, duration: 1900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(sweep, { toValue: 0, duration: 1900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [sweep]);

  /**
   * Put the medicine away, and keep the photo of it. Scanning something you are holding
   * means you own it, so it goes on the shelf — the detail screen can still remove it.
   */
  const open = async (m: Medicine, photoUri = shot) => {
    rememberPending(m);
    if (!has(m.id)) add(m);

    if (!photoUri) {
      router.replace(`/medicine/${m.id}`);
      return;
    }

    let kept: string | undefined;
    try {
      kept = keepPhoto(photoUri, m.id);
      setPhoto(m.id, kept);
    } catch {
      // Keeping the photo is a bonus; never block the scan on it.
    }

    if (kept && settings.cutoutKey) {
      setPhase({ k: 'cutting' });
      const out = await cutout(kept, settings.cutoutKey, m.id);
      if (out.status === 'ok') setPhoto(m.id, out.uri);
    }

    router.replace(`/medicine/${m.id}`);
  };

  const capture = async () => {
    buzz();

    // Take the shot first either way — the photo is what ends up on the shelf, and it
    // does not depend on having an AI key.
    let photoUri: string | undefined;
    try {
      const photo = await camera.current?.takePictureAsync({ quality: 0.7 });
      photoUri = photo?.uri;
      setShot(photoUri);
    } catch {
      // A camera that will not return a photo still leaves the manual path open.
    }

    if (!settings.apiKey) {
      setPhase({
        k: 'picker',
        note: photoUri
          ? 'Pick what you photographed and it goes on the shelf. Add an AI key in Settings and the camera will name it itself.'
          : 'Demo mode — pick what you are holding. Add an AI key in Settings and the camera will read the box itself.',
      });
      return;
    }

    if (!photoUri) {
      setPhase({ k: 'error', message: 'The camera did not return a photo. Try again.' });
      return;
    }

    setPhase({ k: 'reading' });
    try {
      const outcome = await recognizeMedicine(photoUri, settings.apiKey);
      if (outcome.status === 'ok') {
        buzz(Haptics.ImpactFeedbackStyle.Light);
        await open(outcome.result.medicine, photoUri);
      } else if (outcome.status === 'not-found') {
        setPhase({ k: 'picker', note: 'Could not read a medicine name in that photo. Search for it instead.' });
      } else {
        setPhase({ k: 'error', message: outcome.message });
      }
    } catch (e) {
      setPhase({ k: 'error', message: e instanceof Error ? e.message : 'Something went wrong.' });
    }
  };

  if (!permission) return <View style={styles.screen} />;

  if (!permission.granted) {
    return (
      <View style={[styles.screen, styles.center, { padding: 30 }]}>
        <Text style={[type.displaySm, { textAlign: 'center' }]}>Let the camera see{'\n'}your medicine</Text>
        <Text style={[type.bodySoft, { textAlign: 'center', marginTop: 12 }]}>
          The photo is used to read the label. Nothing is stored.
        </Text>
        <View style={{ height: 24 }} />
        <Button label="Allow camera" onPress={requestPermission} />
        <View style={{ height: 10 }} />
        <Button label="Search by name instead" tone="ghost" onPress={() => setPhase({ k: 'picker' })} />
        <View style={{ height: 10 }} />
        <Button label="Close" tone="ghost" onPress={() => router.back()} />
        {phase.k === 'picker' ? (
          <Picker note={phase.note} onPick={open} onClose={() => setPhase({ k: 'camera' })} />
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <CameraView ref={camera} style={StyleSheet.absoluteFill} facing="back" />

      <View style={styles.scrim} pointerEvents="box-none">
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => router.back()} style={styles.round} hitSlop={12} accessibilityLabel="Close">
            <CloseIcon color="#FFFFFF" />
          </Pressable>
          <Text style={styles.topTitle}>Scan a medicine</Text>
          <View style={styles.round} />
        </View>

        <View style={styles.frameWrap}>
          <View style={styles.frame}>
            <Corner pos="tl" /><Corner pos="tr" /><Corner pos="bl" /><Corner pos="br" />
            <Animated.View
              style={[
                styles.sweep,
                {
                  transform: [
                    { translateY: sweep.interpolate({ inputRange: [0, 1], outputRange: [6, FRAME_H - 6] }) },
                  ],
                },
              ]}
            />
          </View>
          <Text style={styles.hint}>Line up the name on the box or strip</Text>
        </View>

        <View style={[styles.bottom, { paddingBottom: insets.bottom + 22 }]}>
          <Pressable onPress={() => setPhase({ k: 'picker' })} hitSlop={10}>
            <Text style={styles.typeLink}>Type the name instead</Text>
          </Pressable>

          <Pressable
            onPress={capture}
            disabled={phase.k === 'reading'}
            style={({ pressed }) => [styles.shutter, pressed && { transform: [{ scale: 0.94 }] }]}
            accessibilityLabel="Take photo"
          >
            <View style={styles.shutterInner} />
          </Pressable>

          <Text style={styles.mode}>
            {settings.apiKey ? 'AI reading is on' : 'Demo mode'}
            {settings.cutoutKey ? ' · cutout on' : ''}
          </Text>
        </View>
      </View>

      {phase.k === 'reading' || phase.k === 'cutting' ? (
        <View style={styles.reading}>
          <ActivityIndicator color="#FFFFFF" />
          <Text style={styles.readingText}>
            {phase.k === 'cutting' ? 'Cutting it out of the photo…' : 'Reading the label…'}
          </Text>
        </View>
      ) : null}

      {phase.k === 'error' ? (
        <View style={styles.reading}>
          <Text style={styles.readingText}>{phase.message}</Text>
          <View style={{ height: 16 }} />
          <Button label="Try again" tone="ghost" onPress={() => setPhase({ k: 'camera' })} />
        </View>
      ) : null}

      {phase.k === 'picker' ? (
        <Picker note={phase.note} onPick={open} onClose={() => setPhase({ k: 'camera' })} />
      ) : null}
    </View>
  );
}

function Corner({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  return <View style={[styles.corner, styles[pos]]} />;
}

/** Search sheet — the fallback path, and the whole flow when there is no API key. */
function Picker({
  note, onPick, onClose,
}: {
  note?: string;
  onPick: (m: Medicine) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const results = q.trim()
    ? searchMedicines(q)
    : COMMON.flatMap((id) => (MEDICINE_BY_ID[id] ? [MEDICINE_BY_ID[id]] : []));

  return (
    <View style={styles.sheetWrap}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Dismiss" />
      <View style={[styles.sheet, shadow.card, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.grabber} />
        {note ? <Text style={styles.note}>{note}</Text> : null}

        <View style={styles.search}>
          <SearchIcon />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Dolo, Combiflam, Digene…"
            placeholderTextColor={colors.inkFaint}
            style={styles.searchInput}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>

        <Text style={styles.sheetLabel}>{q.trim() ? `${results.length} found` : 'Common at home'}</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sheetRail}>
          {results.map((m) => (
            <MedicineBox key={m.id} medicine={m} width={88} height={132} onPress={() => onPick(m)} />
          ))}
          {results.length === 0 ? (
            <Text style={[type.bodySoft, { paddingVertical: 30 }]}>
              Nothing matches “{q}”. Try the brand on the front of the box.
            </Text>
          ) : null}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0B0B0F' },
  center: { alignItems: 'center', justifyContent: 'center' },

  scrim: { flex: 1, backgroundColor: 'rgba(8,8,14,0.42)', justifyContent: 'space-between' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingBottom: 10 },
  topTitle: { color: '#FFFFFF', fontSize: 15, fontFamily: font.bold, letterSpacing: -0.2 },
  round: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center', justifyContent: 'center',
  },

  frameWrap: { alignItems: 'center' },
  frame: {
    width: '78%', height: FRAME_H, borderRadius: radius.lg,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
    overflow: 'hidden',
  },
  corner: { position: 'absolute', width: 26, height: 26, borderColor: '#FFFFFF' },
  tl: { top: 10, left: 10, borderTopWidth: 2.5, borderLeftWidth: 2.5, borderTopLeftRadius: 8 },
  tr: { top: 10, right: 10, borderTopWidth: 2.5, borderRightWidth: 2.5, borderTopRightRadius: 8 },
  bl: { bottom: 10, left: 10, borderBottomWidth: 2.5, borderLeftWidth: 2.5, borderBottomLeftRadius: 8 },
  br: { bottom: 10, right: 10, borderBottomWidth: 2.5, borderRightWidth: 2.5, borderBottomRightRadius: 8 },
  sweep: {
    position: 'absolute', left: 12, right: 12, height: 2,
    backgroundColor: 'rgba(255,255,255,0.85)',
    shadowColor: '#FFFFFF', shadowOpacity: 0.9, shadowRadius: 8, shadowOffset: { width: 0, height: 0 },
  },
  hint: { color: 'rgba(255,255,255,0.72)', fontSize: 13, marginTop: 16, fontFamily: font.medium },

  bottom: { alignItems: 'center', gap: 16, paddingTop: 10 },
  typeLink: { color: 'rgba(255,255,255,0.8)', fontSize: 13.5, fontFamily: font.semibold, textDecorationLine: 'underline' },
  shutter: {
    width: 74, height: 74, borderRadius: 37,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center', justifyContent: 'center',
  },
  shutterInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#FFFFFF' },
  mode: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontFamily: font.bold, letterSpacing: 0.8, textTransform: 'uppercase' },

  reading: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(8,8,14,0.82)',
    alignItems: 'center', justifyContent: 'center', padding: 40, gap: 14,
  },
  readingText: { color: '#FFFFFF', fontSize: 15, fontFamily: font.semibold, textAlign: 'center', lineHeight: 21 },

  sheetWrap: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'flex-end', backgroundColor: 'rgba(8,8,14,0.4)',
  },
  sheet: {
    backgroundColor: colors.page,
    borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    paddingTop: 10, paddingHorizontal: 18,
  },
  grabber: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: colors.line, marginBottom: 14 },
  note: { fontSize: 13, lineHeight: 18, color: colors.inkSoft, marginBottom: 14 },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.card, borderRadius: radius.md,
    paddingHorizontal: 14, height: 50,
  },
  searchInput: { flex: 1, fontSize: 15.5, color: colors.ink, padding: 0 },
  sheetLabel: { ...type.micro, marginTop: 18, marginBottom: 10 },
  sheetRail: { gap: 10, paddingBottom: 18, paddingRight: 18 },
});
