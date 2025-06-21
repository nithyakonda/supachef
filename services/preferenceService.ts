import { supabase } from '@/utils/supabase';
import type { Database } from '@/utils/supabase';

type UserPreferencesRow = Database['public']['Tables']['user_preferences']['Row'];
type UserPreferencesInsert = Database['public']['Tables']['user_preferences']['Insert'];
type UserPreferencesUpdate = Database['public']['Tables']['user_preferences']['Update'];

export interface UserPreferences {
  id: string;
  userId: string;
  favoriteCuisines: string[];
  mealPlanningDays: string[];
  dietaryRestrictions: string[];
  allergies: string[];
  mealTypes: string[];
  cookingExperience: 'Beginner' | 'Intermediate' | 'Expert';
  needsLunchbox: boolean;
  prefersLeftovers: boolean;
  numberOfAdults: number;
  numberOfKids: number;
  createdAt: Date;
  updatedAt: Date;
}

// Transform database row to UserPreferences type
const transformPreferencesFromDB = (row: UserPreferencesRow): UserPreferences => ({
  id: row.id,
  userId: row.user_id,
  favoriteCuisines: row.favorite_cuisines || [],
  mealPlanningDays: row.meal_planning_days || [],
  dietaryRestrictions: row.dietary_restrictions || [],
  allergies: row.allergies || [],
  mealTypes: row.meal_types || [],
  cookingExperience: row.cooking_experience,
  needsLunchbox: row.needs_lunchbox,
  prefersLeftovers: row.prefers_leftovers,
  numberOfAdults: row.number_of_adults,
  numberOfKids: row.number_of_kids,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});

// Transform UserPreferences to database insert format
const transformPreferencesForDB = (preferences: Omit<UserPreferences, 'id' | 'createdAt' | 'updatedAt'>, userId: string): UserPreferencesInsert => ({
  user_id: userId,
  favorite_cuisines: preferences.favoriteCuisines,
  meal_planning_days: preferences.mealPlanningDays,
  dietary_restrictions: preferences.dietaryRestrictions,
  allergies: preferences.allergies,
  meal_types: preferences.mealTypes,
  cooking_experience: preferences.cookingExperience,
  needs_lunchbox: preferences.needsLunchbox,
  prefers_leftovers: preferences.prefersLeftovers,
  number_of_adults: preferences.numberOfAdults,
  number_of_kids: preferences.numberOfKids,
});

// Transform UserPreferences to database update format
const transformPreferencesForUpdate = (preferences: Partial<UserPreferences>): UserPreferencesUpdate => ({
  favorite_cuisines: preferences.favoriteCuisines,
  meal_planning_days: preferences.mealPlanningDays,
  dietary_restrictions: preferences.dietaryRestrictions,
  allergies: preferences.allergies,
  meal_types: preferences.mealTypes,
  cooking_experience: preferences.cookingExperience,
  needs_lunchbox: preferences.needsLunchbox,
  prefers_leftovers: preferences.prefersLeftovers,
  number_of_adults: preferences.numberOfAdults,
  number_of_kids: preferences.numberOfKids,
  updated_at: new Date().toISOString(),
});

export const preferenceService = {
  // Get current user ID
  getCurrentUserId: async (): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  },

  // Get user preferences
  getUserPreferences: async (userId?: string): Promise<UserPreferences | null> => {
    let targetUserId = userId;
    
    if (!targetUserId) {
      targetUserId = await preferenceService.getCurrentUserId();
      if (!targetUserId) {
        throw new Error('User not authenticated');
      }
    }

    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', targetUserId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Preferences not found
      }
      console.error('Error fetching user preferences:', error);
      throw new Error('Failed to fetch user preferences');
    }

    return transformPreferencesFromDB(data);
  },

  // Create user preferences
  createUserPreferences: async (preferences: Omit<UserPreferences, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, userId?: string): Promise<UserPreferences> => {
    let targetUserId = userId;
    
    if (!targetUserId) {
      targetUserId = await preferenceService.getCurrentUserId();
      if (!targetUserId) {
        throw new Error('User not authenticated');
      }
    }

    const { data, error } = await supabase
      .from('user_preferences')
      .insert(transformPreferencesForDB(preferences, targetUserId))
      .select()
      .single();

    if (error) {
      console.error('Error creating user preferences:', error);
      throw new Error('Failed to create user preferences');
    }

    return transformPreferencesFromDB(data);
  },

  // Update user preferences
  updateUserPreferences: async (preferences: Partial<UserPreferences>, userId?: string): Promise<UserPreferences> => {
    let targetUserId = userId;
    
    if (!targetUserId) {
      targetUserId = await preferenceService.getCurrentUserId();
      if (!targetUserId) {
        throw new Error('User not authenticated');
      }
    }

    const { data, error } = await supabase
      .from('user_preferences')
      .update(transformPreferencesForUpdate(preferences))
      .eq('user_id', targetUserId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user preferences:', error);
      throw new Error('Failed to update user preferences');
    }

    return transformPreferencesFromDB(data);
  },

  // Save or update user preferences (upsert)
  saveUserPreferences: async (preferences: Omit<UserPreferences, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, userId?: string): Promise<UserPreferences> => {
    const existingPreferences = await preferenceService.getUserPreferences(userId);
    
    if (existingPreferences) {
      return await preferenceService.updateUserPreferences(preferences, userId);
    } else {
      return await preferenceService.createUserPreferences(preferences, userId);
    }
  },

  // Get default preferences for new users
  getDefaultPreferences: (): Omit<UserPreferences, 'id' | 'userId' | 'createdAt' | 'updatedAt'> => ({
    favoriteCuisines: [],
    mealPlanningDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    dietaryRestrictions: ['None'],
    allergies: ['None'],
    mealTypes: ['Breakfast', 'Lunch', 'Dinner'],
    cookingExperience: 'Intermediate',
    needsLunchbox: false,
    prefersLeftovers: false,
    numberOfAdults: 2,
    numberOfKids: 0,
  }),

  // Initialize preferences for new user
  initializeUserPreferences: async (userId?: string): Promise<UserPreferences> => {
    const defaultPreferences = preferenceService.getDefaultPreferences();
    return await preferenceService.createUserPreferences(defaultPreferences, userId);
  },
};

export default preferenceService;