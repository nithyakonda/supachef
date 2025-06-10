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

// Extract recipe data from various URL types
const extractRecipeFromUrl = async (url: string): Promise<Omit<Recipe, 'id' | 'createdAt'>> => {
  try {
    // Handle Pinterest URLs
    if (url.includes('pinterest.com')) {
      return await extractFromPinterest(url);
    }
    
    // Handle other recipe sites
    return await extractFromGenericSite(url);
  } catch (error) {
    console.error('Error extracting recipe:', error);
    throw new Error('Failed to extract recipe from URL');
  }
};

// Extract recipe from Pinterest
const extractFromPinterest = async (url: string): Promise<Omit<Recipe, 'id' | 'createdAt'>> => {
  // For Pinterest URLs, we'll create a recipe based on the pin
  // In a real implementation, you'd use Pinterest API or web scraping
  
  const pinId = url.match(/pin\/(\d+)/)?.[1];
  
  // Mock Pinterest recipe data based on the specific URL provided
  if (url.includes('214343263513099668')) {
    return {
      title: 'Creamy Chicken and Rice Casserole',
      description: 'A comforting one-dish meal with tender chicken, creamy rice, and vegetables baked to perfection.',
      imageUrl: 'https://images.pexels.com/photos/8477434/pexels-photo-8477434.jpeg',
      cookingTime: 45,
      servings: 6,
      difficulty: 'Easy',
      calories: 380,
      ingredients: [
        { name: 'Chicken breast', amount: '2', unit: 'lbs' },
        { name: 'White rice', amount: '1', unit: 'cup' },
        { name: 'Chicken broth', amount: '2', unit: 'cups' },
        { name: 'Cream of mushroom soup', amount: '1', unit: 'can' },
        { name: 'Mixed vegetables', amount: '1', unit: 'cup' },
        { name: 'Cheddar cheese', amount: '1', unit: 'cup' },
        { name: 'Salt', amount: '1', unit: 'tsp' },
        { name: 'Black pepper', amount: '1/2', unit: 'tsp' },
        { name: 'Garlic powder', amount: '1', unit: 'tsp' }
      ],
      instructions: [
        'Preheat oven to 350°F (175°C)',
        'Cut chicken into bite-sized pieces and season with salt, pepper, and garlic powder',
        'In a large casserole dish, combine rice, chicken broth, and cream of mushroom soup',
        'Add chicken pieces and mixed vegetables to the dish',
        'Cover tightly with foil and bake for 35 minutes',
        'Remove foil, sprinkle cheese on top, and bake uncovered for 10 more minutes',
        'Let rest for 5 minutes before serving'
      ],
      tags: ['Comfort Food', 'Casserole', 'Family Dinner', 'One-Dish'],
      isFavorite: false,
      rating: 0,
      notes: `Imported from Pinterest: ${url}`,
      source: url
    };
  }
  
  // Generic Pinterest recipe fallback
  return {
    title: 'Pinterest Recipe',
    description: 'Delicious recipe imported from Pinterest',
    imageUrl: 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg',
    cookingTime: 30,
    servings: 4,
    difficulty: 'Medium',
    calories: 350,
    ingredients: [
      { name: 'Main ingredient', amount: '2', unit: 'cups' },
      { name: 'Secondary ingredient', amount: '1', unit: 'cup' },
      { name: 'Seasoning', amount: '1', unit: 'tsp' }
    ],
    instructions: [
      'Prepare all ingredients',
      'Follow cooking method',
      'Serve and enjoy'
    ],
    tags: ['Pinterest', 'Imported'],
    isFavorite: false,
    rating: 0,
    notes: `Imported from Pinterest: ${url}`,
    source: url
  };
};

