import { supabase } from '@/utils/supabase';
import { MealPlan, Meal, Recipe, MealRecipeData } from '@/types';
import type { Database } from '@/utils/supabase';

type MealPlanRow = Database['public']['Tables']['meal_plans']['Row'];
type MealPlanInsert = Database['public']['Tables']['meal_plans']['Insert'];
type MealEntryRow = Database['public']['Tables']['meal_entries']['Row'];
type MealEntryInsert = Database['public']['Tables']['meal_entries']['Insert'];

export interface MealPlanWithMeals extends MealPlan {
  meals: Meal[];
}

// Transform database rows to MealPlan type
const transformMealPlanFromDB = (
  planRow: MealPlanRow, 
  mealRows: MealEntryRow[] = []
): MealPlanWithMeals => {
  const meals: Meal[] = mealRows.map(mealRow => {
    // Transform meal_recipes from JSONB array to MealRecipeData array
    const mealRecipes: MealRecipeData[] = (mealRow.meal_recipes || []).map((recipeData: any) => ({
      recipeId: recipeData.recipeId,
      title: recipeData.title,
      imageUrl: recipeData.imageUrl,
      leftover: recipeData.leftover || false,
      lunchbox: recipeData.lunchbox || false,
      aiSuggested: recipeData.aiSuggested || false,
      isPlaceholder: recipeData.isPlaceholder || false,
    }));

    return {
      id: mealRow.id,
      type: mealRow.meal_type,
      mealRecipes: mealRecipes.length > 0 ? mealRecipes : undefined,
      time: mealRow.meal_time || undefined,
      isCompleted: mealRow.is_completed,
      // Note: suggestedRecipes should be empty here since they're processed by the trigger
      suggestedRecipes: undefined,
    };
  });

  return {
    id: planRow.id,
    userId: planRow.user_id,
    date: new Date(planRow.plan_date),
    meals,
    isCompleted: meals.every(meal => meal.isCompleted),
  };
};

