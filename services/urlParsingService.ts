// Updated URL parsing service that uses real metadata extraction

import { Recipe } from '@/types';
import { metadataExtractor, MetadataExtractionResult } from './metadataExtractor';
import { ParsedMetadata } from './parsers/baseParser';

interface ParsedRecipeData extends Omit<Recipe, 'id' | 'createdAt'> {}

class RealUrlParsingService {
  private static instance: RealUrlParsingService;
  
  public static getInstance(): RealUrlParsingService {
    if (!RealUrlParsingService.instance) {
      RealUrlParsingService.instance = new RealUrlParsingService();
    }
    return RealUrlParsingService.instance;
  }

  /**
   * Parse a recipe from a URL using real metadata extraction
   * @param url The URL to parse
   * @param onProgress Optional progress callback
   * @returns Promise with parsed recipe data
   */
  async parseRecipeFromUrl(
    url: string, 
    onProgress?: (status: string) => void
  ): Promise<ParsedRecipeData> {
    try {
      // Validate URL
      new URL(url);
    } catch {
      throw new Error('Invalid URL format');
    }

    onProgress?.('Starting recipe extraction...');

    // Extract metadata using the metadata extractor
    const result: MetadataExtractionResult = await metadataExtractor.extractMetadata(url, onProgress);

    if (!result.success || !result.metadata) {
      throw new Error(result.error || 'Failed to extract recipe metadata');
    }

    onProgress?.('Converting to recipe format...');

    // Convert metadata to recipe format
    const recipeData = this.convertMetadataToRecipe(result.metadata);

    onProgress?.('Recipe extraction complete!');

    return recipeData;
  }

  /**
   * Check if a URL is supported for parsing
   * @param url The URL to check
   * @returns boolean indicating support
   */
  isSupportedUrl(url: string): boolean {
    return metadataExtractor.isSupportedUrl(url);
  }

  /**
   * Get list of supported domains
   * @returns Array of supported domain descriptions
   */
  getSupportedDomains(): string[] {
    return metadataExtractor.getSupportedDomains();
  }

  /**
   * Convert parsed metadata to recipe format
   * @param metadata The parsed metadata
   * @returns Recipe data
   */
  private convertMetadataToRecipe(metadata: ParsedMetadata): ParsedRecipeData {
    // Convert ingredients from strings to ingredient objects
    const ingredients = this.parseIngredients(metadata.ingredients || []);

    // Parse instructions (they might come as a single string or array)
    const instructions = this.parseInstructions(metadata);

    // Determine cooking time in minutes
    const cookingTime = this.parseCookingTime(metadata.cookTime);

    // Parse servings
    const servings = this.parseServings(metadata.servings);

    // Determine difficulty
    const difficulty = this.parseDifficulty(metadata.difficulty);

    // Parse calories (if available)
    const calories = this.parseCalories(metadata);

    return {
      title: metadata.title || 'Imported Recipe',
      description: metadata.description || `Recipe imported from ${metadata.siteName}`,
      imageUrl: metadata.imageUrl || 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg',
      cookingTime,
      servings,
      difficulty,
      calories,
      ingredients,
      instructions,
      tags: this.generateTags(metadata),
      source: metadata.originalUrl,
      rating: metadata.rating ? Math.round(metadata.rating) : undefined,
      notes: this.generateNotes(metadata),
      isFavorite: false,
    };
  }

  /**
   * Parse ingredients from string array to ingredient objects
   */
  private parseIngredients(ingredientStrings: string[]): Array<{name: string, amount: string, unit?: string}> {
    if (!ingredientStrings || ingredientStrings.length === 0) {
      return [{ name: 'See original recipe for ingredients', amount: '1' }];
    }

    return ingredientStrings.map(ingredient => {
      // Try to parse amount, unit, and name from ingredient string
      const parsed = this.parseIngredientString(ingredient);
      return parsed;
    });
  }

  /**
   * Parse a single ingredient string into components
   */
  private parseIngredientString(ingredient: string): {name: string, amount: string, unit?: string} {
    // Common patterns for ingredient parsing
    const patterns = [
      // "2 cups flour" or "1 tablespoon olive oil"
      /^(\d+(?:\/\d+)?(?:\.\d+)?)\s+(\w+)\s+(.+)$/,
      // "1/2 cup sugar"
      /^(\d+\/\d+)\s+(\w+)\s+(.+)$/,
      // "2-3 cloves garlic"
      /^(\d+(?:-\d+)?)\s+(\w+)\s+(.+)$/,
      // "1 large onion"
      /^(\d+)\s+(large|medium|small)?\s*(.+)$/,
    ];

    for (const pattern of patterns) {
      const match = ingredient.match(pattern);
      if (match) {
        const [, amount, unit, name] = match;
        
        // Check if unit is actually a size descriptor
        const sizeDescriptors = ['large', 'medium', 'small'];
        if (sizeDescriptors.includes(unit?.toLowerCase())) {
          return {
            name: `${unit} ${name}`.trim(),
            amount: amount,
          };
        }
        
        return {
          name: name.trim(),
          amount: amount,
          unit: unit,
        };
      }
    }

    // If no pattern matches, try to extract just a number at the beginning
    const numberMatch = ingredient.match(/^(\d+(?:\/\d+)?(?:\.\d+)?)\s*(.+)$/);
    if (numberMatch) {
      return {
        name: numberMatch[2].trim(),
        amount: numberMatch[1],
      };
    }

    // Fallback: treat entire string as ingredient name with amount 1
    return {
      name: ingredient.trim(),
      amount: '1',
    };
  }

