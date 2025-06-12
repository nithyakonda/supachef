import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Star, Heart } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Button from '@/components/ui/Button';
import { Recipe } from '@/types';
import { recipeService } from '@/services/recipeService';

interface RecipeFormData {
  title: string;
  description: string;
  imageUrl: string;
  cookingTime: number;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  calories: number;
  ingredients: string;
  instructions: string;
  tags: string[];
  rating: number;
  notes: string;
  isFavorite: boolean;
}

export default function AddEditRecipeScreen() {
  const { recipeId } = useLocalSearchParams<{ recipeId?: string }>();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<RecipeFormData>({
    title: '',
    description: '',
    imageUrl: '',
    cookingTime: 30,
    servings: 4,
    difficulty: 'Easy',
    calories: 0,
    ingredients: '',
    instructions: '',
    tags: [],
    rating: 0,
    notes: '',
    isFavorite: false,
  });

  // Load recipe data if editing
  useEffect(() => {
    if (recipeId) {
      setIsEditing(true);
      loadRecipe();
    }
  }, [recipeId]);

  const loadRecipe = async () => {
    if (!recipeId) return;

    try {
      setLoading(true);
      const recipe = await recipeService.getRecipeById(recipeId);
      if (recipe) {
        setFormData({
          title: recipe.title,
          description: recipe.description,
          imageUrl: recipe.imageUrl,
          cookingTime: recipe.cookingTime,
          servings: recipe.servings,
          difficulty: recipe.difficulty,
          calories: recipe.calories,
          ingredients: recipe.ingredients.map(ing => `${ing.amount} ${ing.unit || ''} ${ing.name}`).join('\n'),
          instructions: recipe.instructions.join('\n'),
          tags: recipe.tags,
          rating: recipe.rating || 0,
          notes: recipe.notes || '',
          isFavorite: recipe.isFavorite,
        });
      } else {
        Alert.alert('Error', 'Recipe not found');
        router.back();
      }
    } catch (error) {
      console.error('Error loading recipe:', error);
      Alert.alert('Error', 'Failed to load recipe');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a recipe title');
      return;
    }

    try {
      setLoading(true);

      const ingredientsArray = formData.ingredients
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          const parts = line.trim().split(' ');
          const amount = parts[0];
          const unit = parts[1];
          const name = parts.slice(2).join(' ');
          return { name: name || line.trim(), amount, unit };
        });

      const instructionsArray = formData.instructions
        .split('\n')
        .filter(line => line.trim());

      const recipeData: Recipe = {
        id: recipeId || `recipe-${Date.now()}`,
        title: formData.title,
        description: formData.description,
        imageUrl: formData.imageUrl || 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg',
        cookingTime: formData.cookingTime,
        servings: formData.servings,
        difficulty: formData.difficulty,
        calories: formData.calories,
        ingredients: ingredientsArray,
        instructions: instructionsArray,
        tags: formData.tags,
        rating: formData.rating,
        notes: formData.notes,
        isFavorite: formData.isFavorite,
        createdAt: isEditing ? new Date() : new Date(), // In real app, preserve original createdAt for edits
      };

      if (isEditing) {
        await recipeService.updateRecipe(recipeData);
      } else {
        await recipeService.saveRecipe(recipeData);
      }

      router.back();
    } catch (error) {
      console.error('Error saving recipe:', error);
      Alert.alert('Error', 'Failed to save recipe');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const renderStarRating = (rating: number, onPress?: (rating: number) => void) => {
    return (
      <View style={styles.starContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onPress?.(star)}
            disabled={!onPress}
          >
            <Star
              size={24}
              color={star <= rating ? '#F59E0B' : '#E5E7EB'}
              fill={star <= rating ? '#F59E0B' : 'none'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (loading && isEditing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading recipe...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
          <X size={24} color="#6B7280" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Edit Recipe' : 'Add New Recipe'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Title *</Text>
            <TextInput
              style={styles.formInput}
              value={formData.title}
              onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
              placeholder="Recipe title"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Description</Text>
            <TextInput
              style={[styles.formInput, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              placeholder="Brief description"
              multiline
              numberOfLines={3}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Image URL</Text>
            <TextInput
              style={styles.formInput}
              value={formData.imageUrl}
              onChangeText={(text) => setFormData(prev => ({ ...prev, imageUrl: text }))}
              placeholder="https://example.com/image.jpg"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* Recipe Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recipe Details</Text>
          
          <View style={styles.formRow}>
            <View style={styles.formGroupHalf}>
              <Text style={styles.formLabel}>Cooking Time (min)</Text>
              <TextInput
                style={styles.formInput}
                value={formData.cookingTime.toString()}
                onChangeText={(text) => setFormData(prev => ({ ...prev, cookingTime: parseInt(text) || 0 }))}
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <View style={styles.formGroupHalf}>
              <Text style={styles.formLabel}>Servings</Text>
              <TextInput
                style={styles.formInput}
                value={formData.servings.toString()}
                onChangeText={(text) => setFormData(prev => ({ ...prev, servings: parseInt(text) || 0 }))}
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={styles.formGroupHalf}>
              <Text style={styles.formLabel}>Difficulty</Text>
              <View style={styles.difficultyButtons}>
                {['Easy', 'Medium', 'Hard'].map((difficulty) => (
                  <TouchableOpacity
                    key={difficulty}
                    style={[
                      styles.difficultyButton,
                      formData.difficulty === difficulty && styles.selectedDifficulty
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, difficulty: difficulty as any }))}
                  >
                    <Text style={[
                      styles.difficultyButtonText,
                      formData.difficulty === difficulty && styles.selectedDifficultyText
                    ]}>
                      {difficulty}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.formGroupHalf}>
              <Text style={styles.formLabel}>Calories (optional)</Text>
              <TextInput
                style={styles.formInput}
                value={formData.calories.toString()}
                onChangeText={(text) => setFormData(prev => ({ ...prev, calories: parseInt(text) || 0 }))}
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Rating</Text>
            {renderStarRating(formData.rating, (rating) => 
              setFormData(prev => ({ ...prev, rating }))
            )}
          </View>
        </View>

        {/* Ingredients */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ingredients</Text>
          <Text style={styles.sectionSubtitle}>Enter one ingredient per line (e.g., "2 cups flour")</Text>
          
          <View style={styles.formGroup}>
            <TextInput
              style={[styles.formInput, styles.textArea]}
              value={formData.ingredients}
              onChangeText={(text) => setFormData(prev => ({ ...prev, ingredients: text }))}
              placeholder="2 cups flour&#10;1 tsp salt&#10;3 eggs"
              multiline
              numberOfLines={8}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          <Text style={styles.sectionSubtitle}>Enter one step per line</Text>
          
          <View style={styles.formGroup}>
            <TextInput
              style={[styles.formInput, styles.textArea]}
              value={formData.instructions}
              onChangeText={(text) => setFormData(prev => ({ ...prev, instructions: text }))}
              placeholder="Preheat oven to 350°F&#10;Mix dry ingredients&#10;Add wet ingredients"
              multiline
              numberOfLines={8}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* Additional Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Information</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Notes</Text>
            <TextInput
              style={[styles.formInput, styles.textArea]}
              value={formData.notes}
              onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
              placeholder="Additional notes or tips"
              multiline
              numberOfLines={4}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <TouchableOpacity
            style={styles.favoriteToggle}
            onPress={() => setFormData(prev => ({ ...prev, isFavorite: !prev.isFavorite }))}
          >
            <Heart
              size={20}
              color={formData.isFavorite ? '#F97966' : '#9CA3AF'}
              fill={formData.isFavorite ? '#F97966' : 'none'}
            />
            <Text style={styles.favoriteToggleText}>Mark as favorite</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <Button
          title="Cancel"
          onPress={handleCancel}
          variant="outline"
          style={styles.footerButton}
        />
        <Button
          title={loading ? 'Saving...' : (isEditing ? 'Update Recipe' : 'Save Recipe')}
          onPress={handleSave}
          variant="primary"
          style={styles.footerButton}
          disabled={loading}
        />
      </View>
    </SafeAreaView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  formGroupHalf: {
    flex: 1,
  },
  formRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 8,
  },
  formInput: {
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
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  difficultyButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  selectedDifficulty: {
    borderColor: '#F97966',
    backgroundColor: '#FEF3F2',
  },
  difficultyButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  selectedDifficultyText: {
    color: '#F97966',
  },
  starContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  favoriteToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  favoriteToggleText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginLeft: 12,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  footerButton: {
    flex: 1,
  },
});