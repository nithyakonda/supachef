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
import { Meal, Recipe, MealPlan, MealRecipeData } from '@/types';
import { recipeService } from '@/services/recipeService';

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
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);

  const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Check if the current meal is a placeholder meal
  const isPlaceholderMeal = meal.mealRecipes && meal.mealRecipes.length > 0 && meal.mealRecipes[0].isPlaceholder;

  // Load all recipes from Supabase
  const loadRecipes = async () => {
    try {
      setLoading(true);
      const recipes = await recipeService.getAllRecipes();
      setAllRecipes(recipes);
    } catch (error) {
      console.error('Error loading recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize state when modal opens
  useEffect(() => {
    if (visible) {
      loadRecipes();
      
      if (meal.mealRecipes && meal.mealRecipes.length > 0) {
        // Find the recipe from all recipes based on the first meal recipe
        const firstMealRecipe = meal.mealRecipes[0];
        const foundRecipe = allRecipes.find(recipe => recipe.id === firstMealRecipe.recipeId);
        
        if (foundRecipe) {
          setSelectedRecipe(foundRecipe);
          setSearchQuery(foundRecipe.title);
        } else {
          // If recipe not found in recipes, use the title from meal recipe data
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
  const filteredRecipes = allRecipes.filter(recipe =>
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
    const exactMatch = allRecipes.find(recipe => 
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

    // For placeholder meals, don't allow moving to different day/meal type
    if (isPlaceholderMeal) {
      onSave(updatedMealRecipes, currentDayIndex, meal.type);
    } else {
      onSave(updatedMealRecipes, selectedDayIndex, selectedMealType);
    }
  };

  const handleDeleteRecipeFromMeal = () => {
    // Remove the current recipe from the meal by passing an empty array
    // This will signal to the parent component to remove this meal entry
    if (isPlaceholderMeal) {
      onSave([], currentDayIndex, meal.type);
    } else {
      onSave([], selectedDayIndex, selectedMealType);
    }
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
  const showCustomPreview = searchQuery.length > 0 && !selectedRecipe && customTitle.trim().length > 0 && !isPlaceholderMeal;

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
            {/* 1. Selected Recipe Section */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Selected Recipe</Text>
              
              {/* Search Bar */}
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

              {/* Loading indicator */}
              {loading && (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Loading recipes...</Text>
                </View>
              )}

              {/* Recipe Suggestions - Only show for non-placeholder meals */}
              {showSuggestions && !isPlaceholderMeal && !loading && (
                <View style={styles.suggestionsContainer}>
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

              {/* Custom Meal Preview - Only show for non-placeholder meals */}
              {showCustomPreview && (
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
              )}

              {/* No results message - Only show for non-placeholder meals */}
              {searchQuery.length > 0 && filteredRecipes.length === 0 && !showCustomPreview && !isPlaceholderMeal && !loading && (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsText}>
                    No recipes found. Keep typing to create a custom meal.
                  </Text>
                </View>
              )}
            </View>

            {/* 2. Move to Day Section - Hidden for placeholder meals */}
            {!isPlaceholderMeal && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Move to Day</Text>
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
            )}

            {/* 3. Move to Meal Section - Hidden for placeholder meals */}
            {!isPlaceholderMeal && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Move to Meal</Text>
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
            )}

            {/* 4. Meal Options Section */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Meal Options</Text>
              <View style={styles.chipsContainer}>
                <Chip
                  label="Leftover"
                  selected={isLeftover}
                  onPress={() => setIsLeftover(!isLeftover)}
                />
                <Chip
                  label="Lunchbox"
                  selected={isLunchbox}
                  onPress={() => setIsLunchbox(!isLunchbox)}
                />
              </View>
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.modalActions}>
            <Button
              title="Delete"
              onPress={handleDeleteRecipeFromMeal}
              variant="outline"
              style={[styles.modalButton, styles.deleteButton]}
              textStyle={styles.deleteButtonText}
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
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  suggestionsContainer: {
    marginBottom: 16,
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
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FEF3F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F97966',
    marginBottom: 16,
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
  deleteButton: {
    borderColor: '#EF4444',
  },
  deleteButtonText: {
    color: '#EF4444',
  },
});