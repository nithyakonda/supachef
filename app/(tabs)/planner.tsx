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
import { ChevronLeft, ChevronRight, Camera, X } from 'lucide-react-native';
import { router } from 'expo-router';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';

interface PreferenceModalProps {
  visible: boolean;
  title: string;
  type: 'currentWeek' | 'mealsPerDay' | 'dietaryRestrictions' | 'allergies';
  currentValue: string;
  onSave: (value: string) => void;
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
  const [selectedValue, setSelectedValue] = useState(currentValue);
  const [customInput, setCustomInput] = useState('');

  const getOptions = () => {
    switch (type) {
      case 'currentWeek':
        return ['7 days', '5 days (weekdays)', '6 days (no Sunday)', '3 days'];
      case 'mealsPerDay':
        return ['1 meal per day', '2 meals per day', '3 meals per day', '4 meals per day'];
      case 'dietaryRestrictions':
        return ['None', 'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Keto', 'Paleo', 'Low-Carb'];
      case 'allergies':
        return ['None', 'Nuts', 'Shellfish', 'Dairy', 'Eggs', 'Soy', 'Gluten', 'Fish'];
      default:
        return [];
    }
  };

  const handleSave = () => {
    const valueToSave = customInput.trim() || selectedValue;
    onSave(valueToSave);
    setCustomInput('');
    onClose();
  };

  const handleClose = () => {
    setSelectedValue(currentValue);
    setCustomInput('');
    onClose();
  };

  const options = getOptions();
  const allowsMultiple = type === 'dietaryRestrictions' || type === 'allergies';
  const allowsCustom = type === 'dietaryRestrictions' || type === 'allergies';

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
            {allowsMultiple ? (
              <View style={styles.chipsContainer}>
                {options.map((option) => (
                  <Chip
                    key={option}
                    label={option}
                    selected={selectedValue.includes(option)}
                    onPress={() => {
                      if (option === 'None') {
                        setSelectedValue('None');
                      } else {
                        const currentSelections = selectedValue === 'None' ? [] : selectedValue.split(', ');
                        if (currentSelections.includes(option)) {
                          const newSelections = currentSelections.filter(item => item !== option);
                          setSelectedValue(newSelections.length > 0 ? newSelections.join(', ') : 'None');
                        } else {
                          const newSelections = [...currentSelections.filter(item => item !== 'None'), option];
                          setSelectedValue(newSelections.join(', '));
                        }
                      }
                    }}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.optionsContainer}>
                {options.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.optionItem,
                      selectedValue === option && styles.selectedOption
                    ]}
                    onPress={() => setSelectedValue(option)}
                  >
                    <View style={[
                      styles.radioCircle,
                      selectedValue === option && styles.selectedCircle
                    ]} />
                    <Text style={[
                      styles.optionText,
                      selectedValue === option && styles.selectedOptionText
                    ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

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
  const [manualIngredients, setManualIngredients] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showPreferenceModal, setShowPreferenceModal] = useState(false);
  const [editingPreference, setEditingPreference] = useState<'currentWeek' | 'mealsPerDay' | 'dietaryRestrictions' | 'allergies' | null>(null);
  const [preferences, setPreferences] = useState({
    currentWeek: '7 days',
    mealsPerDay: '3 meals per day',
    dietaryRestrictions: 'None',
    allergies: 'None',
  });

  const handleTakePhoto = () => {
    // Stub implementation - would open camera
    console.log('Opening camera for ingredient detection...');
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

  const handlePreferenceSave = (value: string) => {
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

  const handleSubmitToAI = () => {
    // Stub implementation - would generate meal plan
    console.log('Submitting to AI Sous-Chef with:', {
      ingredients: manualIngredients,
      preferences,
    });
  };

  const getPreferenceModalTitle = () => {
    switch (editingPreference) {
      case 'currentWeek':
        return 'Planning Duration';
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
          <Text style={styles.title}>Meal Planner</Text>
          <View style={styles.placeholder} />
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
          <Text style={styles.sectionTitle}>Default Preferences</Text>
          
          <Card style={styles.preferencesCard}>
            <TouchableOpacity 
              style={styles.preferenceItem}
              onPress={() => handlePreferenceEdit('currentWeek')}
            >
              <View style={styles.preferenceContent}>
                <Text style={styles.preferenceTitle}>Current Week</Text>
                <Text style={styles.preferenceSubtitle}>{preferences.currentWeek}</Text>
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
                <Text style={styles.preferenceSubtitle}>{preferences.mealsPerDay}</Text>
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
                <Text style={styles.preferenceSubtitle}>{preferences.dietaryRestrictions}</Text>
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
                <Text style={styles.preferenceSubtitle}>{preferences.allergies}</Text>
              </View>
              <ChevronRight size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </Card>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.submitContainer}>
        <Button
          title="Submit to AI Sous-Chef"
          onPress={handleSubmitToAI}
          variant="primary"
          size="large"
          style={styles.submitButton}
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
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
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
  optionsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  selectedOption: {
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
  optionText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#374151',
  },
  selectedOptionText: {
    color: '#F97966',
    fontFamily: 'Inter-SemiBold',
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