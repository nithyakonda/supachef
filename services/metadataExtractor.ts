// Main metadata extraction service that coordinates all parsers

import { BaseParser, ParsedMetadata, ParserResult } from './parsers/baseParser';
import { YouTubeParser } from './parsers/youtubeParser';
import { PinterestParser } from './parsers/pinterestParser';
import { AllRecipesParser } from './parsers/allRecipesParser';
import { FoodNetworkParser } from './parsers/foodNetworkParser';
import { TasteOfHomeParser } from './parsers/tasteOfHomeParser';
import { BBCGoodFoodParser } from './parsers/bbcGoodFoodParser';
import { GenericParser } from './parsers/genericParser';

export interface MetadataExtractionResult {
  success: boolean;
  metadata?: ParsedMetadata;
  error?: string;
  parserUsed?: string;
}

export class MetadataExtractor {
  private parsers: BaseParser[];
  private genericParser: GenericParser;

  constructor() {
    // Initialize all site-specific parsers
    this.parsers = [
      new YouTubeParser(),
      new PinterestParser(),
      new AllRecipesParser(),
      new FoodNetworkParser(),
      new TasteOfHomeParser(),
      new BBCGoodFoodParser(),
    ];

    // Generic parser as fallback
    this.genericParser = new GenericParser();
  }

  /**
   * Extract metadata from a URL
   * @param url The URL to extract metadata from
   * @param onProgress Optional progress callback
   * @returns Promise with extraction result
   */
  async extractMetadata(
    url: string, 
    onProgress?: (status: string) => void
  ): Promise<MetadataExtractionResult> {
    try {
      // Validate URL
      new URL(url);
    } catch {
      return {
        success: false,
        error: 'Invalid URL provided',
      };
    }

    onProgress?.('Finding the right parser...');

    // Find the appropriate parser for this URL
    const parser = this.findParser(url);
    const parserName = parser.constructor.name.replace('Parser', '');

    onProgress?.(`Using ${parserName} parser...`);

    try {
      // Fetch the HTML content
      onProgress?.('Fetching page content...');
      const html = await this.fetchHtml(url);

      onProgress?.('Extracting metadata...');
      
      // Parse the HTML with the selected parser
      const result = await parser.parse(html, url);

      if (result.success && result.metadata) {
        onProgress?.('Metadata extracted successfully!');
        return {
          success: true,
          metadata: result.metadata,
          parserUsed: parserName,
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to extract metadata',
          parserUsed: parserName,
        };
      }
    } catch (error) {
      // If specific parser fails, try generic parser as fallback
      if (parser !== this.genericParser) {
        onProgress?.('Trying generic parser as fallback...');
        try {
          const html = await this.fetchHtml(url);
          const result = await this.genericParser.parse(html, url);
          
          if (result.success && result.metadata) {
            return {
              success: true,
              metadata: result.metadata,
              parserUsed: 'Generic (fallback)',
            };
          }
        } catch (fallbackError) {
          // Continue to error handling below
        }
      }

      return {
        success: false,
        error: `Failed to extract metadata: ${error instanceof Error ? error.message : 'Unknown error'}`,
        parserUsed: parserName,
      };
    }
  }

  /**
   * Check if a URL is supported by any specific parser
   * @param url The URL to check
   * @returns boolean indicating if the URL is supported
   */
  isSupportedUrl(url: string): boolean {
    try {
      new URL(url);
      return this.parsers.some(parser => parser.canParse(url));
    } catch {
      return false;
    }
  }

  /**
   * Get list of supported domains
   * @returns Array of supported domain descriptions
   */
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
      'King Arthur Baking (kingarthurbaking.com)',
      'And many more recipe websites...',
    ];
  }

  /**
   * Find the appropriate parser for a given URL
   * @param url The URL to find a parser for
   * @returns The parser to use (specific or generic)
   */
  private findParser(url: string): BaseParser {
    // Try to find a specific parser that can handle this URL
    for (const parser of this.parsers) {
      if (parser.canParse(url)) {
        return parser;
      }
    }

    // Fall back to generic parser
    return this.genericParser;
  }

  /**
   * Fetch HTML content from a URL with proper error handling
   * @param url The URL to fetch
   * @returns Promise with HTML content
   */
  private async fetchHtml(url: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Cache-Control': 'max-age=0',
        },
        signal: controller.signal,
        redirect: 'follow',
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Check content type
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/html')) {
        throw new Error(`Unsupported content type: ${contentType}`);
      }

      const html = await response.text();
      
      // Basic content validation
      if (html.length < 100) {
        throw new Error('Content too short, likely not a valid page');
      }

      return html;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout - the website took too long to respond');
        }
        
        // Handle CORS errors
        if (error.message.includes('CORS') || error.message.includes('Network request failed')) {
          throw new Error('Unable to access this website due to security restrictions. This site may require a server-side proxy to access.');
        }
        
        throw error;
      }
      
      throw new Error('Failed to fetch content');
    }
  }
}

// Export singleton instance
export const metadataExtractor = new MetadataExtractor();