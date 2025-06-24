import { BaseParser, ParsedMetadata, ParserResult } from './baseParser';

export class AllRecipesParser extends BaseParser {
  constructor() {
    super('AllRecipes', ['allrecipes.com']);
  }

  async parse(html: string, url: string): Promise<ParserResult> {
    try {
      const metadata: ParsedMetadata = {
        siteName: 'AllRecipes',
        title: '',
        description: '',
        imageUrl: 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg',
        originalUrl: url,
      };

      // Extract Open Graph data
      const ogData = this.extractOpenGraph(html);
      Object.assign(metadata, ogData);

      // Extract JSON-LD data for recipe information
      const jsonLdData = this.extractJsonLd(html);
      for (const data of jsonLdData) {
        if (data['@type'] === 'Recipe') {
          if (data.name) metadata.title = this.decodeHtml(data.name);
          if (data.description) metadata.description = this.decodeHtml(data.description);
          
          if (data.image) {
            const image = Array.isArray(data.image) ? data.image[0] : data.image;
            metadata.imageUrl = typeof image === 'string' ? image : image.url;
          }

          if (data.author) {
            const author = Array.isArray(data.author) ? data.author[0] : data.author;
            metadata.author = this.decodeHtml(author.name || author);
          }

          // Recipe-specific data
          if (data.totalTime || data.cookTime) {
            metadata.cookTime = this.extractTime(data.totalTime || data.cookTime);
          }

          if (data.recipeYield) {
            metadata.servings = Array.isArray(data.recipeYield) 
              ? data.recipeYield[0] 
              : data.recipeYield.toString();
          }

          if (data.recipeIngredient) {
            metadata.ingredients = data.recipeIngredient.map((ing: string) => this.decodeHtml(ing));
          }

          if (data.aggregateRating?.ratingValue) {
            metadata.rating = parseFloat(data.aggregateRating.ratingValue);
          }

          if (data.keywords) {
            metadata.tags = Array.isArray(data.keywords) 
              ? data.keywords.map((tag: string) => this.decodeHtml(tag))
              : [this.decodeHtml(data.keywords)];
          }

          // Extract difficulty from recipe category or instructions
          if (data.recipeCategory) {
            const categories = Array.isArray(data.recipeCategory) ? data.recipeCategory : [data.recipeCategory];
            if (categories.some((cat: string) => cat.toLowerCase().includes('easy'))) {
              metadata.difficulty = 'Easy';
            } else if (categories.some((cat: string) => cat.toLowerCase().includes('hard'))) {
              metadata.difficulty = 'Hard';
            } else {
              metadata.difficulty = 'Medium';
            }
          }
        }
      }

      // Fallback to title tag
      if (!metadata.title) {
        metadata.title = this.extractTitle(html);
        // Clean up AllRecipes title
        if (metadata.title.includes(' | Allrecipes')) {
          metadata.title = metadata.title.split(' | Allrecipes')[0];
        }
      }

      // Add AllRecipes-specific tags
      metadata.tags = [...(metadata.tags || []), 'AllRecipes', 'Community Tested', 'Traditional'];

      return {
        success: true,
        metadata,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to parse AllRecipes recipe: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}