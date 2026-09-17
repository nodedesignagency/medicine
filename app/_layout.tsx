import {
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
  InstrumentSans_700Bold,
} from '@expo-google-fonts/instrument-sans';
import { InstrumentSerif_400Regular } from '@expo-google-fonts/instrument-serif';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CabinetProvider } from '../src/store/cabinet';
import { colors, glass } from '../src/theme';

export default function RootLayout() {
  // Custom fonts carry no weight synthesis, so each cut is registered by name.
  const [fontsLoaded, fontError] = useFonts({
    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    InstrumentSans_600SemiBold,
    InstrumentSans_700Bold,
    InstrumentSerif_400Regular,
  });

  // A font that fails to load should fall back to the system face, not block the app.
  if (!fontsLoaded && !fontError) {
    return <View style={{ flex: 1, backgroundColor: glass.base }} />;
  }

  return (
    <SafeAreaProvider>
      <CabinetProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.page },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="scan" options={{ animation: 'fade' }} />
          <Stack.Screen name="ask" options={{ presentation: 'modal' }} />
          <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
          <Stack.Screen name="medicine/[id]" options={{ animation: 'slide_from_right' }} />
        </Stack>
      </CabinetProvider>
    </SafeAreaProvider>
  );
}
