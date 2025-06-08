import { Recipe, MealPlan, Meal } from '@/types';

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
  }
];

export const sampleMeals: Meal[] = [
  {
    id: '1',
    type: 'breakfast',
    recipe: sampleRecipes[2],
    time: '8:00 AM',
    isCompleted: false,
  },
  {
    id: '2',
    type: 'lunch',
    recipe: sampleRecipes[1],
    time: '12:30 PM',
    isCompleted: false,
  },
  {
    id: '3',
    type: 'dinner',
    recipe: sampleRecipes[0],
    time: '7:00 PM',
    isCompleted: false,
  }
];

export const sampleMealPlan: MealPlan = {
  id: '1',
  userId: 'user1',
  date: new Date(),
  meals: sampleMeals,
  isCompleted: false,
};

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