import { Recipe, MealPlan, Meal, MealRecipeData } from '@/types';

export const sampleRecipes: Recipe[] = [
  {
    id: '1',
    title: 'Butternut Soup with Avocado & Chickpeas',
    description: 'A creamy, nutritious soup perfect for autumn',
    imageUrl: 'https://images.pexels.com/photos/8477434/pexels-photo-8477434.jpeg',
    cookingTime: 45,
    servings: 4,
    difficulty: 'Easy',
    calories: 320,
    ingredients: [
      { name: 'Butternut Squash Soup', amount: '1', unit: '15-ounce can' },
      { name: 'Diced avocado', amount: '1', unit: 'cup' },
      { name: 'Lime juice', amount: '1', unit: 'tablespoon' },
      { name: 'Diced avocado', amount: '2', unit: 'tablespoons' },
      { name: 'Curry powder', amount: '1', unit: 'teaspoon' },
      { name: 'Plain Greek yogurt', amount: '1/4', unit: 'cup' }
    ],
    instructions: [
      'Heat soup according to package directions',
      'Prepare avocado and lime mixture',
      'Serve hot with toppings'
    ],
    tags: ['Vegetarian', 'Healthy', 'Soup'],
    isFavorite: true,
    createdAt: new Date(),
  },
  {
    id: '2',
    title: 'Mediterranean Quinoa Bowl',
    description: 'Fresh and healthy Mediterranean-inspired bowl',
    imageUrl: 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg',
    cookingTime: 25,
    servings: 2,
    difficulty: 'Easy',
    calories: 420,
    ingredients: [
      { name: 'Quinoa', amount: '1', unit: 'cup' },
      { name: 'Cherry tomatoes', amount: '1', unit: 'cup' },
      { name: 'Cucumber', amount: '1', unit: 'medium' },
      { name: 'Feta cheese', amount: '1/2', unit: 'cup' },
      { name: 'Olive oil', amount: '2', unit: 'tablespoons' }
    ],
    instructions: [
      'Cook quinoa according to package directions',
      'Chop vegetables',
      'Combine all ingredients and toss with olive oil'
    ],
    tags: ['Mediterranean', 'Vegetarian', 'Healthy'],
    isFavorite: false,
    createdAt: new Date(),
  },
  {
    id: '3',
    title: 'Avocado Toast with Poached Egg',
    description: 'Classic breakfast with a nutritious twist',
    imageUrl: 'https://images.pexels.com/photos/566566/pexels-photo-566566.jpeg',
    cookingTime: 15,
    servings: 1,
    difficulty: 'Easy',
    calories: 350,
    ingredients: [
      { name: 'Whole grain bread', amount: '2', unit: 'slices' },
      { name: 'Avocado', amount: '1', unit: 'medium' },
      { name: 'Eggs', amount: '2', unit: 'large' },
      { name: 'Lemon juice', amount: '1', unit: 'teaspoon' },
      { name: 'Salt and pepper', amount: 'to taste' }
    ],
    instructions: [
      'Toast bread slices',
      'Mash avocado with lemon juice',
      'Poach eggs',
      'Assemble and season'
    ],
    tags: ['Breakfast', 'Healthy', 'Quick'],
    isFavorite: true,
    createdAt: new Date(),
  },
  {
    id: '4',
    title: 'Grilled Chicken Caesar Salad',
    description: 'Classic Caesar salad with perfectly grilled chicken',
    imageUrl: 'https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg',
    cookingTime: 30,
    servings: 2,
    difficulty: 'Medium',
    calories: 380,
    ingredients: [
      { name: 'Chicken breast', amount: '2', unit: 'pieces' },
      { name: 'Romaine lettuce', amount: '1', unit: 'head' },
      { name: 'Parmesan cheese', amount: '1/2', unit: 'cup' },
      { name: 'Caesar dressing', amount: '1/4', unit: 'cup' },
      { name: 'Croutons', amount: '1', unit: 'cup' }
    ],
    instructions: [
      'Season and grill chicken breast',
      'Chop romaine lettuce',
      'Toss with dressing and toppings',
      'Slice chicken and serve on top'
    ],
    tags: ['Protein', 'Salad', 'Lunch'],
    isFavorite: false,
    createdAt: new Date(),
  },
  {
    id: '5',
    title: 'Spaghetti Carbonara',
    description: 'Creamy Italian pasta with pancetta and eggs',
    imageUrl: 'https://images.pexels.com/photos/4518843/pexels-photo-4518843.jpeg',
    cookingTime: 20,
    servings: 4,
    difficulty: 'Medium',
    calories: 520,
    ingredients: [
      { name: 'Spaghetti', amount: '400', unit: 'g' },
      { name: 'Pancetta', amount: '150', unit: 'g' },
      { name: 'Eggs', amount: '3', unit: 'large' },
      { name: 'Parmesan cheese', amount: '1', unit: 'cup' },
      { name: 'Black pepper', amount: 'to taste' }
    ],
    instructions: [
      'Cook spaghetti according to package directions',
      'Crisp pancetta in a large pan',
      'Whisk eggs with cheese and pepper',
      'Toss hot pasta with egg mixture and pancetta'
    ],
    tags: ['Italian', 'Pasta', 'Dinner'],
    isFavorite: true,
    createdAt: new Date(),
  },
  {
    id: '6',
    title: 'Berry Smoothie Bowl',
    description: 'Nutritious smoothie bowl topped with fresh fruits',
    imageUrl: 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg',
    cookingTime: 10,
    servings: 1,
    difficulty: 'Easy',
    calories: 280,
    ingredients: [
      { name: 'Frozen berries', amount: '1', unit: 'cup' },
      { name: 'Banana', amount: '1', unit: 'medium' },
      { name: 'Greek yogurt', amount: '1/2', unit: 'cup' },
      { name: 'Granola', amount: '1/4', unit: 'cup' },
      { name: 'Honey', amount: '1', unit: 'tablespoon' }
    ],
    instructions: [
      'Blend frozen berries, banana, and yogurt',
      'Pour into bowl',
      'Top with granola and honey',
      'Add fresh fruit as desired'
    ],
    tags: ['Breakfast', 'Healthy', 'Smoothie'],
    isFavorite: false,
    createdAt: new Date(),
  },
  {
    id: '7',
    title: 'Greek Yogurt Parfait',
    description: 'Layered parfait with yogurt, berries, and granola',
    imageUrl: 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg',
    cookingTime: 5,
    servings: 1,
    difficulty: 'Easy',
    calories: 250,
    ingredients: [
      { name: 'Greek yogurt', amount: '1', unit: 'cup' },
      { name: 'Mixed berries', amount: '1/2', unit: 'cup' },
      { name: 'Granola', amount: '1/4', unit: 'cup' },
      { name: 'Honey', amount: '1', unit: 'tablespoon' }
    ],
    instructions: [
      'Layer yogurt in glass',
      'Add berries and granola',
      'Repeat layers',
      'Drizzle with honey'
    ],
    tags: ['Breakfast', 'Healthy', 'Quick'],
    isFavorite: false,
    createdAt: new Date(),
  },
  {
    id: '8',
    title: 'Overnight Oats',
    description: 'Make-ahead breakfast with oats and your favorite toppings',
    imageUrl: 'https://images.pexels.com/photos/704569/pexels-photo-704569.jpeg',
    cookingTime: 5,
    servings: 1,
    difficulty: 'Easy',
    calories: 300,
    ingredients: [
      { name: 'Rolled oats', amount: '1/2', unit: 'cup' },
      { name: 'Milk', amount: '1/2', unit: 'cup' },
      { name: 'Chia seeds', amount: '1', unit: 'tablespoon' },
      { name: 'Maple syrup', amount: '1', unit: 'tablespoon' },
      { name: 'Vanilla extract', amount: '1/2', unit: 'teaspoon' }
    ],
    instructions: [
      'Mix all ingredients in a jar',
      'Refrigerate overnight',
      'Add toppings in the morning',
      'Enjoy cold or warm'
    ],
    tags: ['Breakfast', 'Make-ahead', 'Healthy'],
    isFavorite: true,
    createdAt: new Date(),
  }
];

