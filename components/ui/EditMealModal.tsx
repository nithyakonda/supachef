import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { X, Search } from 'lucide-react-native';
import Button from './Button';
import Chip from './Chip';
import { sampleRecipes } from '@/data/sampleData';
import { Meal, Recipe, MealPlan, MealRecipeData } from '@/types';

interface EditMealModalProps {
  visible: boolean;
  meal: Meal;
  currentDayIndex: number;
  allWeeklyMealPlans: MealPlan[];
  allMealTypes: string[];
  onSave: (updatedMealRecipes: MealRecipeData[], newDayIndex?: number, newMealType?: string) => void;
  onClose: () => void;
}

export default function EditMealModal({ 
  visible, 
  meal, 
  currentDayIndex,
  allWeeklyMealPlans,
  allMealTypes,
  onSave, 
  onClose 
}: EditMealModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [selectedDayIndex, setSelectedDayIndex] = useState(currentDayIndex);
  const [selectedMealType, setSelectedMealType] = useState(meal.type);
  const [isLeftover, setIsLeftover] = useState(false);
  const [isLunchbox, setIsLunchbox] = useState(false);

  const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Initialize state when modal opens
  useEffect(() => {
    if (visible) {
      if (meal.mealRecipes && meal.mealRecipes.length > 0) {
        // Find the recipe from sample recipes based on the first meal recipe
        const firstMealRecipe = meal.mealRecipes[0];
        const foundRecipe = sampleRecipes.find(recipe => recipe.id === firstMealRecipe.recipeId);
        
        if (foundRecipe) {
          setSelectedRecipe(foundRecipe);
          setSearchQuery(foundRecipe.title);
        } else {
          // If recipe not found in sample recipes, use the title from meal recipe data
          setSelectedRecipe(null);
          setSearchQuery(firstMealRecipe.title);
          setCustomTitle(firstMealRecipe.title);
        }
        
        // Set meal flags from the first meal recipe
        setIsLeftover(firstMealRecipe.leftover || false);
        setIsLunchbox(firstMealRecipe.lunchbox || false);
      } else {
        setSelectedRecipe(null);
        setSearchQuery('');
        setCustomTitle('');
        setIsLeftover(false);
        setIsLunchbox(false);
      }
      setSelectedDayIndex(currentDayIndex);
      setSelectedMealType(meal.type);
    }
  }, [visible, meal, currentDayIndex]);

  // Filter recipes based on search query
  const filteredRecipes = sampleRecipes.filter(recipe =>
    recipe.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get available days (current day and future days)
  const availableDays = allWeeklyMealPlans.map((plan, index) => ({
    index,
    name: weekDays[index],
    date: plan.date,
    isCurrent: index === currentDayIndex,
    isFuture: index >= currentDayIndex
  })).filter(day => day.isFuture);

  const handleRecipeSelect = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setSearchQuery(recipe.title);
    setCustomTitle('');
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    
    // If the text doesn't match any recipe exactly, clear selected recipe
    const exactMatch = sampleRecipes.find(recipe => 
      recipe.title.toLowerCase() === text.toLowerCase()
    );
    
    if (!exactMatch) {
      setSelectedRecipe(null);
      setCustomTitle(text);
    }
  };

  const handleDaySelect = (dayIndex: number) => {
    setSelectedDayIndex(dayIndex);
  };

  const handleMealTypeSelect = (mealType: string) => {
    setSelectedMealType(mealType);
  };

  const handleSave = () => {
    let updatedMealRecipes: MealRecipeData[] = [];

    if (selectedRecipe) {
      // Use selected recipe from the recipe book
      updatedMealRecipes = [{
        recipeId: selectedRecipe.id,
        title: selectedRecipe.title,
        imageUrl: selectedRecipe.imageUrl,
        leftover: isLeftover,
        lunchbox: isLunchbox,
        aiSuggested: false,
        isPlaceholder: false,
      }];
    } else if (customTitle.trim()) {
      // Create a custom meal with placeholder data
      updatedMealRecipes = [{
        recipeId: `custom-${Date.now()}`,
        title: customTitle.trim(),
        imageUrl: 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg',
        leftover: isLeftover,
        lunchbox: isLunchbox,
        aiSuggested: false,
        isPlaceholder: true, // Mark as placeholder since it's a custom entry
      }];
    }

    onSave(updatedMealRecipes, selectedDayIndex, selectedMealType);
  };

  const handleCancel = () => {
    setSearchQuery('');
    setSelectedRecipe(null);
    setCustomTitle('');
    setSelectedDayIndex(currentDayIndex);
    setSelectedMealType(meal.type);
    setIsLeftover(false);
    setIsLunchbox(false);
    onClose();
  };

  const showSuggestions = searchQuery.length > 0 && !selectedRecipe && filteredRecipes.length > 0;
  const showCustomPreview = searchQuery.length > 0 && !selectedRecipe && customTitle.trim().length > 0;
  const showSelectedPreview = selectedRecipe !== null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Edit {meal.type.charAt(0).toUpperCase() + meal.type.slice(1)}
            </Text>
            <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.contentScrollView} showsVerticalScrollIndicator={false}>
            {/* Day Selection */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Select Day</Text>
              <View style={styles.chipsContainer}>
                {availableDays.map((day) => (
                  <Chip
                    key={day.index}
                    label={day.isCurrent ? `${day.name} (Today)` : day.name}
                    selected={selectedDayIndex === day.index}
                    onPress={() => handleDaySelect(day.index)}
                  />
                ))}
              </View>
            </View>

            {/* Meal Type Selection */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Select Meal Type</Text>
              <View style={styles.chipsContainer}>
                {allMealTypes.map((mealType) => (
                  <Chip
                    key={mealType}
                    label={mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                    selected={selectedMealType === mealType}
                    onPress={() => handleMealTypeSelect(mealType)}
                  />
                ))}
              </View>
            </View>

            {/* Search Bar */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Recipe</Text>
              <View style={styles.searchInputContainer}>
                <Search size={20} color="#9CA3AF" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search recipes or type custom meal name..."
                  value={searchQuery}
                  onChangeText={handleSearchChange}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Meal Flags Section */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Meal Options</Text>
              <Text style={styles.sectionSubtitle}>Select any options that apply to this meal</Text>
              <View style={styles.flagsContainer}>
                <TouchableOpacity
                  style={[
                    styles.flagOption,
                    isLeftover && styles.selectedFlagOption
                  ]}
                  onPress={() => setIsLeftover(!isLeftover)}
                >
                  <View style={styles.flagOptionContent}>
                    <Text style={[
                      styles.flagOptionTitle,
                      isLeftover && styles.selectedFlagText
                    ]}>
                      Leftover
                    </Text>
                    <Text style={[
                      styles.flagOptionDescription,
                      isLeftover && styles.selectedFlagDescription
                    ]}>
                      This meal uses leftovers from a previous meal
                    </Text>
                  </View>
                  <View style={[
                    styles.flagCheckbox,
                    isLeftover && styles.selectedCheckbox
                  ]}>
                    {isLeftover && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.flagOption,
                    isLunchbox && styles.selectedFlagOption
                  ]}
                  onPress={() => setIsLunchbox(!isLunchbox)}
                >
                  <View style={styles.flagOptionContent}>
                    <Text style={[
                      styles.flagOptionTitle,
                      isLunchbox && styles.selectedFlagText
                    ]}>
                      Lunchbox
                    </Text>
                    <Text style={[
                      styles.flagOptionDescription,
                      isLunchbox && styles.selectedFlagDescription
                    ]}>
                      This meal is suitable for packing in a lunchbox
                    </Text>
                  </View>
                  <View style={[
                    styles.flagCheckbox,
                    isLunchbox && styles.selectedCheckbox
                  ]}>
                    {isLunchbox && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Recipe Suggestions */}
            {showSuggestions && (
              <View style={styles.suggestionsContainer}>
                <Text style={styles.suggestionsTitle}>Recipe Suggestions</Text>
                {filteredRecipes.map((recipe) => (
                  <TouchableOpacity
                    key={recipe.id}
                    style={styles.suggestionItem}
                    onPress={() => handleRecipeSelect(recipe)}
                  >
                    <Image
                      source={{ uri: recipe.imageUrl }}
                      style={styles.suggestionImage}
                    />
                    <View style={styles.suggestionInfo}>
                      <Text style={styles.suggestionTitle}>{recipe.title}</Text>
                      <Text style={styles.suggestionDetails}>
                        {recipe.cookingTime} min • {recipe.calories} cal
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Selected Recipe Preview */}
            {showSelectedPreview && (
              <View style={styles.previewContainer}>
                <Text style={styles.previewTitle}>Selected Recipe</Text>
                <View style={styles.previewCard}>
                  <Image
                    source={{ uri: selectedRecipe.imageUrl }}
                    style={styles.previewImage}
                  />
                  <View style={styles.previewInfo}>
                    <Text style={styles.previewRecipeTitle}>{selectedRecipe.title}</Text>
                    <Text style={styles.previewRecipeDetails}>
                      {selectedRecipe.cookingTime} min • {selectedRecipe.calories} cal
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Custom Meal Preview */}
            {showCustomPreview && (
              <View style={styles.previewContainer}>
                <Text style={styles.previewTitle}>Custom Meal</Text>
                <View style={styles.previewCard}>
                  <Image
                    source={{ uri: 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg' }}
                    style={styles.previewImage}
                  />
                  <View style={styles.previewInfo}>
                    <Text style={styles.previewRecipeTitle}>{customTitle}</Text>
                    <Text style={styles.previewRecipeDetails}>Custom meal</Text>
                  </View>
                </View>
              </View>
            )}

            {/* No results message */}
            {searchQuery.length > 0 && filteredRecipes.length === 0 && !showCustomPreview && (
              <View style={styles.noResultsContainer}>
                <Text style={styles.noResultsText}>
                  No recipes found. Keep typing to create a custom meal.
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Actions */}
          <View style={styles.modalActions}>
            <Button
              title="Cancel"
              onPress={handleCancel}
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
}

const styles = StyleSheet.create({
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
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
  contentScrollView: {
    maxHeight: 500,
    marginBottom: 20,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
  },
  flagsContainer: {
    gap: 12,
  },
  flagOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  selectedFlagOption: {
    borderColor: '#F97966',
    backgroundColor: '#FEF3F2',
  },
  flagOptionContent: {
    flex: 1,
  },
  flagOptionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 4,
  },
  selectedFlagText: {
    color: '#F97966',
  },
  flagOptionDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
  },
  selectedFlagDescription: {
    color: '#DC2626',
  },
  flagCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  selectedCheckbox: {
    borderColor: '#F97966',
    backgroundColor: '#F97966',
  },
  checkmark: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  suggestionsContainer: {
    marginBottom: 20,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 12,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 8,
  },
  suggestionImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 2,
  },
  suggestionDetails: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  previewContainer: {
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 12,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FEF3F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F97966',
  },
  previewImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 16,
  },
  previewInfo: {
    flex: 1,
  },
  previewRecipeTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 4,
  },
  previewRecipeDetails: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noResultsText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});