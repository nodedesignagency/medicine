import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CabinetProvider } from '../src/store/cabinet';
import { colors } from '../src/theme';

export default function RootLayout() {
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
