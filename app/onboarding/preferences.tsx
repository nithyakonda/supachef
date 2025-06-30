import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, ChevronRight, X, Plus } from 'lucide-react-native';
import Button from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';
import ThemedAlert from '@/components/ui/ThemedAlert';
import { useThemedAlert } from '@/hooks/useThemedAlert';
import { cuisineOptions, dietaryRestrictions, mealTypes, weekDays } from '@/data/sampleData';
import { preferenceService } from '@/services/preferenceService';

const PREFERENCE_STEPS = [
  'cuisines',
  'dietary',
  'allergies',
  'mealTypes',
  'experience',
  'household',
  'planning'
];

export default function PreferencesScreen() {
  const { userId } = useLocalSearchParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  const [addingToCategory, setAddingToCategory] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { alertState, showAlert, hideAlert } = useThemedAlert();
  const [customOptions, setCustomOptions] = useState({
    cuisines: [] as string[],
    dietary: [] as string[],
    allergies: [] as string[],
  });
  const [preferences, setPreferences] = useState({
    cuisines: [] as string[],
    dietary: [] as string[],
    allergies: ['None'] as string[], // Default to None
    mealTypes: ['Breakfast', 'Lunch', 'Dinner'] as string[], // Default selection
    experience: 'Intermediate', // Default selection
    needsLunchbox: false,
    prefersLeftovers: false,
    adults: 2,
    kids: 0,
    planningDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as string[], // Default weekdays
  });

  const handleNext = async () => {
    if (currentStep < PREFERENCE_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      setError(null); // Clear any previous errors when moving to next step
    } else {
      // Last step - save preferences and complete onboarding
      setLoading(true);
      setError(null);
      
      try {
        // Check if user can save preferences first
        const { canSave, reason } = await preferenceService.canSavePreferences();
        
        if (!canSave) {
          if (reason === 'Email not confirmed') {
            showAlert({
              title: 'Email Confirmation Required',
              message: 'Please check your email and confirm your account before completing setup. You can also complete setup later from the settings page.',
              type: 'warning',
              buttons: [
                {
                  text: 'Skip for now',
                  style: 'cancel',
                  onPress: () => router.push('/onboarding/complete'),
                }
              ],
            });
            setLoading(false);
            return;
          } else {
            throw new Error(reason || 'Unable to save preferences');
          }
        }

        // Transform preferences to match the service interface
        const preferencesToSave = {
          favoriteCuisines: preferences.cuisines,
          mealPlanningDays: preferences.planningDays,
          dietaryRestrictions: preferences.dietary,
          allergies: preferences.allergies,
          mealTypes: preferences.mealTypes,
          cookingExperience: preferences.experience as 'Beginner' | 'Intermediate' | 'Expert',
          needsLunchbox: preferences.needsLunchbox,
          prefersLeftovers: preferences.prefersLeftovers,
          numberOfAdults: preferences.adults,
          numberOfKids: preferences.kids,
        };

        await preferenceService.saveUserPreferences(preferencesToSave, userId as string);
        router.push('/onboarding/complete');
      } catch (error: any) {
        console.error('Error saving preferences:', error);
        
        // Provide user-friendly error messages
        let errorMessage = 'Failed to save your preferences. Please try again.';
        
        if (error.message?.includes('Permission denied')) {
          errorMessage = 'Please confirm your email address before completing setup. Check your email for a confirmation link.';
        } else if (error.message?.includes('not authenticated')) {
          errorMessage = 'Authentication error. Please sign in again.';
        } else if (error.message?.includes('already exist')) {
          errorMessage = 'Your preferences already exist. Updating them now...';
          // Try to update instead
          try {
            await preferenceService.updateUserPreferences(preferencesToSave, userId as string);
            router.push('/onboarding/complete');
            return;
          } catch (updateError) {
            errorMessage = 'Failed to update your preferences. Please try again.';
          }
        }
        
        showAlert({
          title: 'Error Saving Preferences',
          message: errorMessage,
          type: 'error',
          buttons: [
            {
              text: 'Try Again',
              style: 'default',
            },
            {
              text: 'Skip for now',
              style: 'cancel',
              onPress: () => router.push('/onboarding/complete'),
            }
          ],
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setError(null); // Clear errors when going back
    } else {
      router.back();
    }
  };

  const toggleSelection = (category: string, item: string) => {
    setPreferences(prev => {
      const currentSelections = prev[category as keyof typeof prev] as string[];
      
      if (item === 'None') {
        // If selecting 'None', clear all other selections
        return {
          ...prev,
          [category]: ['None']
        };
      } else {
        // If selecting any other option, remove 'None' and toggle the option
        let newSelections = currentSelections.filter(i => i !== 'None');
        
        if (newSelections.includes(item)) {
          newSelections = newSelections.filter(i => i !== item);
        } else {
          newSelections.push(item);
        }
        
        // If no selections remain, add 'None' back
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

  const updatePreference = (key: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const openAddModal = (category: string) => {
    setAddingToCategory(category);
    setNewItemText('');
    setShowAddModal(true);
  };

  const handleAddNewItem = () => {
    if (!newItemText.trim()) {
      showAlert({
        title: 'Invalid Input',
        message: 'Please enter a valid option',
        type: 'warning',
      });
      return;
    }

    const trimmedText = newItemText.trim();
    
    // Check if item already exists
    let existingOptions: string[] = [];
    if (addingToCategory === 'cuisines') {
      existingOptions = [...cuisineOptions, ...customOptions.cuisines];
    } else if (addingToCategory === 'dietary') {
      existingOptions = [...dietaryRestrictions, ...customOptions.dietary];
    } else if (addingToCategory === 'allergies') {
      existingOptions = ['None', 'Nuts', 'Shellfish', 'Dairy', 'Eggs', 'Soy', 'Gluten', 'Fish', ...customOptions.allergies];
    }
    
    if (existingOptions.some(option => option.toLowerCase() === trimmedText.toLowerCase())) {
      showAlert({
        title: 'Duplicate Option',
        message: 'This option already exists',
        type: 'warning',
      });
      return;
    }

    // Add to custom options
    setCustomOptions(prev => ({
      ...prev,
      [addingToCategory]: [...prev[addingToCategory as keyof typeof prev], trimmedText]
    }));

    // Auto-select the new item
    toggleSelection(addingToCategory, trimmedText);

    // Close modal
    setShowAddModal(false);
    setNewItemText('');
    setAddingToCategory('');
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setNewItemText('');
    setAddingToCategory('');
  };

  const getAllOptions = (category: string) => {
    if (category === 'cuisines') {
      return [...cuisineOptions, ...customOptions.cuisines];
    } else if (category === 'dietary') {
      return [...dietaryRestrictions, ...customOptions.dietary];
    } else if (category === 'allergies') {
      return ['None', 'Nuts', 'Shellfish', 'Dairy', 'Eggs', 'Soy', 'Gluten', 'Fish', ...customOptions.allergies];
    }
    return [];
  };

  const renderProgressDots = () => (
    <View style={styles.progressContainer}>
      {PREFERENCE_STEPS.map((_, index) => (
        <View
          key={index}
          style={[
            styles.progressDot,
            index === currentStep && styles.activeDot,
            index < currentStep && styles.completedDot,
          ]}
        />
      ))}
    </View>
  );

  const renderCuisineStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Which cuisines do you love?</Text>
      <Text style={styles.stepSubtitle}>Select all that apply</Text>
      
      <View style={styles.chipsContainer}>
        {getAllOptions('cuisines').map(cuisine => (
          <Chip
            key={cuisine}
            label={cuisine}
            selected={preferences.cuisines.includes(cuisine)}
            onPress={() => toggleSelection('cuisines', cuisine)}
          />
        ))}
        <TouchableOpacity
          style={styles.addNewChip}
          onPress={() => openAddModal('cuisines')}
        >
          <View style={styles.addNewContent}>
            <Plus size={16} color="#6B7280" />
            <Text style={styles.addNewText}>Add New</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDietaryStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Any dietary restrictions?</Text>
      <Text style={styles.stepSubtitle}>Select all that apply</Text>
      
      <View style={styles.chipsContainer}>
        {getAllOptions('dietary').map(restriction => (
          <Chip
            key={restriction}
            label={restriction}
            selected={preferences.dietary.includes(restriction)}
            onPress={() => toggleSelection('dietary', restriction)}
          />
        ))}
        <TouchableOpacity
          style={styles.addNewChip}
          onPress={() => openAddModal('dietary')}
        >
          <View style={styles.addNewContent}>
            <Plus size={16} color="#6B7280" />
            <Text style={styles.addNewText}>Add New</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAllergiesStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Do you have any allergies?</Text>
      <Text style={styles.stepSubtitle}>Select all that apply, or choose "None" if you don't have any allergies</Text>
      
      <View style={styles.chipsContainer}>
        {getAllOptions('allergies').map(allergy => (
          <Chip
            key={allergy}
            label={allergy}
            selected={preferences.allergies.includes(allergy)}
            onPress={() => toggleSelection('allergies', allergy)}
          />
        ))}
        <TouchableOpacity
          style={styles.addNewChip}
          onPress={() => openAddModal('allergies')}
        >
          <View style={styles.addNewContent}>
            <Plus size={16} color="#6B7280" />
            <Text style={styles.addNewText}>Add New</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderMealTypesStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Which meals do you want to plan?</Text>
      <Text style={styles.stepSubtitle}>Breakfast, Lunch, and Dinner are selected by default</Text>
      
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
  );

  const renderExperienceStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>What's your cooking experience?</Text>
      <Text style={styles.stepSubtitle}>This helps us suggest appropriate recipes</Text>
      
      <View style={styles.radioContainer}>
        {['Beginner', 'Intermediate', 'Expert'].map(level => (
          <TouchableOpacity
            key={level}
            style={[
              styles.radioOption,
              preferences.experience === level && styles.selectedRadio
            ]}
            onPress={() => updatePreference('experience', level)}
          >
            <View style={[
              styles.radioCircle,
              preferences.experience === level && styles.selectedCircle
            ]} />
            <Text style={[
              styles.radioText,
              preferences.experience === level && styles.selectedRadioText
            ]}>
              {level}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderHouseholdStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Tell us about your household</Text>
      <Text style={styles.stepSubtitle}>This helps us plan portion sizes</Text>
      
      <View style={styles.counterContainer}>
        <View style={styles.counterItem}>
          <Text style={styles.counterLabel}>Number of adults</Text>
          <View style={styles.counter}>
            <TouchableOpacity
              style={styles.counterButton}
              onPress={() => updatePreference('adults', Math.max(1, preferences.adults - 1))}
            >
              <Text style={styles.counterButtonText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.counterValue}>{preferences.adults}</Text>
            <TouchableOpacity
              style={styles.counterButton}
              onPress={() => updatePreference('adults', preferences.adults + 1)}
            >
              <Text style={styles.counterButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.counterItem}>
          <Text style={styles.counterLabel}>Number of kids</Text>
          <View style={styles.counter}>
            <TouchableOpacity
              style={styles.counterButton}
              onPress={() => updatePreference('kids', Math.max(0, preferences.kids - 1))}
            >
              <Text style={styles.counterButtonText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.counterValue}>{preferences.kids}</Text>
            <TouchableOpacity
              style={styles.counterButton}
              onPress={() => updatePreference('kids', preferences.kids + 1)}
            >
              <Text style={styles.counterButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleOption,
            preferences.needsLunchbox && styles.selectedToggle
          ]}
          onPress={() => updatePreference('needsLunchbox', !preferences.needsLunchbox)}
        >
          <Text style={[
            styles.toggleText,
            preferences.needsLunchbox && styles.selectedToggleText
          ]}>
            Need lunchbox meals? {preferences.needsLunchbox ? 'Yes' : 'No'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleOption,
            preferences.prefersLeftovers && styles.selectedToggle
          ]}
          onPress={() => updatePreference('prefersLeftovers', !preferences.prefersLeftovers)}
        >
          <Text style={[
            styles.toggleText,
            preferences.prefersLeftovers && styles.selectedToggleText
          ]}>
            Prefer leftovers? {preferences.prefersLeftovers ? 'Yes' : 'No'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPlanningStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Which days do you want to plan?</Text>
      <Text style={styles.stepSubtitle}>Weekdays (Monday-Friday) are selected by default</Text>
      
      <View style={styles.chipsContainer}>
        {weekDays.map(day => (
          <Chip
            key={day}
            label={day}
            selected={preferences.planningDays.includes(day)}
            onPress={() => toggleSelection('planningDays', day)}
          />
        ))}
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (PREFERENCE_STEPS[currentStep]) {
      case 'cuisines':
        return renderCuisineStep();
      case 'dietary':
        return renderDietaryStep();
      case 'allergies':
        return renderAllergiesStep();
      case 'mealTypes':
        return renderMealTypesStep();
      case 'experience':
        return renderExperienceStep();
      case 'household':
        return renderHouseholdStep();
      case 'planning':
        return renderPlanningStep();
      default:
        return null;
    }
  };

  const renderAddModal = () => (
    <Modal
      visible={showAddModal}
      transparent={true}
      animationType="fade"
      onRequestClose={closeAddModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Add New {addingToCategory === 'cuisines' ? 'Cuisine' : addingToCategory === 'dietary' ? 'Dietary Restriction' : 'Allergy'}
            </Text>
            <TouchableOpacity onPress={closeAddModal} style={styles.closeButton}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <TextInput
            style={styles.modalInput}
            placeholder={`Enter ${addingToCategory === 'cuisines' ? 'cuisine name' : addingToCategory === 'dietary' ? 'dietary restriction' : 'allergy'}`}
            value={newItemText}
            onChangeText={setNewItemText}
            autoFocus={true}
            placeholderTextColor="#9CA3AF"
          />
          
          <View style={styles.modalActions}>
            <Button
              title="Cancel"
              onPress={closeAddModal}
              variant="outline"
              style={styles.modalButton}
            />
            <Button
              title="Add"
              onPress={handleAddNewItem}
              variant="primary"
              style={styles.modalButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ChevronLeft size={24} color="#6B7280" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customize Your Meal Plan</Text>
        <View style={styles.placeholder} />
      </View>

      {renderProgressDots()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderCurrentStep()}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={loading ? 'Saving...' : (currentStep === PREFERENCE_STEPS.length - 1 ? 'Complete Setup' : 'Next')}
          onPress={handleNext}
          variant="primary"
          size="large"
          style={styles.nextButton}
          disabled={loading}
        />
      </View>

      {renderAddModal()}

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
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
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginBottom: 32,
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  activeDot: {
    backgroundColor: '#F97966',
  },
  completedDot: {
    backgroundColor: '#10B981',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  stepContent: {
    paddingBottom: 32,
  },
  stepTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 32,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  addNewChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    marginRight: 8,
    marginBottom: 8,
  },
  addNewContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addNewText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginLeft: 4,
  },
  radioContainer: {
    gap: 16,
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
    gap: 24,
    marginBottom: 32,
  },
  counterItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    gap: 16,
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
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#DC2626',
    textAlign: 'center',
    lineHeight: 20,
  },
  skipButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignSelf: 'center',
  },
  skipButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  nextButton: {
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    backgroundColor: '#FFFFFF',
    color: '#111827',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});