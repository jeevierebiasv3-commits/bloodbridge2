import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider } from '@/components/ui/toast';
import { Colors } from '@/constants/theme';
import { useScheme } from '@/hooks/use-theme';
import { AppProvider, useAppStore } from '@/store/app-store';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { hydrated } = useAppStore();
  const scheme = useScheme();
  const colors = Colors[scheme];

  useEffect(() => {
    if (hydrated) void SplashScreen.hideAsync();
  }, [hydrated]);

  if (!hydrated) return null;

  const navTheme = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const theme = {
    ...navTheme,
    colors: {
      ...navTheme.colors,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      primary: colors.brand,
    },
  };

  return (
    <ThemeProvider value={theme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="request/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen
          name="request/new"
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen name="book" options={{ presentation: 'modal' }} />
        <Stack.Screen name="donor-card" options={{ presentation: 'modal' }} />
        <Stack.Screen name="article/[id]" options={{ presentation: 'card' }} />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <ToastProvider>
            <RootNavigator />
          </ToastProvider>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
