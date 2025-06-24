// Client-side recipe parser that works without an API endpoint
// This version works entirely in the browser for development/testing

import { Recipe } from '@/types';

interface ParsedRecipeData extends Omit<Recipe, 'id' | 'createdAt'> {}

class ClientSideRecipeParser {
  private static instance: ClientSideRecipeParser;
  
  public static getInstance(): ClientSideRecipeParser {
    if (!ClientSideRecipeParser.instance) {
      ClientSideRecipeParser.instance = new ClientSideRecipeParser();
    }
    return ClientSideRecipeParser.instance;
  }

  // Main parsing method
  async parseRecipeFromUrl(url: string, onProgress?: (status: string) => void): Promise<ParsedRecipeData> {
    onProgress?.('Analyzing URL...');
    await this.delay(500);

    const domain = this.extractDomain(url);
    
    onProgress?.('Processing recipe data...');
    await this.delay(1000);

    // Since we can't fetch external content directly in the browser due to CORS,
    // we'll create intelligent mock recipes based on the URL structure
    const recipeData = await this.createIntelligentMockRecipe(url, domain);
    
    onProgress?.('Finalizing recipe...');
    await this.delay(500);

    return recipeData;
  }

  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '').toLowerCase();
    } catch {
      throw new Error('Invalid URL format');
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async createIntelligentMockRecipe(url: string, domain: string): Promise<ParsedRecipeData> {
    // Extract information from the URL itself
    const urlInfo = this.analyzeUrl(url);
    
    switch (domain) {
      case 'youtube.com':
      case 'youtu.be':
        return this.createYouTubeMockRecipe(url, urlInfo);
      
      case 'pinterest.com':
      case 'pinterest.co.uk':
      case 'pinterest.ca':
        return this.createPinterestMockRecipe(url, urlInfo);
      
      case 'allrecipes.com':
        return this.createAllRecipesMockRecipe(url, urlInfo);
      
      case 'foodnetwork.com':
        return this.createFoodNetworkMockRecipe(url, urlInfo);
      
      case 'tasteofhome.com':
        return this.createTasteOfHomeMockRecipe(url, urlInfo);
      
      case 'bbcgoodfood.com':
        return this.createBBCGoodFoodMockRecipe(url, urlInfo);
      
      default:
        return this.createGenericMockRecipe(url, urlInfo);
    }
  }

  private analyzeUrl(url: string): { keywords: string[], recipeHints: string[] } {
    const urlLower = url.toLowerCase();
    const pathParts = new URL(url).pathname.split('/').filter(part => part.length > 0);
    
    // Common recipe keywords
    const recipeKeywords = [
      'recipe', 'cooking', 'baking', 'food', 'kitchen', 'chef', 'cook',
      'pasta', 'chicken', 'beef', 'fish', 'vegetarian', 'vegan', 'salad',
      'soup', 'dessert', 'cake', 'bread', 'pizza', 'burger', 'sandwich',
      'breakfast', 'lunch', 'dinner', 'snack', 'healthy', 'quick', 'easy'
    ];

    const foundKeywords = recipeKeywords.filter(keyword => urlLower.includes(keyword));
    const recipeHints = pathParts.filter(part => 
      recipeKeywords.some(keyword => part.includes(keyword)) || 
      part.length > 3
    );

    return { keywords: foundKeywords, recipeHints };
  }

  private createYouTubeMockRecipe(url: string, urlInfo: any): ParsedRecipeData {
    const videoId = this.extractYouTubeVideoId(url);
    const title = this.generateTitle('YouTube', urlInfo.keywords, [
      'Easy Homemade Pasta Recipe',
      'Perfect Chocolate Chip Cookies',
      'Quick Chicken Stir Fry',
      'Fluffy Pancakes from Scratch',
      'Creamy Mushroom Risotto'
    ]);

    return {
      title,
      description: 'A delicious recipe imported from a YouTube cooking video. This recipe has been carefully curated from the video content.',
      imageUrl: 'https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg',
      cookingTime: this.getRandomCookingTime(),
      servings: this.getRandomServings(),
      difficulty: this.getRandomDifficulty(),
      calories: this.getRandomCalories(),
      ingredients: this.generateIngredients(urlInfo.keywords),
      instructions: this.generateInstructions('YouTube video'),
      tags: ['YouTube', 'Video Recipe', ...this.generateTags(urlInfo.keywords)],
      isFavorite: false,
      rating: Math.floor(Math.random() * 2) + 4, // 4 or 5 stars
      notes: `Imported from YouTube video: ${videoId || 'cooking video'}`,
      source: url
    };
  }

  private createPinterestMockRecipe(url: string, urlInfo: any): ParsedRecipeData {
    const title = this.generateTitle('Pinterest', urlInfo.keywords, [
      'Pinterest-Perfect Avocado Toast',
      'Instagrammable Rainbow Smoothie Bowl',
      'Easy 3-Ingredient Cookies',
      'No-Bake Chocolate Truffles',
      'Colorful Buddha Bowl'
    ]);

    return {
      title,
      description: 'A beautiful and delicious recipe discovered on Pinterest. Perfect for sharing and sure to impress!',
      imageUrl: 'https://images.pexels.com/photos/1640773/pexels-photo-1640773.jpeg',
      cookingTime: this.getRandomCookingTime(),
      servings: this.getRandomServings(),
      difficulty: 'Easy',
      calories: this.getRandomCalories(),
      ingredients: this.generateIngredients(urlInfo.keywords),
      instructions: this.generateInstructions('Pinterest recipe'),
      tags: ['Pinterest', 'Visual Recipe', 'Instagram-worthy', ...this.generateTags(urlInfo.keywords)],
      isFavorite: false,
      rating: Math.floor(Math.random() * 2) + 4,
      notes: 'Imported from Pinterest - known for beautiful presentation!',
      source: url
    };
  }

  private createAllRecipesMockRecipe(url: string, urlInfo: any): ParsedRecipeData {
    const title = this.generateTitle('AllRecipes', urlInfo.keywords, [
      'Classic Beef Stew',
      'Grandma\'s Apple Pie',
      'Traditional Meatloaf',
      'Homestyle Fried Chicken',
      'Old-Fashioned Cornbread'
    ]);

    return {
      title,
      description: 'A tried-and-true recipe from AllRecipes, tested by home cooks and rated highly by the community.',
      imageUrl: 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg',
      cookingTime: this.getRandomCookingTime(),
      servings: this.getRandomServings(),
      difficulty: this.getRandomDifficulty(),
      calories: this.getRandomCalories(),
      ingredients: this.generateIngredients(urlInfo.keywords),
      instructions: this.generateInstructions('AllRecipes community'),
      tags: ['AllRecipes', 'Community Tested', 'Traditional', ...this.generateTags(urlInfo.keywords)],
      isFavorite: false,
      rating: Math.floor(Math.random() * 2) + 4,
      notes: 'Imported from AllRecipes - community-tested and approved!',
      source: url
    };
  }

  private createFoodNetworkMockRecipe(url: string, urlInfo: any): ParsedRecipeData {
    const title = this.generateTitle('Food Network', urlInfo.keywords, [
      'Chef\'s Special Risotto',
      'Gourmet Beef Wellington',
      'Professional Pizza Dough',
      'Restaurant-Style Pasta',
      'TV Chef\'s Signature Dish'
    ]);

    return {
      title,
      description: 'A professional recipe from Food Network, created by renowned chefs and food experts.',
      imageUrl: 'https://images.pexels.com/photos/1640775/pexels-photo-1640775.jpeg',
      cookingTime: this.getRandomCookingTime(45, 120),
      servings: this.getRandomServings(),
      difficulty: Math.random() > 0.5 ? 'Medium' : 'Hard',
      calories: this.getRandomCalories(),
      ingredients: this.generateIngredients(urlInfo.keywords, true),
      instructions: this.generateInstructions('Food Network chef'),
      tags: ['Food Network', 'Professional', 'Chef Recipe', ...this.generateTags(urlInfo.keywords)],
      isFavorite: false,
      rating: 5, // Food Network recipes are typically high quality
      notes: 'Imported from Food Network - professional chef quality!',
      source: url
    };
  }

  private createTasteOfHomeMockRecipe(url: string, urlInfo: any): ParsedRecipeData {
    const title = this.generateTitle('Taste of Home', urlInfo.keywords, [
      'Comfort Food Casserole',
      'Family-Style Pot Roast',
      'Homemade Dinner Rolls',
      'Country Kitchen Pie',
      'Sunday Dinner Special'
    ]);

    return {
      title,
      description: 'A comforting, family-friendly recipe from Taste of Home, perfect for bringing loved ones together.',
      imageUrl: 'https://images.pexels.com/photos/1640776/pexels-photo-1640776.jpeg',
      cookingTime: this.getRandomCookingTime(),
      servings: this.getRandomServings(4, 8),
      difficulty: Math.random() > 0.7 ? 'Medium' : 'Easy',
      calories: this.getRandomCalories(),
      ingredients: this.generateIngredients(urlInfo.keywords),
      instructions: this.generateInstructions('Taste of Home kitchen'),
      tags: ['Taste of Home', 'Family Recipe', 'Comfort Food', ...this.generateTags(urlInfo.keywords)],
      isFavorite: false,
      rating: Math.floor(Math.random() * 2) + 4,
      notes: 'Imported from Taste of Home - perfect for family meals!',
      source: url
    };
  }

  private createBBCGoodFoodMockRecipe(url: string, urlInfo: any): ParsedRecipeData {
    const title = this.generateTitle('BBC Good Food', urlInfo.keywords, [
      'British Classic Shepherd\'s Pie',
      'Mediterranean Herb Chicken',
      'Seasonal Vegetable Soup',
      'Traditional Fish and Chips',
      'European-Style Pasta'
    ]);

    return {
      title,
      description: 'A carefully crafted recipe from BBC Good Food, featuring fresh ingredients and clear instructions.',
      imageUrl: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
      cookingTime: this.getRandomCookingTime(),
      servings: this.getRandomServings(),
      difficulty: this.getRandomDifficulty(),
      calories: this.getRandomCalories(),
      ingredients: this.generateIngredients(urlInfo.keywords),
      instructions: this.generateInstructions('BBC Good Food kitchen'),
      tags: ['BBC Good Food', 'British', 'Tested Recipe', ...this.generateTags(urlInfo.keywords)],
      isFavorite: false,
      rating: Math.floor(Math.random() * 2) + 4,
      notes: 'Imported from BBC Good Food - thoroughly tested and reliable!',
      source: url
    };
  }

  private createGenericMockRecipe(url: string, urlInfo: any): ParsedRecipeData {
    const title = this.generateTitle('Recipe Website', urlInfo.keywords, [
      'Delicious Homemade Recipe',
      'Easy Weeknight Dinner',
      'Quick and Tasty Meal',
      'Healthy Family Recipe',
      'Simple Comfort Food'
    ]);

    return {
      title,
      description: 'A wonderful recipe imported from a recipe website, ready to try in your kitchen.',
      imageUrl: 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg',
      cookingTime: this.getRandomCookingTime(),
      servings: this.getRandomServings(),
      difficulty: this.getRandomDifficulty(),
      calories: this.getRandomCalories(),
      ingredients: this.generateIngredients(urlInfo.keywords),
      instructions: this.generateInstructions('recipe website'),
      tags: ['Imported', 'Web Recipe', ...this.generateTags(urlInfo.keywords)],
      isFavorite: false,
      rating: Math.floor(Math.random() * 3) + 3, // 3-5 stars
      notes: `Imported from: ${new URL(url).hostname}`,
      source: url
    };
  }

  // Helper methods
  private extractYouTubeVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    
    return null;
  }

  private generateTitle(source: string, keywords: string[], defaults: string[]): string {
    // Try to create a title based on keywords
    if (keywords.length > 0) {
      const mainKeyword = keywords[0];
      const recipes = {
        'pasta': 'Creamy Pasta Delight',
        'chicken': 'Juicy Chicken Recipe',
        'beef': 'Savory Beef Dish',
        'fish': 'Fresh Fish Recipe',
        'vegetarian': 'Vegetarian Delight',
        'vegan': 'Plant-Based Recipe',
        'salad': 'Fresh Garden Salad',
        'soup': 'Hearty Homemade Soup',
        'dessert': 'Sweet Dessert Recipe',
        'cake': 'Delicious Cake Recipe',
        'bread': 'Fresh Baked Bread',
        'pizza': 'Homemade Pizza',
        'burger': 'Gourmet Burger',
        'sandwich': 'Perfect Sandwich'
      };
      
      if (recipes[mainKeyword]) {
        return recipes[mainKeyword];
      }
    }
    
    // Return a random default title
    return defaults[Math.floor(Math.random() * defaults.length)];
  }

  private getRandomCookingTime(min: number = 15, max: number = 90): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private getRandomServings(min: number = 2, max: number = 6): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private getRandomDifficulty(): 'Easy' | 'Medium' | 'Hard' {
    const difficulties = ['Easy', 'Medium', 'Hard'];
    const weights = [0.5, 0.35, 0.15]; // 50% Easy, 35% Medium, 15% Hard
    const random = Math.random();
    
    if (random < weights[0]) return 'Easy';
    if (random < weights[0] + weights[1]) return 'Medium';
    return 'Hard';
  }

  private getRandomCalories(): number {
    return Math.floor(Math.random() * 500) + 150; // 150-650 calories
  }

  private generateIngredients(keywords: string[], gourmet: boolean = false): Array<{name: string, amount: string, unit?: string}> {
    const baseIngredients = [
      { name: 'olive oil', amount: '2', unit: 'tablespoons' },
      { name: 'salt', amount: '1', unit: 'teaspoon' },
      { name: 'black pepper', amount: '1/2', unit: 'teaspoon' },
      { name: 'garlic', amount: '2', unit: 'cloves' },
      { name: 'onion', amount: '1', unit: 'medium' }
    ];

    const keywordIngredients = {
      'pasta': [
        { name: 'pasta', amount: '12', unit: 'oz' },
        { name: 'parmesan cheese', amount: '1/2', unit: 'cup' },
        { name: 'heavy cream', amount: '1', unit: 'cup' }
      ],
      'chicken': [
        { name: 'chicken breast', amount: '4', unit: 'pieces' },
        { name: 'chicken broth', amount: '2', unit: 'cups' }
      ],
      'beef': [
        { name: 'ground beef', amount: '1', unit: 'lb' },
        { name: 'beef broth', amount: '2', unit: 'cups' }
      ],
      'vegetarian': [
        { name: 'vegetables', amount: '2', unit: 'cups' },
        { name: 'vegetable broth', amount: '2', unit: 'cups' }
      ],
      'dessert': [
        { name: 'sugar', amount: '1', unit: 'cup' },
        { name: 'butter', amount: '1/2', unit: 'cup' },
        { name: 'eggs', amount: '2', unit: 'large' }
      ]
    };

    let ingredients = [...baseIngredients];
    
    keywords.forEach(keyword => {
      if (keywordIngredients[keyword]) {
        ingredients.push(...keywordIngredients[keyword]);
      }
    });

    if (gourmet) {
      ingredients.push(
        { name: 'fresh herbs', amount: '2', unit: 'tablespoons' },
        { name: 'wine', amount: '1/4', unit: 'cup' }
      );
    }

    // Remove duplicates and limit to 8 ingredients
    const uniqueIngredients = ingredients.filter((ingredient, index, self) => 
      index === self.findIndex(i => i.name === ingredient.name)
    );
    
    return uniqueIngredients.slice(0, 8);
  }

  private generateInstructions(source: string): string[] {
    const baseInstructions = [
      'Preheat your oven to 375°F (190°C) if needed.',
      'Prepare all ingredients by washing, chopping, and measuring as needed.',
      'Heat oil in a large pan or pot over medium heat.',
      'Add aromatics (onion, garlic) and cook until fragrant, about 2-3 minutes.',
      'Add main ingredients and cook according to recipe requirements.',
      'Season with salt, pepper, and other spices to taste.',
      'Continue cooking until ingredients are properly cooked through.',
      'Taste and adjust seasoning as needed.',
      'Remove from heat and let rest for a few minutes before serving.',
      'Serve hot and enjoy your delicious homemade meal!'
    ];

    // Customize based on source
    if (source.includes('YouTube')) {
      baseInstructions[0] = 'Watch the video for visual guidance, then preheat oven if needed.';
    } else if (source.includes('Pinterest')) {
      baseInstructions.push('Take a beautiful photo for your social media before serving!');
    }

    return baseInstructions.slice(0, Math.floor(Math.random() * 3) + 6); // 6-8 steps
  }

  private generateTags(keywords: string[]): string[] {
    const baseTags = ['Homemade', 'Delicious'];
    const additionalTags = ['Quick', 'Easy', 'Healthy', 'Comfort Food', 'Family Friendly'];
    
    const tags = [...baseTags];
    
    // Add keyword-based tags
    keywords.forEach(keyword => {
      const capitalizedKeyword = keyword.charAt(0).toUpperCase() + keyword.slice(1);
      if (!tags.includes(capitalizedKeyword)) {
        tags.push(capitalizedKeyword);
      }
    });
    
    // Add some random additional tags
    const randomTags = additionalTags
      .sort(() => 0.5 - Math.random())
      .slice(0, 2);
    
    tags.push(...randomTags);
    
    return tags.slice(0, 6); // Limit to 6 tags
  }

  // Check if URL is supported (for UI feedback)
  isSupportedUrl(url: string): boolean {
    try {
      const domain = new URL(url).hostname.replace('www.', '').toLowerCase();
      const supportedDomains = [
        'youtube.com', 'youtu.be', 'pinterest.com', 'allrecipes.com',
        'foodnetwork.com', 'tasteofhome.com', 'bbcgoodfood.com',
        'food.com', 'epicurious.com', 'delish.com', 'bonappetit.com',
        'seriouseats.com', 'kingarthurbaking.com'
      ];
      
      return supportedDomains.some(supportedDomain => 
        domain === supportedDomain || domain.endsWith('.' + supportedDomain)
      );
    } catch {
      return false;
    }
  }

  // Get supported domains list
  getSupportedDomains(): string[] {
    return [
      'YouTube (youtube.com, youtu.be)',
      'Pinterest (pinterest.com)',
      'AllRecipes (allrecipes.com)',
      'Food Network (foodnetwork.com)',
      'Taste of Home (tasteofhome.com)',
      'BBC Good Food (bbcgoodfood.com)',
      'Food.com',
      'Epicurious (epicurious.com)',
      'Delish (delish.com)',
      'Bon Appétit (bonappetit.com)',
      'Serious Eats (seriouseats.com)',
      'King Arthur Baking (kingarthurbaking.com)'
    ];
  }
}

// Export singleton instance
export const clientSideRecipeParser = ClientSideRecipeParser.getInstance();