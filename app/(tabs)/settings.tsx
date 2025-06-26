import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  User, 
  Utensils,
  LogOut,
  ChevronRight
} from 'lucide-react-native';
import { router } from 'expo-router';
import Card from '@/components/ui/Card';
import ProfileImagePicker from '@/components/ui/ProfileImagePicker';
import ProfileEditModal from '@/components/ui/ProfileEditModal';
import MealPlanPreferencesModal from '@/components/ui/MealPlanPreferencesModal';
import { supabase } from '@/utils/supabase';

export default function SettingsScreen() {
  const [userFullName, setUserFullName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userImageUri, setUserImageUri] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);

  // Load user data
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || '');
        setUserFullName(user.user_metadata?.full_name || '');
        setUserImageUri(user.user_metadata?.profile_image_uri || '');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoggingOut(true);
              const { error } = await supabase.auth.signOut();
              
              if (error) {
                Alert.alert('Error', 'Failed to sign out. Please try again.');
                console.error('Logout error:', error);
              } else {
                // Navigate to onboarding/welcome screen
                router.replace('/onboarding');
              }
            } catch (error) {
              Alert.alert('Error', 'An unexpected error occurred during sign out.');
              console.error('Logout error:', error);
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  const handleProfileImageUpdate = async (imageUri: string) => {
    try {
      // Update user metadata with new image URI
      const { error } = await supabase.auth.updateUser({
        data: {
          profile_image_uri: imageUri,
        },
      });

      if (error) {
        throw error;
      }

      setUserImageUri(imageUri);
      Alert.alert('Success', 'Profile picture updated successfully!');
    } catch (error) {
      console.error('Error updating profile image:', error);
      Alert.alert('Error', 'Failed to update profile picture. Please try again.');
    }
  };

  const handleProfileUpdated = (name: string, email: string, imageUri?: string) => {
    setUserFullName(name);
    setUserEmail(email);
    if (imageUri !== undefined) {
      setUserImageUri(imageUri);
    }
  };

  const getDisplayName = () => {
    if (userFullName) {
      return userFullName;
    }
    return 'Welcome, Chef!';
  };

  const getDisplayEmail = () => {
    if (userEmail) {
      return userEmail;
    }
    return 'Complete your profile setup';
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header - Centered */}
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={styles.title}>Settings</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Profile Section - Interactive */}
        <View style={styles.profileSection}>
          <Card style={styles.profileCard}>
            <TouchableOpacity
              style={styles.profileContent}
              onPress={() => setShowProfileModal(true)}
              activeOpacity={0.7}
            >
              <ProfileImagePicker
                currentImageUri={userImageUri}
                onImageSelected={handleProfileImageUpdate}
                size={80}
              />
              
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{getDisplayName()}</Text>
                <Text style={styles.profileEmail}>{getDisplayEmail()}</Text>
              </View>

              <ChevronRight size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </Card>
        </View>

        {/* Settings Items */}
        <View style={styles.settingsSection}>
          {/* Meal Plan Preferences - Interactive */}
          <Card style={styles.settingsCard}>
            <TouchableOpacity 
              style={styles.settingsItem}
              onPress={() => setShowPreferencesModal(true)}
              activeOpacity={0.7}
            >
              <View style={styles.settingsItemContent}>
                <View style={styles.settingsIcon}>
                  <Utensils size={20} color="#6B7280" />
                </View>
                <View style={styles.settingsText}>
                  <Text style={styles.settingsTitle}>Meal Plan Preferences</Text>
                  <Text style={styles.settingsSubtitle}>Dietary restrictions, cuisines, and more</Text>
                </View>
              </View>
              <ChevronRight size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </Card>
        </View>

        {/* Logout Section */}
        <View style={styles.logoutSection}>
          <Card style={styles.logoutCard}>
            <TouchableOpacity 
              style={styles.logoutItem}
              onPress={handleLogout}
              activeOpacity={0.7}
              disabled={isLoggingOut}
            >
              <View style={styles.settingsItemContent}>
                <View style={[styles.settingsIcon, styles.logoutIcon]}>
                  <LogOut size={20} color="#EF4444" />
                </View>
                <View style={styles.settingsText}>
                  <Text style={[styles.settingsTitle, styles.logoutText]}>
                    {isLoggingOut ? 'Signing Out...' : 'Sign Out'}
                  </Text>
                  <Text style={styles.settingsSubtitle}>
                    Sign out of your account
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </Card>
        </View>

        {/* App Info */}
        <View style={styles.appInfoSection}>
          <Text style={styles.appName}>SupaChef</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appDescription}>
            Your AI-powered sous chef for meal planning and recipe management
          </Text>
        </View>
      </ScrollView>

      {/* Profile Edit Modal */}
      <ProfileEditModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        currentName={userFullName}
        currentEmail={userEmail}
        currentImageUri={userImageUri}
        onProfileUpdated={handleProfileUpdated}
      />

      {/* Meal Plan Preferences Modal */}
      <MealPlanPreferencesModal
        visible={showPreferencesModal}
        onClose={() => setShowPreferencesModal(false)}
        onPreferencesUpdated={() => {
          // Optionally refresh any data that depends on preferences
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerSpacer: {
    width: 40, // Balance the header for centering
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    textAlign: 'center',
  },
  profileSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  profileCard: {
    padding: 20,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  settingsSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  settingsCard: {
    marginBottom: 8,
    padding: 0,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingsItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingsText: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 2,
  },
  settingsSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  logoutSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  logoutCard: {
    padding: 0,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  logoutIcon: {
    backgroundColor: '#FEF2F2',
  },
  logoutText: {
    color: '#EF4444',
  },
  appInfoSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  appName: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#F97966',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginBottom: 8,
  },
  appDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});