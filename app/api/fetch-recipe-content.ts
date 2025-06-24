// API Route: /api/fetch-recipe-content
// This endpoint safely fetches recipe content from external URLs server-side

import { recipeUrlParser } from "../../services/urlParsingService"

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;
const requestCounts = new Map<string, { count: number, timestamp: number }>();

// Allowed domains for security
const ALLOWED_DOMAINS = [
  'youtube.com',
  'youtu.be',
  'pinterest.com',
  'pinterest.co.uk',
  'pinterest.ca',
  'allrecipes.com',
  'foodnetwork.com',
  'tasteofhome.com',
  'bbcgoodfood.com',
  'food.com',
  'epicurious.com',
  'delish.com',
  'bonappetit.com',
  'seriouseats.com',
  'kingarthurbaking.com'
];

// Helper function to check rate limiting
function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const clientData = requestCounts.get(clientId);
  
  if (!clientData || now - clientData.timestamp > RATE_LIMIT_WINDOW) {
    requestCounts.set(clientId, { count: 1, timestamp: now });
    return true;
  }
  
  if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  clientData.count++;
  return true;
}

// Helper function to validate URL domain
function isAllowedDomain(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace('www.', '').toLowerCase();
    return ALLOWED_DOMAINS.some(domain => hostname === domain || hostname.endsWith('.' + domain));
  } catch {
    return false;
  }
}

// Helper function to fetch content with proper headers
async function fetchUrlContent(url: string): Promise<string> {
  const headers = {
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
    'Cache-Control': 'max-age=0'
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

  try {
    const response = await fetch(url, {
      headers,
      signal: controller.signal,
      redirect: 'follow',
      method: 'GET'
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Check content type
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/json')) {
      throw new Error(`Unsupported content type: ${contentType}`);
    }

    const content = await response.text();
    
    // Basic content validation
    if (content.length < 100) {
      throw new Error('Content too short, likely not a valid recipe page');
    }

    return content;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - the website took too long to respond');
      }
      throw error;
    }
    
    throw new Error('Failed to fetch content');
  }
}

// Main API handler
export async function POST(request: Request) {
  try {
    // Get client identifier for rate limiting
    const clientId = request.headers.get('x-forwarded-for') || 'anonymous';
    
    // Check rate limiting
    if (!checkRateLimit(clientId)) {
      return Response.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { url } = body;

    // Validate input
    if (!url || typeof url !== 'string') {
      return Response.json(
        { error: 'URL is required and must be a string' },
        { status: 400 }
      );
    }

    // Validate URL format
    let validatedUrl: URL;
    try {
      validatedUrl = new URL(url);
    } catch {
      return Response.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Check if domain is allowed
    if (!isAllowedDomain(url)) {
      return Response.json(
        { error: 'Domain not supported. Supported sites: YouTube, Pinterest, AllRecipes, Food Network, Taste of Home, BBC Good Food, and other major recipe sites.' },
        { status: 403 }
      );
    }

    // Ensure HTTPS
    if (validatedUrl.protocol !== 'https:') {
      return Response.json(
        { error: 'Only HTTPS URLs are supported' },
        { status: 400 }
      );
    }

    // Fetch and parse the recipe
    try {
      const recipeData = await recipeUrlParser.parseRecipeFromUrl(url);
      
      return Response.json({
        success: true,
        recipe: recipeData
      });
    } catch (parseError) {
      console.error('Error parsing recipe:', parseError);
      
      // Try fallback: just fetch content for manual parsing
      try {
        const content = await fetchUrlContent(url);
        return Response.json({
          success: true,
          content,
          fallback: true,
          message: 'Content fetched but automatic parsing failed. Manual parsing may be required.'
        });
      } catch (fetchError) {
        console.error('Error fetching content:', fetchError);
        return Response.json(
          { error: 'Failed to fetch or parse recipe from the provided URL' },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error('API Error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return Response.json(
    { error: 'Method not allowed. Use POST instead.' },
    { status: 405 }
  );
}

export async function PUT() {
  return Response.json(
    { error: 'Method not allowed. Use POST instead.' },
    { status: 405 }
  );
}

export async function DELETE() {
  return Response.json(
    { error: 'Method not allowed. Use POST instead.' },
    { status: 405 }
  );
}