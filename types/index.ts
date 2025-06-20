export interface User {
  id: string;
  email: string;
  name: string;
  profilePicture?: string;
  preferences: UserPreferences;
  createdAt: Date;
}

export interface UserPreferences {
  favoriteCuisines: string[];
  mealPlanningDays: string[];
  dietaryRestrictions: string[];
  mealTypes: string[];
  cookingExperience: 'Beginner' | 'Intermediate' | 'Expert';
  needsLunchbox: boolean;
  prefersLeftovers: boolean;
  numberOfAdults: number;
  numberOfKids: number;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  cookingTime: number;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  calories: number;
  ingredients: Ingredient[];
  instructions: string[];
  tags: string[];
  source?: string;
  rating?: number;
  notes?: string;
  isFavorite: boolean;
  createdAt: Date;
}

export interface Ingredient {
  name: string;
  amount: string;
  unit?: string;
}

export interface MealPlan {
  id: string;
  userId: string;
  date: Date;
  meals: Meal[];
  isCompleted: boolean;
}

export interface Meal {
  id: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  recipeIds: string[]; // Array of recipe IDs from the recipes table
  recipes?: Recipe[]; // Optional, populated when full recipe objects are fetched
  time?: string;
  isCompleted: boolean;
  leftover?: boolean; // Flag for leftover meals
  lunchbox?: boolean; // Flag for lunchbox meals
  aiSuggested?: boolean; // Flag if the meal was AI-suggested
  isPlaceholder?: boolean; // Flag for placeholder meals
  suggestedRecipes?: Recipe[]; // Temporary storage for AI-suggested recipes not yet in recipes table
}

export interface WeeklyPlan {
  id: string;
  userId: string;
  weekStart: Date;
  dailyPlans: MealPlan[];
  preferences: PlanPreferences;
}

export interface PlanPreferences {
  targetCalories?: number;
  dietaryRestrictions: string[];
  excludedIngredients: string[];
  preferredCuisines: string[];
  mealTypes: string[];
}