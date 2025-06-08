import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter, Heart, Plus, Clock, Users } from 'lucide-react-native';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';
import { sampleRecipes } from '@/data/sampleData';
import { Recipe } from '@/types';

export default function RecipesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>(['1', '3']);

  const allTags = Array.from(
    new Set(sampleRecipes.flatMap(recipe => recipe.tags))
  );

  const filteredRecipes = sampleRecipes.filter(recipe => {
    if (searchQuery && !recipe.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (selectedTags.length > 0 && !selectedTags.some(tag => recipe.tags.includes(tag))) {
      return false;
    }
    return true;
  });

  const toggleFavorite = (recipeId: string) => {
    setFavorites(prev => 
      prev.includes(recipeId) 
        ? prev.filter(id => id !== recipeId)
        : [...prev, recipeId]
    );
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Recipe Book</Text>
        <TouchableOpacity style={styles.addButton}>
          <Plus size={24} color="#F97966" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
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
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Tags Filter */}
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

        {/* Recipes List */}
        <View style={styles.recipesContainer}>
          {filteredRecipes.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>No recipes found</Text>
              <Text style={styles.emptyStateDescription}>
                Try adjusting your search or filters
              </Text>
              <Button
                title="Add Your First Recipe"
                onPress={() => {}}
                style={styles.emptyStateButton}
              />
            </View>
          ) : (
            filteredRecipes.map(recipe => (
              <Card key={recipe.id} style={styles.recipeCard}>
                <TouchableOpacity>
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
                  </View>

                  <View style={styles.recipeContent}>
                    <Text style={styles.recipeTitle}>{recipe.title}</Text>
                    <Text style={styles.recipeDescription} numberOfLines={2}>
                      {recipe.description}
                    </Text>

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
                      {recipe.tags.slice(0, 3).map(tag => (
                        <View key={tag} style={styles.recipeTag}>
                          <Text style={styles.recipeTagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </TouchableOpacity>
              </Card>
            ))
          )}
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
  addButton: {
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
    marginBottom: 16,
    padding: 0,
    overflow: 'hidden',
  },
  recipeImageContainer: {
    position: 'relative',
  },
  recipeImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeContent: {
    padding: 16,
  },
  recipeTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 8,
  },
  recipeDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  recipeStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginLeft: 4,
  },
  difficultyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  recipeTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recipeTag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  recipeTagText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
});