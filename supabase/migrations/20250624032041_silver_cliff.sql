/*
  # Seed Sample Data for SupaChef App

  1. Sample Data
    - Insert sample recipes for user 6a304f8b-5f01-4273-b4d9-a154e03e0762
    - Insert user preferences for the same user
    - Insert sample meal plans for the current week

  2. Data Structure
    - 8 sample recipes with various cuisines and difficulty levels
    - User preferences with default settings
    - Weekly meal plan with meals assigned to different days
*/

-- Insert sample recipes for the specified user
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
  rating,
  notes,
  is_favorite,
  user_id
) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440001',
  'Butternut Soup with Avocado & Chickpeas',
  'A creamy, nutritious soup perfect for autumn',
  'https://images.pexels.com/photos/8477434/pexels-photo-8477434.jpeg',
  45,
  4,
  'Easy',
  320,
  '[
    {"name": "Butternut Squash Soup", "amount": "1", "unit": "15-ounce can"},
    {"name": "Diced avocado", "amount": "1", "unit": "cup"},
    {"name": "Lime juice", "amount": "1", "unit": "tablespoon"},
    {"name": "Curry powder", "amount": "1", "unit": "teaspoon"},
    {"name": "Plain Greek yogurt", "amount": "1/4", "unit": "cup"}
  ]'::jsonb,
  ARRAY['Heat soup according to package directions', 'Prepare avocado and lime mixture', 'Serve hot with toppings'],
  ARRAY['Vegetarian', 'Healthy', 'Soup'],
  5,
  'Perfect for cold days',
  true,
  '6a304f8b-5f01-4273-b4d9-a154e03e0762'
),
(
  '550e8400-e29b-41d4-a716-446655440002',
  'Mediterranean Quinoa Bowl',
  'Fresh and healthy Mediterranean-inspired bowl',
  'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg',
  25,
  2,
  'Easy',
  420,
  '[
    {"name": "Quinoa", "amount": "1", "unit": "cup"},
    {"name": "Cherry tomatoes", "amount": "1", "unit": "cup"},
    {"name": "Cucumber", "amount": "1", "unit": "medium"},
    {"name": "Feta cheese", "amount": "1/2", "unit": "cup"},
    {"name": "Olive oil", "amount": "2", "unit": "tablespoons"}
  ]'::jsonb,
  ARRAY['Cook quinoa according to package directions', 'Chop vegetables', 'Combine all ingredients and toss with olive oil'],
  ARRAY['Mediterranean', 'Vegetarian', 'Healthy'],
  4,
  '',
  false,
  '6a304f8b-5f01-4273-b4d9-a154e03e0762'
),
(
  '550e8400-e29b-41d4-a716-446655440003',
  'Avocado Toast with Poached Egg',
  'Classic breakfast with a nutritious twist',
  'https://images.pexels.com/photos/566566/pexels-photo-566566.jpeg',
  15,
  1,
  'Easy',
  350,
  '[
    {"name": "Whole grain bread", "amount": "2", "unit": "slices"},
    {"name": "Avocado", "amount": "1", "unit": "medium"},
    {"name": "Eggs", "amount": "2", "unit": "large"},
    {"name": "Lemon juice", "amount": "1", "unit": "teaspoon"},
    {"name": "Salt and pepper", "amount": "to taste"}
  ]'::jsonb,
  ARRAY['Toast bread slices', 'Mash avocado with lemon juice', 'Poach eggs', 'Assemble and season'],
  ARRAY['Breakfast', 'Healthy', 'Quick'],
  5,
  '',
  true,
  '6a304f8b-5f01-4273-b4d9-a154e03e0762'
),
(
  '550e8400-e29b-41d4-a716-446655440004',
  'Grilled Chicken Caesar Salad',
  'Classic Caesar salad with perfectly grilled chicken',
  'https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg',
  30,
  2,
  'Medium',
  380,
  '[
    {"name": "Chicken breast", "amount": "2", "unit": "pieces"},
    {"name": "Romaine lettuce", "amount": "1", "unit": "head"},
    {"name": "Parmesan cheese", "amount": "1/2", "unit": "cup"},
    {"name": "Caesar dressing", "amount": "1/4", "unit": "cup"},
    {"name": "Croutons", "amount": "1", "unit": "cup"}
  ]'::jsonb,
  ARRAY['Season and grill chicken breast', 'Chop romaine lettuce', 'Toss with dressing and toppings', 'Slice chicken and serve on top'],
  ARRAY['Protein', 'Salad', 'Lunch'],
  4,
  '',
  false,
  '6a304f8b-5f01-4273-b4d9-a154e03e0762'
),
(
  '550e8400-e29b-41d4-a716-446655440005',
  'Spaghetti Carbonara',
  'Creamy Italian pasta with pancetta and eggs',
  'https://images.pexels.com/photos/4518843/pexels-photo-4518843.jpeg',
  20,
  4,
  'Medium',
  520,
  '[
    {"name": "Spaghetti", "amount": "400", "unit": "g"},
    {"name": "Pancetta", "amount": "150", "unit": "g"},
    {"name": "Eggs", "amount": "3", "unit": "large"},
    {"name": "Parmesan cheese", "amount": "1", "unit": "cup"},
    {"name": "Black pepper", "amount": "to taste"}
  ]'::jsonb,
  ARRAY['Cook spaghetti according to package directions', 'Crisp pancetta in a large pan', 'Whisk eggs with cheese and pepper', 'Toss hot pasta with egg mixture and pancetta'],
  ARRAY['Italian', 'Pasta', 'Dinner'],
  5,
  '',
  true,
  '6a304f8b-5f01-4273-b4d9-a154e03e0762'
),
(
  '550e8400-e29b-41d4-a716-446655440006',
  'Berry Smoothie Bowl',
  'Nutritious smoothie bowl topped with fresh fruits',
  'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg',
  10,
  1,
  'Easy',
  280,
  '[
    {"name": "Frozen berries", "amount": "1", "unit": "cup"},
    {"name": "Banana", "amount": "1", "unit": "medium"},
    {"name": "Greek yogurt", "amount": "1/2", "unit": "cup"},
    {"name": "Granola", "amount": "1/4", "unit": "cup"},
    {"name": "Honey", "amount": "1", "unit": "tablespoon"}
  ]'::jsonb,
  ARRAY['Blend frozen berries, banana, and yogurt', 'Pour into bowl', 'Top with granola and honey', 'Add fresh fruit as desired'],
  ARRAY['Breakfast', 'Healthy', 'Smoothie'],
  4,
  '',
  false,
  '6a304f8b-5f01-4273-b4d9-a154e03e0762'
),
(
  '550e8400-e29b-41d4-a716-446655440007',
  'Greek Yogurt Parfait',
  'Layered parfait with yogurt, berries, and granola',
  'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg',
  5,
  1,
  'Easy',
  250,
  '[
    {"name": "Greek yogurt", "amount": "1", "unit": "cup"},
    {"name": "Mixed berries", "amount": "1/2", "unit": "cup"},
    {"name": "Granola", "amount": "1/4", "unit": "cup"},
    {"name": "Honey", "amount": "1", "unit": "tablespoon"}
  ]'::jsonb,
  ARRAY['Layer yogurt in glass', 'Add berries and granola', 'Repeat layers', 'Drizzle with honey'],
  ARRAY['Breakfast', 'Healthy', 'Quick'],
  4,
  '',
  false,
  '6a304f8b-5f01-4273-b4d9-a154e03e0762'
),
(
  '550e8400-e29b-41d4-a716-446655440008',
  'Overnight Oats',
  'Make-ahead breakfast with oats and your favorite toppings',
  'https://images.pexels.com/photos/704569/pexels-photo-704569.jpeg',
  5,
  1,
  'Easy',
  300,
  '[
    {"name": "Rolled oats", "amount": "1/2", "unit": "cup"},
    {"name": "Milk", "amount": "1/2", "unit": "cup"},
    {"name": "Chia seeds", "amount": "1", "unit": "tablespoon"},
    {"name": "Maple syrup", "amount": "1", "unit": "tablespoon"},
    {"name": "Vanilla extract", "amount": "1/2", "unit": "teaspoon"}
  ]'::jsonb,
  ARRAY['Mix all ingredients in a jar', 'Refrigerate overnight', 'Add toppings in the morning', 'Enjoy cold or warm'],
  ARRAY['Breakfast', 'Make-ahead', 'Healthy'],
  5,
  '',
  true,
  '6a304f8b-5f01-4273-b4d9-a154e03e0762'
);

