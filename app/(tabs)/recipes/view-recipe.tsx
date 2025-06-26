import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Heart, Clock, Users, Star, ChefHat, Flame, ExternalLink, BookOpen } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingIndicator from '@/components/ui/LoadingIndicator';
import { Recipe, MealRecipeData } from '@/types';
import { recipeService } from '@/services/recipeService';

const { width } = Dimensions.get('window');

export default function ViewRecipeScreen() {
  const { recipeData, fromMealPlan } = useLocalSearchParams<{ 
    recipeData: string;
    fromMealPlan?: string;
  }>();
  
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [mealData, setMealData] = useState<MealRecipeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRecipeData();
  }, [recipeData]);

  const loadRecipeData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!recipeData) {
        throw new Error('No recipe data provided');
      }

      // Parse the meal recipe data
      const parsedMealData: MealRecipeData = JSON.parse(recipeData);
      setMealData(parsedMealData);

      // Try to fetch the full recipe from the recipe book
      if (!parsedMealData.isPlaceholder) {
        try {
          const fullRecipe = await recipeService.getRecipeById(parsedMealData.recipeId);
          if (fullRecipe) {
            setRecipe(fullRecipe);
          } else {
            // Recipe not found in recipe book, create a minimal recipe from meal data
            setRecipe(createMinimalRecipe(parsedMealData));
          }
        } catch (error) {
          console.warn('Could not fetch full recipe, using meal data:', error);
          setRecipe(createMinimalRecipe(parsedMealData));
        }
      } else {
        // For placeholder recipes, create a minimal recipe
        setRecipe(createMinimalRecipe(parsedMealData));
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

  const handleBack = () => {
    router.back();
  };

  const handleViewInRecipeBook = () => {
    if (recipe && !mealData?.isPlaceholder) {
      router.push(`/recipes/${recipe.id}`);
    }
  };

  const handleEditRecipe = () => {
    if (recipe && !mealData?.isPlaceholder) {
      router.push(`/recipes/add-edit-recipe?recipeId=${recipe.id}`);
    } else {
      // For placeholder recipes, create a new recipe
      router.push('/recipes/add-edit-recipe');
    }
  };

  const handleToggleFavorite = async () => {
    if (!recipe || mealData?.isPlaceholder) return;

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
            size={20}
            color={star <= rating ? '#F59E0B' : '#E5E7EB'}
            fill={star <= rating ? '#F59E0B' : 'none'}
          />
        ))}
      </View>
    );
  };

  const renderMealFlags = () => {
    if (!mealData) return null;

    const flags = [];
    
    if (mealData.leftover) {
      flags.push(
        <View key="leftover" style={[styles.flagChip, styles.leftoverChip]}>
          <Text style={[styles.flagChipText, styles.leftoverChipText]}>Leftover</Text>
        </View>
      );
    }
    
    if (mealData.lunchbox) {
      flags.push(
        <View key="lunchbox" style={[styles.flagChip, styles.lunchboxChip]}>
          <Text style={[styles.flagChipText, styles.lunchboxChipText]}>Lunchbox</Text>
        </View>
      );
    }
    
    if (mealData.aiSuggested) {
      flags.push(
        <View key="ai" style={[styles.flagChip, styles.aiSuggestedChip]}>
          <Text style={[styles.flagChipText, styles.aiSuggestedChipText]}>AI Suggested</Text>
        </View>
      );
    }

    if (mealData.isPlaceholder) {
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingIndicator size="large" />
          <Text style={styles.loadingText}>Loading recipe details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !recipe) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Recipe not found'}</Text>
          <Button title="Go Back" onPress={handleBack} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image Section */}
        <View style={styles.heroSection}>
          <Image
            source={{ uri: recipe.imageUrl }}
            style={styles.heroImage}
          />
          
          {/* Header Overlay */}
          <View style={styles.headerOverlay}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ChevronLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <View style={styles.headerActions}>
              {!mealData?.isPlaceholder && (
                <TouchableOpacity 
                  onPress={handleToggleFavorite} 
                  style={[styles.actionButton, recipe.isFavorite && styles.favoriteActive]}
                >
                  <Heart
                    size={20}
                    color={recipe.isFavorite ? '#FFFFFF' : '#FFFFFF'}
                    fill={recipe.isFavorite ? '#FFFFFF' : 'none'}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Recipe Title Overlay */}
          <View style={styles.titleOverlay}>
            <Text style={styles.recipeTitle}>{recipe.title}</Text>
            {recipe.rating && recipe.rating > 0 && (
              <View style={styles.ratingContainer}>
                {renderStarRating(recipe.rating)}
                <Text style={styles.ratingText}>({recipe.rating})</Text>
              </View>
            )}
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.contentSection}>
          {/* Meal Plan Context */}
          {fromMealPlan && (
            <Card style={styles.contextCard}>
              <View style={styles.contextHeader}>
                <Text style={styles.contextTitle}>From Your Meal Plan</Text>
                {renderMealFlags()}
              </View>
              <Text style={styles.contextDescription}>
                {mealData?.isPlaceholder 
                  ? 'This is a custom meal placeholder. You can add recipe details or replace it with a saved recipe.'
                  : 'This meal is part of your current meal plan. View the full recipe details below.'}
              </Text>
            </Card>
          )}

          {/* Quick Stats */}
          {(recipe.cookingTime > 0 || recipe.servings > 0 || recipe.calories > 0) && (
            <Card style={styles.statsCard}>
              <View style={styles.statsContainer}>
                {recipe.cookingTime > 0 && (
                  <>
                    <View style={styles.statItem}>
                      <View style={styles.statIcon}>
                        <Clock size={20} color="#F97966" />
                      </View>
                      <Text style={styles.statLabel}>Cook Time</Text>
                      <Text style={styles.statValue}>{recipe.cookingTime} min</Text>
                    </View>
                    <View style={styles.statDivider} />
                  </>
                )}
                
                {recipe.servings > 0 && (
                  <>
                    <View style={styles.statItem}>
                      <View style={styles.statIcon}>
                        <Users size={20} color="#F97966" />
                      </View>
                      <Text style={styles.statLabel}>Servings</Text>
                      <Text style={styles.statValue}>{recipe.servings}</Text>
                    </View>
                    <View style={styles.statDivider} />
                  </>
                )}
                
                <View style={styles.statItem}>
                  <View style={styles.statIcon}>
                    <ChefHat size={20} color="#F97966" />
                  </View>
                  <Text style={styles.statLabel}>Difficulty</Text>
                  <Text style={[styles.statValue, { color: getDifficultyColor(recipe.difficulty) }]}>
                    {recipe.difficulty}
                  </Text>
                </View>
                
                {recipe.calories > 0 && (
                  <>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <View style={styles.statIcon}>
                        <Flame size={20} color="#F97966" />
                      </View>
                      <Text style={styles.statLabel}>Calories</Text>
                      <Text style={styles.statValue}>{recipe.calories}</Text>
                    </View>
                  </>
                )}
              </View>
            </Card>
          )}

          {/* Description */}
          {recipe.description && (
            <Card style={styles.descriptionCard}>
              <Text style={styles.sectionTitle}>About This Recipe</Text>
              <Text style={styles.description}>{recipe.description}</Text>
            </Card>
          )}

          {/* Tags */}
          {recipe.tags.length > 0 && (
            <Card style={styles.tagsCard}>
              <Text style={styles.sectionTitle}>Tags</Text>
              <View style={styles.tagsContainer}>
                {recipe.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </Card>
          )}

          {/* Ingredients */}
          <Card style={styles.ingredientsCard}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <View style={styles.ingredientsList}>
              {recipe.ingredients.map((ingredient, index) => (
                <View key={index} style={styles.ingredientItem}>
                  <View style={styles.ingredientBullet} />
                  <Text style={styles.ingredientText}>
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
            </View>
          </Card>

          {/* Instructions */}
          <Card style={styles.instructionsCard}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            <View style={styles.instructionsList}>
              {recipe.instructions.map((instruction, index) => (
                <View key={index} style={styles.instructionItem}>
                  <View style={styles.instructionNumber}>
                    <Text style={styles.instructionNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.instructionText}>{instruction}</Text>
                </View>
              ))}
            </View>
          </Card>

          {/* Source */}
          {recipe.source && (
            <Card style={styles.sourceCard}>
              <Text style={styles.sectionTitle}>Source</Text>
              <TouchableOpacity 
                onPress={() => {
                  // Open external link
                  if (recipe.source) {
                    // In a real app, you'd use Linking.openURL
                    Alert.alert('External Link', `Would open: ${recipe.source}`);
                  }
                }}
                style={styles.sourceLink}
              >
                <Text style={styles.sourceLinkText} numberOfLines={1}>
                  {recipe.source}
                </Text>
                <ExternalLink size={16} color="#F97966" />
              </TouchableOpacity>
            </Card>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            {!mealData?.isPlaceholder && (
              <Button
                title="View in Recipe Book"
                onPress={handleViewInRecipeBook}
                variant="outline"
                style={styles.actionButton}
              />
            )}
            <Button
              title={mealData?.isPlaceholder ? "Add Recipe Details" : "Edit Recipe"}
              onPress={handleEditRecipe}
              variant="primary"
              style={styles.actionButton}
            />
          </View>
        </View>
      </ScrollView>
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
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#EF4444',
    marginBottom: 20,
    textAlign: 'center',
  },
  heroSection: {
    position: 'relative',
    height: 300,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteActive: {
    backgroundColor: '#F97966',
  },
  titleOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'linear-gradient(transparent, rgba(0, 0, 0, 0.7))',
  },
  recipeTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    marginLeft: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  starContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  contentSection: {
    padding: 20,
    gap: 16,
  },
  contextCard: {
    padding: 20,
    backgroundColor: '#FEF3F2',
    borderWidth: 1,
    borderColor: '#F97966',
  },
  contextHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  contextTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#F97966',
  },
  contextDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
  },
  flagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  flagChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  flagChipText: {
    fontSize: 10,
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
  statsCard: {
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  descriptionCard: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 24,
  },
  tagsCard: {
    padding: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
  },
  tagText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  ingredientsCard: {
    padding: 20,
  },
  ingredientsList: {
    gap: 12,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  ingredientBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F97966',
    marginTop: 8,
    marginRight: 12,
  },
  ingredientText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 22,
  },
  ingredientAmount: {
    fontFamily: 'Inter-SemiBold',
    color: '#F97966',
  },
  ingredientName: {
    color: '#374151',
  },
  instructionsCard: {
    padding: 20,
  },
  instructionsList: {
    gap: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  instructionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F97966',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  instructionNumberText: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  instructionText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 24,
  },
  sourceCard: {
    padding: 20,
  },
  sourceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sourceLinkText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#F97966',
    flex: 1,
    marginRight: 8,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
  },
});