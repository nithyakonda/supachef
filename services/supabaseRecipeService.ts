import { supabase } from '@/utils/supabase';
import { Recipe } from '@/types';
import type { Database } from '@/utils/supabase';

type RecipeRow = Database['public']['Tables']['recipes']['Row'];
type RecipeInsert = Database['public']['Tables']['recipes']['Insert'];
type RecipeUpdate = Database['public']['Tables']['recipes']['Update'];

// Generate a UUID compatible with React Native
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Transform database row to Recipe type
const transformRecipeFromDB = (row: RecipeRow): Recipe => ({
  id: row.id,
  title: row.title,
  description: row.description,
  imageUrl: row.image_url,
  cookingTime: row.cooking_time,
  servings: row.servings,
  difficulty: row.difficulty,
  calories: row.calories,
  ingredients: row.ingredients || [],
  instructions: row.instructions || [],
  tags: row.tags || [],
  source: row.source || undefined,
  rating: row.rating || undefined,
  notes: row.notes || undefined,
  isFavorite: row.is_favorite,
  createdAt: new Date(row.created_at),
});

// Transform Recipe to database insert format
const transformRecipeForDB = (recipe: Recipe, userId: string): RecipeInsert => ({
  id: recipe.id,
  title: recipe.title,
  description: recipe.description,
  image_url: recipe.imageUrl,
  cooking_time: recipe.cookingTime,
  servings: recipe.servings,
  difficulty: recipe.difficulty,
  calories: recipe.calories,
  ingredients: recipe.ingredients,
  instructions: recipe.instructions,
  tags: recipe.tags,
  source: recipe.source || null,
  rating: recipe.rating || null,
  notes: recipe.notes || null,
  is_favorite: recipe.isFavorite,
  user_id: userId,
});

// Transform Recipe to database update format
const transformRecipeForUpdate = (recipe: Recipe): RecipeUpdate => ({
  title: recipe.title,
  description: recipe.description,
  image_url: recipe.imageUrl,
  cooking_time: recipe.cookingTime,
  servings: recipe.servings,
  difficulty: recipe.difficulty,
  calories: recipe.calories,
  ingredients: recipe.ingredients,
  instructions: recipe.instructions,
  tags: recipe.tags,
  source: recipe.source || null,
  rating: recipe.rating || null,
  notes: recipe.notes || null,
  is_favorite: recipe.isFavorite,
  updated_at: new Date().toISOString(),
});

export const supabaseRecipeService = {
  // Get current user ID
  getCurrentUserId: async (): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  },

  // Get all recipes for the current user
  getAllRecipes: async (): Promise<Recipe[]> => {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching recipes:', error);
      throw new Error('Failed to fetch recipes');
    }

    return data.map(transformRecipeFromDB);
  },

  // Get recipe by ID
  getRecipeById: async (id: string): Promise<Recipe | null> => {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Recipe not found
      }
      console.error('Error fetching recipe:', error);
      throw new Error('Failed to fetch recipe');
    }

    return transformRecipeFromDB(data);
  },

  // Create new recipe
  createRecipe: async (recipeData: Omit<Recipe, 'id' | 'createdAt'>): Promise<Recipe> => {
    const userId = await supabaseRecipeService.getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const newRecipe: Recipe = {
      ...recipeData,
      id: generateUUID(), // Use our custom UUID generator
      createdAt: new Date(),
    };

    const { data, error } = await supabase
      .from('recipes')
      .insert(transformRecipeForDB(newRecipe, userId))
      .select()
      .single();

    if (error) {
      console.error('Error creating recipe:', error);
      throw new Error('Failed to create recipe');
    }

    return transformRecipeFromDB(data);
  },

  // Update existing recipe
  updateRecipe: async (recipe: Recipe): Promise<Recipe> => {
    const { data, error } = await supabase
      .from('recipes')
      .update(transformRecipeForUpdate(recipe))
      .eq('id', recipe.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating recipe:', error);
      throw new Error('Failed to update recipe');
    }

    return transformRecipeFromDB(data);
  },

  // Delete recipe
  deleteRecipe: async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting recipe:', error);
      throw new Error('Failed to delete recipe');
    }

    return true;
  },

  // Toggle favorite status
  toggleFavorite: async (id: string): Promise<Recipe | null> => {
    // First get the current recipe
    const recipe = await supabaseRecipeService.getRecipeById(id);
    if (!recipe) return null;

    // Update the favorite status
    const updatedRecipe = { ...recipe, isFavorite: !recipe.isFavorite };
    return await supabaseRecipeService.updateRecipe(updatedRecipe);
  },

  // Search recipes
  searchRecipes: async (query: string): Promise<Recipe[]> => {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error searching recipes:', error);
      throw new Error('Failed to search recipes');
    }

    return data.map(transformRecipeFromDB);
  },

  // Get recipes by tag
  getRecipesByTag: async (tag: string): Promise<Recipe[]> => {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .contains('tags', [tag])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching recipes by tag:', error);
      throw new Error('Failed to fetch recipes by tag');
    }

    return data.map(transformRecipeFromDB);
  },

  // Get favorite recipes
  getFavoriteRecipes: async (): Promise<Recipe[]> => {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('is_favorite', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching favorite recipes:', error);
      throw new Error('Failed to fetch favorite recipes');
    }

    return data.map(transformRecipeFromDB);
  },

  // Get recently added recipes
  getRecentRecipes: async (limit: number = 10): Promise<Recipe[]> => {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent recipes:', error);
      throw new Error('Failed to fetch recent recipes');
    }

    return data.map(transformRecipeFromDB);
  },

  // Get all unique tags
  getAllTags: async (): Promise<string[]> => {
    const { data, error } = await supabase
      .from('recipes')
      .select('tags');

    if (error) {
      console.error('Error fetching tags:', error);
      throw new Error('Failed to fetch tags');
    }

    const allTags = data.flatMap(row => row.tags || []);
    return Array.from(new Set(allTags)).sort();
  },

  // Import recipe from URL (keeping the existing logic)
  importFromUrl: async (url: string): Promise<Recipe> => {
    // Validate URL
    try {
      new URL(url);
    } catch {
      throw new Error('Invalid URL provided');
    }

    // Simulate loading delay for better UX
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For now, create a placeholder recipe
    // In the future, this would use the existing URL parsing logic
    const recipeData: Omit<Recipe, 'id' | 'createdAt'> = {
      title: 'Imported Recipe',
      description: 'Recipe imported from URL',
      imageUrl: 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg',
      cookingTime: 30,
      servings: 4,
      difficulty: 'Medium',
      calories: 0,
      ingredients: [{ name: 'See original recipe for ingredients', amount: '1' }],
      instructions: ['See original recipe for instructions'],
      tags: ['Imported'],
      isFavorite: false,
      rating: 0,
      notes: `Imported from: ${url}`,
      source: url
    };
    
    return await supabaseRecipeService.createRecipe(recipeData);
  }
};

export default supabaseRecipeService;