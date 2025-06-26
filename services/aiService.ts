import { AIPayload, AIResponse } from '@/types';

export const aiService = {
  /**
   * Generate a meal plan using AI
   * @param payload The AI payload containing preferences, ingredients, and saved recipes
   * @returns Promise with AI response
   */
  generateMealPlanAI: async (payload: AIPayload): Promise<AIResponse> => {
    try {
      const response = await fetch('/api/generate-meal-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log("nkk"+response)

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result: AIResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'AI meal planning failed');
      }

      return result;
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