import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pencil, Plus, User, Sparkles } from 'lucide-react-native';
import { useFocusEffect } from 'expo-router';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingIndicator from '../../components/ui/LoadingIndicator';
import EditMealModal from '../../components/ui/EditMealModal';
import RecipeViewModal from '../../components/ui/RecipeViewModal';
import ThemedAlert from '../../components/ui/ThemedAlert';
import { useThemedAlert } from '../../hooks/useThemedAlert';
import { Meal, MealPlan, MealRecipeData } from '../../types';
import { supabase } from '../../utils/supabase';
import { mealPlanService } from '../../services/mealPlanService';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const [weeklyMealPlans, setWeeklyMealPlans] = useState<MealPlan[]>([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    // Initialize to today's index in the week (0 = Sunday, 1 = Monday, etc.)
    const today = new Date();
    return today.getDay();
  });
  const [showEditMealModal, setShowEditMealModal] = useState(false);
  const [showRecipeViewModal, setShowRecipeViewModal] = useState(false);
  const [currentMealEditInfo, setCurrentMealEditInfo] = useState<{
    meal: Meal;
    dayIndex: number;
    mealIndex: number;
  } | null>(null);
  const [currentRecipeViewData, setCurrentRecipeViewData] = useState<MealRecipeData | null>(null);
  const [userFirstName, setUserFirstName] = useState<string>('');
  const [userImageUri, setUserImageUri] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const { alertState, showAlert, hideAlert } = useThemedAlert();

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const allMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
  const today = new Date();
  const todayIndex = today.getDay();

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.user_metadata?.full_name) {
          const fullName = user.user_metadata.full_name;
          const firstName = fullName.split(' ')[0];
          setUserFirstName(firstName);
        }
        if (user?.user_metadata?.profile_image_uri) {
          setUserImageUri(user.user_metadata.profile_image_uri);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, []);

  // Load meal plans from Supabase
  const loadMealPlans = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate the start and end of the current week (Sunday to Saturday)
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      // Fetch meal plans for the current week
      const mealPlans = await mealPlanService.getMealPlansInRange(startOfWeek, endOfWeek);
      
      // Create a complete week array (7 days) with empty plans for missing days
      const completeWeek: MealPlan[] = [];
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startOfWeek);
        currentDate.setDate(startOfWeek.getDate() + i);
        
        const existingPlan = mealPlans.find(plan => 
          plan.date.toDateString() === currentDate.toDateString()
        );
        
        if (existingPlan) {
          completeWeek.push(existingPlan);
        } else {
          // Create empty meal plan for missing days
          completeWeek.push({
            id: `empty-${i}`,
            userId: 'current-user',
            date: currentDate,
            meals: [],
            isCompleted: false,
          });
        }
      }

      setWeeklyMealPlans(completeWeek);
    } catch (error) {
      console.error('Error loading meal plans:', error);
      setError('Failed to load meal plans. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load meal plans when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadMealPlans();
    }, [])
  );

  // Initial scroll to today's meals
  useEffect(() => {
    if (scrollViewRef.current && !loading) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          x: selectedDayIndex * width,
          animated: false,
        });
      }, 100);
    }
  }, [loading]);

  const handleDayPress = (dayIndex: number) => {
    setSelectedDayIndex(dayIndex);
    scrollViewRef.current?.scrollTo({
      x: dayIndex * width,
      animated: true,
    });
  };

  const handleScrollEnd = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset;
    const dayIndex = Math.round(contentOffset.x / width);
    setSelectedDayIndex(dayIndex);
  };

  const handleEditMeal = (meal: Meal, dayIndex: number, mealIndex: number) => {
    setCurrentMealEditInfo({ meal, dayIndex, mealIndex });
    setShowEditMealModal(true);
  };

  const handleViewRecipe = (mealRecipeData: MealRecipeData) => {
    setCurrentRecipeViewData(mealRecipeData);
    setShowRecipeViewModal(true);
  };

  const handleAddMeal = (dayIndex: number) => {
    // Create a placeholder meal for adding new meal
    const placeholderMeal: Meal = {
      id: `placeholder-${Date.now()}`,
      type: 'breakfast', // Default type, user can change in modal
      mealRecipes: [{
        recipeId: `placeholder-${Date.now()}`,
        title: 'Your Recipe Here',
        imageUrl: 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg',
        leftover: false,
        lunchbox: false,
        aiSuggested: false,
        isPlaceholder: true,
      }],
      isCompleted: false,
    };

    setCurrentMealEditInfo({ meal: placeholderMeal, dayIndex, mealIndex: -1 });
    setShowEditMealModal(true);
  };

  const handleSaveEditedMeal = async (updatedMealRecipes: MealRecipeData[], newDayIndex?: number, newMealType?: string) => {
    if (!currentMealEditInfo) return;

    try {
      const { dayIndex: originalDayIndex, mealIndex: originalMealIndex } = currentMealEditInfo;
      const targetDayIndex = newDayIndex !== undefined ? newDayIndex : originalDayIndex;
      const targetMealType = newMealType || currentMealEditInfo.meal.type;

      // Update the local state immediately for better UX
      setWeeklyMealPlans(prevPlans => {
        const newPlans = [...prevPlans];
        
        // Remove meal from original position (if not adding new)
        if (originalMealIndex >= 0) {
          newPlans[originalDayIndex] = {
            ...newPlans[originalDayIndex],
            meals: newPlans[originalDayIndex].meals.filter((_, index) => index !== originalMealIndex)
          };
        }

        // Only add meal if we have recipes
        if (updatedMealRecipes.length > 0) {
          // Create updated meal with new recipe data
          const updatedMeal: Meal = {
            ...currentMealEditInfo.meal,
            type: targetMealType as 'breakfast' | 'lunch' | 'dinner' | 'snack',
            mealRecipes: updatedMealRecipes,
            id: `${targetDayIndex}-${targetMealType}-${Date.now()}` // Generate new ID to avoid conflicts
          };

          // Add meal to target position
          newPlans[targetDayIndex] = {
            ...newPlans[targetDayIndex],
            meals: [...newPlans[targetDayIndex].meals, updatedMeal]
          };
        }

        return newPlans;
      });

      // TODO: Update meal plan in Supabase
      // This would involve updating the meal_entries table
      // For now, we'll just update the local state

    } catch (error) {
      console.error('Error saving meal:', error);
      setError('Failed to save meal changes. Please try again.');
    }

    setShowEditMealModal(false);
    setCurrentMealEditInfo(null);
  };

  const handleCloseEditMealModal = () => {
    setShowEditMealModal(false);
    setCurrentMealEditInfo(null);
  };

  const handleCloseRecipeViewModal = () => {
    setShowRecipeViewModal(false);
    setCurrentRecipeViewData(null);
  };

  const handleBoltBadgePress = async () => {
    try {
      const supported = await Linking.canOpenURL('https://bolt.new/');
      if (supported) {
        await Linking.openURL('https://bolt.new/');
      } else {
        showAlert({
          title: 'Cannot Open Link',
          message: 'Unable to open bolt.new in your browser.',
          type: 'error',
        });
      }
    } catch (error) {
      showAlert({
        title: 'Error',
        message: 'Failed to open bolt.new. Please try again.',
        type: 'error',
      });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingIndicator size="large" />
          <Text style={styles.loadingText}>Loading your meal plans...</Text>
        </View>
        <ThemedAlert
          visible={alertState.visible}
          title={alertState.title}
          message={alertState.message}
          type={alertState.type}
          buttons={alertState.buttons}
          onClose={hideAlert}
        />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button
            title="Retry"
            onPress={loadMealPlans}
            variant="primary"
            style={styles.retryButton}
          />
        </View>
        <ThemedAlert
          visible={alertState.visible}
          title={alertState.title}
          message={alertState.message}
          type={alertState.type}
          buttons={alertState.buttons}
          onClose={hideAlert}
        />
      </SafeAreaView>
    );
  }

  const selectedPlan = weeklyMealPlans[selectedDayIndex];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.profileButton}>
            {userImageUri ? (
              <Image
                source={{ uri: userImageUri }}
                style={styles.profileImage}
              />
            ) : (
              <User size={24} color="#F97966" />
            )}
          </TouchableOpacity>
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>
              Hello, {userFirstName || 'Chef'}!
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.boltBadge}
            onPress={handleBoltBadgePress}
            activeOpacity={0.8}
          >
            <Image
              source={require('@/assets/images/bolt_badge.png')}
              style={styles.boltBadgeImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        {/* Week Calendar */}
        <View style={styles.weekContainer}>
          {weeklyMealPlans.map((plan, index) => {
            const isToday = index === todayIndex;
            const isSelected = index === selectedDayIndex;
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayButton,
                  isSelected && styles.selectedDay,
                  isToday && !isSelected && styles.todayDay,
                ]}
                onPress={() => handleDayPress(index)}
              >
                <Text style={[
                  styles.dayName,
                  isSelected && styles.selectedDayText,
                  isToday && !isSelected && styles.todayDayText,
                ]}>
                  {weekDays[index]}
                </Text>
                <Text style={[
                  styles.dayNumber,
                  isSelected && styles.selectedDayText,
                  isToday && !isSelected && styles.todayDayText,
                ]}>
                  {plan.date.getDate()}
                </Text>
                {isToday && !isSelected && (
                  <View style={styles.todayIndicator} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Daily Meals Section */}
        <View style={styles.dailyMealsSection}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScrollEnd}
            style={styles.mealsScrollView}
          >
            {weeklyMealPlans.map((plan, dayIndex) => (
              <View key={dayIndex} style={[styles.dayMealsContainer, { width }]}>
                {plan.meals.length > 0 ? (
                  allMealTypes.map((mealType) => {
                    const mealsOfType = plan.meals.filter(meal => meal.type === mealType);
                    
                    if (mealsOfType.length === 0) return null;

                    return (
                      <View key={mealType} style={styles.mealTypeSection}>
                        <Text style={styles.mealTypeHeader}>
                          {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                        </Text>
                        
                        {/* Stack all meal cards vertically */}
                        <View style={styles.mealCardsContainer}>
                          {mealsOfType.map((meal) => {
                            const originalMealIndex = plan.meals.findIndex(m => m.id === meal.id);
                            
                            return (
                              <Card key={meal.id} style={styles.mealCard}>
                                <View style={styles.mealContent}>
                                  {meal.mealRecipes && meal.mealRecipes.length > 0 && (
                                    <View style={styles.recipePreview}>
                                      <TouchableOpacity 
                                        onPress={() => handleViewRecipe(meal.mealRecipes![0])}
                                        style={styles.recipeImageContainer}
                                      >
                                        <Image
                                          source={{ uri: meal.mealRecipes[0].imageUrl }}
                                          style={styles.recipeImage}
                                        />
                                      </TouchableOpacity>
                                      <View style={styles.recipeTextAndButtons}>
                                        <View style={styles.titleAndEditContainer}>
                                          <TouchableOpacity 
                                            onPress={() => handleViewRecipe(meal.mealRecipes![0])}
                                            style={styles.recipeTitleContainer}
                                          >
                                            <Text style={styles.recipeTitle}>
                                              {meal.mealRecipes[0].title}
                                            </Text>
                                          </TouchableOpacity>
                                          <TouchableOpacity
                                            style={styles.editTitleButton}
                                            onPress={() => handleEditMeal(meal, dayIndex, originalMealIndex)}
                                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                          >
                                            <Pencil size={16} color="#6B7280" />
                                          </TouchableOpacity>
                                        </View>
                                        
                                        {/* Meal Flags - Anchored to bottom */}
                                        <View style={styles.mealFlagsContainer}>
                                          {meal.mealRecipes[0].leftover && (
                                            <View style={[styles.flagChip, styles.leftoverChip]}>
                                              <Text style={[styles.flagChipText, styles.leftoverChipText]}>Leftover</Text>
                                            </View>
                                          )}
                                          {meal.mealRecipes[0].lunchbox && (
                                            <View style={[styles.flagChip, styles.lunchboxChip]}>
                                              <Text style={[styles.flagChipText, styles.lunchboxChipText]}>Lunchbox</Text>
                                            </View>
                                          )}
                                          {meal.mealRecipes[0].aiSuggested && (
                                            <View style={[styles.flagChip, styles.aiSuggestedChip]}>
                                              <View style={styles.aiSuggestedContent}>
                                                <Sparkles size={10} color="#F97966" />
                                                <Text style={[styles.flagChipText, styles.aiSuggestedChipText]}>Try This</Text>
                                              </View>
                                            </View>
                                          )}
                                        </View>
                                      </View>
                                    </View>
                                  )}
                                </View>
                              </Card>
                            );
                          })}
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <View style={styles.noMealsContainer}>
                    <Text style={styles.noMealsText}>No meals planned for this day</Text>
                    <Button
                      title="Add Meal"
                      onPress={() => handleAddMeal(dayIndex)}
                      variant="outline"
                      style={styles.addMealButton}
                    />
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Edit Meal Modal */}
      {currentMealEditInfo && (
        <EditMealModal
          visible={showEditMealModal}
          meal={currentMealEditInfo.meal}
          currentDayIndex={currentMealEditInfo.dayIndex}
          allWeeklyMealPlans={weeklyMealPlans}
          allMealTypes={allMealTypes}
          onSave={handleSaveEditedMeal}
          onClose={handleCloseEditMealModal}
        />
      )}

      {/* Recipe View Modal */}
      {currentRecipeViewData && (
        <RecipeViewModal
          visible={showRecipeViewModal}
          mealRecipeData={currentRecipeViewData}
          fromMealPlan={true}
          onClose={handleCloseRecipeViewModal}
        />
      )}

      {/* Themed Alert */}
      <ThemedAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        buttons={alertState.buttons}
        onClose={hideAlert}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF3F2',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  greetingContainer: {
    flex: 1,
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  boltBadge: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boltBadgeImage: {
    width: 40,
    height: 40,
  },
  weekContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 8,
  },
  dayButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  selectedDay: {
    backgroundColor: '#F97966',
  },
  todayDay: {
    backgroundColor: '#FEF3F2',
    borderWidth: 2,
    borderColor: '#F97966',
  },
  dayName: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  selectedDayText: {
    color: '#FFFFFF',
  },
  todayDayText: {
    color: '#F97966',
  },
  todayIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F97966',
  },
  dailyMealsSection: {
    marginBottom: 32,
  },
  mealsScrollView: {
    flex: 1,
  },
  dayMealsContainer: {
    paddingHorizontal: 20,
  },
  mealTypeSection: {
    marginBottom: 24,
  },
  mealTypeHeader: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  mealCardsContainer: {
    gap: 12,
  },
  noMealsContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  noMealsText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  addMealButton: {
    paddingHorizontal: 24,
  },
  mealCard: {
    marginBottom: 0,
    padding: 0,
  },
  mealContent: {
    padding: 16,
  },
  recipePreview: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  recipeImageContainer: {
    position: 'relative',
  },
  recipeImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
  },
  recipeTextAndButtons: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: 80, // Match the image height to ensure proper spacing
  },
  titleAndEditContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    minHeight: 22, // Match the lineHeight of the text
  },
  recipeTitleContainer: {
    flex: 1,
    marginRight: 8,
  },
  recipeTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    lineHeight: 22,
  },
  editTitleButton: {
    width: 24,
    height: 22, // Match the lineHeight for perfect alignment
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  mealFlagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignSelf: 'flex-start', // Anchor to the left
  },
  flagChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  flagChipText: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
  },
  leftoverChip: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FEDD9F',
  },
  leftoverChipText: {
    color: '#D97706',
  },
  lunchboxChip: {
    backgroundColor: '#F0FDF4',
    borderColor: '#CBC87D',
  },
  lunchboxChipText: {
    color: '#65A30D',
  },
  aiSuggestedChip: {
    backgroundColor: '#FEF3F2',
    borderColor: '#F97966',
  },
  aiSuggestedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  aiSuggestedChipText: {
    color: '#F97966',
    fontFamily: 'Inter-SemiBold',
  },
});