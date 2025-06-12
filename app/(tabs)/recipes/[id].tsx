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
import { ChevronLeft, Heart, CreditCard as Edit3, Trash2, Clock, Users, Star, ChefHat, Flame } from 'lucide-react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Recipe } from '@/types';
import { recipeService } from '@/services/recipeService';

const { width } = Dimensions.get('window');

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load recipe data when screen comes into focus
  const loadRecipe = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const recipeData = await recipeService.getRecipeById(id);
      if (recipeData) {
        setRecipe(recipeData);
        setIsFavorite(recipeData.isFavorite);
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

  useFocusEffect(
    React.useCallback(() => {
      loadRecipe();
    }, [id])
  );

  const handleBack = () => {
    router.back();
  };

  const handleEdit = () => {
    if (recipe) {
      router.push(`/recipe/add-edit-recipe?recipeId=${recipe.id}`);
    }
  };

  const handleDelete = () => {
    if (!recipe) return;

    Alert.alert(
      'Delete Recipe',
      'Are you sure you want to delete this recipe? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await recipeService.deleteRecipe(recipe.id);
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete recipe');
            }
          },
        },
      ]
    );
  };

  const handleToggleFavorite = async () => {
    if (!recipe) return;

    try {
      const updatedRecipe = await recipeService.toggleFavorite(recipe.id);
      if (updatedRecipe) {
        setIsFavorite(updatedRecipe.isFavorite);
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading recipe...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!recipe) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Recipe not found</Text>
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
              <TouchableOpacity 
                onPress={handleToggleFavorite} 
                style={[styles.actionButton, isFavorite && styles.favoriteActive]}
              >
                <Heart
                  size={20}
                  color={isFavorite ? '#FFFFFF' : '#FFFFFF'}
                  fill={isFavorite ? '#FFFFFF' : 'none'}
                />
              </TouchableOpacity>
              
              <TouchableOpacity onPress={handleEdit} style={styles.actionButton}>
                <Edit3 size={20} color="#FFFFFF" />
              </TouchableOpacity>
              
              <TouchableOpacity onPress={handleDelete} style={[styles.actionButton, styles.deleteButton]}>
                <Trash2 size={20} color="#FFFFFF" />
              </TouchableOpacity>
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
          {/* Quick Stats */}
          <Card style={styles.statsCard}>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <View style={styles.statIcon}>
                  <Clock size={20} color="#F97966" />
                </View>
                <Text style={styles.statLabel}>Cook Time</Text>
                <Text style={styles.statValue}>{recipe.cookingTime} min</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <View style={styles.statIcon}>
                  <Users size={20} color="#F97966" />
                </View>
                <Text style={styles.statLabel}>Servings</Text>
                <Text style={styles.statValue}>{recipe.servings}</Text>
              </View>
              
              <View style={styles.statDivider} />
              
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
                      {ingredient.amount} {ingredient.unit}
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

          {/* Notes */}
          {recipe.notes && (
            <Card style={styles.notesCard}>
              <Text style={styles.sectionTitle}>Chef's Notes</Text>
              <Text style={styles.notesText}>{recipe.notes}</Text>
            </Card>
          )}

          {/* Source */}
          {recipe.source && (
            <Card style={styles.sourceCard}>
              <Text style={styles.sectionTitle}>Source</Text>
              <Text style={styles.sourceText} numberOfLines={1}>
                {recipe.source}
              </Text>
            </Card>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <View style={styles.fabContainer}>
        <TouchableOpacity onPress={handleEdit} style={styles.fab}>
          <Edit3 size={24} color="#FFFFFF" />
        </TouchableOpacity>
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
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
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
  notesCard: {
    padding: 20,
    backgroundColor: '#FEF3F2',
  },
  notesText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  sourceCard: {
    padding: 20,
  },
  sourceText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F97966',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});