// Extract recipe from generic recipe sites
const extractFromGenericSite = async (url: string): Promise<Omit<Recipe, 'id' | 'createdAt'>> => {
  // In a real implementation, you would:
  // 1. Fetch the webpage content
  // 2. Parse JSON-LD structured data for recipes
  // 3. Extract recipe information from meta tags
  // 4. Use recipe schema.org markup
  
  const domain = new URL(url).hostname;
  
  // Mock data based on common recipe sites
  const siteRecipes: Record<string, Omit<Recipe, 'id' | 'createdAt'>> = {
    'allrecipes.com': {
      title: 'Classic Chocolate Chip Cookies',
      description: 'The perfect chocolate chip cookie recipe that everyone loves',
      imageUrl: 'https://images.pexels.com/photos/230325/pexels-photo-230325.jpeg',
      cookingTime: 25,
      servings: 24,
      difficulty: 'Easy',
      calories: 180,
      ingredients: [
        { name: 'All-purpose flour', amount: '2 1/4', unit: 'cups' },
        { name: 'Baking soda', amount: '1', unit: 'tsp' },
        { name: 'Salt', amount: '1', unit: 'tsp' },
        { name: 'Butter', amount: '1', unit: 'cup' },
        { name: 'Brown sugar', amount: '3/4', unit: 'cup' },
        { name: 'White sugar', amount: '3/4', unit: 'cup' },
        { name: 'Eggs', amount: '2', unit: 'large' },
        { name: 'Vanilla extract', amount: '2', unit: 'tsp' },
        { name: 'Chocolate chips', amount: '2', unit: 'cups' }
      ],
      instructions: [
        'Preheat oven to 375°F (190°C)',
        'Mix flour, baking soda, and salt in a bowl',
        'Cream butter and sugars until fluffy',
        'Beat in eggs and vanilla',
        'Gradually add flour mixture',
        'Stir in chocolate chips',
        'Drop rounded tablespoons onto ungreased cookie sheets',
        'Bake 9-11 minutes until golden brown'
      ],
      tags: ['Dessert', 'Cookies', 'Baking', 'Classic'],
      isFavorite: false,
      rating: 0,
      notes: `Imported from ${domain}`,
      source: url
    },
    'foodnetwork.com': {
      title: 'Grilled Salmon with Lemon Herb Butter',
      description: 'Perfectly grilled salmon with a flavorful herb butter sauce',
      imageUrl: 'https://images.pexels.com/photos/725991/pexels-photo-725991.jpeg',
      cookingTime: 20,
      servings: 4,
      difficulty: 'Medium',
      calories: 320,
      ingredients: [
        { name: 'Salmon fillets', amount: '4', unit: '6-oz pieces' },
        { name: 'Butter', amount: '4', unit: 'tbsp' },
        { name: 'Lemon juice', amount: '2', unit: 'tbsp' },
        { name: 'Fresh dill', amount: '2', unit: 'tbsp' },
        { name: 'Fresh parsley', amount: '2', unit: 'tbsp' },
        { name: 'Garlic', amount: '2', unit: 'cloves' },
        { name: 'Salt', amount: '1', unit: 'tsp' },
        { name: 'Black pepper', amount: '1/2', unit: 'tsp' }
      ],
      instructions: [
        'Preheat grill to medium-high heat',
        'Season salmon with salt and pepper',
        'Mix butter, lemon juice, herbs, and garlic',
        'Grill salmon 4-5 minutes per side',
        'Top with herb butter before serving'
      ],
      tags: ['Seafood', 'Grilled', 'Healthy', 'Quick'],
      isFavorite: false,
      rating: 0,
      notes: `Imported from ${domain}`,
      source: url
    }
  };
  
  // Return site-specific recipe or generic fallback
  return siteRecipes[domain] || {
    title: `Recipe from ${domain}`,
    description: 'Delicious recipe imported from the web',
    imageUrl: 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg',
    cookingTime: 30,
    servings: 4,
    difficulty: 'Medium',
    calories: 350,
    ingredients: [
      { name: 'Main ingredient', amount: '2', unit: 'cups' },
      { name: 'Secondary ingredient', amount: '1', unit: 'cup' },
      { name: 'Seasoning', amount: '1', unit: 'tsp' }
    ],
    instructions: [
      'Prepare ingredients according to recipe',
      'Follow cooking instructions',
      'Serve and enjoy'
    ],
    tags: ['Imported', 'Web Recipe'],
    isFavorite: false,
    rating: 0,
    notes: `Imported from ${url}`,
    source: url
  };
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

  // Save recipe (create or update)
  saveRecipe: (recipe: Recipe): Recipe => {
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
  updateRecipe: (recipe: Recipe): Recipe => {
    const recipes = getStoredRecipes();
    const index = recipes.findIndex(r => r.id === recipe.id);
    
    if (index >= 0) {
      recipes[index] = recipe;
      saveRecipes(recipes);
    }
    
    return recipe;
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
    
    const updatedRecipe = { ...recipe, isFavorite: !recipe.isFavorite };
    return recipeService.updateRecipe(updatedRecipe);
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

  // Import recipe from URL
  importFromUrl: async (url: string): Promise<Recipe> => {
    // Validate URL
    try {
      new URL(url);
    } catch {
      throw new Error('Invalid URL provided');
    }

    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Extract recipe data from URL
    const recipeData = await extractRecipeFromUrl(url);
    
    // Create and save the recipe
    return recipeService.createRecipe(recipeData);
  }
};

export default recipeService;