-- Insert user preferences for the specified user
INSERT INTO user_preferences (
  id,
  user_id,
  favorite_cuisines,
  meal_planning_days,
  dietary_restrictions,
  allergies,
  meal_types,
  cooking_experience,
  needs_lunchbox,
  prefers_leftovers,
  number_of_adults,
  number_of_kids
) VALUES (
  '550e8400-e29b-41d4-a716-446655440100',
  '6a304f8b-5f01-4273-b4d9-a154e03e0762',
  ARRAY['Italian', 'Mediterranean', 'American'],
  ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  ARRAY['None'],
  ARRAY['None'],
  ARRAY['Breakfast', 'Lunch', 'Dinner'],
  'Intermediate',
  false,
  true,
  2,
  0
) ON CONFLICT (user_id) DO UPDATE SET
  favorite_cuisines = EXCLUDED.favorite_cuisines,
  meal_planning_days = EXCLUDED.meal_planning_days,
  dietary_restrictions = EXCLUDED.dietary_restrictions,
  allergies = EXCLUDED.allergies,
  meal_types = EXCLUDED.meal_types,
  cooking_experience = EXCLUDED.cooking_experience,
  needs_lunchbox = EXCLUDED.needs_lunchbox,
  prefers_leftovers = EXCLUDED.prefers_leftovers,
  number_of_adults = EXCLUDED.number_of_adults,
  number_of_kids = EXCLUDED.number_of_kids,
  updated_at = now();

