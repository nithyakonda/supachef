import { AIPayload, AIResponse } from '@/types';

export async function POST(request: Request): Promise<Response> {
  try {
    console.log("nkk 1")
    // Parse the request body
    const payload: AIPayload = await request.json();

    // Validate the payload
    if (!payload.preferences || !payload.ingredients || !payload.savedRecipes) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: preferences, ingredients, or savedRecipes',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get Supabase URL from environment
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Supabase configuration missing',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Call the Supabase Edge Function
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/meal-planner-ai`;
    console.log("nkk", edgeFunctionUrl)
    
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Edge function error:', errorText);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: `AI service error: ${response.status} ${response.statusText}`,
        }),
        {
          status: response.status,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse and return the AI response with robust error handling
    try {
      const aiResponse: AIResponse = await response.json();
      
      return new Response(
        JSON.stringify(aiResponse),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (jsonError) {
      // If JSON parsing fails, get the raw response text
      const responseText = await response.text();
      console.error('JSON parsing failed. Response was:', responseText);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Edge function returned invalid JSON response. This usually indicates a configuration issue with the AI service or missing environment variables.',
          details: responseText.substring(0, 500), // Include first 500 chars for debugging
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('API route error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return new Response(
    JSON.stringify({
      success: false,
      error: 'Method not allowed. Use POST instead.',
    }),
    {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}