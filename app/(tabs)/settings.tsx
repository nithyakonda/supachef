import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  User, 
  Settings as SettingsIcon, 
  Info, 
  ChevronRight,
  Camera,
  Bell,
  Shield,
  Utensils,
  LogOut
} from 'lucide-react-native';
import { router } from 'expo-router';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { supabase } from '@/utils/supabase';

interface SettingsItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  onPress: () => void;
}

export default function SettingsScreen() {
  const [userFullName, setUserFullName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserEmail(user.email || '');
          setUserFullName(user.user_metadata?.full_name || '');
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

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

  const settingsItems: SettingsItem[] = [
    {
      id: 'profile',
      title: 'Profile',
      subtitle: 'Update your personal information',
      icon: <User size={20} color="#6B7280" />,
      onPress: () => {},
    },
    {
      id: 'preferences',
      title: 'Meal Plan Preferences',
      subtitle: 'Dietary restrictions, cuisines, and more',
      icon: <Utensils size={20} color="#6B7280" />,
      onPress: () => {},
    },
    {
      id: 'notifications',
      title: 'Notifications',
      subtitle: 'Meal reminders and cooking alerts',
      icon: <Bell size={20} color="#6B7280" />,
      onPress: () => {},
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      subtitle: 'Data and account security settings',
      icon: <Shield size={20} color="#6B7280" />,
      onPress: () => {},
    },
    {
      id: 'about',
      title: 'About',
      subtitle: 'App version and information',
      icon: <Info size={20} color="#6B7280" />,
      onPress: () => {},
    },
  ];

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <Card style={styles.profileCard}>
            <View style={styles.profileContent}>
              <View style={styles.profileImageContainer}>
                <View style={styles.profileImage}>
                  <User size={32} color="#F97966" />
                </View>
                <TouchableOpacity style={styles.cameraButton}>
                  <Camera size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{getDisplayName()}</Text>
                <Text style={styles.profileEmail}>{getDisplayEmail()}</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Settings Items */}
        <View style={styles.settingsSection}>
          {settingsItems.map((item) => (
            <Card key={item.id} style={styles.settingsCard}>
              <TouchableOpacity 
                style={styles.settingsItem}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={styles.settingsItemContent}>
                  <View style={styles.settingsIcon}>
                    {item.icon}
                  </View>
                  <View style={styles.settingsText}>
                    <Text style={styles.settingsTitle}>{item.title}</Text>
                    {item.subtitle && (
                      <Text style={styles.settingsSubtitle}>{item.subtitle}</Text>
                    )}
                  </View>
                </View>
                <ChevronRight size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </Card>
          ))}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#111827',
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
  profileImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF3F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F97966',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
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