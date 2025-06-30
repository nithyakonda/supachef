import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, ChevronRight } from 'lucide-react-native';
import Button from './Button';
import Chip from './Chip';
import ThemedAlert from './ThemedAlert';
import { useThemedAlert } from '@/hooks/useThemedAlert';
import { preferenceService } from '@/services/preferenceService';
import { cuisineOptions, dietaryRestrictions, mealTypes, weekDays } from '@/data/sampleData';

interface MealPlanPreferencesModalProps {
  visible: boolean;
  onClose: () => void;
  onPreferencesUpdated: () => void;
}

interface UserPreferences {
  favoriteCuisines: string[];
  mealPlanningDays: string[];
  dietaryRestrictions: string[];
  allergies: string[];
  mealTypes: string[];
  cookingExperience: 'Beginner' | 'Intermediate' | 'Expert';
  needsLunchbox: boolean;
  prefersLeftovers: boolean;
  numberOfAdults: number;
  numberOfKids: number;
}

export default function MealPlanPreferencesModal({
  visible,
  onClose,
  onPreferencesUpdated,
}: MealPlanPreferencesModalProps) {
  const [preferences, setPreferences] = useState<UserPreferences>({
    favoriteCuisines: [],
    mealPlanningDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    dietaryRestrictions: ['None'],
    allergies: ['None'],
    mealTypes: ['Breakfast', 'Lunch', 'Dinner'],
    cookingExperience: 'Intermediate',
    needsLunchbox: false,
    prefersLeftovers: false,
    numberOfAdults: 2,
    numberOfKids: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPreferences, setLoadingPreferences] = useState(true);
  const { alertState, showAlert, hideAlert } = useThemedAlert();

  useEffect(() => {
    if (visible) {
      loadPreferences();
    }
  }, [visible]);

  const loadPreferences = async () => {
    try {
      setLoadingPreferences(true);
      const userPrefs = await preferenceService.getUserPreferences();
      if (userPrefs) {
        setPreferences({
          favoriteCuisines: userPrefs.favoriteCuisines,
          mealPlanningDays: userPrefs.mealPlanningDays,
          dietaryRestrictions: userPrefs.dietaryRestrictions,
          allergies: userPrefs.allergies,
          mealTypes: userPrefs.mealTypes,
          cookingExperience: userPrefs.cookingExperience,
          needsLunchbox: userPrefs.needsLunchbox,
          prefersLeftovers: userPrefs.prefersLeftovers,
          numberOfAdults: userPrefs.numberOfAdults,
          numberOfKids: userPrefs.numberOfKids,
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      showAlert({
        title: 'Error Loading Preferences',
        message: 'Failed to load your preferences. Please try again.',
        type: 'error',
      });
    } finally {
      setLoadingPreferences(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await preferenceService.saveUserPreferences(preferences);
      onPreferencesUpdated();
      onClose();
      showAlert({
        title: 'Preferences Updated',
        message: 'Meal plan preferences updated successfully!',
        type: 'success',
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      showAlert({
        title: 'Save Failed',
        message: 'Failed to save preferences. Please try again.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelection = (category: keyof UserPreferences, item: string) => {
    setPreferences(prev => {
      const currentSelections = prev[category] as string[];
      
      if (item === 'None') {
        return {
          ...prev,
          [category]: ['None']
        };
      } else {
        let newSelections = currentSelections.filter(i => i !== 'None');
        
        if (newSelections.includes(item)) {
          newSelections = newSelections.filter(i => i !== item);
        } else {
          newSelections.push(item);
        }
        
        if (newSelections.length === 0) {
          newSelections = ['None'];
        }
        
        return {
          ...prev,
          [category]: newSelections
        };
      }
    });
  };

  const updateCounter = (field: 'numberOfAdults' | 'numberOfKids', increment: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [field]: Math.max(0, prev[field] + (increment ? 1 : -1))
    }));
  };

  const toggleBoolean = (field: 'needsLunchbox' | 'prefersLeftovers') => {
    setPreferences(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const setExperience = (experience: 'Beginner' | 'Intermediate' | 'Expert') => {
    setPreferences(prev => ({
      ...prev,
      cookingExperience: experience
    }));
  };

  if (loadingPreferences) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading preferences...</Text>
          </View>
          <ThemedAlert
            visible={alertState.visible}
            title={alertState.title}
            message={alertState.message}
            type={alertState.type}
            buttons={alertState.buttons}
            onClose={hideAlert}
          />
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Meal Plan Preferences</Text>
            <Text style={styles.headerSubtitle}>
              Customize your meal planning settings
            </Text>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Favorite Cuisines */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Favorite Cuisines</Text>
            <View style={styles.chipsContainer}>
              {cuisineOptions.map(cuisine => (
                <Chip
                  key={cuisine}
                  label={cuisine}
                  selected={preferences.favoriteCuisines.includes(cuisine)}
                  onPress={() => toggleSelection('favoriteCuisines', cuisine)}
                />
              ))}
            </View>
          </View>

          {/* Planning Days */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Planning Days</Text>
            <View style={styles.chipsContainer}>
              {weekDays.map(day => (
                <Chip
                  key={day}
                  label={day}
                  selected={preferences.mealPlanningDays.includes(day)}
                  onPress={() => toggleSelection('mealPlanningDays', day)}
                />
              ))}
            </View>
          </View>

          {/* Meal Types */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Meals to Plan</Text>
            <View style={styles.chipsContainer}>
              {mealTypes.map(type => (
                <Chip
                  key={type}
                  label={type}
                  selected={preferences.mealTypes.includes(type)}
                  onPress={() => toggleSelection('mealTypes', type)}
                />
              ))}
            </View>
          </View>

          {/* Dietary Restrictions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dietary Restrictions</Text>
            <View style={styles.chipsContainer}>
              {[...dietaryRestrictions, 'None'].map(restriction => (
                <Chip
                  key={restriction}
                  label={restriction}
                  selected={preferences.dietaryRestrictions.includes(restriction)}
                  onPress={() => toggleSelection('dietaryRestrictions', restriction)}
                />
              ))}
            </View>
          </View>

          {/* Cooking Experience */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cooking Experience</Text>
            <View style={styles.radioContainer}>
              {['Beginner', 'Intermediate', 'Expert'].map(level => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.radioOption,
                    preferences.cookingExperience === level && styles.selectedRadio
                  ]}
                  onPress={() => setExperience(level as any)}
                >
                  <View style={[
                    styles.radioCircle,
                    preferences.cookingExperience === level && styles.selectedCircle
                  ]} />
                  <Text style={[
                    styles.radioText,
                    preferences.cookingExperience === level && styles.selectedRadioText
                  ]}>
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Household Size */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Household Size</Text>
            <View style={styles.counterContainer}>
              <View style={styles.counterItem}>
                <Text style={styles.counterLabel}>Adults</Text>
                <View style={styles.counter}>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() => updateCounter('numberOfAdults', false)}
                  >
                    <Text style={styles.counterButtonText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.counterValue}>{preferences.numberOfAdults}</Text>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() => updateCounter('numberOfAdults', true)}
                  >
                    <Text style={styles.counterButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.counterItem}>
                <Text style={styles.counterLabel}>Kids</Text>
                <View style={styles.counter}>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() => updateCounter('numberOfKids', false)}
                  >
                    <Text style={styles.counterButtonText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.counterValue}>{preferences.numberOfKids}</Text>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() => updateCounter('numberOfKids', true)}
                  >
                    <Text style={styles.counterButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Additional Options */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Options</Text>
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[
                  styles.toggleOption,
                  preferences.needsLunchbox && styles.selectedToggle
                ]}
                onPress={() => toggleBoolean('needsLunchbox')}
              >
                <Text style={[
                  styles.toggleText,
                  preferences.needsLunchbox && styles.selectedToggleText
                ]}>
                  Need lunchbox meals
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.toggleOption,
                  preferences.prefersLeftovers && styles.selectedToggle
                ]}
                onPress={() => toggleBoolean('prefersLeftovers')}
              >
                <Text style={[
                  styles.toggleText,
                  preferences.prefersLeftovers && styles.selectedToggleText
                ]}>
                  Prefer leftovers
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Footer Actions */}
        <View style={styles.footer}>
          <Button
            title="Cancel"
            onPress={onClose}
            variant="outline"
            style={styles.footerButton}
            disabled={isLoading}
          />
          <Button
            title={isLoading ? 'Saving...' : 'Save Preferences'}
            onPress={handleSave}
            variant="primary"
            style={styles.footerButton}
            disabled={isLoading}
          />
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
    </Modal>
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerContent: {
    flex: 1,
    paddingRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginVertical: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 16,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  radioContainer: {
    gap: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  selectedRadio: {
    borderColor: '#F97966',
    backgroundColor: '#FEF3F2',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginRight: 12,
  },
  selectedCircle: {
    borderColor: '#F97966',
    backgroundColor: '#F97966',
  },
  radioText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#374151',
  },
  selectedRadioText: {
    color: '#F97966',
    fontFamily: 'Inter-SemiBold',
  },
  counterContainer: {
    gap: 16,
  },
  counterItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  counterLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },
  counterButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
  },
  counterValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginHorizontal: 16,
    minWidth: 24,
    textAlign: 'center',
  },
  toggleContainer: {
    gap: 12,
  },
  toggleOption: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  selectedToggle: {
    borderColor: '#F97966',
    backgroundColor: '#FEF3F2',
  },
  toggleText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    textAlign: 'center',
  },
  selectedToggleText: {
    color: '#F97966',
    fontFamily: 'Inter-SemiBold',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 12,
  },
  footerButton: {
    flex: 1,
  },
});