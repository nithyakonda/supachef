import { AIPayload, AIResponse } from '@/types';

export const aiService = {
  /**
   * Generate a meal plan using AI
   * @param payload The AI payload containing preferences, ingredients, and saved recipes
   * @returns Promise with AI response
   */
  generateMealPlanAI: async (payload: AIPayload): Promise<AIResponse> => {
    try {
      // Get Supabase configuration from environment
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase configuration is missing. Please check your environment variables.');
      }

      // Construct the direct URL to the Supabase Edge Function
      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/meal-planner-ai`;

      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Edge function error:', errorText);
        throw new Error(`AI service error: ${response.status} ${response.statusText}`);
      }

      // Parse and return the AI response with robust error handling
      try {
        const aiResponse: AIResponse = await response.json();
        
        if (!aiResponse.success) {
          throw new Error(aiResponse.error || 'AI meal planning failed');
        }

        return aiResponse;
      } catch (jsonError) {
        // If JSON parsing fails, get the raw response text
        const responseText = await response.text();
        console.error('JSON parsing failed. Response was:', responseText);
        
        throw new Error('Edge function returned invalid JSON response. This usually indicates a configuration issue with the AI service or missing environment variables.');
      }
    } catch (error) {
      console.error('Error generating meal plan:', error);
      throw new Error(
        error instanceof Error 
          ? error.message 
          : 'Failed to generate meal plan. Please try again.'
      );
    }
  },

  /**
   * Validate AI payload before sending
   * @param payload The payload to validate
   * @returns boolean indicating if payload is valid
   */
  validatePayload: (payload: AIPayload): boolean => {
    if (!payload.preferences) return false;
    if (!Array.isArray(payload.ingredients)) return false;
    if (!Array.isArray(payload.savedRecipes)) return false;
    
    const { preferences } = payload;
    if (typeof preferences.mealsPerDay !== 'number' || preferences.mealsPerDay < 1) return false;
    if (typeof preferences.daysToPlan !== 'number' || preferences.daysToPlan < 1) return false;
    if (!Array.isArray(preferences.dietaryRestrictions)) return false;
    if (typeof preferences.prefersLeftovers !== 'boolean') return false;
    if (typeof preferences.needsLunchbox !== 'boolean') return false;

    return true;
  },
};

export default aiService;