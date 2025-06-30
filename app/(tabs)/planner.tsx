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
import { ChevronLeft, ChevronRight, Camera, X, Sparkles } from 'lucide-react-native';
import { router } from 'expo-router';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';
import ThemedAlert from '@/components/ui/ThemedAlert';
import { useThemedAlert } from '@/hooks/useThemedAlert';
import { weekDays, mealTypes, dietaryRestrictions } from '@/data/sampleData';
import { aiService } from '@/services/aiService';
import { mealPlanService } from '@/services/mealPlanService';
import { recipeService } from '@/services/recipeService';
import { AIPayload, AISavedRecipe } from '@/types';

interface PreferenceModalProps {
  visible: boolean;
  title: string;
  type: 'currentWeek' | 'mealsPerDay' | 'dietaryRestrictions' | 'allergies';
  currentValue: string[];
  onSave: (value: string[]) => void;
  onClose: () => void;
}

const PreferenceModal: React.FC<PreferenceModalProps> = ({
  visible,
  title,
  type,
  currentValue,
  onSave,
  onClose,
}) => {
  const [selectedValue, setSelectedValue] = useState<string[]>(currentValue);
  const [customInput, setCustomInput] = useState('');

  const options = React.useMemo(() => {
    switch (type) {
      case 'currentWeek':
        return weekDays;
      case 'mealsPerDay':
        return mealTypes;
      case 'dietaryRestrictions':
        return [...dietaryRestrictions, 'None'];
      case 'allergies':
        return ['None', 'Nuts', 'Shellfish', 'Dairy', 'Eggs', 'Soy', 'Gluten', 'Fish'];
      default:
        return [];
    }
  }, [type]);

  const allowsMultiple = ['currentWeek', 'mealsPerDay', 'dietaryRestrictions', 'allergies'].includes(type);
  const allowsCustom = type === 'dietaryRestrictions' || type === 'allergies';

  const handleSave = () => {
    let valueToSave = [...selectedValue];
    
    // Add custom input if provided for dietary restrictions or allergies
    if (customInput.trim() && allowsCustom) {
      const trimmedInput = customInput.trim();
      if (!valueToSave.includes(trimmedInput)) {
        // Remove 'None' if adding custom item
        valueToSave = valueToSave.filter(item => item !== 'None');
        valueToSave.push(trimmedInput);
      }
    }
    
    onSave(valueToSave);
    setCustomInput('');
    onClose();
  };

  const handleClose = () => {
    setSelectedValue(currentValue);
    setCustomInput('');
    onClose();
  };

  const toggleSelection = (option: string) => {
    if (option === 'None') {
      // If selecting 'None', clear all other selections
      setSelectedValue(['None']);
    } else {
      // If selecting any other option, remove 'None' and toggle the option
      let newSelections = selectedValue.filter(item => item !== 'None');
      
      if (newSelections.includes(option)) {
        newSelections = newSelections.filter(item => item !== option);
      } else {
        newSelections.push(option);
      }
      
      // If no selections remain, add 'None' back
      if (newSelections.length === 0) {
        newSelections = ['None'];
      }
      
      setSelectedValue(newSelections);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.chipsContainer}>
              {options.map((option) => (
                <Chip
                  key={option}
                  label={option}
                  selected={selectedValue.includes(option)}
                  onPress={() => toggleSelection(option)}
                />
              ))}
            </View>

            {allowsCustom && (
              <View style={styles.customInputContainer}>
                <Text style={styles.customInputLabel}>Or add custom:</Text>
                <TextInput
                  style={styles.customInput}
                  placeholder="Type custom option..."
                  value={customInput}
                  onChangeText={setCustomInput}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            )}
          </ScrollView>

          <View style={styles.modalActions}>
            <Button
              title="Cancel"
              onPress={handleClose}
              variant="outline"
              style={styles.modalButton}
            />
            <Button
              title="Save"
              onPress={handleSave}
              variant="primary"
              style={styles.modalButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function PlannerScreen() {
  const [ingredientMethod, setIngredientMethod] = useState<'photo' | 'manual'>('photo');
  const [manualIngredients, setManualIngredients] = useState('butternut squash, avocado, chickpeas, greek yogurt, quinoa, cherry tomatoes, cucumber, feta cheese, bread, eggs, chicken , romaine lettuce, parmesan cheese, caesar dressing, croutons, spaghetti, frozen berries, banana, granola, honey, rolled oats');//useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showPreferenceModal, setShowPreferenceModal] = useState(false);
  const [editingPreference, setEditingPreference] = useState<'currentWeek' | 'mealsPerDay' | 'dietaryRestrictions' | 'allergies' | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { alertState, showAlert, hideAlert } = useThemedAlert();
  const [preferences, setPreferences] = useState({
    currentWeek: weekDays, // Initialize with all days
    mealsPerDay: ['Breakfast', 'Lunch', 'Dinner'], // Initialize with default meals
    dietaryRestrictions: ['None'] as string[],
    allergies: ['None'] as string[],
  });

  const handleTakePhoto = () => {
    // Stub implementation - would open camera
    console.log('Opening camera for ingredient detection...');
    showAlert({
      title: 'Camera Feature',
      message: 'Camera integration would be implemented here for ingredient detection.',
      type: 'info',
    });
  };

  const handleManualEntry = () => {
    setShowManualEntry(true);
  };

  const handleSaveManualEntry = () => {
    setShowManualEntry(false);
    console.log('Manual ingredients saved:', manualIngredients);
  };

  const handlePreferenceEdit = (key: 'currentWeek' | 'mealsPerDay' | 'dietaryRestrictions' | 'allergies') => {
    setEditingPreference(key);
    setShowPreferenceModal(true);
  };

  const handlePreferenceSave = (value: string[]) => {
    if (editingPreference) {
      setPreferences(prev => ({
        ...prev,
        [editingPreference]: value
      }));
    }
    setShowPreferenceModal(false);
    setEditingPreference(null);
  };

  const handlePreferenceModalClose = () => {
    setShowPreferenceModal(false);
    setEditingPreference(null);
  };

  const handleSubmitToAI = async () => {
    if (!manualIngredients.trim()) {
      showAlert({
        title: 'Missing Ingredients',
        message: 'Please add some ingredients before generating a meal plan.',
        type: 'warning',
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Fetch user's saved recipes
      const savedRecipes = await recipeService.getAllRecipes();

      // Parse ingredients from manual input
      const ingredients = manualIngredients
        .split(',')
        .map(ingredient => ingredient.trim())
        .filter(ingredient => ingredient.length > 0);

      // Map saved recipes to AI format
      const aiSavedRecipes: AISavedRecipe[] = savedRecipes.map(recipe => ({
        id: recipe.id,
        title: recipe.title,
        imageUrl: recipe.imageUrl,
        tags: recipe.tags,
        description: recipe.description,
      }));

      // Prepare AI payload
      const aiPayload: AIPayload = {
        preferences: {
          mealsPerDay: preferences.mealsPerDay.length,
          daysToPlan: preferences.currentWeek.length,
          dietaryRestrictions: preferences.dietaryRestrictions.filter(item => item !== 'None'),
          prefersLeftovers: true, // Could be made configurable
          needsLunchbox: false, // Could be made configurable
        },
        ingredients,
        savedRecipes: aiSavedRecipes,
      };

      // Validate payload
      if (!aiService.validatePayload(aiPayload)) {
        throw new Error('Invalid meal planning preferences. Please check your settings.');
      }

      // Call AI service
      const aiResponse = await aiService.generateMealPlanAI(aiPayload);

      if (!aiResponse.success || !aiResponse.data) {
        throw new Error(aiResponse.error || 'Failed to generate meal plan');
      }

      // Save the AI-generated meal plan
      await mealPlanService.saveMealPlanFromAIResponse(aiResponse.data);

      // Show success message
      showAlert({
        title: 'Meal Plan Generated!',
        message: 'Your AI-powered meal plan has been created successfully. Check your home screen to see your new meals.',
        type: 'success',
        buttons: [
          {
            text: 'View Meal Plan',
            onPress: () => router.push('/(tabs)'),
          },
        ],
      });

    } catch (error) {
      console.error('Error generating meal plan:', error);
      showAlert({
        title: 'Generation Failed',
        message: error instanceof Error ? error.message : 'Failed to generate meal plan. Please try again.',
        type: 'error',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getPreferenceModalTitle = () => {
    switch (editingPreference) {
      case 'currentWeek':
        return 'Planning Days';
      case 'mealsPerDay':
        return 'Meals per Day';
      case 'dietaryRestrictions':
        return 'Dietary Restrictions';
      case 'allergies':
        return 'Allergies';
      default:
        return '';
    }
  };

  const getPreferenceSubtitle = (key: keyof typeof preferences) => {
    const value = preferences[key];
    if (Array.isArray(value)) {
      // Special handling for currentWeek to show simplified labels
      if (key === 'currentWeek') {
        const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const weekends = ['Saturday', 'Sunday'];
        
        // Check if all days are selected
        if (value.length === allDays.length && allDays.every(day => value.includes(day))) {
          return 'All days';
        }
        
        // Check if only weekdays are selected
        if (value.length === weekdays.length && weekdays.every(day => value.includes(day)) && !weekends.some(day => value.includes(day))) {
          return 'Weekdays only';
        }
        
        // Check if only weekends are selected
        if (value.length === weekends.length && weekends.every(day => value.includes(day)) && !weekdays.some(day => value.includes(day))) {
          return 'Weekends only';
        }
        
        // Otherwise, show individual days
        return value.join(', ');
      }
      
      return value.join(', ');
    }
    return value;
  };

  const renderManualEntryModal = () => (
    <Modal
      visible={showManualEntry}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowManualEntry(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Ingredients</Text>
            <TouchableOpacity 
              onPress={() => setShowManualEntry(false)} 
              style={styles.closeButton}
            >
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.modalSubtitle}>
            Enter ingredients you have available (e.g., "chicken, rice, broccoli")
          </Text>
          
          <TextInput
            style={styles.ingredientInput}
            placeholder="Type your ingredients here..."
            value={manualIngredients}
            onChangeText={setManualIngredients}
            multiline={true}
            numberOfLines={4}
            textAlignVertical="top"
            placeholderTextColor="#9CA3AF"
          />
          
          <View style={styles.modalActions}>
            <Button
              title="Cancel"
              onPress={() => setShowManualEntry(false)}
              variant="outline"
              style={styles.modalButton}
            />
            <Button
              title="Save"
              onPress={handleSaveManualEntry}
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
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
          >
            <ChevronLeft size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.title}>AI Meal Planner</Text>
          <View style={styles.placeholder} />
        </View>

        {/* AI Sous-Chef Banner */}
        <View style={styles.aiBanner}>
          <View style={styles.aiIconContainer}>
            <Sparkles size={24} color="#F97966" />
          </View>
          <View style={styles.aiBannerContent}>
            <Text style={styles.aiBannerTitle}>Your AI Sous-Chef</Text>
            <Text style={styles.aiBannerDescription}>
              Tell me what ingredients you have, and I'll create a personalized meal plan just for you!
            </Text>
          </View>
        </View>

        {/* Add Ingredients Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add Ingredients</Text>
          
          <View style={styles.ingredientButtons}>
            <Button
              title="Take a Photo"
              onPress={handleTakePhoto}
              variant="primary"
              style={[styles.ingredientButton, styles.photoButton]}
              textStyle={styles.photoButtonText}
            />
            <Button
              title="Manual Entry"
              onPress={handleManualEntry}
              variant="outline"
              style={[styles.ingredientButton, styles.manualButton]}
              textStyle={styles.manualButtonText}
            />
          </View>

          {manualIngredients ? (
            <Card style={styles.ingredientsPreview}>
              <Text style={styles.ingredientsLabel}>Your Ingredients:</Text>
              <Text style={styles.ingredientsText}>{manualIngredients}</Text>
              <TouchableOpacity onPress={handleManualEntry}>
                <Text style={styles.editText}>Edit</Text>
              </TouchableOpacity>
            </Card>
          ) : null}
        </View>

        {/* Default Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meal Planning Preferences</Text>
          
          <Card style={styles.preferencesCard}>
            <TouchableOpacity 
              style={styles.preferenceItem}
              onPress={() => handlePreferenceEdit('currentWeek')}
            >
              <View style={styles.preferenceContent}>
                <Text style={styles.preferenceTitle}>Planning Days</Text>
                <Text style={styles.preferenceSubtitle}>{getPreferenceSubtitle('currentWeek')}</Text>
              </View>
              <ChevronRight size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <View style={styles.preferenceDivider} />

            <TouchableOpacity 
              style={styles.preferenceItem}
              onPress={() => handlePreferenceEdit('mealsPerDay')}
            >
              <View style={styles.preferenceContent}>
                <Text style={styles.preferenceTitle}>Meals per Day</Text>
                <Text style={styles.preferenceSubtitle}>{getPreferenceSubtitle('mealsPerDay')}</Text>
              </View>
              <ChevronRight size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <View style={styles.preferenceDivider} />

            <TouchableOpacity 
              style={styles.preferenceItem}
              onPress={() => handlePreferenceEdit('dietaryRestrictions')}
            >
              <View style={styles.preferenceContent}>
                <Text style={styles.preferenceTitle}>Dietary Restrictions</Text>
                <Text style={styles.preferenceSubtitle}>{getPreferenceSubtitle('dietaryRestrictions')}</Text>
              </View>
              <ChevronRight size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <View style={styles.preferenceDivider} />

            <TouchableOpacity 
              style={styles.preferenceItem}
              onPress={() => handlePreferenceEdit('allergies')}
            >
              <View style={styles.preferenceContent}>
                <Text style={styles.preferenceTitle}>Allergies</Text>
                <Text style={styles.preferenceSubtitle}>{getPreferenceSubtitle('allergies')}</Text>
              </View>
              <ChevronRight size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </Card>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.submitContainer}>
        <Button
          title={isGenerating ? "Generating Your Meal Plan..." : "Generate Meal Plan"}
          onPress={handleSubmitToAI}
          variant="primary"
          size="large"
          style={styles.submitButton}
          disabled={isGenerating || !manualIngredients.trim()}
        />
      </View>

      {renderManualEntryModal()}
      
      {editingPreference && (
        <PreferenceModal
          visible={showPreferenceModal}
          title={getPreferenceModalTitle()}
          type={editingPreference}
          currentValue={preferences[editingPreference]}
          onSave={handlePreferenceSave}
          onClose={handlePreferenceModalClose}
        />
      )}

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
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
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
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 32,
    padding: 20,
    backgroundColor: '#FEF3F2',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F97966',
  },
  aiIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F97966',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  aiBannerContent: {
    flex: 1,
  },
  aiBannerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 4,
  },
  aiBannerDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 16,
  },
  ingredientButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  ingredientButton: {
    flex: 1,
    borderRadius: 24,
    paddingVertical: 12,
  },
  photoButton: {
    backgroundColor: '#F97966',
  },
  photoButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
  manualButton: {
    backgroundColor: '#E5E7EB',
    borderColor: '#E5E7EB',
  },
  manualButtonText: {
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
  },
  ingredientsPreview: {
    marginTop: 16,
    backgroundColor: '#F8F9FA',
  },
  ingredientsLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 8,
  },
  ingredientsText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
    marginBottom: 8,
    lineHeight: 22,
  },
  editText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#F97966',
  },
  preferencesCard: {
    padding: 0,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  preferenceContent: {
    flex: 1,
  },
  preferenceTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 4,
  },
  preferenceSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  preferenceDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 20,
  },
  submitContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  submitButton: {
    width: '100%',
    borderRadius: 24,
    paddingVertical: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 22,
  },
  modalScrollView: {
    maxHeight: 400,
    marginBottom: 24,
  },
  ingredientInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    backgroundColor: '#FFFFFF',
    color: '#111827',
    minHeight: 120,
    marginBottom: 24,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  customInputContainer: {
    marginTop: 16,
  },
  customInputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 8,
  },
  customInput: {
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
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});