import { Recipe } from '@/types';
import { supabaseRecipeService } from './supabaseRecipeService';
import { realUrlParsingService } from './urlParsingService';

// Simple wrapper around supabaseRecipeService to maintain the same interface
export const recipeService = {
  // Get all recipes
  getAllRecipes: async (): Promise<Recipe[]> => {
    return await supabaseRecipeService.getAllRecipes();
  },

  // Get recipe by ID
  getRecipeById: async (id: string): Promise<Recipe | undefined> => {
    const recipe = await supabaseRecipeService.getRecipeById(id);
    return recipe || undefined;
  },

  // Save recipe (create or update)
  saveRecipe: async (recipe: Recipe): Promise<Recipe> => {
    return await supabaseRecipeService.updateRecipe(recipe);
  },

  // Create new recipe
  createRecipe: async (recipeData: Omit<Recipe, 'id' | 'createdAt'>): Promise<Recipe> => {
    return await supabaseRecipeService.createRecipe(recipeData);
  },

  // Update existing recipe
  updateRecipe: async (recipe: Recipe): Promise<Recipe> => {
    return await supabaseRecipeService.updateRecipe(recipe);
  },

  // Delete recipe
  deleteRecipe: async (id: string): Promise<boolean> => {
    return await supabaseRecipeService.deleteRecipe(id);
  },

  // Toggle favorite status
  toggleFavorite: async (id: string): Promise<Recipe | null> => {
    return await supabaseRecipeService.toggleFavorite(id);
  },

  // Search recipes
  searchRecipes: async (query: string): Promise<Recipe[]> => {
    return await supabaseRecipeService.searchRecipes(query);
  },

  // Get recipes by tag
  getRecipesByTag: async (tag: string): Promise<Recipe[]> => {
    return await supabaseRecipeService.getRecipesByTag(tag);
  },

  // Get favorite recipes
  getFavoriteRecipes: async (): Promise<Recipe[]> => {
    return await supabaseRecipeService.getFavoriteRecipes();
  },

  // Get recently added recipes
  getRecentRecipes: async (limit: number = 10): Promise<Recipe[]> => {
    return await supabaseRecipeService.getRecentRecipes(limit);
  },

  // Get all unique tags
  getAllTags: async (): Promise<string[]> => {
    return await supabaseRecipeService.getAllTags();
  },

  // Import recipe from URL using real metadata extraction
  importFromUrl: async (
    url: string, 
    onProgress?: (status: string) => void
  ): Promise<Recipe> => {
    try {
      // Validate URL
      new URL(url);
    } catch {
      throw new Error('Invalid URL provided');
    }

    onProgress?.('Starting import...');
    
    // Use real URL parsing service
    const recipeData = await realUrlParsingService.parseRecipeFromUrl(url, onProgress);
    
    onProgress?.('Saving recipe...');
    
    // Create and save the recipe using Supabase
    const savedRecipe = await supabaseRecipeService.createRecipe(recipeData);
    
    onProgress?.('Import complete!');
    
    return savedRecipe;
  },

  // Batch import multiple URLs
  batchImportFromUrls: async (
    urls: string[],
    onProgress?: (completed: number, total: number, currentUrl: string) => void
  ): Promise<{ success: Recipe[], failed: { url: string, error: string }[] }> => {
    const results = { success: [] as Recipe[], failed: [] as { url: string, error: string }[] };
    
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      onProgress?.(i, urls.length, url);
      
      try {
        const recipe = await recipeService.importFromUrl(url);
        results.success.push(recipe);
      } catch (error) {
        results.failed.push({
          url,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
      // Small delay between imports
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    onProgress?.(urls.length, urls.length, '');
    return results;
  },

  // Check if URL is supported
  isSupportedUrl: (url: string): boolean => {
    return realUrlParsingService.isSupportedUrl(url);
  },

  // Get supported domains list
  getSupportedDomains: (): string[] => {
    return realUrlParsingService.getSupportedDomains();
  }
};

export default recipeService;