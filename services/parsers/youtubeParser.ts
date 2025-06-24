import { BaseParser, ParsedMetadata, ParserResult } from './baseParser';

export class YouTubeParser extends BaseParser {
  constructor() {
    super('YouTube', ['youtube.com', 'youtu.be']);
  }

  async parse(html: string, url: string): Promise<ParserResult> {
    try {
      const metadata: ParsedMetadata = {
        siteName: 'YouTube',
        title: '',
        description: '',
        imageUrl: 'https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg',
        originalUrl: url,
      };

      // Extract Open Graph data
      const ogData = this.extractOpenGraph(html);
      Object.assign(metadata, ogData);

      // Extract JSON-LD data for more detailed information
      const jsonLdData = this.extractJsonLd(html);
      for (const data of jsonLdData) {
        if (data['@type'] === 'VideoObject') {
          if (data.name) metadata.title = this.decodeHtml(data.name);
          if (data.description) metadata.description = this.decodeHtml(data.description);
          if (data.thumbnailUrl) {
            metadata.imageUrl = Array.isArray(data.thumbnailUrl) 
              ? data.thumbnailUrl[0] 
              : data.thumbnailUrl;
          }
          if (data.author?.name) metadata.author = this.decodeHtml(data.author.name);
          
          // Extract duration if available
          if (data.duration) {
            metadata.cookTime = this.extractTime(data.duration);
          }
        }
      }

      // Fallback to title tag if no og:title
      if (!metadata.title) {
        metadata.title = this.extractTitle(html);
      }

      // Clean up YouTube title (remove " - YouTube" suffix)
      if (metadata.title.endsWith(' - YouTube')) {
        metadata.title = metadata.title.replace(' - YouTube', '');
      }

      // Extract video ID for better thumbnail
      const videoId = this.extractVideoId(url);
      if (videoId) {
        metadata.imageUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      }

      // Add YouTube-specific tags
      metadata.tags = ['YouTube', 'Video Recipe'];

      return {
        success: true,
        metadata,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to parse YouTube video: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  private extractVideoId(url: string): string | null {
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
}