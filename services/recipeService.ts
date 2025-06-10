import { Recipe } from '@/types';

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

// Recipe service functions
export const recipeService = {
  // Get all recipes
  getAllRecipes: (): Recipe[] => {
    return getStoredRecipes();
  },

  // Get recipe by ID
  getRecipeById: (id: string): Recipe | undefined => {
    const recipes = getStoredRecipes();
    return recipes.find(recipe => recipe.id === id);
  },

  // Create new recipe
  createRecipe: (recipeData: Omit<Recipe, 'id' | 'createdAt'>): Recipe => {
    const recipes = getStoredRecipes();
    const newRecipe: Recipe = {
      ...recipeData,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    
    const updatedRecipes = [newRecipe, ...recipes];
    saveRecipes(updatedRecipes);
    return newRecipe;
  },

  // Update existing recipe
  updateRecipe: (id: string, updates: Partial<Recipe>): Recipe | null => {
    const recipes = getStoredRecipes();
    const index = recipes.findIndex(recipe => recipe.id === id);
    
    if (index === -1) return null;
    
    const updatedRecipe = { ...recipes[index], ...updates };
    recipes[index] = updatedRecipe;
    saveRecipes(recipes);
    return updatedRecipe;
  },

  // Delete recipe
  deleteRecipe: (id: string): boolean => {
    const recipes = getStoredRecipes();
    const filteredRecipes = recipes.filter(recipe => recipe.id !== id);
    
    if (filteredRecipes.length === recipes.length) return false;
    
    saveRecipes(filteredRecipes);
    return true;
  },

  // Toggle favorite status
  toggleFavorite: (id: string): Recipe | null => {
    const recipes = getStoredRecipes();
    const recipe = recipes.find(r => r.id === id);
    
    if (!recipe) return null;
    
    return recipeService.updateRecipe(id, { isFavorite: !recipe.isFavorite });
  },

  // Search recipes
  searchRecipes: (query: string): Recipe[] => {
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
  getRecipesByTag: (tag: string): Recipe[] => {
    const recipes = getStoredRecipes();
    return recipes.filter(recipe => 
      recipe.tags.some(t => t.toLowerCase() === tag.toLowerCase())
    );
  },

  // Get favorite recipes
  getFavoriteRecipes: (): Recipe[] => {
    const recipes = getStoredRecipes();
    return recipes.filter(recipe => recipe.isFavorite);
  },

  // Get recently added recipes
  getRecentRecipes: (limit: number = 10): Recipe[] => {
    const recipes = getStoredRecipes();
    return recipes
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  },

  // Get all unique tags
  getAllTags: (): string[] => {
    const recipes = getStoredRecipes();
    const allTags = recipes.flatMap(recipe => recipe.tags);
    return Array.from(new Set(allTags)).sort();
  },

  // Import recipe from URL (mock implementation)
  importFromUrl: async (url: string): Promise<Recipe> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock recipe extraction based on URL
    const mockRecipe: Omit<Recipe, 'id' | 'createdAt'> = {
      title: `Recipe from ${new URL(url).hostname}`,
      description: 'Imported recipe description',
      imageUrl: 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg',
      cookingTime: 30,
      servings: 4,
      difficulty: 'Medium',
      calories: 350,
      ingredients: [
        { name: 'Ingredient 1', amount: '1', unit: 'cup' },
        { name: 'Ingredient 2', amount: '2', unit: 'tablespoons' }
      ],
      instructions: [
        'Step 1: Prepare ingredients',
        'Step 2: Cook according to directions',
        'Step 3: Serve and enjoy'
      ],
      tags: ['Imported'],
      isFavorite: false,
      rating: 0,
      notes: `Imported from ${url}`,
    };
    
    return recipeService.createRecipe(mockRecipe);
  }
};

export default recipeService;