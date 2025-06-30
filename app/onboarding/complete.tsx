import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Sparkles, ChefHat } from 'lucide-react-native';
import Button from '@/components/ui/Button';

const { width } = Dimensions.get('window');

export default function CompleteScreen() {
  const handleComplete = () => {
    // In a real app, you'd save the onboarding completion status
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Animated Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.mainIcon}>
            <Image
              source={require('@/assets/images/sous-chef.png')}
              style={styles.sousChefImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.sparkleContainer}>
            <Sparkles size={24} color="#F59E0B" style={styles.sparkle1} />
            <Sparkles size={16} color="#F59E0B" style={styles.sparkle2} />
            <Sparkles size={20} color="#F59E0B" style={styles.sparkle3} />
          </View>
        </View>

        {/* Content */}
        <View style={styles.textContent}>
          <Text style={styles.title}>Meet Your AI Sous-Chef!</Text>
          <Text style={styles.description}>
            Your personalized cooking assistant is ready to help you plan meals, suggest recipes, and make cooking effortless.
          </Text>
          <Text style={styles.note}>
            💡 Your suggestions will get smarter as you build your recipe book and create meal plans.
          </Text>
        </View>

        {/* Features List */}
        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>🍽️</Text>
            <Text style={styles.featureText}>Smart meal planning based on your preferences</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>📱</Text>
            <Text style={styles.featureText}>Save recipes from any link or social media</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>🤖</Text>
            <Text style={styles.featureText}>AI-powered recipe suggestions</Text>
          </View>
        </View>

        {/* Action Button */}
        <View style={styles.actionContainer}>
          <Button
            title="Start Cooking!"
            onPress={handleComplete}
            variant="primary"
            size="large"
            style={styles.completeButton}
          />
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
    alignItems: 'center',
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
    height: 120,
    width: 120,
  },
  mainIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FEF3F2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#F97966',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sousChefImage: {
    width: 64,
    height: 64,
  },
  sparkleContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  sparkle1: {
    position: 'absolute',
    top: 10,
    right: 20,
  },
  sparkle2: {
    position: 'absolute',
    bottom: 15,
    left: 15,
  },
  sparkle3: {
    position: 'absolute',
    top: 30,
    left: 5,
  },
  textContent: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  note: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#F97966',
    textAlign: 'center',
    backgroundColor: '#FEF3F2',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    lineHeight: 20,
  },
  featuresList: {
    width: '100%',
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  featureEmoji: {
    fontSize: 24,
    marginRight: 16,
    width: 32,
  },
  featureText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    flex: 1,
    lineHeight: 22,
  },
  actionContainer: {
    width: '100%',
    marginTop: 'auto',
  },
  completeButton: {
    width: '100%',
  },
});