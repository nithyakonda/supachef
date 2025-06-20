import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database types for TypeScript
export interface Database {
  public: {
    Tables: {
      recipes: {
        Row: {
          id: string;
          title: string;
          description: string;
          image_url: string;
          cooking_time: number;
          servings: number;
          difficulty: 'Easy' | 'Medium' | 'Hard';
          calories: number;
          ingredients: any; // JSONB
          instructions: string[];
          tags: string[];
          source: string | null;
          rating: number | null;
          notes: string | null;
          is_favorite: boolean;
          user_id: string;
          created_at: string;
          updated_at: string;
          embedding: string | null; // For pgvector
        };
        Insert: {
          id?: string;
          title: string;
          description?: string;
          image_url?: string;
          cooking_time?: number;
          servings?: number;
          difficulty?: 'Easy' | 'Medium' | 'Hard';
          calories?: number;
          ingredients?: any;
          instructions?: string[];
          tags?: string[];
          source?: string | null;
          rating?: number | null;
          notes?: string | null;
          is_favorite?: boolean;
          user_id: string;
          created_at?: string;
          updated_at?: string;
          embedding?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          image_url?: string;
          cooking_time?: number;
          servings?: number;
          difficulty?: 'Easy' | 'Medium' | 'Hard';
          calories?: number;
          ingredients?: any;
          instructions?: string[];
          tags?: string[];
          source?: string | null;
          rating?: number | null;
          notes?: string | null;
          is_favorite?: boolean;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
          embedding?: string | null;
        };
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          favorite_cuisines: string[];
          meal_planning_days: string[];
          dietary_restrictions: string[];
          allergies: string[];
          meal_types: string[];
          cooking_experience: 'Beginner' | 'Intermediate' | 'Expert';
          needs_lunchbox: boolean;
          prefers_leftovers: boolean;
          number_of_adults: number;
          number_of_kids: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          favorite_cuisines?: string[];
          meal_planning_days?: string[];
          dietary_restrictions?: string[];
          allergies?: string[];
          meal_types?: string[];
          cooking_experience?: 'Beginner' | 'Intermediate' | 'Expert';
          needs_lunchbox?: boolean;
          prefers_leftovers?: boolean;
          number_of_adults?: number;
          number_of_kids?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          favorite_cuisines?: string[];
          meal_planning_days?: string[];
          dietary_restrictions?: string[];
          allergies?: string[];
          meal_types?: string[];
          cooking_experience?: 'Beginner' | 'Intermediate' | 'Expert';
          needs_lunchbox?: boolean;
          prefers_leftovers?: boolean;
          number_of_adults?: number;
          number_of_kids?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      meal_plans: {
        Row: {
          id: string;
          user_id: string;
          plan_date: string;
          ingredients_used: any; // JSONB
          preferences_snapshot: any; // JSONB
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_date: string;
          ingredients_used?: any;
          preferences_snapshot?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan_date?: string;
          ingredients_used?: any;
          preferences_snapshot?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
      plan_meals: {
        Row: {
          id: string;
          meal_plan_id: string;
          recipe_id: string;
          meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
          meal_time: string | null;
          is_completed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          meal_plan_id: string;
          recipe_id: string;
          meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
          meal_time?: string | null;
          is_completed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          meal_plan_id?: string;
          recipe_id?: string;
          meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
          meal_time?: string | null;
          is_completed?: boolean;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}