  /**
   * Parse instructions from metadata
   */
  private parseInstructions(metadata: ParsedMetadata): string[] {
    // Instructions might be in the description or we might need to provide generic ones
    const defaultInstructions = [
      'Prepare all ingredients according to the original recipe.',
      'Follow the cooking method described in the source recipe.',
      'Cook until done according to the original instructions.',
      'Serve as directed in the original recipe.',
    ];

    // If we have specific instructions from JSON-LD, they would be parsed by individual parsers
    // For now, return default instructions with a note to check the source
    return [
      'Please refer to the original recipe for detailed cooking instructions.',
      `Original recipe can be found at: ${metadata.originalUrl}`,
      ...defaultInstructions,
    ];
  }

  /**
   * Parse cooking time from string to minutes
   */
  private parseCookingTime(cookTime?: string): number {
    if (!cookTime) return 30; // Default 30 minutes

    // Extract numbers and time units
    const hourMatch = cookTime.match(/(\d+)\s*h/i);
    const minuteMatch = cookTime.match(/(\d+)\s*m/i);

    let totalMinutes = 0;
    
    if (hourMatch) {
      totalMinutes += parseInt(hourMatch[1]) * 60;
    }
    
    if (minuteMatch) {
      totalMinutes += parseInt(minuteMatch[1]);
    }

    // If no time units found, try to extract just a number and assume minutes
    if (totalMinutes === 0) {
      const numberMatch = cookTime.match(/(\d+)/);
      if (numberMatch) {
        totalMinutes = parseInt(numberMatch[1]);
        // If the number is very large, it might be in seconds
        if (totalMinutes > 300) {
          totalMinutes = Math.round(totalMinutes / 60);
        }
      }
    }

    return totalMinutes > 0 ? totalMinutes : 30;
  }

  /**
   * Parse servings from string to number
   */
  private parseServings(servingsStr?: string): number {
    if (!servingsStr) return 4; // Default 4 servings

    const match = servingsStr.match(/(\d+)/);
    return match ? parseInt(match[1]) : 4;
  }

  /**
   * Parse difficulty level
   */
  private parseDifficulty(difficulty?: string): 'Easy' | 'Medium' | 'Hard' {
    if (!difficulty) return 'Medium';

    const lower = difficulty.toLowerCase();
    if (lower.includes('easy') || lower.includes('simple') || lower.includes('quick')) {
      return 'Easy';
    } else if (lower.includes('hard') || lower.includes('difficult') || lower.includes('challenging') || lower.includes('advanced')) {
      return 'Hard';
    } else {
      return 'Medium';
    }
  }

  /**
   * Parse calories from metadata
   */
  private parseCalories(metadata: ParsedMetadata): number {
    // Calories might be in the description or other fields
    const text = `${metadata.description} ${metadata.title}`.toLowerCase();
    
    const calorieMatch = text.match(/(\d+)\s*cal/);
    if (calorieMatch) {
      return parseInt(calorieMatch[1]);
    }

    // Default based on meal type
    if (text.includes('dessert') || text.includes('cake') || text.includes('cookie')) {
      return 350;
    } else if (text.includes('salad') || text.includes('soup')) {
      return 250;
    } else if (text.includes('main') || text.includes('dinner') || text.includes('entree')) {
      return 450;
    }

    return 300; // Default calories
  }

  /**
   * Generate appropriate tags for the recipe
   */
  private generateTags(metadata: ParsedMetadata): string[] {
    const tags = new Set<string>();

    // Add site-specific tag
    tags.add(metadata.siteName);

    // Add existing tags from metadata
    if (metadata.tags) {
      metadata.tags.forEach(tag => tags.add(tag));
    }

    // Add tags based on content analysis
    const content = `${metadata.title} ${metadata.description}`.toLowerCase();
    
    // Meal type tags
    if (content.includes('breakfast')) tags.add('Breakfast');
    if (content.includes('lunch')) tags.add('Lunch');
    if (content.includes('dinner')) tags.add('Dinner');
    if (content.includes('dessert')) tags.add('Dessert');
    if (content.includes('snack')) tags.add('Snack');

    // Dietary tags
    if (content.includes('vegetarian')) tags.add('Vegetarian');
    if (content.includes('vegan')) tags.add('Vegan');
    if (content.includes('gluten-free') || content.includes('gluten free')) tags.add('Gluten-Free');
    if (content.includes('healthy')) tags.add('Healthy');
    if (content.includes('low-carb') || content.includes('low carb')) tags.add('Low-Carb');

    // Cooking method tags
    if (content.includes('baked') || content.includes('baking')) tags.add('Baked');
    if (content.includes('grilled')) tags.add('Grilled');
    if (content.includes('fried')) tags.add('Fried');
    if (content.includes('slow cooker') || content.includes('crockpot')) tags.add('Slow Cooker');

    // Time-based tags
    if (content.includes('quick') || content.includes('easy') || content.includes('30 min')) tags.add('Quick');
    if (content.includes('make-ahead') || content.includes('prep ahead')) tags.add('Make-Ahead');

    // Always add imported tag
    tags.add('Imported');

    return Array.from(tags).slice(0, 8); // Limit to 8 tags
  }

  /**
   * Generate notes for the recipe
   */
  private generateNotes(metadata: ParsedMetadata): string {
    const notes = [];

    notes.push(`Imported from ${metadata.siteName}`);
    
    if (metadata.author) {
      notes.push(`Original author: ${metadata.author}`);
    }

    if (metadata.rating) {
      notes.push(`Original rating: ${metadata.rating}/5 stars`);
    }

    notes.push('Please refer to the original recipe for complete instructions and any special techniques.');

    return notes.join('\n\n');
  }
}

// Export singleton instance
export const realUrlParsingService = RealUrlParsingService.getInstance();

// For backward compatibility, also export as the main parser
export const clientSideRecipeParser = realUrlParsingService;