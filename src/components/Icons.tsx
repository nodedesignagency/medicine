import React from 'react';
import { StyleSheet, View } from 'react-native';

/** Small geometric icons drawn with plain views — no icon font dependency. */

export function CameraIcon({ color = '#FFFFFF', size = 18 }: { color?: string; size?: number }) {
  return (
    <View style={{ width: size, height: size * 0.82, justifyContent: 'flex-end' }}>
      <View style={[styles.camBump, { borderColor: color, width: size * 0.4, height: size * 0.2 }]} />
      <View style={[styles.camBody, { borderColor: color, height: size * 0.62 }]}>
        <View style={[styles.camLens, { borderColor: color, width: size * 0.3, height: size * 0.3, borderRadius: size * 0.15 }]} />
      </View>
    </View>
  );
}

export function SearchIcon({ color = '#63636E', size = 16 }: { color?: string; size?: number }) {
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={{
          width: size * 0.72, height: size * 0.72, borderRadius: size * 0.36,
          borderWidth: 1.6, borderColor: color,
        }}
      />
      <View
        style={{
          position: 'absolute', right: 0, bottom: 0,
          width: size * 0.36, height: 1.6, backgroundColor: color,
          transform: [{ rotate: '45deg' }],
        }}
      />
    </View>
  );
}

/** Three stacked bars — the "close" affordance on full-bleed screens reads better as an X. */
export function CloseIcon({ color = '#0B0B0F', size = 14 }: { color?: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', width: size, height: 1.8, backgroundColor: color, transform: [{ rotate: '45deg' }] }} />
      <View style={{ position: 'absolute', width: size, height: 1.8, backgroundColor: color, transform: [{ rotate: '-45deg' }] }} />
    </View>
  );
}

export function BackIcon({ color = '#0B0B0F', size = 14 }: { color?: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', width: size * 0.62, height: 1.8, backgroundColor: color, transform: [{ translateX: -size * 0.16 }, { translateY: -size * 0.21 }, { rotate: '-45deg' }] }} />
      <View style={{ position: 'absolute', width: size * 0.62, height: 1.8, backgroundColor: color, transform: [{ translateX: -size * 0.16 }, { translateY: size * 0.21 }, { rotate: '45deg' }] }} />
    </View>
  );
}

const styles = StyleSheet.create({
  camBump: {
    borderTopLeftRadius: 2, borderTopRightRadius: 2,
    borderWidth: 1.6, borderBottomWidth: 0,
    marginLeft: 3,
  },
  camBody: {
    borderWidth: 1.6, borderRadius: 3,
    alignItems: 'center', justifyContent: 'center',
  },
  camLens: { borderWidth: 1.6 },
});
