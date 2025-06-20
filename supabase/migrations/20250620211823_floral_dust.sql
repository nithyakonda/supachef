/*
  # Rename plan_meals table to meal_entries

  1. Table Rename
    - Rename `plan_meals` table to `meal_entries`
    - Update all related indexes, constraints, and policies
    - Update trigger and function references
    - Update table and column comments

  2. Security
    - Rename all RLS policies to reflect new table name
    - Maintain same security model

  3. Performance
    - Rename all indexes to use new table name
    - Maintain same indexing strategy
*/

-- Rename the table
ALTER TABLE plan_meals RENAME TO meal_entries;

-- Update RLS policies to reflect the new table name
ALTER POLICY "Users can delete own plan meals" ON meal_entries RENAME TO "Users can delete own meal entries";
ALTER POLICY "Users can insert own plan meals" ON meal_entries RENAME TO "Users can insert own meal entries";
ALTER POLICY "Users can read own plan meals" ON meal_entries RENAME TO "Users can read own meal entries";
ALTER POLICY "Users can update own plan meals" ON meal_entries RENAME TO "Users can update own meal entries";

-- Update indexes to reflect the new table name
ALTER INDEX idx_plan_meals_ai_suggested RENAME TO idx_meal_entries_ai_suggested;
ALTER INDEX idx_plan_meals_is_placeholder RENAME TO idx_meal_entries_is_placeholder;
ALTER INDEX idx_plan_meals_leftover RENAME TO idx_meal_entries_leftover;
ALTER INDEX idx_plan_meals_lunchbox RENAME TO idx_meal_entries_lunchbox;
ALTER INDEX idx_plan_meals_meal_plan_id RENAME TO idx_meal_entries_meal_plan_id;
ALTER INDEX idx_plan_meals_recipe_ids RENAME TO idx_meal_entries_recipe_ids;
ALTER INDEX idx_plan_meals_suggested_recipes RENAME TO idx_meal_entries_suggested_recipes;
ALTER INDEX plan_meals_pkey RENAME TO meal_entries_pkey;

-- Update foreign key constraints
ALTER TABLE meal_entries DROP CONSTRAINT IF EXISTS plan_meals_meal_plan_id_fkey;
ALTER TABLE meal_entries ADD CONSTRAINT meal_entries_meal_plan_id_fkey FOREIGN KEY (meal_plan_id) REFERENCES meal_plans(id) ON DELETE CASCADE;

-- Update trigger to reflect the new table name
DROP TRIGGER IF EXISTS process_suggested_recipes_trigger ON meal_entries;
CREATE TRIGGER process_suggested_recipes_trigger
  BEFORE INSERT OR UPDATE ON meal_entries
  FOR EACH ROW
  EXECUTE FUNCTION process_suggested_recipes();

-- Update comments to reflect the new table name
COMMENT ON TABLE meal_entries IS 'Individual meal entries within meal plans, using recipe_ids array for multiple recipes per meal';
COMMENT ON COLUMN meal_entries.recipe_ids IS 'Array of recipe IDs from the recipes table (for saved recipes)';
COMMENT ON COLUMN meal_entries.suggested_recipes IS 'Array of full recipe objects for AI suggestions (temporary, processed by trigger)';
COMMENT ON COLUMN meal_entries.leftover IS 'Flag indicating if this meal is a leftover from a previous meal';
COMMENT ON COLUMN meal_entries.lunchbox IS 'Flag indicating if this meal is intended for lunchbox/packed lunch';
COMMENT ON COLUMN meal_entries.ai_suggested IS 'Flag indicating if this meal was suggested by AI';
COMMENT ON COLUMN meal_entries.is_placeholder IS 'Flag indicating if this is a placeholder meal for user to fill';