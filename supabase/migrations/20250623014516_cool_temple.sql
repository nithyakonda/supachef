/*
  # Update meal_entries table for recipe data structure

  1. Schema Changes
    - Add new `meal_recipes` column as jsonb[] to store recipe data with flags
    - Migrate existing data from `recipe_ids` and individual flag columns
    - Remove old columns after migration
    - Update trigger function to work with new structure

  2. Data Migration
    - Convert recipe_ids array to meal_recipes jsonb array
    - Preserve existing flag values for each recipe
    - Handle cases where flags might be null

  3. Performance
    - Add appropriate indexes for new structure
    - Remove old indexes
*/

-- Step 1: Add the new meal_recipes column as jsonb[]
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meal_entries' AND column_name = 'meal_recipes'
  ) THEN
    ALTER TABLE meal_entries ADD COLUMN meal_recipes jsonb[] DEFAULT '{}'::jsonb[];
  END IF;
END $$;

-- Step 2: Migrate data from the old structure to the new structure
-- This creates a meal_recipes entry for each recipe_id, using the current flag values
UPDATE meal_entries me
SET meal_recipes = (
    SELECT COALESCE(ARRAY_AGG(
        JSONB_BUILD_OBJECT(
            'recipeId', r.id,
            'title', r.title,
            'imageUrl', r.image_url,
            'leftover', COALESCE(me.leftover, FALSE),
            'lunchbox', COALESCE(me.lunchbox, FALSE),
            'aiSuggested', COALESCE(me.ai_suggested, FALSE),
            'isPlaceholder', COALESCE(me.is_placeholder, FALSE)
        )
    ), '{}'::jsonb[])
    FROM UNNEST(me.recipe_ids) AS t(recipe_id)
    JOIN recipes r ON r.id = t.recipe_id
)
WHERE me.recipe_ids IS NOT NULL AND array_length(me.recipe_ids, 1) > 0;

-- Step 3: Drop the old columns after migration
ALTER TABLE meal_entries DROP COLUMN IF EXISTS recipe_ids;
ALTER TABLE meal_entries DROP COLUMN IF EXISTS leftover;
ALTER TABLE meal_entries DROP COLUMN IF EXISTS lunchbox;
ALTER TABLE meal_entries DROP COLUMN IF EXISTS ai_suggested;
ALTER TABLE meal_entries DROP COLUMN IF EXISTS is_placeholder;

-- Step 4: Update the process_suggested_recipes function
-- This function needs to work with the new meal_recipes structure
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
      
      -- Add the new recipe ID and its details to the meal_recipes array
      NEW.meal_recipes := COALESCE(NEW.meal_recipes, '{}'::jsonb[]) || ARRAY[
        JSONB_BUILD_OBJECT(
          'recipeId', new_recipe_id,
          'title', COALESCE(recipe_json->>'title', 'AI Suggested Recipe'),
          'imageUrl', COALESCE(recipe_json->>'imageUrl', 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg'),
          'leftover', FALSE,
          'lunchbox', FALSE,
          'aiSuggested', TRUE, -- This recipe was AI suggested
          'isPlaceholder', FALSE
        )
      ];
    END LOOP;
    
    -- Clear the suggested_recipes array since they've been processed
    NEW.suggested_recipes := '{}';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Drop old indexes related to the removed columns
DROP INDEX IF EXISTS idx_meal_entries_recipe_ids;
DROP INDEX IF EXISTS idx_meal_entries_ai_suggested;
DROP INDEX IF EXISTS idx_meal_entries_is_placeholder;
DROP INDEX IF EXISTS idx_meal_entries_leftover;
DROP INDEX IF EXISTS idx_meal_entries_lunchbox;

-- Step 6: Add new index for the meal_recipes column
CREATE INDEX IF NOT EXISTS idx_meal_entries_meal_recipes ON meal_entries USING GIN(meal_recipes);

-- Step 7: Update comments to reflect the new structure
COMMENT ON COLUMN meal_entries.meal_recipes IS 'Array of recipe objects (id, title, imageUrl, and flags) for meals';
COMMENT ON COLUMN meal_entries.suggested_recipes IS 'Array of full recipe objects for AI suggestions (temporary, processed by trigger)';