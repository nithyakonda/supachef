import { supabase } from '@/utils/supabase';
import { MealPlan, Meal, Recipe } from '@/types';
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
  mealRows: (MealEntryRow & { recipes?: any[] })[] = []
): MealPlanWithMeals => {
  const meals: Meal[] = mealRows.map(mealRow => {
    // Fetch recipes for the recipe IDs
    const recipes: Recipe[] = (mealRow.recipes || []).map(recipeData => ({
      id: recipeData.id,
      title: recipeData.title,
      description: recipeData.description,
      imageUrl: recipeData.image_url,
      cookingTime: recipeData.cooking_time,
      servings: recipeData.servings,
      difficulty: recipeData.difficulty,
      calories: recipeData.calories,
      ingredients: recipeData.ingredients || [],
      instructions: recipeData.instructions || [],
      tags: recipeData.tags || [],
      source: recipeData.source,
      rating: recipeData.rating,
      notes: recipeData.notes,
      isFavorite: recipeData.is_favorite,
      createdAt: new Date(recipeData.created_at),
    }));

    return {
      id: mealRow.id,
      type: mealRow.meal_type,
      recipeIds: mealRow.recipe_ids || [],
      recipes: recipes.length > 0 ? recipes : undefined,
      time: mealRow.meal_time || undefined,
      isCompleted: mealRow.is_completed,
      leftover: mealRow.leftover || false,
      lunchbox: mealRow.lunchbox || false,
      aiSuggested: mealRow.ai_suggested || false,
      isPlaceholder: mealRow.is_placeholder || false,
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

    // Get meals for this plan with their recipes
    const { data: mealsData, error: mealsError } = await supabase
      .from('meal_entries')
      .select('*')
      .eq('meal_plan_id', planData.id);

    if (mealsError) {
      console.error('Error fetching meal entries:', mealsError);
      throw new Error('Failed to fetch meal entries');
    }

    // Fetch recipes for all recipe IDs in the meals
    const allRecipeIds = mealsData.flatMap(meal => meal.recipe_ids || []);
    const uniqueRecipeIds = Array.from(new Set(allRecipeIds));

    let recipesData: any[] = [];
    if (uniqueRecipeIds.length > 0) {
      const { data: fetchedRecipes, error: recipesError } = await supabase
        .from('recipes')
        .select('*')
        .in('id', uniqueRecipeIds);

      if (recipesError) {
        console.error('Error fetching recipes:', recipesError);
        throw new Error('Failed to fetch recipes');
      }

      recipesData = fetchedRecipes || [];
    }

    // Map recipes to meals
    const mealsWithRecipes = mealsData.map(meal => ({
      ...meal,
      recipes: (meal.recipe_ids || []).map(recipeId => 
        recipesData.find(recipe => recipe.id === recipeId)
      ).filter(Boolean)
    }));

    return transformMealPlanFromDB(planData, mealsWithRecipes);
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

    // Fetch all recipes
    const allRecipeIds = mealsData.flatMap(meal => meal.recipe_ids || []);
    const uniqueRecipeIds = Array.from(new Set(allRecipeIds));

    let recipesData: any[] = [];
    if (uniqueRecipeIds.length > 0) {
      const { data: fetchedRecipes, error: recipesError } = await supabase
        .from('recipes')
        .select('*')
        .in('id', uniqueRecipeIds);

      if (recipesError) {
        console.error('Error fetching recipes:', recipesError);
        throw new Error('Failed to fetch recipes');
      }

      recipesData = fetchedRecipes || [];
    }

    // Group meals by plan ID and add recipes
    const mealsByPlan = mealsData.reduce((acc, meal) => {
      if (!acc[meal.meal_plan_id]) {
        acc[meal.meal_plan_id] = [];
      }
      
      const mealWithRecipes = {
        ...meal,
        recipes: (meal.recipe_ids || []).map(recipeId => 
          recipesData.find(recipe => recipe.id === recipeId)
        ).filter(Boolean)
      };
      
      acc[meal.meal_plan_id].push(mealWithRecipes);
      return acc;
    }, {} as Record<string, any[]>);

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
      recipe_ids: meal.recipeIds || [],
      meal_type: meal.type,
      meal_time: meal.time || null,
      is_completed: meal.isCompleted,
      leftover: meal.leftover || false,
      lunchbox: meal.lunchbox || false,
      ai_suggested: meal.aiSuggested || false,
      is_placeholder: meal.isPlaceholder || false,
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

    // Fetch recipes for the created meals
    const allRecipeIds = mealsData.flatMap(meal => meal.recipe_ids || []);
    const uniqueRecipeIds = Array.from(new Set(allRecipeIds));

    let recipesData: any[] = [];
    if (uniqueRecipeIds.length > 0) {
      const { data: fetchedRecipes, error: recipesError } = await supabase
        .from('recipes')
        .select('*')
        .in('id', uniqueRecipeIds);

      if (recipesError) {
        console.error('Error fetching recipes:', recipesError);
        throw new Error('Failed to fetch recipes');
      }

      recipesData = fetchedRecipes || [];
    }

    // Add recipes to meals
    const mealsWithRecipes = mealsData.map(meal => ({
      ...meal,
      recipes: (meal.recipe_ids || []).map(recipeId => 
        recipesData.find(recipe => recipe.id === recipeId)
      ).filter(Boolean)
    }));

    return transformMealPlanFromDB(planData, mealsWithRecipes);
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

  // Update meal flags
  updateMealFlags: async (
    mealId: string, 
    flags: {
      leftover?: boolean;
      lunchbox?: boolean;
      aiSuggested?: boolean;
      isPlaceholder?: boolean;
    }
  ): Promise<void> => {
    const updateData: any = {};
    if (flags.leftover !== undefined) updateData.leftover = flags.leftover;
    if (flags.lunchbox !== undefined) updateData.lunchbox = flags.lunchbox;
    if (flags.aiSuggested !== undefined) updateData.ai_suggested = flags.aiSuggested;
    if (flags.isPlaceholder !== undefined) updateData.is_placeholder = flags.isPlaceholder;

    const { error } = await supabase
      .from('meal_entries')
      .update(updateData)
      .eq('id', mealId);

    if (error) {
      console.error('Error updating meal flags:', error);
      throw new Error('Failed to update meal flags');
    }
  },

  // Add suggested recipes to a meal (they will be automatically processed by the trigger)
  addSuggestedRecipesToMeal: async (mealId: string, suggestedRecipes: Recipe[]): Promise<void> => {
    const { error } = await supabase
      .from('meal_entries')
      .update({ 
        suggested_recipes: suggestedRecipes,
        ai_suggested: true 
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
        recipe_ids,
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

    const allRecipeIds = data.flatMap(item => item.recipe_ids || []);
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
        recipe_ids,
        ai_suggested,
        is_placeholder,
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
    const aiSuggestedMeals = mealStats.filter(meal => meal.ai_suggested).length;
    const placeholderMeals = mealStats.filter(meal => meal.is_placeholder).length;

    // Get most used recipes
    const allRecipeIds = mealStats.flatMap(meal => meal.recipe_ids || []);
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