import { BaseParser, ParsedMetadata, ParserResult } from './baseParser';

export class TasteOfHomeParser extends BaseParser {
  constructor() {
    super('Taste of Home', ['tasteofhome.com']);
  }

  async parse(html: string, url: string): Promise<ParserResult> {
    try {
      const metadata: ParsedMetadata = {
        siteName: 'Taste of Home',
        title: '',
        description: '',
        imageUrl: 'https://images.pexels.com/photos/1640776/pexels-photo-1640776.jpeg',
        originalUrl: url,
      };

      // Extract Open Graph data
      const ogData = this.extractOpenGraph(html);
      Object.assign(metadata, ogData);

      // Extract JSON-LD data
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

          // Taste of Home recipes are typically family-friendly and easy to medium difficulty
          metadata.difficulty = 'Easy';

          if (data.keywords) {
            metadata.tags = Array.isArray(data.keywords) 
              ? data.keywords.map((tag: string) => this.decodeHtml(tag))
              : [this.decodeHtml(data.keywords)];
          }
        }
      }

      // Fallback to title tag
      if (!metadata.title) {
        metadata.title = this.extractTitle(html);
        // Clean up Taste of Home title
        if (metadata.title.includes(' | Taste of Home')) {
          metadata.title = metadata.title.split(' | Taste of Home')[0];
        }
      }

      // Add Taste of Home-specific tags
      metadata.tags = [...(metadata.tags || []), 'Taste of Home', 'Family Recipe', 'Comfort Food'];

      return {
        success: true,
        metadata,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to parse Taste of Home recipe: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}