// Enhanced Recipe URL Parser Service
// This service handles parsing recipes from various platforms including YouTube and Pinterest

import { Recipe } from '@/types';

interface ParsedRecipeData extends Omit<Recipe, 'id' | 'createdAt'> {}

// YouTube API configuration
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

// Pinterest API configuration (if available)
const PINTEREST_ACCESS_TOKEN = process.env.PINTEREST_ACCESS_TOKEN;

export class RecipeUrlParser {
  private static instance: RecipeUrlParser;
  
  public static getInstance(): RecipeUrlParser {
    if (!RecipeUrlParser.instance) {
      RecipeUrlParser.instance = new RecipeUrlParser();
    }
    return RecipeUrlParser.instance;
  }

  // Main parsing method that routes to appropriate parser
  async parseRecipeFromUrl(url: string): Promise<ParsedRecipeData> {
    const domain = this.extractDomain(url);
    
    switch (domain) {
      case 'youtube.com':
      case 'youtu.be':
        return await this.parseYouTubeRecipe(url);
      
      case 'pinterest.com':
      case 'pinterest.co.uk':
      case 'pinterest.ca':
        return await this.parsePinterestRecipe(url);
      
      case 'allrecipes.com':
        return await this.parseAllRecipes(url);
      
      case 'foodnetwork.com':
        return await this.parseFoodNetwork(url);
      
      case 'tasteofhome.com':
        return await this.parseTasteOfHome(url);
      
      case 'bbcgoodfood.com':
        return await this.parseBBCGoodFood(url);
      
      default:
        return await this.parseGenericRecipe(url);
    }
  }