// Helper function to get week dates starting from Sunday
export const getWeekDatesForPlan = (date: Date = new Date()) => {
  const week = [];
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay()); // Start from Sunday
  
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    week.push(day);
  }
  return week;
};

// Generate sample weekly meal plans with multiple meals for testing carousel
export const generateSampleWeeklyMealPlans = (): MealPlan[] => {
  const weekDates = getWeekDatesForPlan();
  
  return weekDates.map((date, index) => {
    const dayMeals: Meal[] = [];
    
    // Add different meals for different days
    switch (index) {
      case 0: // Sunday
        dayMeals.push(
          {
            id: `${index}-breakfast-1`,
            type: 'breakfast',
            mealRecipes: [{
              recipeId: sampleRecipes[5].id,
              title: sampleRecipes[5].title,
              imageUrl: sampleRecipes[5].imageUrl,
              leftover: false,
              lunchbox: false,
              aiSuggested: false,
              isPlaceholder: false,
            }],
            time: '9:00 AM',
            isCompleted: false,
          },
          {
            id: `${index}-breakfast-2`,
            type: 'breakfast',
            mealRecipes: [{
              recipeId: sampleRecipes[6].id,
              title: sampleRecipes[6].title,
              imageUrl: sampleRecipes[6].imageUrl,
              leftover: false,
              lunchbox: false,
              aiSuggested: false,
              isPlaceholder: false,
            }],
            time: '9:00 AM',
            isCompleted: false,
          },
          {
            id: `${index}-lunch`,
            type: 'lunch',
            mealRecipes: [{
              recipeId: sampleRecipes[1].id,
              title: sampleRecipes[1].title,
              imageUrl: sampleRecipes[1].imageUrl,
              leftover: false,
              lunchbox: false,
              aiSuggested: false,
              isPlaceholder: false,
            }],
            time: '1:00 PM',
            isCompleted: false,
          },
          {
            id: `${index}-dinner`,
            type: 'dinner',
            mealRecipes: [{
              recipeId: sampleRecipes[4].id,
              title: sampleRecipes[4].title,
              imageUrl: sampleRecipes[4].imageUrl,
              leftover: false,
              lunchbox: false,
              aiSuggested: false,
              isPlaceholder: false,
            }],
            time: '7:00 PM',
            isCompleted: false,
          }
        );
        break;
      case 1: // Monday
        dayMeals.push(
          {
            id: `${index}-breakfast-1`,
            type: 'breakfast',
            mealRecipes: [{
              recipeId: sampleRecipes[2].id,
              title: sampleRecipes[2].title,
              imageUrl: sampleRecipes[2].imageUrl,
              leftover: false,
              lunchbox: false,
              aiSuggested: false,
              isPlaceholder: false,
            }],
            time: '8:00 AM',
            isCompleted: false,
          },
          {
            id: `${index}-breakfast-2`,
            type: 'breakfast',
            mealRecipes: [{
              recipeId: sampleRecipes[7].id,
              title: sampleRecipes[7].title,
              imageUrl: sampleRecipes[7].imageUrl,
              leftover: false,
              lunchbox: false,
              aiSuggested: false,
              isPlaceholder: false,
            }],
            time: '8:00 AM',
            isCompleted: false,
          },
          {
            id: `${index}-breakfast-3`,
            type: 'breakfast',
            mealRecipes: [{
              recipeId: sampleRecipes[6].id,
              title: sampleRecipes[6].title,
              imageUrl: sampleRecipes[6].imageUrl,
              leftover: false,
              lunchbox: false,
              aiSuggested: false,
              isPlaceholder: false,
            }],
            time: '8:00 AM',
            isCompleted: false,
          },
          {
            id: `${index}-lunch`,
            type: 'lunch',
            mealRecipes: [{
              recipeId: sampleRecipes[3].id,
              title: sampleRecipes[3].title,
              imageUrl: sampleRecipes[3].imageUrl,
              leftover: false,
              lunchbox: false,
              aiSuggested: false,
              isPlaceholder: false,
            }],
            time: '12:30 PM',
            isCompleted: false,
          },
          {
            id: `${index}-dinner`,
            type: 'dinner',
            mealRecipes: [{
              recipeId: sampleRecipes[0].id,
              title: sampleRecipes[0].title,
              imageUrl: sampleRecipes[0].imageUrl,
              leftover: false,
              lunchbox: false,
              aiSuggested: false,
              isPlaceholder: false,
            }],
            time: '7:00 PM',
            isCompleted: false,
          }
        );
        break;
      case 2: // Tuesday
        dayMeals.push(
          {
            id: `${index}-breakfast`,
            type: 'breakfast',
            mealRecipes: [{
              recipeId: sampleRecipes[5].id,
              title: sampleRecipes[5].title,
              imageUrl: sampleRecipes[5].imageUrl,
              leftover: false,
              lunchbox: false,
              aiSuggested: false,
              isPlaceholder: false,
            }],
            time: '8:00 AM',
            isCompleted: false,
          },
          {
            id: `${index}-lunch-1`,
            type: 'lunch',
            mealRecipes: [{
              recipeId: sampleRecipes[1].id,
              title: sampleRecipes[1].title,
              imageUrl: sampleRecipes[1].imageUrl,
              leftover: false,
              lunchbox: false,
              aiSuggested: false,
              isPlaceholder: false,
            }],
            time: '12:30 PM',
            isCompleted: false,
          },
          {
            id: `${index}-lunch-2`,
            type: 'lunch',
            mealRecipes: [{
              recipeId: sampleRecipes[3].id,
              title: sampleRecipes[3].title,
              imageUrl: sampleRecipes[3].imageUrl,
              leftover: false,
              lunchbox: false,
              aiSuggested: false,
              isPlaceholder: false,
            }],
            time: '12:30 PM',
            isCompleted: false,
          }
        );
        break;
      case 3: // Wednesday
        dayMeals.push(
          {
            id: `${index}-breakfast`,
            type: 'breakfast',
            mealRecipes: [{
              recipeId: sampleRecipes[2].id,
              title: sampleRecipes[2].title,
              imageUrl: sampleRecipes[2].imageUrl,
              leftover: false,
              lunchbox: false,
              aiSuggested: false,
              isPlaceholder: false,
            }],
            time: '8:00 AM',
            isCompleted: false,
          },
          {
            id: `${index}-lunch`,
            type: 'lunch',
            mealRecipes: [{
              recipeId: sampleRecipes[3].id,
              title: sampleRecipes[3].title,
              imageUrl: sampleRecipes[3].imageUrl,
              leftover: false,
              lunchbox: false,
              aiSuggested: false,
              isPlaceholder: false,
            }],
            time: '12:30 PM',
            isCompleted: false,
          },
          {
            id: `${index}-dinner`,
            type: 'dinner',
            mealRecipes: [{
              recipeId: sampleRecipes[4].id,
              title: sampleRecipes[4].title,
              imageUrl: sampleRecipes[4].imageUrl,
              leftover: false,
              lunchbox: false,
              aiSuggested: false,
              isPlaceholder: false,
            }],
            time: '7:00 PM',
            isCompleted: false,
          }
        );
        break;
      case 4: // Thursday
        dayMeals.push(
          {
            id: `${index}-breakfast`,
            type: 'breakfast',
            mealRecipes: [{
              recipeId: sampleRecipes[5].id,
              title: sampleRecipes[5].title,
              imageUrl: sampleRecipes[5].imageUrl,
              leftover: false,
              lunchbox: false,
              aiSuggested: false,
              isPlaceholder: false,
            }],
            time: '8:00 AM',
            isCompleted: false,
          },
          {
            id: `${index}-dinner-1`,
            type: 'dinner',
            mealRecipes: [{
              recipeId: sampleRecipes[0].id,
              title: sampleRecipes[0].title,
              imageUrl: sampleRecipes[0].imageUrl,
              leftover: false,
              lunchbox: false,
              aiSuggested: false,
              isPlaceholder: false,
            }],
            time: '7:00 PM',
            isCompleted: false,
          },
          {
            id: `${index}-dinner-2`,
            type: 'dinner',
            mealRecipes: [{
              recipeId: sampleRecipes[4].id,
              title: sampleRecipes[4].title,
              imageUrl: sampleRecipes[4].imageUrl,
              leftover: false,
              lunchbox: false,
              aiSuggested: false,
              isPlaceholder: false,
            }],
            time: '7:00 PM',
            isCompleted: false,
          }
        );
        break;
      case 5: // Friday
        dayMeals.push(
          {
            id: `${index}-breakfast`,
            type: 'breakfast',
            mealRecipes: [{
              recipeId: sampleRecipes[2].id,
              title: sampleRecipes[2].title,
              imageUrl: sampleRecipes[2].imageUrl,
              leftover: false,
              lunchbox: false,
              aiSuggested: false,
              isPlaceholder: false,
            }],
            time: '8:00 AM',
            isCompleted: false,
          },
          {
            id: `${index}-lunch`,
            type: 'lunch',
            mealRecipes: [{
              recipeId: sampleRecipes[1].id,
              title: sampleRecipes[1].title,
              imageUrl: sampleRecipes[1].imageUrl,
              leftover: false,
              lunchbox: false,
              aiSuggested: false,
              isPlaceholder: false,
            }],
            time: '12:30 PM',
            isCompleted: false,
          },
          {
            id: `${index}-dinner`,
            type: 'dinner',
            mealRecipes: [{
              recipeId: sampleRecipes[4].id,
              title: sampleRecipes[4].title,
              imageUrl: sampleRecipes[4].imageUrl,
              leftover: false,
              lunchbox: false,
              aiSuggested: false,
              isPlaceholder: false,
            }],
            time: '7:00 PM',
            isCompleted: false,
          }
        );
        break;
      case 6: // Saturday
        // No meals planned for Saturday
        break;
    }
    
    return {
      id: `plan-${index}`,
      userId: 'user1',
      date: new Date(date),
      meals: dayMeals,
      isCompleted: false,
    };
  });
};

export const sampleWeeklyMealPlans = generateSampleWeeklyMealPlans();

export const cuisineOptions = [
  'Italian', 'Mexican', 'Indian', 'Chinese', 'Thai', 
  'American', 'Mediterranean', 'Japanese', 'French', 'Middle Eastern'
];

export const dietaryRestrictions = [
  'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 
  'Nut-Free', 'Low-Carb', 'Keto', 'Paleo'
];

export const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

export const weekDays = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 
  'Friday', 'Saturday', 'Sunday'
];