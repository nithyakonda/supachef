import { supabase } from '@/utils/supabase';
import { MealPlan, Meal } from '@/types';
import type { Database } from '@/utils/supabase';

type MealPlanRow = Database['public']['Tables']['meal_plans']['Row'];
type MealPlanInsert = Database['public']['Tables']['meal_plans']['Insert'];
type PlanMealRow = Database['public']['Tables']['plan_meals']['Row'];
type PlanMealInsert = Database['public']['Tables']['plan_meals']['Insert'];

export interface MealPlanWithMeals extends MealPlan {
  meals: Meal[];
}

// Transform database rows to MealPlan type
const transformMealPlanFromDB = (
  planRow: MealPlanRow, 
  mealRows: (PlanMealRow & { recipes: any })[] = []
): MealPlanWithMeals => {
  const meals: Meal[] = mealRows.map(mealRow => ({
    id: mealRow.id,
    type: mealRow.meal_type,
    recipe: mealRow.recipes ? {
      id: mealRow.recipes.id,
      title: mealRow.recipes.title,
      description: mealRow.recipes.description,
      imageUrl: mealRow.recipes.image_url,
      cookingTime: mealRow.recipes.cooking_time,
      servings: mealRow.recipes.servings,
      difficulty: mealRow.recipes.difficulty,
      calories: mealRow.recipes.calories,
      ingredients: mealRow.recipes.ingredients || [],
      instructions: mealRow.recipes.instructions || [],
      tags: mealRow.recipes.tags || [],
      source: mealRow.recipes.source,
      rating: mealRow.recipes.rating,
      notes: mealRow.recipes.notes,
      isFavorite: mealRow.recipes.is_favorite,
      createdAt: new Date(mealRow.recipes.created_at),
    } : undefined,
    time: mealRow.meal_time || undefined,
    isCompleted: mealRow.is_completed,
  }));

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
      .from('plan_meals')
      .select(`
        *,
        recipes (*)
      `)
      .eq('meal_plan_id', planData.id);

    if (mealsError) {
      console.error('Error fetching plan meals:', mealsError);
      throw new Error('Failed to fetch plan meals');
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
      .from('plan_meals')
      .select(`
        *,
        recipes (*)
      `)
      .in('meal_plan_id', planIds);

    if (mealsError) {
      console.error('Error fetching plan meals:', mealsError);
      throw new Error('Failed to fetch plan meals');
    }

    // Group meals by plan ID
    const mealsByPlan = mealsData.reduce((acc, meal) => {
      if (!acc[meal.meal_plan_id]) {
        acc[meal.meal_plan_id] = [];
      }
      acc[meal.meal_plan_id].push(meal);
      return acc;
    }, {} as Record<string, typeof mealsData>);

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
    const mealInserts: PlanMealInsert[] = meals.map(meal => ({
      meal_plan_id: planData.id,
      recipe_id: meal.recipe!.id,
      meal_type: meal.type,
      meal_time: meal.time || null,
      is_completed: meal.isCompleted,
    }));

    const { data: mealsData, error: mealsError } = await supabase
      .from('plan_meals')
      .insert(mealInserts)
      .select(`
        *,
        recipes (*)
      `);

    if (mealsError) {
      console.error('Error creating plan meals:', mealsError);
      throw new Error('Failed to create plan meals');
    }

    return transformMealPlanFromDB(planData, mealsData);
  },

  // Update meal completion status
  updateMealCompletion: async (mealId: string, isCompleted: boolean): Promise<void> => {
    const { error } = await supabase
      .from('plan_meals')
      .update({ is_completed: isCompleted })
      .eq('id', mealId);

    if (error) {
      console.error('Error updating meal completion:', error);
      throw new Error('Failed to update meal completion');
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
      .from('plan_meals')
      .select(`
        recipe_id,
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

    return Array.from(new Set(data.map(item => item.recipe_id)));
  },

  // Get meal plan statistics
  getMealPlanStats: async (): Promise<{
    totalPlans: number;
    completedMeals: number;
    totalMeals: number;
    favoriteRecipes: string[];
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
      .from('plan_meals')
      .select(`
        is_completed,
        recipe_id,
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

    // Get most used recipes
    const recipeUsage = mealStats.reduce((acc, meal) => {
      acc[meal.recipe_id] = (acc[meal.recipe_id] || 0) + 1;
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
    };
  },
};

export default mealPlanService;