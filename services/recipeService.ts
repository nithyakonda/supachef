import { Recipe } from '@/types';
import { clientSideRecipeParser } from './clientSideRecipeParser';

// Mock data for development
const MOCK_RECIPES: Recipe[] = [
  {
    id: '1',
    title: 'Butternut Soup with Avocado & Chickpeas',
    description: 'A creamy, nutritious soup perfect for autumn',
    imageUrl: 'https://images.pexels.com/photos/8477434/pexels-photo-8477434.jpeg',
    cookingTime: 45,
    servings: 4,
    difficulty: 'Easy',
    calories: 320,
    ingredients: [
      { name: 'Butternut Squash Soup', amount: '1', unit: '15-ounce can' },
      { name: 'Diced avocado', amount: '1', unit: 'cup' },
      { name: 'Lime juice', amount: '1', unit: 'tablespoon' },
      { name: 'Curry powder', amount: '1', unit: 'teaspoon' },
      { name: 'Plain Greek yogurt', amount: '1/4', unit: 'cup' }
    ],
    instructions: [
      'Heat soup according to package directions',
      'Prepare avocado and lime mixture',
      'Serve hot with toppings'
    ],
    tags: ['Vegetarian', 'Healthy', 'Soup'],
    isFavorite: true,
    rating: 5,
    notes: 'Perfect for cold days',
    createdAt: new Date(),
  },
  {
    id: '2',
    title: 'Mediterranean Quinoa Bowl',
    description: 'Fresh and healthy Mediterranean-inspired bowl',
    imageUrl: 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg',
    cookingTime: 25,
    servings: 2,
    difficulty: 'Easy',
    calories: 420,
    ingredients: [
      { name: 'Quinoa', amount: '1', unit: 'cup' },
      { name: 'Cherry tomatoes', amount: '1', unit: 'cup' },
      { name: 'Cucumber', amount: '1', unit: 'medium' },
      { name: 'Feta cheese', amount: '1/2', unit: 'cup' },
      { name: 'Olive oil', amount: '2', unit: 'tablespoons' }
    ],
    instructions: [
      'Cook quinoa according to package directions',
      'Chop vegetables',
      'Combine all ingredients and toss with olive oil'
    ],
    tags: ['Mediterranean', 'Vegetarian', 'Healthy'],
    isFavorite: false,
    rating: 4,
    notes: '',
    createdAt: new Date(),
  }
];

// Storage key for localStorage
const STORAGE_KEY = 'supachef_recipes';

// Get recipes from localStorage or return mock data
const getStoredRecipes = (): Recipe[] => {
  if (typeof window === 'undefined') return MOCK_RECIPES;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((recipe: any) => ({
        ...recipe,
        createdAt: new Date(recipe.createdAt)
      }));
    }
  } catch (error) {
    console.error('Error loading recipes from storage:', error);
  }
  
  return MOCK_RECIPES;
};

// Save recipes to localStorage
const saveRecipes = (recipes: Recipe[]): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
  } catch (error) {
    console.error('Error saving recipes to storage:', error);
  }
};

// Generate unique ID
const generateId = (): string => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

// Simplified recipe service
export const recipeService = {
  // Get all recipes
  getAllRecipes: async (): Promise<Recipe[]> => {
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 100));
    return getStoredRecipes();
  },

  // Get recipe by ID
  getRecipeById: async (id: string): Promise<Recipe | undefined> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    const recipes = getStoredRecipes();
    return recipes.find(recipe => recipe.id === id);
  },

  // Save recipe (create or update)
  saveRecipe: async (recipe: Recipe): Promise<Recipe> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    const recipes = getStoredRecipes();
    const existingIndex = recipes.findIndex(r => r.id === recipe.id);
    
    if (existingIndex >= 0) {
      recipes[existingIndex] = recipe;
    } else {
      recipes.unshift(recipe);
    }
    
    saveRecipes(recipes);
    return recipe;
  },

  // Create new recipe
  createRecipe: async (recipeData: Omit<Recipe, 'id' | 'createdAt'>): Promise<Recipe> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    const recipes = getStoredRecipes();
    const newRecipe: Recipe = {
      ...recipeData,
      id: generateId(),
      createdAt: new Date(),
    };
    
    const updatedRecipes = [newRecipe, ...recipes];
    saveRecipes(updatedRecipes);
    return newRecipe;
  },

  // Update existing recipe
  updateRecipe: async (recipe: Recipe): Promise<Recipe> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    const recipes = getStoredRecipes();
    const index = recipes.findIndex(r => r.id === recipe.id);
    
    if (index >= 0) {
      recipes[index] = recipe;
      saveRecipes(recipes);
    }
    
    return recipe;
  },

  // Delete recipe
  deleteRecipe: async (id: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    const recipes = getStoredRecipes();
    const filteredRecipes = recipes.filter(recipe => recipe.id !== id);
    
    if (filteredRecipes.length === recipes.length) return false;
    
    saveRecipes(filteredRecipes);
    return true;
  },

  // Toggle favorite status
  toggleFavorite: async (id: string): Promise<Recipe | null> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    const recipes = getStoredRecipes();
    const recipe = recipes.find(r => r.id === id);
    
    if (!recipe) return null;
    
    const updatedRecipe = { ...recipe, isFavorite: !recipe.isFavorite };
    await recipeService.updateRecipe(updatedRecipe);
    return updatedRecipe;
  },

  // Search recipes
  searchRecipes: async (query: string): Promise<Recipe[]> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    const recipes = getStoredRecipes();
    const lowercaseQuery = query.toLowerCase();
    
    return recipes.filter(recipe =>
      recipe.title.toLowerCase().includes(lowercaseQuery) ||
      recipe.description.toLowerCase().includes(lowercaseQuery) ||
      recipe.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
      recipe.ingredients.some(ingredient => 
        ingredient.name.toLowerCase().includes(lowercaseQuery)
      )
    );
  },

  // Get recipes by tag
  getRecipesByTag: async (tag: string): Promise<Recipe[]> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    const recipes = getStoredRecipes();
    return recipes.filter(recipe => 
      recipe.tags.some(t => t.toLowerCase() === tag.toLowerCase())
    );
  },

  // Get favorite recipes
  getFavoriteRecipes: async (): Promise<Recipe[]> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    const recipes = getStoredRecipes();
    return recipes.filter(recipe => recipe.isFavorite);
  },

  // Get recently added recipes
  getRecentRecipes: async (limit: number = 10): Promise<Recipe[]> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    const recipes = getStoredRecipes();
    return recipes
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  },

  // Get all unique tags
  getAllTags: async (): Promise<string[]> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    const recipes = getStoredRecipes();
    const allTags = recipes.flatMap(recipe => recipe.tags);
    return Array.from(new Set(allTags)).sort();
  },

  // Import recipe from URL using client-side parser
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
    
    // Use client-side parser
    const recipeData = await clientSideRecipeParser.parseRecipeFromUrl(url, onProgress);
    
    onProgress?.('Saving recipe...');
    
    // Create and save the recipe
    const savedRecipe = await recipeService.createRecipe(recipeData);
    
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
    return clientSideRecipeParser.isSupportedUrl(url);
  },

  // Get supported domains list
  getSupportedDomains: (): string[] => {
    return clientSideRecipeParser.getSupportedDomains();
  }
};

export default recipeService;