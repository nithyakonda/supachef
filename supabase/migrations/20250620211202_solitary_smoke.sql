/*
  # Remove deprecated recipe_id column

  1. Changes
    - Drop the `recipe_id` column from `plan_meals` table
    - Drop the foreign key constraint for `recipe_id`
    - Drop the index for `recipe_id`
    - Update comments to reflect the new structure

  This migration removes backward compatibility fields since this is a fresh database.
*/

-- Drop the foreign key constraint first
ALTER TABLE plan_meals DROP CONSTRAINT IF EXISTS plan_meals_recipe_id_fkey;

-- Drop the index
DROP INDEX IF EXISTS idx_plan_meals_recipe_id;

-- Drop the recipe_id column
ALTER TABLE plan_meals DROP COLUMN IF EXISTS recipe_id;

-- Update table comment to reflect the new structure
COMMENT ON TABLE plan_meals IS 'Meals within meal plans, using recipe_ids array for multiple recipes per meal';