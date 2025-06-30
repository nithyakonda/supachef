import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Button from '@/components/ui/Button';

const { width, height } = Dimensions.get('window');

export default function OnboardingScreen() {
  const handleGetStarted = () => {
    router.push('/onboarding/welcome');
  };

  const handleSignIn = () => {
    // Navigate to the welcome screen with login mode
    router.push('/onboarding/welcome?mode=login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.topSection}>
          {/* Logo & App Name */}
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/app_icon_android.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.appName}>SupaChef</Text>
          </View>

          {/* Text Content */}
          <View style={styles.textContent}>
            <Text style={styles.subtitle}>Your AI Sous-Chef Awaits</Text>
            <Text style={styles.description}>
              Plan meals effortlessly, save recipes from anywhere, and let AI help you create the perfect weekly menu tailored to your taste and lifestyle.
            </Text>
          </View>
        </View>

        {/* Anchored Action Section */}
        <View style={styles.actionContainer}>
          <Button
            title="Get Started"
            onPress={handleGetStarted}
            variant="primary"
            size="large"
            style={styles.getStartedButton}
          />
          <TouchableOpacity onPress={handleSignIn}>
            <Text style={styles.loginText}>
              Already have an account? <Text style={styles.loginLink}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between', 
    paddingBottom: 32, 
    paddingTop: 64,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoImage: {
    width: 100,
    height: 100,
  },
  appName: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#F97966',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 48,
    flex: 1,
    justifyContent: 'center',
  },
  heroImage: {
    width: width * 0.8,
    height: width * 0.6,
    borderRadius: 20,
  },
  textContent: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 34,
  },
  description: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  actionContainer: {
    alignItems: 'center',
  },
  getStartedButton: {
    width: '100%',
    marginBottom: 16,
  },
  loginText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  loginLink: {
    color: '#F97966',
    fontFamily: 'Inter-SemiBold',
  },
});