  // Extract domain from URL
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '').toLowerCase();
    } catch {
      throw new Error('Invalid URL format');
    }
  }

  // YouTube recipe parsing
  private async parseYouTubeRecipe(url: string): Promise<ParsedRecipeData> {
    const videoId = this.extractYouTubeVideoId(url);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    try {
      // Get video details from YouTube API
      const videoData = await this.fetchYouTubeVideoData(videoId);
      
      // Extract recipe information from video description and title
      const recipeData = this.parseYouTubeVideoData(videoData, url);
      
      return recipeData;
    } catch (error) {
      console.error('Error parsing YouTube recipe:', error);
      throw new Error('Failed to parse YouTube recipe');
    }
  }

  // Extract YouTube video ID from various URL formats
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

  // Fetch YouTube video data using API
  private async fetchYouTubeVideoData(videoId: string) {
    if (!YOUTUBE_API_KEY) {
      throw new Error('YouTube API key not configured');
    }

    const response = await fetch(
      `${YOUTUBE_API_BASE}/videos?part=snippet,contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch YouTube video data');
    }

    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      throw new Error('Video not found');
    }

    return data.items[0];
  }

  // Parse YouTube video data to extract recipe information
  private parseYouTubeVideoData(videoData: any, originalUrl: string): ParsedRecipeData {
    const { snippet, contentDetails } = videoData;
    const title = snippet.title;
    const description = snippet.description;
    const thumbnail = snippet.thumbnails.maxres?.url || 
                     snippet.thumbnails.high?.url || 
                     snippet.thumbnails.medium?.url;
    
    // Parse duration (PT4M13S format)
    const duration = this.parseYouTubeDuration(contentDetails.duration);
    
    // Extract recipe details from description
    const parsedContent = this.parseRecipeFromDescription(description);
    
    // Determine cooking time (use video duration as base, but look for cooking time in description)
    const cookingTime = this.extractCookingTimeFromText(description) || Math.max(duration, 15);
    
    return {
      title: this.cleanRecipeTitle(title),
      description: this.extractRecipeDescription(description),
      imageUrl: thumbnail || 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg',
      cookingTime,
      servings: this.extractServingsFromText(description) || 4,
      difficulty: this.determineDifficulty(description, duration),
      calories: this.extractCaloriesFromText(description) || 0,
      ingredients: parsedContent.ingredients,
      instructions: parsedContent.instructions,
      tags: this.extractTagsFromYouTube(title, description),
      isFavorite: false,
      rating: 0,
      notes: `Imported from YouTube: ${snippet.channelTitle}`,
      source: originalUrl
    };
  }

  // Parse YouTube duration format (PT4M13S)
  private parseYouTubeDuration(duration: string): number {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 30;
    
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    
    return hours * 60 + minutes + (seconds > 30 ? 1 : 0);
  }

  // Pinterest recipe parsing
  private async parsePinterestRecipe(url: string): Promise<ParsedRecipeData> {
    try {
      // Fetch Pinterest page content
      const html = await this.fetchPageContent(url);
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Try to find JSON-LD data first
      const jsonLdData = this.extractJsonLdFromDocument(doc);
      if (jsonLdData) {
        return jsonLdData;
      }
      
      // Fallback to Pinterest-specific parsing
      return await this.parsePinterestSpecific(doc, url);
    } catch (error) {
      console.error('Error parsing Pinterest recipe:', error);
      throw new Error('Failed to parse Pinterest recipe');
    }
  }

  // Pinterest-specific parsing logic
  private async parsePinterestSpecific(doc: Document, url: string): Promise<ParsedRecipeData> {
    // Pinterest stores data in script tags and meta tags
    const title = this.extractMetaContent(doc, 'og:title') || 
                  doc.querySelector('title')?.textContent || 
                  'Pinterest Recipe';
    
    const description = this.extractMetaContent(doc, 'og:description') || '';
    const imageUrl = this.extractMetaContent(doc, 'og:image') || 
                     'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg';
    
    // Try to extract recipe data from Pinterest's script tags
    const scripts = doc.querySelectorAll('script[type="application/json"]');
    let pinterestData: any = null;
    
    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent || '');
        if (data.props?.initialReduxState?.pins) {
          pinterestData = data;
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    const parsedContent = this.parseRecipeFromDescription(description);
    
    return {
      title: this.cleanRecipeTitle(title),
      description: description.substring(0, 300),
      imageUrl,
      cookingTime: this.extractCookingTimeFromText(description) || 30,
      servings: this.extractServingsFromText(description) || 4,
      difficulty: 'Medium',
      calories: this.extractCaloriesFromText(description) || 0,
      ingredients: parsedContent.ingredients,
      instructions: parsedContent.instructions,
      tags: ['Pinterest', 'Imported', ...this.extractTagsFromText(description)],
      isFavorite: false,
      rating: 0,
      notes: `Imported from Pinterest`,
      source: url
    };
  }

  // Generic recipe site parsing (works for most recipe websites)
  private async parseGenericRecipe(url: string): Promise<ParsedRecipeData> {
    try {
      const html = await this.fetchPageContent(url);
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Try JSON-LD structured data first (most reliable)
      const jsonLdData = this.extractJsonLdFromDocument(doc);
      if (jsonLdData) {
        return jsonLdData;
      }
      
      // Fallback to microdata and manual extraction
      return this.extractFromHtmlContent(doc, url);
    } catch (error) {
      console.error('Error parsing generic recipe:', error);
      throw new Error('Failed to parse recipe from URL');
    }
  }

  // Extract JSON-LD structured data
  private extractJsonLdFromDocument(doc: Document): ParsedRecipeData | null {
    const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
    
    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent || '');
        const recipe = this.findRecipeInJsonLd(data);
        if (recipe) return recipe;
      } catch (e) {
        continue;
      }
    }
    
    return null;
  }

  // Find recipe in JSON-LD data structure
  private findRecipeInJsonLd(data: any): ParsedRecipeData | null {
    if (Array.isArray(data)) {
      for (const item of data) {
        const recipe = this.findRecipeInJsonLd(item);
        if (recipe) return recipe;
      }
      return null;
    }
    
    if (data['@type'] === 'Recipe' || (Array.isArray(data['@type']) && data['@type'].includes('Recipe'))) {
      return {
        title: data.name || 'Imported Recipe',
        description: data.description || '',
        imageUrl: this.extractImageUrl(data.image) || 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg',
        cookingTime: this.parseTime(data.cookTime || data.totalTime) || 30,
        servings: this.parseServings(data.recipeYield) || 4,
        difficulty: this.determineDifficultyFromData(data) || 'Medium',
        calories: this.extractCaloriesFromNutrition(data.nutrition) || 0,
        ingredients: this.parseIngredients(data.recipeIngredient || []),
        instructions: this.parseInstructions(data.recipeInstructions || []),
        tags: this.parseTags(data.recipeCategory, data.recipeCuisine, data.keywords),
        isFavorite: false,
        rating: data.aggregateRating?.ratingValue ? Math.round(data.aggregateRating.ratingValue) : 0,
        notes: `Imported from recipe website`,
        source: data.url
      };
    }
    
    // Recursively search nested objects
    if (typeof data === 'object' && data !== null) {
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          const recipe = this.findRecipeInJsonLd(data[key]);
          if (recipe) return recipe;
        }
      }
    }
    
    return null;
  }

  // Utility methods for parsing recipe content
  private parseRecipeFromDescription(description: string): {
    ingredients: Array<{name: string, amount: string, unit?: string}>,
    instructions: string[]
  } {
    const lines = description.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const ingredients: Array<{name: string, amount: string, unit?: string}> = [];
    const instructions: string[] = [];
    
    let currentSection: 'none' | 'ingredients' | 'instructions' = 'none';
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      // Section detection
      if (lowerLine.includes('ingredient') || lowerLine.includes('what you need')) {
        currentSection = 'ingredients';
        continue;
      } else if (lowerLine.includes('instruction') || lowerLine.includes('direction') || lowerLine.includes('method')) {
        currentSection = 'instructions';
        continue;
      }
      
      // Content parsing
      if (this.looksLikeIngredient(line)) {
        const ingredient = this.parseIngredientLine(line);
        ingredients.push(ingredient);
      } else if (this.looksLikeInstruction(line)) {
        instructions.push(line);
      }
    }
    
    // Fallback if no structured content found
    if (ingredients.length === 0) {
      ingredients.push({ name: 'See original recipe for ingredients', amount: '1' });
    }
    if (instructions.length === 0) {
      instructions.push('See original recipe for instructions');
    }
    
    return { ingredients, instructions };
  }

  // Helper methods
  private looksLikeIngredient(line: string): boolean {
    return /^\d+/.test(line) || 
           /cup|tsp|tbsp|oz|lb|gram|kg|ml|liter/.test(line.toLowerCase()) ||
           line.includes('•') || line.includes('-');
  }

  private looksLikeInstruction(line: string): boolean {
    return line.length > 20 && 
           /^(\d+\.|\d+\)|\w+)/.test(line) &&
           !/^\d+\s*(cup|tsp|tbsp|oz|lb|gram|kg|ml|liter)/.test(line.toLowerCase());
  }

  private parseIngredientLine(line: string): {name: string, amount: string, unit?: string} {
    // Remove bullet points and numbering
    const cleaned = line.replace(/^[-•\d+\.)\s]+/, '').trim();
    
    // Try to parse "amount unit ingredient" format
    const parts = cleaned.split(' ');
    const amount = parts[0];
    const unit = parts[1];
    const name = parts.slice(2).join(' ');
    
    if (name && /^\d/.test(amount)) {
      return { name, amount, unit };
    }
    
    return { name: cleaned, amount: '1' };
  }

  private extractCookingTimeFromText(text: string): number | null {
    const timePatterns = [
      /(\d+)\s*(?:hours?|hrs?|h)\s*(?:(\d+)\s*(?:minutes?|mins?|m))?/i,
      /(\d+)\s*(?:minutes?|mins?|m)/i,
      /cook.*?(\d+)\s*(?:minutes?|mins?)/i,
      /prep.*?(\d+)\s*(?:minutes?|mins?)/i
    ];
    
    for (const pattern of timePatterns) {
      const match = text.match(pattern);
      if (match) {
        const hours = parseInt(match[1]) || 0;
        const minutes = parseInt(match[2]) || 0;
        return match[2] ? hours * 60 + minutes : (hours > 24 ? hours : hours * 60);
      }
    }
    
    return null;
  }

  private extractServingsFromText(text: string): number | null {
    const servingPatterns = [
      /serves?:?\s*(\d+)/i,
      /yield:?\s*(\d+)/i,
      /makes?:?\s*(\d+)/i,
      /(\d+)\s*servings?/i,
      /(\d+)\s*portions?/i
    ];
    
    for (const pattern of servingPatterns) {
      const match = text.match(pattern);
      if (match) {
        return parseInt(match[1]);
      }
    }
    
    return null;
  }

  private extractCaloriesFromText(text: string): number | null {
    const caloriePatterns = [
      /(\d+)\s*calories?/i,
      /calories?:?\s*(\d+)/i,
      /(\d+)\s*kcal/i
    ];
    
    for (const pattern of caloriePatterns) {
      const match = text.match(pattern);
      if (match) {
        return parseInt(match[1]);
      }
    }
    
    return null;
  }

  private extractTagsFromYouTube(title: string, description: string): string[] {
    const tags = new Set<string>();
    const text = `${title} ${description}`.toLowerCase();
    
    // Common recipe keywords
    const keywords = [
      'recipe', 'cooking', 'baking', 'healthy', 'easy', 'quick', 'homemade',
      'vegetarian', 'vegan', 'gluten-free', 'keto', 'low-carb', 'dessert',
      'breakfast', 'lunch', 'dinner', 'snack', 'appetizer', 'main course'
    ];
    
    keywords.forEach(keyword => {
      if (text.includes(keyword)) {
        tags.add(keyword.charAt(0).toUpperCase() + keyword.slice(1));
      }
    });
    
    tags.add('YouTube');
    return Array.from(tags);
  }

  private extractTagsFromText(text: string): string[] {
    const tags = new Set<string>();
    const keywords = [
      'healthy', 'easy', 'quick', 'vegetarian', 'vegan', 'gluten-free',
      'keto', 'low-carb', 'dessert', 'comfort food', 'spicy', 'sweet'
    ];
    
    const lowerText = text.toLowerCase();
    keywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        tags.add(keyword.charAt(0).toUpperCase() + keyword.slice(1));
      }
    });
    
    return Array.from(tags);
  }

  private cleanRecipeTitle(title: string): string {
    // Remove common YouTube and Pinterest suffixes
    return title
      .replace(/\s*\|\s*.*$/, '') // Remove "| Channel Name"
      .replace(/\s*-\s*YouTube$/, '')
      .replace(/\s*#\w+/g, '') // Remove hashtags
      .trim();
  }

  private extractRecipeDescription(text: string): string {
    const lines = text.split('\n');
    const firstParagraph = lines.find(line => 
      line.length > 50 && 
      !line.toLowerCase().includes('subscribe') &&
      !line.toLowerCase().includes('follow') &&
      !line.includes('http')
    );
    
    return firstParagraph?.substring(0, 200) || text.substring(0, 200);
  }

  private determineDifficulty(description: string, duration: number): 'Easy' | 'Medium' | 'Hard' {
    const text = description.toLowerCase();
    
    if (text.includes('easy') || text.includes('simple') || text.includes('quick') || duration < 30) {
      return 'Easy';
    } else if (text.includes('advanced') || text.includes('complex') || duration > 120) {
      return 'Hard';
    } else {
      return 'Medium';
    }
  }

  // Additional helper methods for generic parsing
  private async fetchPageContent(url: string): Promise<string> {
    // This should be implemented server-side
    const response = await fetch('/api/fetch-recipe-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch page content');
    }
    
    const data = await response.json();
    return data.content;
  }

  private extractMetaContent(doc: Document, property: string): string {
    const meta = doc.querySelector(`meta[property="${property}"], meta[name="${property}"]`);
    return meta?.getAttribute('content') || '';
  }

  private extractFromHtmlContent(doc: Document, url: string): ParsedRecipeData {
    // Implement HTML content extraction logic
    const title = this.extractMetaContent(doc, 'og:title') || 
                  doc.querySelector('h1')?.textContent || 
                  'Imported Recipe';
    
    const description = this.extractMetaContent(doc, 'og:description') || '';
    const imageUrl = this.extractMetaContent(doc, 'og:image') || 
                     'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg';
    
    return {
      title: this.cleanRecipeTitle(title),
      description,
      imageUrl,
      cookingTime: 30,
      servings: 4,
      difficulty: 'Medium',
      calories: 0,
      ingredients: [{ name: 'See original recipe for ingredients', amount: '1' }],
      instructions: ['See original recipe for instructions'],
      tags: ['Imported'],
      isFavorite: false,
      rating: 0,
      notes: `Imported from website`,
      source: url
    };
  }

  // Implement remaining utility methods...
  private extractImageUrl(image: any): string | null {
    if (typeof image === 'string') return image;
    if (Array.isArray(image) && image.length > 0) return this.extractImageUrl(image[0]);
    if (typeof image === 'object' && image?.url) return image.url;
    return null;
  }

  private parseTime(timeStr: string): number {
    if (!timeStr) return 30;
    const match = timeStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (match) {
      const hours = parseInt(match[1] || '0');
      const minutes = parseInt(match[2] || '0');
      return hours * 60 + minutes;
    }
    return 30;
  }

  private parseServings(recipeYield: any): number {
    if (typeof recipeYield === 'number') return recipeYield;
    if (typeof recipeYield === 'string') {
      const match = recipeYield.match(/(\d+)/);
      return match ? parseInt(match[1]) : 4;
    }
    return 4;
  }

  private determineDifficultyFromData(data: any): 'Easy' | 'Medium' | 'Hard' {
    // Analyze complexity based on ingredient count, cook time, etc.
    const ingredientCount = data.recipeIngredient?.length || 0;
    const totalTime = this.parseTime(data.totalTime || data.cookTime);
    
    if (ingredientCount <= 5 && totalTime <= 30) return 'Easy';
    if (ingredientCount >= 15 || totalTime >= 120) return 'Hard';
    return 'Medium';
  }

  private extractCaloriesFromNutrition(nutrition: any): number {
    if (!nutrition) return 0;
    if (typeof nutrition === 'object' && nutrition.calories) {
      return parseInt(nutrition.calories) || 0;
    }
    return 0;
  }

  private parseIngredients(ingredients: any[]): Array<{name: string, amount: string, unit?: string}> {
    if (!Array.isArray(ingredients)) return [];
    
    return ingredients.map(ingredient => {
      if (typeof ingredient === 'string') {
        return this.parseIngredientLine(ingredient);
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
  }

  private parseInstructions(instructions: any[]): string[] {
    if (!Array.isArray(instructions)) return [];
    
    return instructions.map(instruction => {
      if (typeof instruction === 'string') return instruction.trim();
      if (typeof instruction === 'object') {
        return instruction.text || instruction.name || 'Follow recipe step';
      }
      return 'Follow recipe step';
    }).filter(step => step.length > 0);
  }

  private parseTags(...tagSources: any[]): string[] {
    const tags = new Set<string>();
    
    tagSources.forEach(source => {
      if (typeof source === 'string') {
        tags.add(source);
      } else if (Array.isArray(source)) {
        source.forEach(tag => {
          if (typeof tag === 'string') tags.add(tag);
        });
      }
    });
    
    return Array.from(tags).filter(tag => tag.length > 0);
  }
}

// Export singleton instance
export const recipeUrlParser = RecipeUrlParser.getInstance();