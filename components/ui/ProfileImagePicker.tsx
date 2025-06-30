import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { Camera, Upload, User } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

interface ProfileImagePickerProps {
  currentImageUri?: string;
  onImageSelected: (uri: string) => void;
  size?: number;
}

export default function ProfileImagePicker({
  currentImageUri,
  onImageSelected,
  size = 80,
}: ProfileImagePickerProps) {
  const [isLoading, setIsLoading] = useState(false);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Sorry, we need camera roll permissions to upload a profile picture.'
        );
        return false;
      }
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      setIsLoading(true);
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onImageSelected(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const takePhoto = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'Camera is not available on web platform.');
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Sorry, we need camera permissions to take a photo.'
      );
      return;
    }

    try {
      setIsLoading(true);
      
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onImageSelected(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const showImageOptions = () => {
    const options = [
      { text: 'Choose from Library', onPress: pickImage },
      { text: 'Cancel', style: 'cancel' as const },
    ];

    if (Platform.OS !== 'web') {
      options.unshift({ text: 'Take Photo', onPress: takePhoto });
    }

    Alert.alert('Select Profile Picture', 'Choose how you want to add your profile picture', options);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.imageContainer, { width: size, height: size }]}
        onPress={showImageOptions}
        disabled={isLoading}
        activeOpacity={0.8}
      >
        {currentImageUri ? (
          <Image
            source={{ uri: currentImageUri }}
            style={[styles.profileImage, { width: size, height: size }]}
          />
        ) : (
          <View style={[styles.placeholderImage, { width: size, height: size }]}>
            <User size={size * 0.4} color="#F97966" />
          </View>
        )}
        
        {/* Camera button overlay */}
        <View style={[styles.cameraButton, { 
          width: size * 0.35, 
          height: size * 0.35,
          borderRadius: size * 0.175,
          bottom: -2,
          right: -2,
        }]}>
          {isLoading ? (
            <View style={[styles.loadingDot, { 
              width: size * 0.15, 
              height: size * 0.15,
              borderRadius: size * 0.075,
            }]} />
          ) : (
            <Camera size={size * 0.2} color="#FFFFFF" />
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 50,
    overflow: 'visible', // Changed from 'hidden' to 'visible' to allow camera button to overlay
  },
  profileImage: {
    borderRadius: 50,
  },
  placeholderImage: {
    borderRadius: 50,
    backgroundColor: '#FEF3F2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F97966',
  },
  cameraButton: {
    position: 'absolute',
    backgroundColor: '#F97966',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    // Enhanced shadow for better visibility
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    // Ensure it's above other elements
    zIndex: 10,
  },
  loadingDot: {
    backgroundColor: '#FFFFFF',
    opacity: 0.7,
  },
});