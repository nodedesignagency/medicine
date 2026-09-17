import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Verdict } from '../logic/advisor';
import { alpha, colors, font, radius, shadow, type } from '../theme';

export function Chip({
  label, active, onPress, count, tone,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  count?: number;
  tone?: string;
}) {
  const accent = tone ?? colors.accent;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active && { backgroundColor: alpha(accent, 0.14), borderColor: alpha(accent, 0.4) },
        pressed && { opacity: 0.7 },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
    >
      <Text style={[styles.chipText, active && { color: accent }]}>{label}</Text>
      {count !== undefined ? (
        <View style={[styles.chipCount, active && { backgroundColor: alpha(accent, 0.18) }]}>
          <Text style={[styles.chipCountText, active && { color: accent }]}>{count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, shadow.card, style]}>{children}</View>;
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

const VERDICT_STYLE: Record<Verdict, { bg: string; fg: string; mark: string }> = {
  yes: { bg: alpha(colors.good, 0.12), fg: colors.good, mark: '✓' },
  caution: { bg: alpha(colors.warn, 0.14), fg: '#9A6B00', mark: '!' },
  no: { bg: alpha(colors.bad, 0.12), fg: colors.bad, mark: '✕' },
  'wrong-fit': { bg: alpha(colors.inkSoft, 0.1), fg: colors.inkSoft, mark: '—' },
};

export function VerdictBadge({ verdict, label }: { verdict: Verdict; label?: string }) {
  const s = VERDICT_STYLE[verdict];
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.badgeMark, { color: s.fg }]}>{s.mark}</Text>
      {label ? <Text style={[styles.badgeText, { color: s.fg }]}>{label}</Text> : null}
    </View>
  );
}

export function verdictColor(v: Verdict) {
  return VERDICT_STYLE[v].fg;
}

/** Health advice from an app needs this said out loud, not buried in a settings page. */
export function Disclaimer({ compact }: { compact?: boolean }) {
  return (
    <View style={[styles.disclaimer, compact && styles.disclaimerCompact]}>
      <Text style={styles.disclaimerText}>
        {compact
          ? 'General information, not medical advice.'
          : 'This is general information about common medicines — not medical advice, and not a diagnosis. When something is severe, unusual, or not getting better, see a doctor or pharmacist.'}
      </Text>
    </View>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

export function Button({
  label, onPress, tone = 'primary', disabled,
}: {
  label: string;
  onPress?: () => void;
  tone?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        tone === 'primary' && styles.btnPrimary,
        tone === 'ghost' && styles.btnGhost,
        tone === 'danger' && styles.btnDanger,
        pressed && { opacity: 0.82 },
        disabled && { opacity: 0.4 },
      ]}
      accessibilityRole="button"
    >
      <Text
        style={[
          styles.btnText,
          tone === 'primary' && { color: '#FFFFFF' },
          tone === 'ghost' && { color: colors.ink },
          tone === 'danger' && { color: colors.bad },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: alpha(colors.ink, 0.045),
    borderWidth: 1, borderColor: 'transparent',
  },
  chipText: { fontSize: 14, fontFamily: font.semibold, color: colors.inkSoft, letterSpacing: -0.2 },
  chipCount: {
    minWidth: 20, paddingHorizontal: 5, paddingVertical: 1,
    borderRadius: 999, backgroundColor: alpha(colors.ink, 0.07),
    alignItems: 'center',
  },
  chipCountText: { fontSize: 11, fontFamily: font.bold, color: colors.inkFaint },

  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 18 },
  sectionLabel: { ...type.micro, textTransform: 'uppercase', marginBottom: 8 },

  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999,
    alignSelf: 'flex-start',
  },
  badgeMark: { fontSize: 12, fontFamily: font.bold },
  badgeText: { fontSize: 12, fontFamily: font.bold, letterSpacing: -0.1 },

  disclaimer: {
    backgroundColor: alpha(colors.ink, 0.04),
    borderRadius: radius.md,
    padding: 14,
  },
  disclaimerCompact: { padding: 10, borderRadius: radius.sm },
  disclaimerText: { fontSize: 12, lineHeight: 17, color: colors.inkSoft },

  divider: { height: 1, backgroundColor: colors.line, marginVertical: 16 },

  btn: {
    height: 52, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 20,
  },
  btnPrimary: { backgroundColor: colors.ink },
  btnGhost: { backgroundColor: alpha(colors.ink, 0.06) },
  btnDanger: { backgroundColor: alpha(colors.bad, 0.1) },
  btnText: { fontSize: 15, fontFamily: font.bold, letterSpacing: -0.2 },
});
