import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Button from '@/components/ui/Button';

const { width, height } = Dimensions.get('window');

export default function OnboardingScreen() {
  const handleGetStarted = () => {
    router.push('/onboarding/welcome');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo/Icon */}
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>👨‍🍳</Text>
          </View>
          <Text style={styles.appName}>SupaChef</Text>
        </View>

        {/* Hero Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg' }}
            style={styles.heroImage}
          />
        </View>

        {/* Content */}
        <View style={styles.textContent}>
          <Text style={styles.title}>Your AI Sous-Chef Awaits</Text>
          <Text style={styles.description}>
            Plan meals effortlessly, save recipes from anywhere, and let AI help you create the perfect weekly menu tailored to your taste.
          </Text>
        </View>

        {/* Action Button */}
        <View style={styles.actionContainer}>
          <Button
            title="Get Started"
            onPress={handleGetStarted}
            variant="primary"
            size="large"
            style={styles.getStartedButton}
          />
          <Text style={styles.loginText}>
            Already have an account?{' '}
            <Text style={styles.loginLink}>Sign In</Text>
          </Text>
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
    paddingVertical: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF3F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 36,
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