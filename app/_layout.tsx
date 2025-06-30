import { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { supabase } from '@/utils/supabase';
import { preferenceService } from '@/services/preferenceService';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();

  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [isOnboardingCheckComplete, setIsOnboardingCheckComplete] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  // Check authentication status on app start
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsAuthenticated(false);
      } finally {
        setIsAuthChecked(true);
      }
    };

    checkAuthStatus();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      setIsAuthChecked(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check onboarding completion status for authenticated users
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (isAuthChecked && isAuthenticated) {
        try {
          const userPreferences = await preferenceService.getUserPreferences();
          setIsOnboardingComplete(!!userPreferences);
        } catch (error) {
          console.error('Error checking onboarding status:', error);
          setIsOnboardingComplete(false);
        } finally {
          setIsOnboardingCheckComplete(true);
        }
      } else if (isAuthChecked && !isAuthenticated) {
        // If not authenticated, skip onboarding check
        setIsOnboardingCheckComplete(true);
      }
    };

    checkOnboardingStatus();
  }, [isAuthenticated, isAuthChecked]);

  // Handle authentication-based navigation
  useEffect(() => {
    if (isAuthChecked && isOnboardingCheckComplete) {
      if (isAuthenticated) {
        if (isOnboardingComplete) {
          router.replace('/(tabs)');
        } else {
          router.replace('/onboarding/preferences');
        }
      } else {
        router.replace('/onboarding');
      }
    }
  }, [isAuthenticated, isAuthChecked, isOnboardingComplete, isOnboardingCheckComplete, router]);

  // Hide splash screen when fonts are loaded, auth is checked, and onboarding status is determined
  useEffect(() => {
    if ((fontsLoaded || fontError) && isAuthChecked && isOnboardingCheckComplete) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, isAuthChecked, isOnboardingCheckComplete]);

  // Keep splash screen visible until all checks are complete
  if ((!fontsLoaded && !fontError) || !isAuthChecked || !isOnboardingCheckComplete) {
    return null;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
    </>
  );
}