export const mealPlanService = {
  // Get current user ID
  getCurrentUserId: async (): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  },

  // Get meal plan for a specific date
  getMealPlanByDate: async (date: Date): Promise<MealPlanWithMeals | null> => {
    const userId = await mealPlanService.getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const dateString = date.toISOString().split('T')[0];

    const { data: planData, error: planError } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('plan_date', dateString)
      .single();

    if (planError) {
      if (planError.code === 'PGRST116') {
        return null; // Meal plan not found
      }
      console.error('Error fetching meal plan:', planError);
      throw new Error('Failed to fetch meal plan');
    }

    // Get meals for this plan
    const { data: mealsData, error: mealsError } = await supabase
      .from('meal_entries')
      .select('*')
      .eq('meal_plan_id', planData.id);

    if (mealsError) {
      console.error('Error fetching meal entries:', mealsError);
      throw new Error('Failed to fetch meal entries');
    }

    return transformMealPlanFromDB(planData, mealsData);
  },

  // Get meal plans for a date range
  getMealPlansInRange: async (startDate: Date, endDate: Date): Promise<MealPlanWithMeals[]> => {
    const userId = await mealPlanService.getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const startDateString = startDate.toISOString().split('T')[0];
    const endDateString = endDate.toISOString().split('T')[0];

    const { data: plansData, error: plansError } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('user_id', userId)
      .gte('plan_date', startDateString)
      .lte('plan_date', endDateString)
      .order('plan_date', { ascending: true });

    if (plansError) {
      console.error('Error fetching meal plans:', plansError);
      throw new Error('Failed to fetch meal plans');
    }

    // Get all meals for these plans
    const planIds = plansData.map(plan => plan.id);
    if (planIds.length === 0) {
      return [];
    }

    const { data: mealsData, error: mealsError } = await supabase
      .from('meal_entries')
      .select('*')
      .in('meal_plan_id', planIds);

    if (mealsError) {
      console.error('Error fetching meal entries:', mealsError);
      throw new Error('Failed to fetch meal entries');
    }

    // Group meals by plan ID
    const mealsByPlan = mealsData.reduce((acc, meal) => {
      if (!acc[meal.meal_plan_id]) {
        acc[meal.meal_plan_id] = [];
      }
      acc[meal.meal_plan_id].push(meal);
      return acc;
    }, {} as Record<string, MealEntryRow[]>);

    return plansData.map(plan => 
      transformMealPlanFromDB(plan, mealsByPlan[plan.id] || [])
    );
  },

  // Create a new meal plan
  createMealPlan: async (
    date: Date, 
    meals: Omit<Meal, 'id'>[], 
    ingredientsUsed: string[] = [],
    preferencesSnapshot: any = {}
  ): Promise<MealPlanWithMeals> => {
    const userId = await mealPlanService.getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const dateString = date.toISOString().split('T')[0];

    // Create the meal plan
    const { data: planData, error: planError } = await supabase
      .from('meal_plans')
      .insert({
        user_id: userId,
        plan_date: dateString,
        ingredients_used: ingredientsUsed,
        preferences_snapshot: preferencesSnapshot,
      })
      .select()
      .single();

    if (planError) {
      console.error('Error creating meal plan:', planError);
      throw new Error('Failed to create meal plan');
    }

    // Create the meals
    const mealInserts: MealEntryInsert[] = meals.map(meal => ({
      meal_plan_id: planData.id,
      meal_recipes: meal.mealRecipes || [],
      meal_type: meal.type,
      meal_time: meal.time || null,
      is_completed: meal.isCompleted,
      suggested_recipes: meal.suggestedRecipes || [],
    }));

    const { data: mealsData, error: mealsError } = await supabase
      .from('meal_entries')
      .insert(mealInserts)
      .select('*');

    if (mealsError) {
      console.error('Error creating meal entries:', mealsError);
      throw new Error('Failed to create meal entries');
    }

    return transformMealPlanFromDB(planData, mealsData);
  },

  // Update meal completion status
  updateMealCompletion: async (mealId: string, isCompleted: boolean): Promise<void> => {
    const { error } = await supabase
      .from('meal_entries')
      .update({ is_completed: isCompleted })
      .eq('id', mealId);

    if (error) {
      console.error('Error updating meal completion:', error);
      throw new Error('Failed to update meal completion');
    }
  },

  // Update meal flags for a specific recipe within a meal
  updateMealFlags: async (
    mealId: string, 
    recipeId: string,
    flags: {
      leftover?: boolean;
      lunchbox?: boolean;
      aiSuggested?: boolean;
      isPlaceholder?: boolean;
    }
  ): Promise<void> => {
    // First, fetch the current meal entry
    const { data: mealEntry, error: fetchError } = await supabase
      .from('meal_entries')
      .select('meal_recipes')
      .eq('id', mealId)
      .single();

    if (fetchError) {
      console.error('Error fetching meal entry:', fetchError);
      throw new Error('Failed to fetch meal entry');
    }

    // Update the specific recipe's flags within the meal_recipes array
    const updatedMealRecipes = (mealEntry.meal_recipes || []).map((recipeData: any) => {
      if (recipeData.recipeId === recipeId) {
        return {
          ...recipeData,
          ...Object.fromEntries(
            Object.entries(flags).filter(([_, value]) => value !== undefined)
          )
        };
      }
      return recipeData;
    });

    // Update the meal entry with the modified meal_recipes array
    const { error: updateError } = await supabase
      .from('meal_entries')
      .update({ meal_recipes: updatedMealRecipes })
      .eq('id', mealId);

    if (updateError) {
      console.error('Error updating meal flags:', updateError);
      throw new Error('Failed to update meal flags');
    }
  },

  // Add suggested recipes to a meal (they will be automatically processed by the trigger)
  addSuggestedRecipesToMeal: async (mealId: string, suggestedRecipes: Recipe[]): Promise<void> => {
    const { error } = await supabase
      .from('meal_entries')
      .update({ 
        suggested_recipes: suggestedRecipes
      })
      .eq('id', mealId);

    if (error) {
      console.error('Error adding suggested recipes:', error);
      throw new Error('Failed to add suggested recipes');
    }
  },

  // Delete a meal plan
  deleteMealPlan: async (planId: string): Promise<void> => {
    const { error } = await supabase
      .from('meal_plans')
      .delete()
      .eq('id', planId);

    if (error) {
      console.error('Error deleting meal plan:', error);
      throw new Error('Failed to delete meal plan');
    }
  },

  // Get recently used recipes (for AI to avoid repetition)
  getRecentlyUsedRecipes: async (days: number = 14): Promise<string[]> => {
    const userId = await mealPlanService.getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffDateString = cutoffDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('meal_entries')
      .select(`
        meal_recipes,
        meal_plans!inner (
          user_id,
          plan_date
        )
      `)
      .eq('meal_plans.user_id', userId)
      .gte('meal_plans.plan_date', cutoffDateString);

    if (error) {
      console.error('Error fetching recently used recipes:', error);
      throw new Error('Failed to fetch recently used recipes');
    }

    // Extract recipe IDs from meal_recipes arrays
    const allRecipeIds = data.flatMap(item => 
      (item.meal_recipes || []).map((recipe: any) => recipe.recipeId)
    );
    return Array.from(new Set(allRecipeIds));
  },

  // Get meal plan statistics
  getMealPlanStats: async (): Promise<{
    totalPlans: number;
    completedMeals: number;
    totalMeals: number;
    favoriteRecipes: string[];
    aiSuggestedMeals: number;
    placeholderMeals: number;
  }> => {
    const userId = await mealPlanService.getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Get total plans
    const { count: totalPlans, error: plansError } = await supabase
      .from('meal_plans')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (plansError) {
      console.error('Error fetching meal plan count:', plansError);
      throw new Error('Failed to fetch meal plan statistics');
    }

    // Get meal completion stats
    const { data: mealStats, error: mealStatsError } = await supabase
      .from('meal_entries')
      .select(`
        is_completed,
        meal_recipes,
        meal_plans!inner (
          user_id
        )
      `)
      .eq('meal_plans.user_id', userId);

    if (mealStatsError) {
      console.error('Error fetching meal stats:', mealStatsError);
      throw new Error('Failed to fetch meal statistics');
    }

    const completedMeals = mealStats.filter(meal => meal.is_completed).length;
    const totalMeals = mealStats.length;

    // Calculate AI suggested and placeholder meals by checking flags in meal_recipes
    let aiSuggestedMeals = 0;
    let placeholderMeals = 0;
    const allRecipeIds: string[] = [];

    mealStats.forEach(meal => {
      (meal.meal_recipes || []).forEach((recipe: any) => {
        allRecipeIds.push(recipe.recipeId);
        if (recipe.aiSuggested) aiSuggestedMeals++;
        if (recipe.isPlaceholder) placeholderMeals++;
      });
    });

    // Get most used recipes
    const recipeUsage = allRecipeIds.reduce((acc, recipeId) => {
      acc[recipeId] = (acc[recipeId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const favoriteRecipes = Object.entries(recipeUsage)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([recipeId]) => recipeId);

    return {
      totalPlans: totalPlans || 0,
      completedMeals,
      totalMeals,
      favoriteRecipes,
      aiSuggestedMeals,
      placeholderMeals,
    };
  },
};

export default mealPlanService;