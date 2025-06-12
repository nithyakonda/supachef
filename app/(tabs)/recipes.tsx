import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  Alert,
  Dimensions,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter, Heart, Plus, Clock, Users, Star, X, Link, Save, CreditCard as Edit3, Trash2, ChevronRight } from 'lucide-react-native';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';
import { sampleRecipes } from '@/data/sampleData';
import { Recipe } from '@/types';
import { recipeService } from '@/services/recipeService';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2; // 2 cards per row with margins

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

export default function RecipesScreen() {
  const [recipes, setRecipes] = useState<Recipe[]>(sampleRecipes);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>(['1', '3']);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'alphabetical' | 'rating'>('recent');
  const [filterBy, setFilterBy] = useState<'all' | 'favorites'>('all');
  const [importUrl, setImportUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);

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

  // Load recipes from database on component mount
  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    try {
      const savedRecipes = await recipeService.getAllRecipes();
      if (savedRecipes.length > 0) {
        setRecipes(savedRecipes);
      }
    } catch (error) {
      console.error('Error loading recipes:', error);
    }
  };

  const allTags = Array.from(
    new Set(recipes.flatMap(recipe => recipe.tags))
  );

  const filteredRecipes = recipes.filter(recipe => {
    if (searchQuery && !recipe.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (selectedTags.length > 0 && !selectedTags.some(tag => recipe.tags.includes(tag))) {
      return false;
    }
    if (filterBy === 'favorites' && !favorites.includes(recipe.id)) {
      return false;
    }
    return true;
  });

  const sortedRecipes = [...filteredRecipes].sort((a, b) => {
    switch (sortBy) {
      case 'alphabetical':
        return a.title.localeCompare(b.title);
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'recent':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  // Group recipes for Netflix-style carousels
  const recentlyAdded = recipes
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  const favoriteRecipes = recipes.filter(recipe => favorites.includes(recipe.id));

  const recipesByTag = allTags.reduce((acc, tag) => {
    acc[tag] = recipes.filter(recipe => recipe.tags.includes(tag)).slice(0, 10);
    return acc;
  }, {} as Record<string, Recipe[]>);

  const toggleFavorite = async (recipeId: string) => {
    const newFavorites = favorites.includes(recipeId) 
      ? favorites.filter(id => id !== recipeId)
      : [...favorites, recipeId];
    
    setFavorites(newFavorites);
    
    // Update recipe in database
    const recipe = recipes.find(r => r.id === recipeId);
    if (recipe) {
      const updatedRecipe = { ...recipe, isFavorite: newFavorites.includes(recipeId) };
      await recipeService.updateRecipe(updatedRecipe);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
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

  const resetForm = () => {
    setFormData({
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
    setEditingRecipe(null);
  };

  const handleAddRecipe = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEditRecipe = (recipe: Recipe) => {
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
    setEditingRecipe(recipe);
    setShowAddModal(true);
  };

  const handleDeleteRecipe = async (recipeId: string) => {
    Alert.alert(
      'Delete Recipe',
      'Are you sure you want to delete this recipe?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await recipeService.deleteRecipe(recipeId);
              setRecipes(prev => prev.filter(r => r.id !== recipeId));
              setFavorites(prev => prev.filter(id => id !== recipeId));
            } catch (error) {
              Alert.alert('Error', 'Failed to delete recipe');
            }
          },
        },
      ]
    );
  };

  const handleSaveRecipe = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a recipe title');
      return;
    }

    try {
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
        id: editingRecipe?.id || `recipe-${Date.now()}`,
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
        createdAt: editingRecipe?.createdAt || new Date(),
      };

      if (editingRecipe) {
        await recipeService.updateRecipe(recipeData);
        setRecipes(prev => prev.map(r => r.id === recipeData.id ? recipeData : r));
      } else {
        await recipeService.saveRecipe(recipeData);
        setRecipes(prev => [recipeData, ...prev]);
      }

      if (formData.isFavorite && !favorites.includes(recipeData.id)) {
        setFavorites(prev => [...prev, recipeData.id]);
      }

      setShowAddModal(false);
      resetForm();
    } catch (error) {
      Alert.alert('Error', 'Failed to save recipe');
    }
  };

  const handleImportFromUrl = async () => {
    if (!importUrl.trim()) {
      Alert.alert('Error', 'Please enter a valid URL');
      return;
    }

    setIsImporting(true);
    try {
      const importedRecipe = await recipeService.importFromUrl(importUrl);
      await recipeService.saveRecipe(importedRecipe);
      setRecipes(prev => [importedRecipe, ...prev]);
      setShowImportModal(false);
      setImportUrl('');
      Alert.alert('Success', 'Recipe imported successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to import recipe. Please check the URL and try again.');
    } finally {
      setIsImporting(false);
    }
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
              size={20}
              color={star <= rating ? '#F59E0B' : '#E5E7EB'}
              fill={star <= rating ? '#F59E0B' : 'none'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderRecipeCard = (recipe: Recipe, isCarousel = false) => (
    <Card key={recipe.id} style={[styles.recipeCard, isCarousel && styles.carouselCard]}>
      <View style={styles.recipeImageContainer}>
        <Image
          source={{ uri: recipe.imageUrl }}
          style={styles.recipeImage}
        />
        <View style={styles.recipeActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteRecipe(recipe.id)}
          >
            <Trash2 size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.recipeContent}>
        <View style={styles.titleAndEditContainer}>
          <Text style={styles.recipeTitle} numberOfLines={2}>{recipe.title}</Text>
          <TouchableOpacity
            style={styles.editTitleButton}
            onPress={() => handleEditRecipe(recipe)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Edit3 size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.recipeDescription} numberOfLines={2}>
          {recipe.description}
        </Text>

        {recipe.rating && recipe.rating > 0 && (
          <View style={styles.ratingContainer}>
            {renderStarRating(recipe.rating)}
            <Text style={styles.ratingText}>({recipe.rating})</Text>
          </View>
        )}

        <View style={styles.recipeStats}>
          <View style={styles.statItem}>
            <Clock size={14} color="#6B7280" />
            <Text style={styles.statText}>{recipe.cookingTime} min</Text>
          </View>
          <View style={styles.statItem}>
            <Users size={14} color="#6B7280" />
            <Text style={styles.statText}>{recipe.servings} servings</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[
              styles.difficultyDot,
              { backgroundColor: getDifficultyColor(recipe.difficulty) }
            ]} />
            <Text style={styles.statText}>{recipe.difficulty}</Text>
          </View>
        </View>

        <View style={styles.recipeTags}>
          {recipe.tags.slice(0, 2).map(tag => (
            <View key={tag} style={styles.recipeTag}>
              <Text style={styles.recipeTagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </Card>
  );

  const renderCarousel = (title: string, recipes: Recipe[]) => {
    if (recipes.length === 0) return null;

    return (
      <View style={styles.carouselSection}>
        <View style={styles.carouselHeader}>
          <Text style={styles.carouselTitle}>{title}</Text>
          <TouchableOpacity>
            <ChevronRight size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={recipes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => renderRecipeCard(item, true)}
          contentContainerStyle={styles.carouselContent}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Recipe Book</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setShowImportModal(true)}
          >
            <Link size={20} color="#F97966" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handleAddRecipe}
          >
            <Plus size={20} color="#F97966" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search and Filter Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search recipes..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Filter size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Netflix-style Carousels */}
        {searchQuery === '' && selectedTags.length === 0 && (
          <View style={styles.carouselsContainer}>
            {renderCarousel('Recently Added', recentlyAdded)}
            {favoriteRecipes.length > 0 && renderCarousel('Your Favorites', favoriteRecipes)}
            {Object.entries(recipesByTag).map(([tag, tagRecipes]) => (
              <React.Fragment key={tag}>
                {renderCarousel(tag, tagRecipes)}
              </React.Fragment>
            ))}
          </View>
        )}

        {/* Tags Filter */}
        {allTags.length > 0 && (
          <View style={styles.tagsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.tagsContent}>
                {allTags.map(tag => (
                  <Chip
                    key={tag}
                    label={tag}
                    selected={selectedTags.includes(tag)}
                    onPress={() => toggleTag(tag)}
                  />
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Recipes Grid */}
        {(searchQuery !== '' || selectedTags.length > 0) && (
          <View style={styles.recipesContainer}>
            {sortedRecipes.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateTitle}>No recipes found</Text>
                <Text style={styles.emptyStateDescription}>
                  Try adjusting your search or filters
                </Text>
                <Button
                  title="Add Your First Recipe"
                  onPress={handleAddRecipe}
                  style={styles.emptyStateButton}
                />
              </View>
            ) : (
              <View style={styles.recipesGrid}>
                {sortedRecipes.map(recipe => renderRecipeCard(recipe))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Add/Edit Recipe Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingRecipe ? 'Edit Recipe' : 'Add New Recipe'}
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formScrollView}>
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

              <View style={styles.formGroup}>
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

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Rating</Text>
                {renderStarRating(formData.rating, (rating) => 
                  setFormData(prev => ({ ...prev, rating }))
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Ingredients (one per line)</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  value={formData.ingredients}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, ingredients: text }))}
                  placeholder="2 cups flour&#10;1 tsp salt&#10;3 eggs"
                  multiline
                  numberOfLines={5}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Instructions (one per line)</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  value={formData.instructions}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, instructions: text }))}
                  placeholder="Preheat oven to 350°F&#10;Mix dry ingredients&#10;Add wet ingredients"
                  multiline
                  numberOfLines={5}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Notes</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  value={formData.notes}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
                  placeholder="Additional notes or tips"
                  multiline
                  numberOfLines={3}
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
            </ScrollView>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => setShowAddModal(false)}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title={editingRecipe ? 'Update' : 'Save'}
                onPress={handleSaveRecipe}
                variant="primary"
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Import from URL Modal */}
      <Modal
        visible={showImportModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowImportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.importModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Import Recipe from URL</Text>
              <TouchableOpacity onPress={() => setShowImportModal(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.importDescription}>
              Paste a URL from Pinterest, food blogs, or recipe websites to automatically import the recipe.
            </Text>

            <TextInput
              style={styles.urlInput}
              value={importUrl}
              onChangeText={setImportUrl}
              placeholder="https://example.com/recipe"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => setShowImportModal(false)}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title={isImporting ? "Importing..." : "Import"}
                onPress={handleImportFromUrl}
                variant="primary"
                style={styles.modalButton}
                disabled={isImporting}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.filterModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sort & Filter</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Sort by</Text>
              {[
                { key: 'recent', label: 'Recently Added' },
                { key: 'alphabetical', label: 'Alphabetical' },
                { key: 'rating', label: 'Rating' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={styles.filterOption}
                  onPress={() => setSortBy(option.key as any)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    sortBy === option.key && styles.selectedFilterText
                  ]}>
                    {option.label}
                  </Text>
                  {sortBy === option.key && (
                    <View style={styles.selectedIndicator} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Show</Text>
              {[
                { key: 'all', label: 'All Recipes' },
                { key: 'favorites', label: 'Favorites Only' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={styles.filterOption}
                  onPress={() => setFilterBy(option.key as any)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    filterBy === option.key && styles.selectedFilterText
                  ]}>
                    {option.label}
                  </Text>
                  {filterBy === option.key && (
                    <View style={styles.selectedIndicator} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <Button
              title="Apply Filters"
              onPress={() => setShowFilterModal(false)}
              variant="primary"
              style={styles.applyFiltersButton}
            />
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF3F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
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
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  carouselsContainer: {
    paddingBottom: 20,
  },
  carouselSection: {
    marginBottom: 32,
  },
  carouselHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  carouselTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  carouselContent: {
    paddingHorizontal: 20,
  },
  carouselCard: {
    width: 200,
    marginRight: 16,
  },
  tagsContainer: {
    marginBottom: 24,
  },
  tagsContent: {
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  recipesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  recipesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  emptyStateButton: {
    paddingHorizontal: 32,
  },
  recipeCard: {
    width: CARD_WIDTH,
    marginBottom: 16,
    padding: 0,
    overflow: 'hidden',
  },
  recipeImageContainer: {
    position: 'relative',
  },
  recipeImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  recipeActions: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
  },
  recipeContent: {
    padding: 12,
  },
  titleAndEditContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  recipeTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  editTitleButton: {
    padding: 4,
    backgroundColor: 'transparent',
  },
  recipeDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginLeft: 4,
  },
  recipeStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginLeft: 2,
  },
  difficultyDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  recipeTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  recipeTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  recipeTagText: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  starContainer: {
    flexDirection: 'row',
    gap: 2,
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
    maxHeight: '90%',
  },
  importModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '50%',
  },
  filterModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '70%',
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
  formScrollView: {
    maxHeight: 400,
    marginBottom: 20,
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
    minHeight: 80,
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
  favoriteToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
  },
  favoriteToggleText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginLeft: 12,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
  importDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  urlInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    backgroundColor: '#FFFFFF',
    color: '#111827',
    marginBottom: 24,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 12,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  filterOptionText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
  },
  selectedFilterText: {
    fontFamily: 'Inter-SemiBold',
    color: '#F97966',
  },
  selectedIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F97966',
  },
  applyFiltersButton: {
    width: '100%',
  },
});