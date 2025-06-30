import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  TextInput,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Heart, Pencil, Trash2, Clock, Users, Star, ChefHat, Flame, Plus, X, ExternalLink } from 'lucide-react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ThemedAlert from '@/components/ui/ThemedAlert';
import { useThemedAlert } from '@/hooks/useThemedAlert';
import { Recipe } from '@/types';
import { recipeService } from '@/services/recipeService';

const { width } = Dimensions.get('window');

// Helper component for editable tags
const EditableTags = ({ 
  tags, 
  onTagsChange, 
  isEditing 
}: { 
  tags: string[], 
  onTagsChange: (tags: string[]) => void,
  isEditing: boolean 
}) => {
  const [newTag, setNewTag] = useState('');
  const [showInput, setShowInput] = useState(false);

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      onTagsChange([...tags, newTag.trim()]);
      setNewTag('');
      setShowInput(false);
    }
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  if (!isEditing) {
    return (
      <View style={styles.tagsContainer}>
        {tags.map((tag, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.editableTagsContainer}>
      <View style={styles.tagsContainer}>
        {tags.map((tag, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.tag, styles.editableTag]}
            onPress={() => removeTag(tag)}
          >
            <Text style={styles.tagText}>{tag}</Text>
            <X size={12} color="#6B7280" style={styles.tagRemoveIcon} />
          </TouchableOpacity>
        ))}
        
        {showInput ? (
          <View style={styles.tagInputContainer}>
            <TextInput
              style={styles.tagInput}
              value={newTag}
              onChangeText={setNewTag}
              placeholder="New tag"
              onSubmitEditing={addTag}
              onBlur={() => {
                if (newTag.trim()) addTag();
                else setShowInput(false);
              }}
              autoFocus
            />
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addTagButton}
            onPress={() => setShowInput(true)}
          >
            <Plus size={16} color="#F97966" />
            <Text style={styles.addTagText}>Add Tag</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// Helper component for editable notes
const EditableNotes = ({ 
  notes, 
  onNotesChange, 
  isEditing 
}: { 
  notes: string, 
  onNotesChange: (notes: string) => void,
  isEditing: boolean 
}) => {
  if (!isEditing) {
    return <Text style={styles.notesText}>{notes}</Text>;
  }

  return (
    <TextInput
      style={styles.notesInput}
      value={notes}
      onChangeText={onNotesChange}
      placeholder="Add your notes here..."
      multiline
      textAlignVertical="top"
    />
  );
};

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedTags, setEditedTags] = useState<string[]>([]);
  const [editedNotes, setEditedNotes] = useState('');
  const { alertState, showAlert, hideAlert } = useThemedAlert();

  // Load recipe data when screen comes into focus
  const loadRecipe = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const recipeData = await recipeService.getRecipeById(id);
      if (recipeData) {
        setRecipe(recipeData);
        setIsFavorite(recipeData.isFavorite);
        setEditedTags(recipeData.tags);
        setEditedNotes(recipeData.notes || '');
      } else {
        showAlert({
          title: 'Recipe Not Found',
          message: 'The recipe you\'re looking for could not be found.',
          type: 'error',
          buttons: [{ text: 'Go Back', onPress: () => router.back() }],
        });
      }
    } catch (error) {
      console.error('Error loading recipe:', error);
      showAlert({
        title: 'Error Loading Recipe',
        message: 'Failed to load the recipe. Please try again.',
        type: 'error',
        buttons: [{ text: 'Go Back', onPress: () => router.back() }],
      });
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
      router.push(`/recipes/add-edit-recipe?recipeId=${recipe.id}`);
    }
  };

  const handleDelete = () => {
    if (!recipe) return;

    showAlert({
      title: 'Delete Recipe',
      message: 'Are you sure you want to delete this recipe? This action cannot be undone.',
      type: 'warning',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await recipeService.deleteRecipe(recipe.id);
              router.back();
            } catch (error) {
              showAlert({
                title: 'Delete Failed',
                message: 'Failed to delete the recipe. Please try again.',
                type: 'error',
              });
            }
          },
        },
      ],
    });
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
      showAlert({
        title: 'Update Failed',
        message: 'Failed to update favorite status. Please try again.',
        type: 'error',
      });
    }
  };

  const handleSourcePress = async () => {
    if (!recipe?.source) return;
    
    try {
      const supported = await Linking.canOpenURL(recipe.source);
      if (supported) {
        await Linking.openURL(recipe.source);
      } else {
        showAlert({
          title: 'Cannot Open Link',
          message: 'This URL cannot be opened on your device.',
          type: 'error',
        });
      }
    } catch (error) {
      showAlert({
        title: 'Error Opening Link',
        message: 'Failed to open the URL. Please try again.',
        type: 'error',
      });
    }
  };

  const saveTags = async () => {
    if (!recipe) return;
    
    try {
      const updatedRecipe = { ...recipe, tags: editedTags };
      await recipeService.updateRecipe(updatedRecipe);
      setRecipe(updatedRecipe);
      setIsEditingTags(false);
    } catch (error) {
      showAlert({
        title: 'Update Failed',
        message: 'Failed to update tags. Please try again.',
        type: 'error',
      });
    }
  };

  const saveNotes = async () => {
    if (!recipe) return;
    
    try {
      const updatedRecipe = { ...recipe, notes: editedNotes };
      await recipeService.updateRecipe(updatedRecipe);
      setRecipe(updatedRecipe);
      setIsEditingNotes(false);
    } catch (error) {
      showAlert({
        title: 'Update Failed',
        message: 'Failed to update notes. Please try again.',
        type: 'error',
      });
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
          {/* Quick Stats - Only show stats with actual values */}
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

          {/* Description */}
          {recipe.description && (
            <Card style={styles.descriptionCard}>
              <Text style={styles.sectionTitle}>About This Recipe</Text>
              <Text style={styles.description}>{recipe.description}</Text>
            </Card>
          )}

          {/* Tags - Editable */}
          {(recipe.tags.length > 0 || isEditingTags) && (
            <Card style={styles.tagsCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Tags</Text>
                <TouchableOpacity
                  onPress={() => {
                    if (isEditingTags) {
                      saveTags();
                    } else {
                      setIsEditingTags(true);
                    }
                  }}
                  style={styles.editButton}
                >
                  <Pencil size={16} color="#F97966" />
                </TouchableOpacity>
              </View>
              <EditableTags
                tags={editedTags}
                onTagsChange={setEditedTags}
                isEditing={isEditingTags}
              />
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

          {/* My Notes - Editable */}
          <Card style={styles.notesCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Notes</Text>
              <TouchableOpacity
                onPress={() => {
                  if (isEditingNotes) {
                    saveNotes();
                  } else {
                    setIsEditingNotes(true);
                  }
                }}
                style={styles.editButton}
              >
                <Pencil size={16} color="#F97966" />
              </TouchableOpacity>
            </View>
            <EditableNotes
              notes={editedNotes}
              onNotesChange={setEditedNotes}
              isEditing={isEditingNotes}
            />
          </Card>

          {/* Source - Clickable */}
          {recipe.source && (
            <Card style={styles.sourceCard}>
              <Text style={styles.sectionTitle}>Source</Text>
              <TouchableOpacity onPress={handleSourcePress} style={styles.sourceLink}>
                <Text style={styles.sourceLinkText} numberOfLines={1}>
                  {recipe.source}
                </Text>
                <ExternalLink size={16} color="#F97966" />
              </TouchableOpacity>
            </Card>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button - Edit (Pencil) */}
      <View style={styles.fabContainer}>
        <TouchableOpacity onPress={handleEdit} style={styles.fab}>
          <Pencil size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEF3F2',
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
  editableTagsContainer: {
    flex: 1,
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
  editableTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3F2',
    borderWidth: 1,
    borderColor: '#F97966',
  },
  tagText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  tagRemoveIcon: {
    marginLeft: 4,
  },
  tagInputContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F97966',
  },
  tagInput: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#111827',
    minWidth: 80,
  },
  addTagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FEF3F2',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F97966',
    borderStyle: 'dashed',
  },
  addTagText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#F97966',
    marginLeft: 4,
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
  notesInput: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 24,
    borderWidth: 1,
    borderColor: '#F97966',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
    minHeight: 100,
    textAlignVertical: 'top',
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