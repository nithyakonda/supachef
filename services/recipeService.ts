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

// Server-side proxy for fetching external URLs
const fetchWithProxy = async (url: string): Promise<string> => {
  try {
    const response = await fetch('/api/proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Proxy request failed: ${errorText}`);
    }

    const data = await response.json();
    return data.contents;
  } catch (error) {
    console.error('Error fetching with proxy:', error);
    throw new Error('Failed to fetch URL content');
  }
};

// Parse HTML content to extract recipe data
const parseRecipeFromHTML = (html: string, url: string): Omit<Recipe, 'id' | 'createdAt'> => {
  // Create a temporary DOM parser
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Try to extract JSON-LD structured data first
  const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
  for (const script of jsonLdScripts) {
    try {
      const data = JSON.parse(script.textContent || '');
      const recipe = findRecipeInJsonLd(data);
      if (recipe) {
        return recipe;
      }
    } catch (error) {
      console.log('Error parsing JSON-LD:', error);
    }
  }
  
  // Fallback to meta tags and structured markup
  return extractFromMetaTags(doc, url);
};

// Find recipe data in JSON-LD structured data
const findRecipeInJsonLd = (data: any): Omit<Recipe, 'id' | 'createdAt'> | null => {
  // Handle arrays of structured data
  if (Array.isArray(data)) {
    for (const item of data) {
      const recipe = findRecipeInJsonLd(item);
      if (recipe) return recipe;
    }
    return null;
  }
  
  // Check if this is a Recipe type
  if (data['@type'] === 'Recipe' || (Array.isArray(data['@type']) && data['@type'].includes('Recipe'))) {
    return {
      title: data.name || 'Imported Recipe',
      description: data.description || '',
      imageUrl: extractImageUrl(data.image) || 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg',
      cookingTime: parseTime(data.cookTime || data.totalTime) || 30,
      servings: parseInt(data.recipeYield) || 4,
      difficulty: 'Medium' as const,
      calories: extractCalories(data.nutrition) || 0,
      ingredients: parseIngredients(data.recipeIngredient || []),
      instructions: parseInstructions(data.recipeInstructions || []),
      tags: parseTags(data.recipeCategory, data.recipeCuisine, data.keywords),
      isFavorite: false,
      rating: 0,
      notes: `Imported from: ${data.url || 'web'}`,
      source: data.url
    };
  }
  
  // Recursively search in nested objects
  if (typeof data === 'object' && data !== null) {
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const recipe = findRecipeInJsonLd(data[key]);
        if (recipe) return recipe;
      }
    }
  }
  
  return null;
};

// Extract recipe from meta tags and page content
const extractFromMetaTags = (doc: Document, url: string): Omit<Recipe, 'id' | 'createdAt'> => {
  const getMetaContent = (property: string): string => {
    const meta = doc.querySelector(`meta[property="${property}"], meta[name="${property}"]`);
    return meta?.getAttribute('content') || '';
  };
  
  const title = getMetaContent('og:title') || 
                doc.querySelector('title')?.textContent || 
                'Imported Recipe';
  
  const description = getMetaContent('og:description') || 
                     getMetaContent('description') || 
                     '';
  
  const imageUrl = getMetaContent('og:image') || 
                   'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg';
  
  // Try to extract ingredients and instructions from common selectors
  const ingredients = extractIngredientsFromDOM(doc);
  const instructions = extractInstructionsFromDOM(doc);
  
  return {
    title: title.trim(),
    description: description.trim(),
    imageUrl,
    cookingTime: 30,
    servings: 4,
    difficulty: 'Medium',
    calories: 0,
    ingredients,
    instructions,
    tags: ['Imported'],
    isFavorite: false,
    rating: 0,
    notes: `Imported from: ${url}`,
    source: url
  };
};

// Helper functions for parsing structured data
const extractImageUrl = (image: any): string | null => {
  if (typeof image === 'string') return image;
  if (Array.isArray(image) && image.length > 0) {
    return extractImageUrl(image[0]);
  }
  if (typeof image === 'object' && image.url) {
    return image.url;
  }
  return null;
};

const parseTime = (timeStr: string): number => {
  if (!timeStr) return 30;
  
  // Parse ISO 8601 duration (PT30M)
  const match = timeStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (match) {
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    return hours * 60 + minutes;
  }
  
  // Parse simple number
  const numMatch = timeStr.match(/(\d+)/);
  return numMatch ? parseInt(numMatch[1]) : 30;
};

