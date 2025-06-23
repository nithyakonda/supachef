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

export interface MealRecipeData {
  recipeId: string;
  title: string;
  imageUrl: string;
  leftover: boolean;
  lunchbox: boolean;
  aiSuggested: boolean;
  isPlaceholder: boolean;
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
  mealRecipes?: MealRecipeData[];
  time?: string;
  isCompleted: boolean;
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