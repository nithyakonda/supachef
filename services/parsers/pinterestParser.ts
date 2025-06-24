import { BaseParser, ParsedMetadata, ParserResult } from './baseParser';

export class PinterestParser extends BaseParser {
  constructor() {
    super('Pinterest', ['pinterest.com', 'pinterest.co.uk', 'pinterest.ca']);
  }

  async parse(html: string, url: string): Promise<ParserResult> {
    try {
      const metadata: ParsedMetadata = {
        siteName: 'Pinterest',
        title: '',
        description: '',
        imageUrl: 'https://images.pexels.com/photos/1640773/pexels-photo-1640773.jpeg',
        originalUrl: url,
      };

      // Extract Open Graph data
      const ogData = this.extractOpenGraph(html);
      Object.assign(metadata, ogData);

      // Extract JSON-LD data
      const jsonLdData = this.extractJsonLd(html);
      for (const data of jsonLdData) {
        if (data['@type'] === 'Article' || data['@type'] === 'Recipe') {
          if (data.headline || data.name) {
            metadata.title = this.decodeHtml(data.headline || data.name);
          }
          if (data.description) {
            metadata.description = this.decodeHtml(data.description);
          }
          if (data.image) {
            const image = Array.isArray(data.image) ? data.image[0] : data.image;
            metadata.imageUrl = typeof image === 'string' ? image : image.url;
          }
          if (data.author?.name) {
            metadata.author = this.decodeHtml(data.author.name);
          }

          // Recipe-specific data
          if (data['@type'] === 'Recipe') {
            if (data.cookTime) {
              metadata.cookTime = this.extractTime(data.cookTime);
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
          }
        }
      }

      // Fallback to title tag
      if (!metadata.title) {
        metadata.title = this.extractTitle(html);
        // Clean up Pinterest title
        if (metadata.title.includes(' | Pinterest')) {
          metadata.title = metadata.title.split(' | Pinterest')[0];
        }
      }

      // Extract Pinterest-specific metadata from page content
      const pinDataMatch = html.match(/"title":"([^"]+)"/);
      if (pinDataMatch && !metadata.title) {
        metadata.title = this.decodeHtml(pinDataMatch[1]);
      }

      const pinDescMatch = html.match(/"description":"([^"]+)"/);
      if (pinDescMatch && !metadata.description) {
        metadata.description = this.decodeHtml(pinDescMatch[1]);
      }

      // Add Pinterest-specific tags
      metadata.tags = ['Pinterest', 'Visual Recipe', 'Instagram-worthy'];

      return {
        success: true,
        metadata,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to parse Pinterest pin: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}