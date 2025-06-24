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
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter, Heart, Plus, Clock, Users, Star, X, Link, ChevronRight, Info, ExternalLink } from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';
import { sampleRecipes } from '@/data/sampleData';
import { Recipe } from '@/types';
import { enhancedRecipeService } from '@/services/enhancedRecipeService';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2;

export default function EnhancedRecipesScreen() {
  const [recipes, setRecipes] = useState<Recipe[]>(sampleRecipes);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>(['1', '3']);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSupportedSitesModal, setShowSupportedSitesModal] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'alphabetical' | 'rating'>('recent');
  const [filterBy, setFilterBy] = useState<'all' | 'favorites'>('all');
  const [importUrl, setImportUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState('');
  const [urlError, setUrlError] = useState('');

  // Load recipes from database
  const loadRecipes = async () => {
    try {
      const savedRecipes = await enhancedRecipeService.getAllRecipes();
      if (savedRecipes.length > 0) {
        setRecipes(savedRecipes);
      }
    } catch (error) {
      console.error('Error loading recipes:', error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadRecipes();
    }, [])
  );

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

  // Group recipes for carousels
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
    
    try {
      await enhancedRecipeService.toggleFavorite(recipeId);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Revert on error
      setFavorites(favorites);
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

  const handleAddRecipe = () => {
    router.push('/recipes/add-edit-recipe');
  };

  const handleRecipePress = (recipe: Recipe) => {
    router.push(`/recipes/${recipe.id}`);
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
              await enhancedRecipeService.deleteRecipe(recipeId);
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

  const validateUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'https:' || urlObj.protocol === 'http:';
    } catch {
      return false;
    }
  };

  const handleUrlChange = (url: string) => {
    setImportUrl(url);
    setUrlError('');
    
    if (url.trim() && !validateUrl(url)) {
      setUrlError('Please enter a valid URL');
    } else if (url.trim() && !enhancedRecipeService.isSupportedUrl(url)) {
      setUrlError('This website may not be supported. Check supported sites below.');
    }
  };

  const handleImportFromUrl = async () => {
    if (!importUrl.trim()) {
      setUrlError('Please enter a URL');
      return;
    }

    if (!validateUrl(importUrl)) {
      setUrlError('Please enter a valid URL');
      return;
    }

    setIsImporting(true);
    setImportProgress('Starting import...');
    setUrlError('');

    try {
      const importedRecipe = await enhancedRecipeService.importFromUrl(
        importUrl,
        (status) => setImportProgress(status)
      );
      
      setRecipes(prev => [importedRecipe, ...prev]);
      setShowImportModal(false);
      setImportUrl('');
      setImportProgress('');
      
      Alert.alert(
        'Success!', 
        'Recipe imported successfully!',
        [
          { text: 'View Recipe', onPress: () => handleRecipePress(importedRecipe) },
          { text: 'OK', style: 'default' }
        ]
      );
    } catch (error) {
      console.error('Import error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to import recipe';
      setUrlError(errorMessage);
      setImportProgress('');
    } finally {
      setIsImporting(false);
    }
  };

  const handleBatchImport = () => {
    // Show info about batch import feature
    Alert.alert(
      'Batch Import',
      'Want to import multiple recipes at once? This feature is coming soon!',
      [{ text: 'OK' }]
    );
  };

  const openSupportedSites = () => {
    setShowSupportedSitesModal(true);
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

  const renderRecipeCard = (recipe: Recipe, isCarousel = false) => (
    <Card key={recipe.id} style={[styles.recipeCard, isCarousel && styles.carouselCard]}>
      <TouchableOpacity onPress={() => handleRecipePress(recipe)}>
        <View style={styles.recipeImageContainer}>
          <Image
            source={{ uri: recipe.imageUrl }}
            style={styles.recipeImage}
          />
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => toggleFavorite(recipe.id)}
          >
            <Heart
              size={18}
              color={favorites.includes(recipe.id) ? '#F97966' : '#9CA3AF'}
              fill={favorites.includes(recipe.id) ? '#F97966' : 'none'}
            />
          </TouchableOpacity>
          {recipe.source && (
            <View style={styles.sourceIndicator}>
              <ExternalLink size={12} color="#FFFFFF" />
            </View>
          )}
        </View>

        <View style={styles.recipeContent}>
          <Text style={styles.recipeTitle} numberOfLines={2}>{recipe.title}</Text>
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
      </TouchableOpacity>
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

      {/* Enhanced Import from URL Modal */}
      <Modal
        visible={showImportModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => !isImporting && setShowImportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.importModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Import Recipe from URL</Text>
              {!isImporting && (
                <TouchableOpacity onPress={() => setShowImportModal(false)}>
                  <X size={24} color="#6B7280" />
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.importDescription}>
              Import recipes from YouTube, Pinterest, and major recipe websites automatically.
            </Text>

            <TextInput
              style={[styles.urlInput, urlError ? styles.urlInputError : null]}
              value={importUrl}
              onChangeText={handleUrlChange}
              placeholder="https://youtube.com/watch?v=... or https://pinterest.com/..."
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isImporting}
              multiline={true}
              numberOfLines={2}
            />

            {urlError ? (
              <Text style={styles.errorText}>{urlError}</Text>
            ) : null}

            {isImporting && importProgress ? (
              <View style={styles.progressContainer}>
                <ActivityIndicator size="small" color="#F97966" />
                <Text style={styles.progressText}>{importProgress}</Text>
              </View>
            ) : null}

            <View style={styles.supportedSitesContainer}>
              <TouchableOpacity 
                style={styles.supportedSitesButton}
                onPress={openSupportedSites}
              >
                <Info size={16} color="#6B7280" />
                <Text style={styles.supportedSitesText}>View supported sites</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => setShowImportModal(false)}
                variant="outline"
                style={styles.modalButton}
                disabled={isImporting}
              />
              <Button
                title={isImporting ? "Importing..." : "Import Recipe"}
                onPress={handleImportFromUrl}
                variant="primary"
                style={styles.modalButton}
                disabled={isImporting || !importUrl.trim() || !!urlError}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Supported Sites Modal */}
      <Modal
        visible={showSupportedSitesModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSupportedSitesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.supportedSitesModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Supported Websites</Text>
              <TouchableOpacity onPress={() => setShowSupportedSitesModal(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.supportedSitesDescription}>
                Our recipe importer works best with these popular websites:
              </Text>

              {enhancedRecipeService.getSupportedDomains().map((domain, index) => (
                <View key={index} style={styles.supportedSiteItem}>
                  <Text style={styles.supportedSiteText}>• {domain}</Text>
                </View>
              ))}

              <View style={styles.noteContainer}>
                <Text style={styles.noteTitle}>Note:</Text>
                <Text style={styles.noteText}>
                  While we support many recipe websites, some sites may have restrictions that prevent automatic importing. 
                  If a recipe doesn't import correctly, you can always add it manually.
                </Text>
              </View>
            </ScrollView>

            <Button
              title="Got it"
              onPress={() => setShowSupportedSitesModal(false)}
              variant="primary"
              style={styles.fullWidthButton}
            />
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
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeContent: {
    padding: 12,
  },
  recipeTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 4,
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
  importModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  supportedSitesModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
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
    marginBottom: 16,
    minHeight: 48,
    textAlignVertical: 'top',
  },
  urlInputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#EF4444',
    marginBottom: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  progressText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#F97966',
    marginLeft: 12,
  },
  supportedSitesContainer: {
    marginBottom: 20,
  },
  supportedSitesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  supportedSitesText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginLeft: 8,
  },
  supportedSitesDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  supportedSiteItem: {
    paddingVertical: 4,
  },
  supportedSiteText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
  },
  noteContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 20,
  },
  noteTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 8,
  },
  noteText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
  },
  fullWidthButton: {
    width: '100%',
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
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});