const extractCalories = (nutrition: any): number => {
  if (!nutrition) return 0;
  if (typeof nutrition === 'object' && nutrition.calories) {
    return parseInt(nutrition.calories) || 0;
  }
  return 0;
};

const parseIngredients = (ingredients: any[]): Array<{name: string, amount: string, unit?: string}> => {
  if (!Array.isArray(ingredients)) return [];
  
  return ingredients.map(ingredient => {
    if (typeof ingredient === 'string') {
      // Parse "2 cups flour" format
      const parts = ingredient.trim().split(' ');
      const amount = parts[0];
      const unit = parts[1];
      const name = parts.slice(2).join(' ');
      
      return {
        name: name || ingredient,
        amount: amount || '1',
        unit: unit
      };
    }
    
    if (typeof ingredient === 'object') {
      return {
        name: ingredient.name || ingredient.text || 'Unknown ingredient',
        amount: ingredient.amount || '1',
        unit: ingredient.unit
      };
    }
    
    return { name: 'Unknown ingredient', amount: '1' };
  });
};

const parseInstructions = (instructions: any[]): string[] => {
  if (!Array.isArray(instructions)) return [];
  
  return instructions.map(instruction => {
    if (typeof instruction === 'string') {
      return instruction.trim();
    }
    
    if (typeof instruction === 'object') {
      return instruction.text || instruction.name || 'Follow recipe step';
    }
    
    return 'Follow recipe step';
  }).filter(step => step.length > 0);
};

const parseTags = (...tagSources: any[]): string[] => {
  const tags = new Set<string>();
  
  tagSources.forEach(source => {
    if (typeof source === 'string') {
      tags.add(source);
    } else if (Array.isArray(source)) {
      source.forEach(tag => {
        if (typeof tag === 'string') {
          tags.add(tag);
        }
      });
    }
  });
  
  return Array.from(tags).filter(tag => tag.length > 0);
};

// Extract ingredients from DOM using common selectors
const extractIngredientsFromDOM = (doc: Document): Array<{name: string, amount: string, unit?: string}> => {
  const selectors = [
    '.recipe-ingredient',
    '.ingredient',
    '[class*="ingredient"]',
    '.recipe-ingredients li',
    '.ingredients li'
  ];
  
  for (const selector of selectors) {
    const elements = doc.querySelectorAll(selector);
    if (elements.length > 0) {
      return Array.from(elements).map(el => {
        const text = el.textContent?.trim() || '';
        const parts = text.split(' ');
        const amount = parts[0];
        const unit = parts[1];
        const name = parts.slice(2).join(' ');
        
        return {
          name: name || text,
          amount: amount || '1',
          unit: unit
        };
      });
    }
  }
  
  return [{ name: 'See original recipe for ingredients', amount: '1' }];
};

// Extract instructions from DOM using common selectors
const extractInstructionsFromDOM = (doc: Document): string[] => {
  const selectors = [
    '.recipe-instruction',
    '.instruction',
    '[class*="instruction"]',
    '.recipe-instructions li',
    '.instructions li',
    '.recipe-directions li',
    '.directions li'
  ];
  
  for (const selector of selectors) {
    const elements = doc.querySelectorAll(selector);
    if (elements.length > 0) {
      return Array.from(elements)
        .map(el => el.textContent?.trim() || '')
        .filter(text => text.length > 0);
    }
  }
  
  return ['See original recipe for instructions'];
};

// Extract recipe data from various URL types
const extractRecipeFromUrl = async (url: string): Promise<Omit<Recipe, 'id' | 'createdAt'>> => {
  try {
    // Handle Pinterest URLs specially
    if (url.includes('pinterest.com')) {
      return await extractFromPinterest(url);
    }
    
    // For other sites, fetch and parse HTML
    const html = await fetchWithProxy(url);
    return parseRecipeFromHTML(html, url);
  } catch (error) {
    console.error('Error extracting recipe:', error);
    throw new Error('Failed to extract recipe from URL. Please check the URL and try again.');
  }
};