-- Insert sample meal plans for the current week
-- We'll create meal plans for the next 7 days starting from today
DO $$
DECLARE
  plan_id_sunday uuid := '550e8400-e29b-41d4-a716-446655440200';
  plan_id_monday uuid := '550e8400-e29b-41d4-a716-446655440201';
  plan_id_tuesday uuid := '550e8400-e29b-41d4-a716-446655440202';
  plan_id_wednesday uuid := '550e8400-e29b-41d4-a716-446655440203';
  plan_id_thursday uuid := '550e8400-e29b-41d4-a716-446655440204';
  plan_id_friday uuid := '550e8400-e29b-41d4-a716-446655440205';
  plan_id_saturday uuid := '550e8400-e29b-41d4-a716-446655440206';
  current_sunday date;
BEGIN
  -- Calculate the start of the current week (Sunday)
  current_sunday := date_trunc('week', CURRENT_DATE)::date;
  
  -- Insert meal plans for each day of the week
  INSERT INTO meal_plans (id, user_id, plan_date, ingredients_used, preferences_snapshot) VALUES
  (plan_id_sunday, '6a304f8b-5f01-4273-b4d9-a154e03e0762', current_sunday, '[]'::jsonb, '{}'::jsonb),
  (plan_id_monday, '6a304f8b-5f01-4273-b4d9-a154e03e0762', current_sunday + 1, '[]'::jsonb, '{}'::jsonb),
  (plan_id_tuesday, '6a304f8b-5f01-4273-b4d9-a154e03e0762', current_sunday + 2, '[]'::jsonb, '{}'::jsonb),
  (plan_id_wednesday, '6a304f8b-5f01-4273-b4d9-a154e03e0762', current_sunday + 3, '[]'::jsonb, '{}'::jsonb),
  (plan_id_thursday, '6a304f8b-5f01-4273-b4d9-a154e03e0762', current_sunday + 4, '[]'::jsonb, '{}'::jsonb),
  (plan_id_friday, '6a304f8b-5f01-4273-b4d9-a154e03e0762', current_sunday + 5, '[]'::jsonb, '{}'::jsonb),
  (plan_id_saturday, '6a304f8b-5f01-4273-b4d9-a154e03e0762', current_sunday + 6, '[]'::jsonb, '{}'::jsonb)
  ON CONFLICT (user_id, plan_date) DO NOTHING;

  -- Insert meal entries for Sunday
  INSERT INTO meal_entries (meal_plan_id, meal_type, meal_time, meal_recipes, is_completed) VALUES
  (plan_id_sunday, 'breakfast', '9:00 AM', ARRAY[
    '{"recipeId": "550e8400-e29b-41d4-a716-446655440006", "title": "Berry Smoothie Bowl", "imageUrl": "https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg", "leftover": true, "lunchbox": true, "aiSuggested": true, "isPlaceholder": false}'::jsonb
  ], false),
  (plan_id_sunday, 'breakfast', '9:00 AM', ARRAY[
    '{"recipeId": "550e8400-e29b-41d4-a716-446655440007", "title": "Greek Yogurt Parfait", "imageUrl": "https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg", "leftover": true, "lunchbox": true, "aiSuggested": true, "isPlaceholder": false}'::jsonb
  ], false),
  (plan_id_sunday, 'lunch', '1:00 PM', ARRAY[
    '{"recipeId": "550e8400-e29b-41d4-a716-446655440002", "title": "Mediterranean Quinoa Bowl", "imageUrl": "https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg", "leftover": false, "lunchbox": true, "aiSuggested": false, "isPlaceholder": false}'::jsonb
  ], false),
  (plan_id_sunday, 'dinner', '7:00 PM', ARRAY[
    '{"recipeId": "550e8400-e29b-41d4-a716-446655440005", "title": "Spaghetti Carbonara", "imageUrl": "https://images.pexels.com/photos/4518843/pexels-photo-4518843.jpeg", "leftover": false, "lunchbox": false, "aiSuggested": false, "isPlaceholder": false}'::jsonb
  ], false);

  -- Insert meal entries for Monday
  INSERT INTO meal_entries (meal_plan_id, meal_type, meal_time, meal_recipes, is_completed) VALUES
  (plan_id_monday, 'breakfast', '8:00 AM', ARRAY[
    '{"recipeId": "550e8400-e29b-41d4-a716-446655440003", "title": "Avocado Toast with Poached Egg", "imageUrl": "https://images.pexels.com/photos/566566/pexels-photo-566566.jpeg", "leftover": false, "lunchbox": false, "aiSuggested": false, "isPlaceholder": false}'::jsonb
  ], false),
  (plan_id_monday, 'breakfast', '8:00 AM', ARRAY[
    '{"recipeId": "550e8400-e29b-41d4-a716-446655440008", "title": "Overnight Oats", "imageUrl": "https://images.pexels.com/photos/704569/pexels-photo-704569.jpeg", "leftover": true, "lunchbox": true, "aiSuggested": false, "isPlaceholder": false}'::jsonb
  ], false),
  (plan_id_monday, 'breakfast', '8:00 AM', ARRAY[
    '{"recipeId": "550e8400-e29b-41d4-a716-446655440007", "title": "Greek Yogurt Parfait", "imageUrl": "https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg", "leftover": false, "lunchbox": false, "aiSuggested": false, "isPlaceholder": false}'::jsonb
  ], false),
  (plan_id_monday, 'lunch', '12:30 PM', ARRAY[
    '{"recipeId": "550e8400-e29b-41d4-a716-446655440004", "title": "Grilled Chicken Caesar Salad", "imageUrl": "https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg", "leftover": false, "lunchbox": false, "aiSuggested": true, "isPlaceholder": false}'::jsonb
  ], false),
  (plan_id_monday, 'dinner', '7:00 PM', ARRAY[
    '{"recipeId": "550e8400-e29b-41d4-a716-446655440001", "title": "Butternut Soup with Avocado & Chickpeas", "imageUrl": "https://images.pexels.com/photos/8477434/pexels-photo-8477434.jpeg", "leftover": false, "lunchbox": false, "aiSuggested": false, "isPlaceholder": false}'::jsonb
  ], false);

  -- Insert meal entries for Tuesday
  INSERT INTO meal_entries (meal_plan_id, meal_type, meal_time, meal_recipes, is_completed) VALUES
  (plan_id_tuesday, 'breakfast', '8:00 AM', ARRAY[
    '{"recipeId": "550e8400-e29b-41d4-a716-446655440006", "title": "Berry Smoothie Bowl", "imageUrl": "https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg", "leftover": true, "lunchbox": false, "aiSuggested": false, "isPlaceholder": false}'::jsonb
  ], false),
  (plan_id_tuesday, 'lunch', '12:30 PM', ARRAY[
    '{"recipeId": "placeholder-lunch-1", "title": "Your Recipe Here", "imageUrl": "https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg", "leftover": false, "lunchbox": false, "aiSuggested": false, "isPlaceholder": true}'::jsonb
  ], false),
  (plan_id_tuesday, 'lunch', '12:30 PM', ARRAY[
    '{"recipeId": "550e8400-e29b-41d4-a716-446655440004", "title": "Grilled Chicken Caesar Salad", "imageUrl": "https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg", "leftover": true, "lunchbox": true, "aiSuggested": true, "isPlaceholder": false}'::jsonb
  ], false);

  -- Insert meal entries for Wednesday
  INSERT INTO meal_entries (meal_plan_id, meal_type, meal_time, meal_recipes, is_completed) VALUES
  (plan_id_wednesday, 'breakfast', '8:00 AM', ARRAY[
    '{"recipeId": "550e8400-e29b-41d4-a716-446655440003", "title": "Avocado Toast with Poached Egg", "imageUrl": "https://images.pexels.com/photos/566566/pexels-photo-566566.jpeg", "leftover": false, "lunchbox": false, "aiSuggested": false, "isPlaceholder": false}'::jsonb
  ], false),
  (plan_id_wednesday, 'lunch', '12:30 PM', ARRAY[
    '{"recipeId": "550e8400-e29b-41d4-a716-446655440004", "title": "Grilled Chicken Caesar Salad", "imageUrl": "https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg", "leftover": false, "lunchbox": true, "aiSuggested": true, "isPlaceholder": false}'::jsonb
  ], false),
  (plan_id_wednesday, 'dinner', '7:00 PM', ARRAY[
    '{"recipeId": "550e8400-e29b-41d4-a716-446655440005", "title": "Spaghetti Carbonara", "imageUrl": "https://images.pexels.com/photos/4518843/pexels-photo-4518843.jpeg", "leftover": false, "lunchbox": false, "aiSuggested": false, "isPlaceholder": false}'::jsonb
  ], false);

  -- Insert meal entries for Thursday
  INSERT INTO meal_entries (meal_plan_id, meal_type, meal_time, meal_recipes, is_completed) VALUES
  (plan_id_thursday, 'breakfast', '8:00 AM', ARRAY[
    '{"recipeId": "550e8400-e29b-41d4-a716-446655440006", "title": "Berry Smoothie Bowl", "imageUrl": "https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg", "leftover": false, "lunchbox": true, "aiSuggested": false, "isPlaceholder": false}'::jsonb
  ], false),
  (plan_id_thursday, 'dinner', '7:00 PM', ARRAY[
    '{"recipeId": "550e8400-e29b-41d4-a716-446655440001", "title": "Butternut Soup with Avocado & Chickpeas", "imageUrl": "https://images.pexels.com/photos/8477434/pexels-photo-8477434.jpeg", "leftover": true, "lunchbox": false, "aiSuggested": true, "isPlaceholder": false}'::jsonb
  ], false),
  (plan_id_thursday, 'dinner', '7:00 PM', ARRAY[
    '{"recipeId": "550e8400-e29b-41d4-a716-446655440005", "title": "Spaghetti Carbonara", "imageUrl": "https://images.pexels.com/photos/4518843/pexels-photo-4518843.jpeg", "leftover": false, "lunchbox": false, "aiSuggested": false, "isPlaceholder": false}'::jsonb
  ], false);

  -- Insert meal entries for Friday
  INSERT INTO meal_entries (meal_plan_id, meal_type, meal_time, meal_recipes, is_completed) VALUES
  (plan_id_friday, 'breakfast', '8:00 AM', ARRAY[
    '{"recipeId": "550e8400-e29b-41d4-a716-446655440003", "title": "Avocado Toast with Poached Egg", "imageUrl": "https://images.pexels.com/photos/566566/pexels-photo-566566.jpeg", "leftover": false, "lunchbox": true, "aiSuggested": false, "isPlaceholder": false}'::jsonb
  ], false),
  (plan_id_friday, 'lunch', '12:30 PM', ARRAY[
    '{"recipeId": "550e8400-e29b-41d4-a716-446655440002", "title": "Mediterranean Quinoa Bowl", "imageUrl": "https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg", "leftover": false, "lunchbox": true, "aiSuggested": true, "isPlaceholder": false}'::jsonb
  ], false),
  (plan_id_friday, 'dinner', '7:00 PM', ARRAY[
    '{"recipeId": "550e8400-e29b-41d4-a716-446655440005", "title": "Spaghetti Carbonara", "imageUrl": "https://images.pexels.com/photos/4518843/pexels-photo-4518843.jpeg", "leftover": true, "lunchbox": false, "aiSuggested": false, "isPlaceholder": false}'::jsonb
  ], false);

  -- Saturday has no meals planned (empty day)
END $$;