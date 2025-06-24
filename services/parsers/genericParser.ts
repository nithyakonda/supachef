import { BaseParser, ParsedMetadata, ParserResult } from './baseParser';

export class GenericParser extends BaseParser {
  constructor() {
    super('Recipe Website', []); // Empty domains - this parser accepts any URL
  }

  canParse(url: string): boolean {
    // Generic parser can handle any URL as a fallback
    return true;
  }

  async parse(html: string, url: string): Promise<ParserResult> {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.replace('www.', '');

      const metadata: ParsedMetadata = {
        siteName: this.formatSiteName(hostname),
        title: '',
        description: '',
        imageUrl: 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg',
        originalUrl: url,
      };

      // Extract Open Graph data
      const ogData = this.extractOpenGraph(html);
      Object.assign(metadata, ogData);

      // Extract meta tags
      const metaData = this.extractMetaTags(html);
      if (!metadata.description && metaData.description) {
        metadata.description = metaData.description;
      }
      if (!metadata.author && metaData.author) {
        metadata.author = metaData.author;
      }

      // Extract JSON-LD data
      const jsonLdData = this.extractJsonLd(html);
      for (const data of jsonLdData) {
        if (data['@type'] === 'Recipe') {
          if (data.name && !metadata.title) metadata.title = this.decodeHtml(data.name);
          if (data.description && !metadata.description) metadata.description = this.decodeHtml(data.description);
          
          if (data.image && !metadata.imageUrl.includes('pexels.com')) {
            const image = Array.isArray(data.image) ? data.image[0] : data.image;
            metadata.imageUrl = typeof image === 'string' ? image : image.url;
          }

          if (data.author && !metadata.author) {
            const author = Array.isArray(data.author) ? data.author[0] : data.author;
            metadata.author = this.decodeHtml(author.name || author);
          }

          // Only include timing if we can parse it reliably
          if (data.totalTime || data.cookTime) {
            const timeString = data.totalTime || data.cookTime;
            const parsedTime = this.extractTime(timeString);
            if (parsedTime) {
              metadata.cookTime = parsedTime;
            }
          }

          // Only include servings if explicitly provided
          if (data.recipeYield) {
            const yieldValue = Array.isArray(data.recipeYield) 
              ? data.recipeYield[0] 
              : data.recipeYield.toString();
            metadata.servings = yieldValue;
          }

          // Only include ingredients if they exist
          if (data.recipeIngredient && Array.isArray(data.recipeIngredient) && data.recipeIngredient.length > 0) {
            metadata.ingredients = data.recipeIngredient.map((ing: string) => this.decodeHtml(ing));
          }

          // Only include rating if it exists and is valid
          if (data.aggregateRating?.ratingValue) {
            const rating = parseFloat(data.aggregateRating.ratingValue);
            if (rating >= 1 && rating <= 5) {
              metadata.rating = rating;
            }
          }

          // Only include keywords/tags if they exist
          if (data.keywords) {
            metadata.tags = Array.isArray(data.keywords) 
              ? data.keywords.map((tag: string) => this.decodeHtml(tag))
              : [this.decodeHtml(data.keywords)];
          }

          // Only include difficulty if explicitly mentioned in categories
          if (data.recipeCategory) {
            const categories = Array.isArray(data.recipeCategory) ? data.recipeCategory : [data.recipeCategory];
            const categoryText = categories.join(' ').toLowerCase();
            
            if (categoryText.includes('easy') || categoryText.includes('simple') || categoryText.includes('beginner')) {
              metadata.difficulty = 'Easy';
            } else if (categoryText.includes('hard') || categoryText.includes('difficult') || categoryText.includes('advanced')) {
              metadata.difficulty = 'Hard';
            } else if (categoryText.includes('medium') || categoryText.includes('intermediate')) {
              metadata.difficulty = 'Medium';
            }
            // If no clear difficulty indicator, don't set it
          }
        } else if (data['@type'] === 'Article' && !metadata.title) {
          if (data.headline) metadata.title = this.decodeHtml(data.headline);
          if (data.description && !metadata.description) metadata.description = this.decodeHtml(data.description);
          if (data.image && !metadata.imageUrl.includes('pexels.com')) {
            const image = Array.isArray(data.image) ? data.image[0] : data.image;
            metadata.imageUrl = typeof image === 'string' ? image : image.url;
          }
          if (data.author && !metadata.author) {
            const author = Array.isArray(data.author) ? data.author[0] : data.author;
            metadata.author = this.decodeHtml(author.name || author);
          }
        }
      }

      // Fallback to title tag
      if (!metadata.title) {
        metadata.title = this.extractTitle(html);
        // Clean up common title patterns
        metadata.title = this.cleanTitle(metadata.title, hostname);
      }

      // Ensure we have a title
      if (!metadata.title) {
        metadata.title = 'Imported Recipe';
      }

      // Ensure we have a description
      if (!metadata.description) {
        metadata.description = `Recipe imported from ${metadata.siteName}`;
      }

      // Add generic tags
      metadata.tags = [...(metadata.tags || []), 'Imported', 'Web Recipe'];

      return {
        success: true,
        metadata,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to parse recipe: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  private formatSiteName(hostname: string): string {
    // Convert hostname to a readable site name
    return hostname
      .split('.')
      .slice(0, -1) // Remove TLD
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private cleanTitle(title: string, hostname: string): string {
    // Remove common site name patterns from title
    const siteName = this.formatSiteName(hostname);
    const patterns = [
      ` - ${siteName}`,
      ` | ${siteName}`,
      ` :: ${siteName}`,
      ` — ${siteName}`,
      ` – ${siteName}`,
    ];

    let cleanedTitle = title;
    for (const pattern of patterns) {
      if (cleanedTitle.endsWith(pattern)) {
        cleanedTitle = cleanedTitle.replace(pattern, '');
        break;
      }
    }

    return cleanedTitle.trim();
  }
}