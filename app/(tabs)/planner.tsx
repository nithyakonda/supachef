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

export default function PlannerScreen() {
  const [ingredientMethod, setIngredientMethod] = useState<'photo' | 'manual'>('photo');
  const [manualIngredients, setManualIngredients] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);
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

  const handlePreferenceEdit = (key: string) => {
    // Stub implementation - would open preference editor
    console.log(`Editing preference: ${key}`);
  };

  const handleSubmitToAI = () => {
    // Stub implementation - would generate meal plan
    console.log('Submitting to AI Sous-Chef with:', {
      ingredients: manualIngredients,
      preferences,
    });
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
          size="small"
          style={styles.submitButton}
        />
      </View>

      {renderManualEntryModal()}
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
    paddingVertical: 16,
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
    paddingVertical: 18,
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
    minHeight: 400,
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
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});