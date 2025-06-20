/*
  # Update plan_meals table for AI-assisted meal planning

  1. Schema Changes
    - Replace `recipe_id` with `recipe_ids` (uuid array) for multiple saved recipes per meal
    - Add boolean flags: `leftover`, `lunchbox`, `ai_suggested`, `is_placeholder`
    - Add `suggested_recipes` (jsonb array) for AI-suggested recipes not yet in recipes table

  2. Security
    - Maintain existing RLS policies
    - Update policies to handle new column structure

  3. Indexes
    - Add indexes for new columns to optimize queries
*/

-- First, add new columns to plan_meals table
DO $$
BEGIN
  -- Add recipe_ids column (array of UUIDs)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plan_meals' AND column_name = 'recipe_ids'
  ) THEN
    ALTER TABLE plan_meals ADD COLUMN recipe_ids uuid[] DEFAULT '{}';
  END IF;

  -- Add boolean flags
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plan_meals' AND column_name = 'leftover'
  ) THEN
    ALTER TABLE plan_meals ADD COLUMN leftover boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plan_meals' AND column_name = 'lunchbox'
  ) THEN
    ALTER TABLE plan_meals ADD COLUMN lunchbox boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plan_meals' AND column_name = 'ai_suggested'
  ) THEN
    ALTER TABLE plan_meals ADD COLUMN ai_suggested boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plan_meals' AND column_name = 'is_placeholder'
  ) THEN
    ALTER TABLE plan_meals ADD COLUMN is_placeholder boolean DEFAULT false;
  END IF;

  -- Add suggested_recipes column (jsonb array)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plan_meals' AND column_name = 'suggested_recipes'
  ) THEN
    ALTER TABLE plan_meals ADD COLUMN suggested_recipes jsonb[] DEFAULT '{}';
  END IF;
END $$;

-- Migrate existing data: move recipe_id to recipe_ids array
UPDATE plan_meals 
SET recipe_ids = ARRAY[recipe_id] 
WHERE recipe_id IS NOT NULL AND (recipe_ids IS NULL OR recipe_ids = '{}');

-- Make recipe_id nullable since we're transitioning to recipe_ids
ALTER TABLE plan_meals ALTER COLUMN recipe_id DROP NOT NULL;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_plan_meals_recipe_ids ON plan_meals USING GIN(recipe_ids);
CREATE INDEX IF NOT EXISTS idx_plan_meals_leftover ON plan_meals(leftover) WHERE leftover = true;
CREATE INDEX IF NOT EXISTS idx_plan_meals_lunchbox ON plan_meals(lunchbox) WHERE lunchbox = true;
CREATE INDEX IF NOT EXISTS idx_plan_meals_ai_suggested ON plan_meals(ai_suggested) WHERE ai_suggested = true;
CREATE INDEX IF NOT EXISTS idx_plan_meals_is_placeholder ON plan_meals(is_placeholder) WHERE is_placeholder = true;
CREATE INDEX IF NOT EXISTS idx_plan_meals_suggested_recipes ON plan_meals USING GIN(suggested_recipes);

-- Update RLS policies to include new columns
-- Note: The existing policies will continue to work, but we'll update them to be more explicit

-- Drop and recreate the INSERT policy to include new columns
DROP POLICY IF EXISTS "Users can insert own plan meals" ON plan_meals;
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

-- Drop and recreate the UPDATE policy to include new columns
DROP POLICY IF EXISTS "Users can update own plan meals" ON plan_meals;
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

-- Add a function to automatically add suggested recipes to the recipes table
CREATE OR REPLACE FUNCTION process_suggested_recipes()
RETURNS TRIGGER AS $$
DECLARE
  recipe_json jsonb;
  new_recipe_id uuid;
  user_id_val uuid;
BEGIN
  -- Get the user_id from the meal_plan
  SELECT mp.user_id INTO user_id_val
  FROM meal_plans mp
  WHERE mp.id = NEW.meal_plan_id;

  -- Process each suggested recipe
  IF NEW.suggested_recipes IS NOT NULL AND array_length(NEW.suggested_recipes, 1) > 0 THEN
    FOREACH recipe_json IN ARRAY NEW.suggested_recipes
    LOOP
      -- Generate a new UUID for the recipe
      new_recipe_id := gen_random_uuid();
      
      -- Insert the suggested recipe into the recipes table
      INSERT INTO recipes (
        id,
        title,
        description,
        image_url,
        cooking_time,
        servings,
        difficulty,
        calories,
        ingredients,
        instructions,
        tags,
        source,
        rating,
        notes,
        is_favorite,
        user_id
      ) VALUES (
        new_recipe_id,
        COALESCE(recipe_json->>'title', 'AI Suggested Recipe'),
        COALESCE(recipe_json->>'description', ''),
        COALESCE(recipe_json->>'imageUrl', 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg'),
        COALESCE((recipe_json->>'cookingTime')::integer, 30),
        COALESCE((recipe_json->>'servings')::integer, 4),
        COALESCE((recipe_json->>'difficulty')::difficulty_level, 'Medium'),
        COALESCE((recipe_json->>'calories')::integer, 0),
        COALESCE(recipe_json->'ingredients', '[]'::jsonb),
        COALESCE(
          ARRAY(SELECT jsonb_array_elements_text(recipe_json->'instructions')),
          ARRAY['See AI suggestion for instructions']
        ),
        COALESCE(
          ARRAY(SELECT jsonb_array_elements_text(recipe_json->'tags')),
          ARRAY['AI Suggested']
        ) || ARRAY['Sous-chef Suggested'], -- Always add the Sous-chef Suggested tag
        recipe_json->>'source',
        COALESCE((recipe_json->>'rating')::integer, NULL),
        recipe_json->>'notes',
        COALESCE((recipe_json->>'isFavorite')::boolean, false),
        user_id_val
      );
      
      -- Add the new recipe ID to the recipe_ids array
      NEW.recipe_ids := COALESCE(NEW.recipe_ids, '{}') || ARRAY[new_recipe_id];
    END LOOP;
    
    -- Clear the suggested_recipes array since they've been processed
    NEW.suggested_recipes := '{}';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically process suggested recipes
DROP TRIGGER IF EXISTS process_suggested_recipes_trigger ON plan_meals;
CREATE TRIGGER process_suggested_recipes_trigger
  BEFORE INSERT OR UPDATE ON plan_meals
  FOR EACH ROW
  EXECUTE FUNCTION process_suggested_recipes();

-- Add a comment to document the new structure
COMMENT ON COLUMN plan_meals.recipe_ids IS 'Array of recipe IDs from the recipes table (for saved recipes)';
COMMENT ON COLUMN plan_meals.suggested_recipes IS 'Array of full recipe objects for AI suggestions (temporary, processed by trigger)';
COMMENT ON COLUMN plan_meals.leftover IS 'Flag indicating if this meal is a leftover from a previous meal';
COMMENT ON COLUMN plan_meals.lunchbox IS 'Flag indicating if this meal is intended for lunchbox/packed lunch';
COMMENT ON COLUMN plan_meals.ai_suggested IS 'Flag indicating if this meal was suggested by AI';
COMMENT ON COLUMN plan_meals.is_placeholder IS 'Flag indicating if this is a placeholder meal for user to fill';