// Extract recipe from Pinterest
const extractFromPinterest = async (url: string): Promise<Omit<Recipe, 'id' | 'createdAt'>> => {
  try {
    // Fetch Pinterest page content
    const html = await fetchWithProxy(url);
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Pinterest stores data in script tags
    const scripts = doc.querySelectorAll('script');
    let pinterestData: any = null;
    
    for (const script of scripts) {
      const content = script.textContent || '';
      if (content.includes('"Pin"') && content.includes('"description"')) {
        try {
          // Extract JSON data from Pinterest's script tags
          const jsonMatch = content.match(/\{.*"Pin".*\}/);
          if (jsonMatch) {
            pinterestData = JSON.parse(jsonMatch[0]);
            break;
          }
        } catch (e) {
          continue;
        }
      }
    }
    
    if (pinterestData && pinterestData.Pin) {
      const pin = pinterestData.Pin;
      const description = pin.description || '';
      const imageUrl = pin.images?.['736x']?.url || pin.images?.orig?.url || 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg';
      
      // Try to extract recipe info from description
      const title = extractTitleFromDescription(description) || 'Pinterest Recipe';
      const { ingredients, instructions } = parseRecipeFromDescription(description);
      
      return {
        title,
        description: description.substring(0, 200) + (description.length > 200 ? '...' : ''),
        imageUrl,
        cookingTime: 30,
        servings: 4,
        difficulty: 'Medium',
        calories: 0,
        ingredients,
        instructions,
        tags: ['Pinterest', 'Imported'],
        isFavorite: false,
        rating: 0,
        notes: `Imported from Pinterest: ${url}`,
        source: url
      };
    }
    
    // Fallback to meta tag extraction
    return extractFromMetaTags(doc, url);
  } catch (error) {
    console.error('Error extracting from Pinterest:', error);
    
    // Ultimate fallback for Pinterest
    return {
      title: 'Pinterest Recipe',
      description: 'Recipe imported from Pinterest',
      imageUrl: 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg',
      cookingTime: 30,
      servings: 4,
      difficulty: 'Medium',
      calories: 0,
      ingredients: [{ name: 'See original pin for ingredients', amount: '1' }],
      instructions: ['See original pin for instructions'],
      tags: ['Pinterest', 'Imported'],
      isFavorite: false,
      rating: 0,
      notes: `Imported from Pinterest: ${url}`,
      source: url
    };
  }
};

// Helper functions for Pinterest parsing
const extractTitleFromDescription = (description: string): string => {
  // Look for common title patterns in Pinterest descriptions
  const lines = description.split('\n');
  const firstLine = lines[0].trim();
  
  // If first line looks like a title (not too long, has capital letters)
  if (firstLine.length < 100 && /[A-Z]/.test(firstLine)) {
    return firstLine;
  }
  
  // Look for recipe-like patterns
  const recipeMatch = description.match(/^([^.!?]+(?:recipe|dish|meal|food))/i);
  if (recipeMatch) {
    return recipeMatch[1].trim();
  }
  
  return firstLine || 'Pinterest Recipe';
};

const parseRecipeFromDescription = (description: string): {
  ingredients: Array<{name: string, amount: string, unit?: string}>,
  instructions: string[]
} => {
  const lines = description.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  const ingredients: Array<{name: string, amount: string, unit?: string}> = [];
  const instructions: string[] = [];
  
  let currentSection: 'none' | 'ingredients' | 'instructions' = 'none';
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    // Detect section headers
    if (lowerLine.includes('ingredient') || lowerLine.includes('what you need')) {
      currentSection = 'ingredients';
      continue;
    } else if (lowerLine.includes('instruction') || lowerLine.includes('direction') || lowerLine.includes('step')) {
      currentSection = 'instructions';
      continue;
    }
    
    // Parse based on current section
    if (currentSection === 'ingredients' || (currentSection === 'none' && /^\d+/.test(line))) {
      // Looks like an ingredient line
      const parts = line.split(' ');
      const amount = parts[0];
      const unit = parts[1];
      const name = parts.slice(2).join(' ');
      
      ingredients.push({
        name: name || line,
        amount: amount || '1',
        unit: unit
      });
    } else if (currentSection === 'instructions' || (currentSection === 'none' && line.length > 20)) {
      // Looks like an instruction
      instructions.push(line);
    }
  }
  
  // If no structured data found, provide fallback
  if (ingredients.length === 0) {
    ingredients.push({ name: 'See original pin for ingredients', amount: '1' });
  }
  
  if (instructions.length === 0) {
    instructions.push('See original pin for instructions');
  }
  
  return { ingredients, instructions };
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

    // Simulate loading delay for better UX
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Extract recipe data from URL
    const recipeData = await extractRecipeFromUrl(url);
    
    // Create and save the recipe
    return recipeService.createRecipe(recipeData);
  }
};

export default recipeService;