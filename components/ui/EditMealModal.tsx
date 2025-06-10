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
import { sampleRecipes } from '@/data/sampleData';
import { Meal, Recipe } from '@/types';

interface EditMealModalProps {
  visible: boolean;
  meal: Meal;
  onSave: (updatedMeal: Meal) => void;
  onClose: () => void;
}

export default function EditMealModal({ visible, meal, onSave, onClose }: EditMealModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [customTitle, setCustomTitle] = useState('');

  // Initialize state when modal opens
  useEffect(() => {
    if (visible) {
      if (meal.recipe) {
        setSelectedRecipe(meal.recipe);
        setSearchQuery(meal.recipe.title);
        setCustomTitle('');
      } else {
        setSelectedRecipe(null);
        setSearchQuery('');
        setCustomTitle('');
      }
    }
  }, [visible, meal]);

  // Filter recipes based on search query
  const filteredRecipes = sampleRecipes.filter(recipe =>
    recipe.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const handleSave = () => {
    let updatedMeal: Meal;

    if (selectedRecipe) {
      // Use selected recipe from the recipe book
      updatedMeal = {
        ...meal,
        recipe: selectedRecipe,
      };
    } else if (customTitle.trim()) {
      // Create a custom meal with placeholder image
      const customRecipe: Recipe = {
        id: `custom-${Date.now()}`,
        title: customTitle.trim(),
        description: 'Custom meal',
        imageUrl: 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg',
        cookingTime: 30,
        servings: 1,
        difficulty: 'Easy',
        calories: 0,
        ingredients: [],
        instructions: [],
        tags: ['Custom'],
        isFavorite: false,
        createdAt: new Date(),
      };

      updatedMeal = {
        ...meal,
        recipe: customRecipe,
      };
    } else {
      // No recipe selected and no custom title
      updatedMeal = {
        ...meal,
        recipe: undefined,
      };
    }

    onSave(updatedMeal);
  };

  const handleCancel = () => {
    setSearchQuery('');
    setSelectedRecipe(null);
    setCustomTitle('');
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

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Search size={20} color="#9CA3AF" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search recipes or type custom meal name..."
                value={searchQuery}
                onChangeText={handleSearchChange}
                placeholderTextColor="#9CA3AF"
                autoFocus={true}
              />
            </View>
          </View>

          {/* Content */}
          <ScrollView style={styles.contentScrollView} showsVerticalScrollIndicator={false}>
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
  searchContainer: {
    marginBottom: 20,
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
  contentScrollView: {
    maxHeight: 400,
    marginBottom: 20,
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