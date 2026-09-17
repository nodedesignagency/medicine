import React from 'react';
import { StyleSheet, Text, TextStyle } from 'react-native';
import { colors, glass, type } from '../theme';

/**
 * The headline is the status. Counts and the phrase that matters are set in black and
 * underlined; everything else drops back to grey so the sentence reads at a glance.
 *
 * `textDecorationColor` is documented iOS-only, but it is also honoured on web and simply
 * ignored on Android — so it is set unconditionally rather than gated to one platform.
 * Android therefore draws the underline in the text colour, which still reads as emphasis.
 */
const strong: TextStyle = {
  color: colors.ink,
  textDecorationLine: 'underline',
  textDecorationColor: glass.underline,
};

type Props = { total: number; expired: number; soon: number };

export default function HeroSentence({ total, expired, soon }: Props) {
  const noun = total === 1 ? 'medicine' : 'medicines';

  return (
    <Text style={[type.serifDisplay, styles.muted]} accessibilityRole="header">
      <Text style={styles.muted}>You have </Text>
      <Text style={strong}>{total} {noun}</Text>
      <Text style={styles.muted}> at home</Text>

      {expired ? (
        <>
          <Text style={styles.muted}>, </Text>
          <Text style={strong}>{expired}</Text>
          <Text style={styles.muted}>{expired === 1 ? ' has ' : ' have '}</Text>
          <Text style={strong}>already expired.</Text>
        </>
      ) : soon ? (
        <>
          <Text style={styles.muted}>, </Text>
          <Text style={strong}>{soon}</Text>
          <Text style={styles.muted}>{soon === 1 ? ' is ' : ' are '}getting </Text>
          <Text style={strong}>expired soon.</Text>
        </>
      ) : (
        <>
          <Text style={styles.muted}> and </Text>
          <Text style={strong}>all of them are in date.</Text>
        </>
      )}
    </Text>
  );
}

const styles = StyleSheet.create({
  muted: { color: '#9A9AA4' },
});
