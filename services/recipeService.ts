import { Recipe } from '@/types';

// Mock database service for recipes
class RecipeService {
  private storageKey = 'supachef_recipes';

  // Get all recipes from storage
  async getAllRecipes(): Promise<Recipe[]> {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(this.storageKey);
        return stored ? JSON.parse(stored) : [];
      }
      return [];
    } catch (error) {
      console.error('Error loading recipes:', error);
      return [];
    }
  }

  // Save a new recipe
  async saveRecipe(recipe: Recipe): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        const recipes = await this.getAllRecipes();
        const updatedRecipes = [recipe, ...recipes.filter(r => r.id !== recipe.id)];
        localStorage.setItem(this.storageKey, JSON.stringify(updatedRecipes));
      }
    } catch (error) {
      console.error('Error saving recipe:', error);
      throw new Error('Failed to save recipe');
    }
  }

  // Update an existing recipe
  async updateRecipe(recipe: Recipe): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        const recipes = await this.getAllRecipes();
        const updatedRecipes = recipes.map(r => r.id === recipe.id ? recipe : r);
        localStorage.setItem(this.storageKey, JSON.stringify(updatedRecipes));
      }
    } catch (error) {
      console.error('Error updating recipe:', error);
      throw new Error('Failed to update recipe');
    }
  }

  // Delete a recipe
  async deleteRecipe(recipeId: string): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        const recipes = await this.getAllRecipes();
        const updatedRecipes = recipes.filter(r => r.id !== recipeId);
        localStorage.setItem(this.storageKey, JSON.stringify(updatedRecipes));
      }
    } catch (error) {
      console.error('Error deleting recipe:', error);
      throw new Error('Failed to delete recipe');
    }
  }

  // Import recipe from URL (mock implementation)
  async importFromUrl(url: string): Promise<Recipe> {
    try {
      // In a real implementation, this would:
      // 1. Fetch the URL content
      // 2. Parse recipe schema (JSON-LD) or scrape content
      // 3. Extract recipe data using Edamam API or custom parser
      
      // Mock implementation - simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock extracted recipe data
      const mockRecipe: Recipe = {
        id: `imported-${Date.now()}`,
        title: this.extractTitleFromUrl(url),
        description: 'Imported recipe from ' + new URL(url).hostname,
        imageUrl: 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg',
        cookingTime: 30,
        servings: 4,
        difficulty: 'Medium',
        calories: 350,
        ingredients: [
          { name: 'Ingredient 1', amount: '2', unit: 'cups' },
          { name: 'Ingredient 2', amount: '1', unit: 'tsp' },
          { name: 'Ingredient 3', amount: '3', unit: 'pieces' },
        ],
        instructions: [
          'Step 1: Prepare ingredients',
          'Step 2: Mix together',
          'Step 3: Cook according to directions',
          'Step 4: Serve hot'
        ],
        tags: ['Imported', 'Quick'],
        rating: 0,
        notes: `Imported from: ${url}`,
        isFavorite: false,
        createdAt: new Date(),
      };

      return mockRecipe;
    } catch (error) {
      console.error('Error importing recipe:', error);
      throw new Error('Failed to import recipe from URL');
    }
  }

  private extractTitleFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      
      // Extract potential recipe name from URL path
      const segments = pathname.split('/').filter(segment => segment.length > 0);
      const lastSegment = segments[segments.length - 1];
      
      if (lastSegment) {
        // Convert URL-friendly format to readable title
        return lastSegment
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase())
          .replace(/\.(html|php|aspx?)$/i, '');
      }
      
      return 'Imported Recipe';
    } catch {
      return 'Imported Recipe';
    }
  }

  // Search recipes by query
  async searchRecipes(query: string): Promise<Recipe[]> {
    const recipes = await this.getAllRecipes();
    const lowercaseQuery = query.toLowerCase();
    
    return recipes.filter(recipe => 
      recipe.title.toLowerCase().includes(lowercaseQuery) ||
      recipe.description.toLowerCase().includes(lowercaseQuery) ||
      recipe.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
      recipe.ingredients.some(ing => ing.name.toLowerCase().includes(lowercaseQuery))
    );
  }

  // Get recipes by tag
  async getRecipesByTag(tag: string): Promise<Recipe[]> {
    const recipes = await this.getAllRecipes();
    return recipes.filter(recipe => recipe.tags.includes(tag));
  }

  // Get favorite recipes
  async getFavoriteRecipes(): Promise<Recipe[]> {
    const recipes = await this.getAllRecipes();
    return recipes.filter(recipe => recipe.isFavorite);
  }
}

export const recipeService = new RecipeService();