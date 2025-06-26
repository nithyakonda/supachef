import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Heart, Clock, Users, Star, ChefHat, Flame, ExternalLink, BookOpen, Edit } from 'lucide-react-native';
import { router } from 'expo-router';
import Button from './Button';
import LoadingIndicator from './LoadingIndicator';
import { Recipe, MealRecipeData } from '@/types';
import { recipeService } from '@/services/recipeService';

const { width, height } = Dimensions.get('window');

interface RecipeViewModalProps {
  visible: boolean;
  onClose: () => void;
  mealRecipeData: MealRecipeData;
  fromMealPlan?: boolean;
}

export default function RecipeViewModal({
  visible,
  onClose,
  mealRecipeData,
  fromMealPlan = false,
}: RecipeViewModalProps) {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadRecipeData();
    }
  }, [visible, mealRecipeData]);

  const loadRecipeData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to fetch the full recipe from the recipe book
      if (!mealRecipeData.isPlaceholder) {
        try {
          const fullRecipe = await recipeService.getRecipeById(mealRecipeData.recipeId);
          if (fullRecipe) {
            setRecipe(fullRecipe);
          } else {
            // Recipe not found in recipe book, create a minimal recipe from meal data
            setRecipe(createMinimalRecipe(mealRecipeData));
          }
        } catch (error) {
          console.warn('Could not fetch full recipe, using meal data:', error);
          setRecipe(createMinimalRecipe(mealRecipeData));
        }
      } else {
        // For placeholder recipes, create a minimal recipe
        setRecipe(createMinimalRecipe(mealRecipeData));
      }
    } catch (error) {
      console.error('Error loading recipe data:', error);
      setError('Failed to load recipe details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const createMinimalRecipe = (mealData: MealRecipeData): Recipe => ({
    id: mealData.recipeId,
    title: mealData.title,
    description: mealData.isPlaceholder 
      ? 'This is a placeholder meal. Add your own recipe details or find a recipe to replace it.'
      : 'Recipe details are not available. This meal was added from your meal plan.',
    imageUrl: mealData.imageUrl,
    cookingTime: 0,
    servings: 0,
    difficulty: 'Medium',
    calories: 0,
    ingredients: mealData.isPlaceholder 
      ? [{ name: 'Add your ingredients here', amount: '1' }]
      : [{ name: 'Ingredients not available - refer to original source', amount: '1' }],
    instructions: mealData.isPlaceholder 
      ? ['Add your cooking instructions here']
      : ['Instructions not available - refer to original source'],
    tags: mealData.isPlaceholder 
      ? ['Placeholder', 'Custom Meal']
      : ['Meal Plan', 'Quick Reference'],
    isFavorite: false,
    createdAt: new Date(),
  });

  const handleViewFullScreen = () => {
    onClose();
    router.push({
      pathname: '/recipes/view-recipe',
      params: {
        recipeData: JSON.stringify(mealRecipeData),
        fromMealPlan: fromMealPlan ? 'true' : 'false',
      },
    });
  };

  const handleViewInRecipeBook = () => {
    if (recipe && !mealRecipeData.isPlaceholder) {
      onClose();
      router.push(`/recipes/${recipe.id}`);
    }
  };

  const handleEditRecipe = () => {
    onClose();
    if (recipe && !mealRecipeData.isPlaceholder) {
      router.push(`/recipes/add-edit-recipe?recipeId=${recipe.id}`);
    } else {
      // For placeholder recipes, create a new recipe
      router.push('/recipes/add-edit-recipe');
    }
  };

  const handleToggleFavorite = async () => {
    if (!recipe || mealRecipeData.isPlaceholder) return;

    try {
      const updatedRecipe = await recipeService.toggleFavorite(recipe.id);
      if (updatedRecipe) {
        setRecipe(updatedRecipe);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update favorite status');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return '#10B981';
      case 'Medium':
        return '#F59E0B';
      case 'Hard':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const renderStarRating = (rating: number) => {
    return (
      <View style={styles.starContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            color={star <= rating ? '#F59E0B' : '#E5E7EB'}
            fill={star <= rating ? '#F59E0B' : 'none'}
          />
        ))}
      </View>
    );
  };

  const renderMealFlags = () => {
    const flags = [];
    
    if (mealRecipeData.leftover) {
      flags.push(
        <View key="leftover" style={[styles.flagChip, styles.leftoverChip]}>
          <Text style={[styles.flagChipText, styles.leftoverChipText]}>Leftover</Text>
        </View>
      );
    }
    
    if (mealRecipeData.lunchbox) {
      flags.push(
        <View key="lunchbox" style={[styles.flagChip, styles.lunchboxChip]}>
          <Text style={[styles.flagChipText, styles.lunchboxChipText]}>Lunchbox</Text>
        </View>
      );
    }
    
    if (mealRecipeData.aiSuggested) {
      flags.push(
        <View key="ai" style={[styles.flagChip, styles.aiSuggestedChip]}>
          <Text style={[styles.flagChipText, styles.aiSuggestedChipText]}>AI Suggested</Text>
        </View>
      );
    }

    if (mealRecipeData.isPlaceholder) {
      flags.push(
        <View key="placeholder" style={[styles.flagChip, styles.placeholderChip]}>
          <Text style={[styles.flagChipText, styles.placeholderChipText]}>Custom Meal</Text>
        </View>
      );
    }

    return flags.length > 0 ? (
      <View style={styles.flagsContainer}>
        {flags}
      </View>
    ) : null;
  };

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
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Recipe Details</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={handleViewFullScreen} style={styles.expandButton}>
              <BookOpen size={20} color="#F97966" />
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <LoadingIndicator size="large" />
            <Text style={styles.loadingText}>Loading recipe details...</Text>
          </View>
        ) : error || !recipe ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error || 'Recipe not found'}</Text>
            <Button title="Close" onPress={onClose} />
          </View>
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Hero Section */}
            <View style={styles.heroSection}>
              <Image source={{ uri: recipe.imageUrl }} style={styles.heroImage} />
              <View style={styles.heroOverlay}>
                <View style={styles.heroContent}>
                  <Text style={styles.recipeTitle}>{recipe.title}</Text>
                  {recipe.rating && recipe.rating > 0 && (
                    <View style={styles.ratingContainer}>
                      {renderStarRating(recipe.rating)}
                      <Text style={styles.ratingText}>({recipe.rating})</Text>
                    </View>
                  )}
                </View>
                {!mealRecipeData.isPlaceholder && (
                  <TouchableOpacity 
                    onPress={handleToggleFavorite} 
                    style={[styles.favoriteButton, recipe.isFavorite && styles.favoriteActive]}
                  >
                    <Heart
                      size={18}
                      color={recipe.isFavorite ? '#FFFFFF' : '#FFFFFF'}
                      fill={recipe.isFavorite ? '#FFFFFF' : 'none'}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Meal Plan Context */}
            {fromMealPlan && (
              <View style={styles.contextSection}>
                <View style={styles.contextHeader}>
                  <Text style={styles.contextTitle}>From Your Meal Plan</Text>
                  {renderMealFlags()}
                </View>
                <Text style={styles.contextDescription}>
                  {mealRecipeData.isPlaceholder 
                    ? 'This is a custom meal placeholder. You can add recipe details or replace it with a saved recipe.'
                    : 'This meal is part of your current meal plan.'}
                </Text>
              </View>
            )}

            {/* Quick Stats */}
            {(recipe.cookingTime > 0 || recipe.servings > 0 || recipe.calories > 0) && (
              <View style={styles.statsSection}>
                <View style={styles.statsContainer}>
                  {recipe.cookingTime > 0 && (
                    <View style={styles.statItem}>
                      <Clock size={16} color="#F97966" />
                      <Text style={styles.statText}>{recipe.cookingTime} min</Text>
                    </View>
                  )}
                  {recipe.servings > 0 && (
                    <View style={styles.statItem}>
                      <Users size={16} color="#F97966" />
                      <Text style={styles.statText}>{recipe.servings} servings</Text>
                    </View>
                  )}
                  <View style={styles.statItem}>
                    <ChefHat size={16} color="#F97966" />
                    <Text style={[styles.statText, { color: getDifficultyColor(recipe.difficulty) }]}>
                      {recipe.difficulty}
                    </Text>
                  </View>
                  {recipe.calories > 0 && (
                    <View style={styles.statItem}>
                      <Flame size={16} color="#F97966" />
                      <Text style={styles.statText}>{recipe.calories} cal</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Description */}
            {recipe.description && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>About</Text>
                <Text style={styles.description}>{recipe.description}</Text>
              </View>
            )}

            {/* Ingredients Preview */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ingredients ({recipe.ingredients.length})</Text>
              <View style={styles.ingredientsPreview}>
                {recipe.ingredients.slice(0, 3).map((ingredient, index) => (
                  <View key={index} style={styles.ingredientItem}>
                    <View style={styles.ingredientBullet} />
                    <Text style={styles.ingredientText} numberOfLines={1}>
                      <Text style={styles.ingredientAmount}>
                        {ingredient.amount} {ingredient.unit || ''}
                      </Text>
                      {' '}
                      <Text style={styles.ingredientName}>
                        {ingredient.name}
                      </Text>
                    </Text>
                  </View>
                ))}
                {recipe.ingredients.length > 3 && (
                  <Text style={styles.moreText}>
                    +{recipe.ingredients.length - 3} more ingredients
                  </Text>
                )}
              </View>
            </View>

            {/* Instructions Preview */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Instructions ({recipe.instructions.length} steps)</Text>
              <View style={styles.instructionsPreview}>
                {recipe.instructions.slice(0, 2).map((instruction, index) => (
                  <View key={index} style={styles.instructionItem}>
                    <View style={styles.instructionNumber}>
                      <Text style={styles.instructionNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.instructionText} numberOfLines={2}>
                      {instruction}
                    </Text>
                  </View>
                ))}
                {recipe.instructions.length > 2 && (
                  <Text style={styles.moreText}>
                    +{recipe.instructions.length - 2} more steps
                  </Text>
                )}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              {!mealRecipeData.isPlaceholder && (
                <Button
                  title="View in Recipe Book"
                  onPress={handleViewInRecipeBook}
                  variant="outline"
                  style={styles.actionButton}
                />
              )}
              <Button
                title={mealRecipeData.isPlaceholder ? "Add Details" : "Edit Recipe"}
                onPress={handleEditRecipe}
                variant="primary"
                style={styles.actionButton}
              />
            </View>

            <View style={styles.bottomSpacer} />
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
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
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    width: 40,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#EF4444',
    marginBottom: 20,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  heroSection: {
    position: 'relative',
    height: 200,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'linear-gradient(transparent, rgba(0, 0, 0, 0.7))',
  },
  heroContent: {
    flex: 1,
  },
  recipeTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    marginLeft: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  starContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  favoriteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteActive: {
    backgroundColor: '#F97966',
  },
  contextSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FEF3F2',
    borderBottomWidth: 1,
    borderBottomColor: '#F97966',
  },
  contextHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  contextTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#F97966',
  },
  contextDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 16,
  },
  flagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  flagChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  flagChipText: {
    fontSize: 9,
    fontFamily: 'Inter-SemiBold',
  },
  leftoverChip: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FEDD9F',
  },
  leftoverChipText: {
    color: '#D97706',
  },
  lunchboxChip: {
    backgroundColor: '#F0FDF4',
    borderColor: '#CBC87D',
  },
  lunchboxChipText: {
    color: '#65A30D',
  },
  aiSuggestedChip: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
  },
  aiSuggestedChipText: {
    color: '#2563EB',
  },
  placeholderChip: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
  },
  placeholderChipText: {
    color: '#6B7280',
  },
  statsSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 20,
  },
  ingredientsPreview: {
    gap: 8,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ingredientBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F97966',
    marginRight: 8,
  },
  ingredientText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
  },
  ingredientAmount: {
    fontFamily: 'Inter-SemiBold',
    color: '#F97966',
  },
  ingredientName: {
    color: '#374151',
  },
  instructionsPreview: {
    gap: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  instructionNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F97966',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  instructionNumberText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 20,
  },
  moreText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#F97966',
    fontStyle: 'italic',
    marginTop: 4,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  actionButton: {
    flex: 1,
  },
  bottomSpacer: {
    height: 20,
  },
});