import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';

const clear = 'rgba(255,255,255,0)';

/**
 * The wash behind the glass home screen: white, with a cyan glow anchored top-right and
 * a trace of lavender on the left. React Native has no blur filter that behaves the same
 * on both platforms, so the softness comes from stacked colour-to-transparent gradients.
 */
export default function Aurora() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={['#FFFFFF', '#F6FBFD', '#F2F9FC']}
        locations={[0, 0.5, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <LinearGradient
        colors={['rgba(150, 226, 246, 0.9)', 'rgba(176, 234, 247, 0.34)', clear]}
        locations={[0, 0.48, 1]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.08, y: 1 }}
        style={[styles.layer, { height: '46%' }]}
      />

      <LinearGradient
        colors={['rgba(219, 214, 246, 0.42)', clear]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.75, y: 1 }}
        style={[styles.layer, { height: '30%' }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', left: 0, right: 0, top: 0 },
});
