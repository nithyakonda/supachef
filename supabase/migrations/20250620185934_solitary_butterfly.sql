/*
  # Initial Schema for SupaChef App

  1. New Tables
    - `recipes`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `image_url` (text)
      - `cooking_time` (integer, minutes)
      - `servings` (integer)
      - `difficulty` (text, enum: Easy/Medium/Hard)
      - `calories` (integer)
      - `ingredients` (jsonb)
      - `instructions` (text array)
      - `tags` (text array)
      - `source` (text, nullable)
      - `rating` (integer, nullable, 1-5)
      - `notes` (text, nullable)
      - `is_favorite` (boolean)
      - `user_id` (uuid, foreign key)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `embedding` (vector, for pgvector similarity search)

    - `user_preferences`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `favorite_cuisines` (text array)
      - `meal_planning_days` (text array)
      - `dietary_restrictions` (text array)
      - `allergies` (text array)
      - `meal_types` (text array)
      - `cooking_experience` (text, enum)
      - `needs_lunchbox` (boolean)
      - `prefers_leftovers` (boolean)
      - `number_of_adults` (integer)
      - `number_of_kids` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `meal_plans`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `plan_date` (date)
      - `ingredients_used` (jsonb, for traceability)
      - `preferences_snapshot` (jsonb, snapshot of preferences used)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `plan_meals`
      - `id` (uuid, primary key)
      - `meal_plan_id` (uuid, foreign key)
      - `recipe_id` (uuid, foreign key)
      - `meal_type` (text, enum: breakfast/lunch/dinner/snack)
      - `meal_time` (text, nullable)
      - `is_completed` (boolean)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Enable pgvector extension for similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Create custom types
CREATE TYPE difficulty_level AS ENUM ('Easy', 'Medium', 'Hard');
CREATE TYPE cooking_experience AS ENUM ('Beginner', 'Intermediate', 'Expert');
CREATE TYPE meal_type AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');

-- Create recipes table
CREATE TABLE IF NOT EXISTS recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  image_url text DEFAULT 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg',
  cooking_time integer DEFAULT 30,
  servings integer DEFAULT 4,
  difficulty difficulty_level DEFAULT 'Medium',
  calories integer DEFAULT 0,
  ingredients jsonb DEFAULT '[]'::jsonb,
  instructions text[] DEFAULT '{}',
  tags text[] DEFAULT '{}',
  source text,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  notes text,
  is_favorite boolean DEFAULT false,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  embedding vector(1536) -- OpenAI embedding dimension
);

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  favorite_cuisines text[] DEFAULT '{}',
  meal_planning_days text[] DEFAULT '{"Monday","Tuesday","Wednesday","Thursday","Friday"}',
  dietary_restrictions text[] DEFAULT '{"None"}',
  allergies text[] DEFAULT '{"None"}',
  meal_types text[] DEFAULT '{"Breakfast","Lunch","Dinner"}',
  cooking_experience cooking_experience DEFAULT 'Intermediate',
  needs_lunchbox boolean DEFAULT false,
  prefers_leftovers boolean DEFAULT false,
  number_of_adults integer DEFAULT 2,
  number_of_kids integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create meal_plans table
CREATE TABLE IF NOT EXISTS meal_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_date date NOT NULL,
  ingredients_used jsonb DEFAULT '[]'::jsonb,
  preferences_snapshot jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, plan_date)
);

-- Create plan_meals table
CREATE TABLE IF NOT EXISTS plan_meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id uuid REFERENCES meal_plans(id) ON DELETE CASCADE NOT NULL,
  recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  meal_type meal_type NOT NULL,
  meal_time text,
  is_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_tags ON recipes USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_recipes_is_favorite ON recipes(user_id, is_favorite);
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_embedding ON recipes USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_meal_plans_user_id ON meal_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_date ON meal_plans(plan_date DESC);

CREATE INDEX IF NOT EXISTS idx_plan_meals_meal_plan_id ON plan_meals(meal_plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_meals_recipe_id ON plan_meals(recipe_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_recipes_updated_at 
  BEFORE UPDATE ON recipes 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at 
  BEFORE UPDATE ON user_preferences 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meal_plans_updated_at 
  BEFORE UPDATE ON meal_plans 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_meals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for recipes
CREATE POLICY "Users can read own recipes"
  ON recipes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recipes"
  ON recipes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recipes"
  ON recipes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own recipes"
  ON recipes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for user_preferences
CREATE POLICY "Users can read own preferences"
  ON user_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for meal_plans
CREATE POLICY "Users can read own meal plans"
  ON meal_plans
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal plans"
  ON meal_plans
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal plans"
  ON meal_plans
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal plans"
  ON meal_plans
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for plan_meals
CREATE POLICY "Users can read own plan meals"
  ON plan_meals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM meal_plans 
      WHERE meal_plans.id = plan_meals.meal_plan_id 
      AND meal_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own plan meals"
  ON plan_meals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM meal_plans 
      WHERE meal_plans.id = plan_meals.meal_plan_id 
      AND meal_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own plan meals"
  ON plan_meals
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM meal_plans 
      WHERE meal_plans.id = plan_meals.meal_plan_id 
      AND meal_plans.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM meal_plans 
      WHERE meal_plans.id = plan_meals.meal_plan_id 
      AND meal_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own plan meals"
  ON plan_meals
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM meal_plans 
      WHERE meal_plans.id = plan_meals.meal_plan_id 
      AND meal_plans.user_id = auth.uid()
    )
  );