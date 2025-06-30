import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react-native';
import Button from '@/components/ui/Button';
import ThemedAlert from '@/components/ui/ThemedAlert';
import { useThemedAlert } from '@/hooks/useThemedAlert';
import { supabase } from '@/utils/supabase';

export default function WelcomeScreen() {
  const { mode } = useLocalSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const { alertState, showAlert, hideAlert } = useThemedAlert();

  // Set initial mode based on URL parameter
  useEffect(() => {
    if (mode === 'login') {
      setIsLogin(true);
    }
  }, [mode]);

  const handleSubmit = async () => {
    if (!name && !isLogin) {
      showAlert({
        title: 'Missing Information',
        message: 'Please enter your name',
        type: 'warning',
      });
      return;
    }
    if (!email || !password) {
      showAlert({
        title: 'Missing Information',
        message: 'Please fill in all fields',
        type: 'warning',
      });
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        // Sign in existing user
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          showAlert({
            title: 'Sign In Failed',
            message: error.message,
            type: 'error',
          });
          return;
        }

        if (data.user) {
          // Successfully signed in, go to main app
          showAlert({
            title: 'Welcome Back!',
            message: 'You have successfully signed in.',
            type: 'success',
            buttons: [
              {
                text: 'Continue',
                onPress: () => router.replace('/(tabs)'),
              },
            ],
          });
        }
      } else {
        // Sign up new user
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            },
          },
        });

        if (error) {
          showAlert({
            title: 'Sign Up Failed',
            message: error.message,
            type: 'error',
          });
          return;
        }

        if (data.user) {
          // Successfully signed up, go to preferences setup with user ID
          showAlert({
            title: 'Account Created',
            message: 'Your account has been created successfully! Let\'s set up your preferences.',
            type: 'success',
            buttons: [
              {
                text: 'Continue',
                onPress: () => router.push({
                  pathname: '/onboarding/preferences',
                  params: { userId: data.user.id }
                }),
              },
            ],
          });
        }
      }
    } catch (error) {
      showAlert({
        title: 'Error',
        message: 'An unexpected error occurred. Please try again.',
        type: 'error',
      });
      console.error('Authentication error:', error);
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    router.back();
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    // Clear form and errors when switching modes
    setName('');
    setEmail('');
    setPassword('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <ChevronLeft size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.title}>
            {isLogin ? 'Sign in to continue' : "Let's get you started"}
          </Text>
          <Text style={styles.subtitle}>
            {isLogin 
              ? 'Enter your credentials to access your meal plans'
              : 'Create your account to begin your culinary journey'
            }
          </Text>

          <View style={styles.inputContainer}>
            {!isLogin && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  placeholderTextColor="#9CA3AF"
                  editable={!loading}
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#9CA3AF"
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholderTextColor="#9CA3AF"
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#9CA3AF" />
                  ) : (
                    <Eye size={20} color="#9CA3AF" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {isLogin && (
              <TouchableOpacity style={styles.forgotPassword} disabled={loading}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}
          </View>

          <Button
            title={loading ? (isLogin ? 'Signing In...' : 'Creating Account...') : (isLogin ? 'Sign In' : 'Create Account')}
            onPress={handleSubmit}
            variant="primary"
            size="large"
            style={styles.submitButton}
            disabled={loading}
          />

          <TouchableOpacity
            style={styles.switchMode}
            onPress={toggleMode}
            disabled={loading}
          >
            <Text style={styles.switchText}>
              {isLogin 
                ? "Don't have an account? "
                : "Already have an account? "
              }
              <Text style={styles.switchLink}>
                {isLogin ? 'Sign Up' : 'Sign In'}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Themed Alert */}
      <ThemedAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        buttons={alertState.buttons}
        onClose={hideAlert}
      />
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  form: {
    flex: 1,
    paddingTop: 32,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 32,
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    backgroundColor: '#FFFFFF',
    color: '#111827',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
  },
  eyeButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#F97966',
  },
  submitButton: {
    width: '100%',
    marginBottom: 20,
  },
  switchMode: {
    alignItems: 'center',
  },
  switchText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  switchLink: {
    color: '#F97966',
    fontFamily: 'Inter-SemiBold',
  },
});