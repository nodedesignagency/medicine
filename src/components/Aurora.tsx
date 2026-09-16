import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { glass } from '../theme';

const clear = 'rgba(255,255,255,0)';

/**
 * The iridescent wash behind the glass home screen. React Native has no blur filter
 * that behaves the same on both platforms, so the softness comes from stacking wide
 * colour-to-transparent gradients rather than blurring a mesh.
 */
export default function Aurora() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={[glass.base, '#F2F8FB', '#F7FBFD']}
        locations={[0, 0.45, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Warm pink, anchored top-left. */}
      <LinearGradient
        colors={['rgba(246,203,228,0.95)', 'rgba(246,203,228,0.35)', clear]}
        locations={[0, 0.45, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={[styles.layer, { height: '44%' }]}
      />

      {/* Cool cyan, anchored top-right, crossing the pink. */}
      <LinearGradient
        colors={['rgba(176,231,244,0.95)', 'rgba(176,231,244,0.3)', clear]}
        locations={[0, 0.5, 1]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.15, y: 1 }}
        style={[styles.layer, { height: '40%' }]}
      />

      {/* A lilac seam where the two meet, which is what makes it read as iridescent. */}
      <LinearGradient
        colors={[clear, 'rgba(214,209,248,0.5)', clear]}
        locations={[0, 0.5, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.95, y: 0.9 }}
        style={[styles.layer, { height: '30%' }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', left: 0, right: 0, top: 0 },
});
