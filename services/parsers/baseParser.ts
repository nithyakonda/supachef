// Base parser interface and utilities for all site-specific parsers

export interface ParsedMetadata {
  siteName: string;
  title: string;
  description: string;
  imageUrl: string;
  author?: string;
  cookTime?: string;
  servings?: string;
  ingredients?: string[];
  rating?: number;
  difficulty?: string;
  tags?: string[];
  originalUrl: string;
}

export interface ParserResult {
  success: boolean;
  metadata?: ParsedMetadata;
  error?: string;
}

export abstract class BaseParser {
  protected siteName: string;
  protected supportedDomains: string[];

  constructor(siteName: string, supportedDomains: string[]) {
    this.siteName = siteName;
    this.supportedDomains = supportedDomains;
  }

  // Check if this parser supports the given URL
  canParse(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.replace('www.', '').toLowerCase();
      return this.supportedDomains.some(domain => 
        hostname === domain || hostname.endsWith('.' + domain)
      );
    } catch {
      return false;
    }
  }

  // Abstract method that each parser must implement
  abstract parse(html: string, url: string): Promise<ParserResult>;

  // Utility methods for extracting common metadata
  protected extractOpenGraph(html: string): Partial<ParsedMetadata> {
    const metadata: Partial<ParsedMetadata> = {};
    
    // Extract og:title
    const titleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    if (titleMatch) metadata.title = this.decodeHtml(titleMatch[1]);

    // Extract og:description
    const descMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    if (descMatch) metadata.description = this.decodeHtml(descMatch[1]);

    // Extract og:image
    const imageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    if (imageMatch) metadata.imageUrl = imageMatch[1];

    // Extract og:site_name
    const siteMatch = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    if (siteMatch) metadata.siteName = this.decodeHtml(siteMatch[1]);

    return metadata;
  }

  protected extractMetaTags(html: string): Partial<ParsedMetadata> {
    const metadata: Partial<ParsedMetadata> = {};

    // Extract meta description
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    if (descMatch) metadata.description = this.decodeHtml(descMatch[1]);

    // Extract meta author
    const authorMatch = html.match(/<meta[^>]*name=["']author["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    if (authorMatch) metadata.author = this.decodeHtml(authorMatch[1]);

    return metadata;
  }

  protected extractJsonLd(html: string): any[] {
    const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis);
    const jsonLdData: any[] = [];

    if (jsonLdMatches) {
      for (const match of jsonLdMatches) {
        try {
          const jsonContent = match.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
          const parsed = JSON.parse(jsonContent);
          jsonLdData.push(parsed);
        } catch (error) {
          // Skip invalid JSON-LD
          continue;
        }
      }
    }

    return jsonLdData;
  }

  protected extractTitle(html: string): string {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return titleMatch ? this.decodeHtml(titleMatch[1]) : '';
  }

  protected decodeHtml(text: string): string {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .trim();
  }

  protected cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .trim();
  }

  protected extractNumber(text: string): number | undefined {
    const match = text.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : undefined;
  }

  protected extractTime(text: string): string | undefined {
    // Extract time patterns like "30 minutes", "1 hour 15 minutes", "PT30M"
    const timePatterns = [
      /(\d+)\s*(?:hours?|hrs?|h)\s*(?:(\d+)\s*(?:minutes?|mins?|m))?/i,
      /(\d+)\s*(?:minutes?|mins?|m)/i,
      /PT(\d+)H?(\d+)?M/i, // ISO 8601 duration
    ];

    for (const pattern of timePatterns) {
      const match = text.match(pattern);
      if (match) {
        if (pattern.source.includes('PT')) {
          // ISO 8601 format
          const hours = parseInt(match[1]) || 0;
          const minutes = parseInt(match[2]) || 0;
          const totalMinutes = hours * 60 + minutes;
          return totalMinutes > 60 ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m` : `${totalMinutes}m`;
        } else if (match[2]) {
          // Hours and minutes
          return `${match[1]}h ${match[2]}m`;
        } else {
          // Just minutes or hours
          const num = parseInt(match[1]);
          return text.toLowerCase().includes('hour') ? `${num}h` : `${num}m`;
        }
      }
    }

    return undefined;
  }
}