import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pencil, Plus, User } from 'lucide-react-native';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Chip from '../../components/ui/Chip';
import EditMealModal from '../../components/ui/EditMealModal';
import { generateSampleWeeklyMealPlans } from '../../data/sampleData';
import { Meal, MealPlan, MealRecipeData } from '../../types';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const [weeklyMealPlans, setWeeklyMealPlans] = useState<MealPlan[]>(() => generateSampleWeeklyMealPlans());
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    // Initialize to today's index in the week (0 = Sunday, 1 = Monday, etc.)
    const today = new Date();
    return today.getDay();
  });
  const [showEditMealModal, setShowEditMealModal] = useState(false);
  const [currentMealEditInfo, setCurrentMealEditInfo] = useState<{
    meal: Meal;
    dayIndex: number;
    mealIndex: number;
  } | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const allMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
  const today = new Date();
  const todayIndex = today.getDay();

  // Initial scroll to today's meals
  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          x: selectedDayIndex * width,
          animated: false,
        });
      }, 100);
    }
  }, []);

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

  const handleSaveEditedMeal = (updatedMealRecipes: MealRecipeData[], newDayIndex?: number, newMealType?: string) => {
    if (!currentMealEditInfo) return;

    const { dayIndex: originalDayIndex, mealIndex: originalMealIndex } = currentMealEditInfo;
    const targetDayIndex = newDayIndex !== undefined ? newDayIndex : originalDayIndex;
    const targetMealType = newMealType || currentMealEditInfo.meal.type;

    setWeeklyMealPlans(prevPlans => {
      const newPlans = [...prevPlans];
      
      // Remove meal from original position
      newPlans[originalDayIndex] = {
        ...newPlans[originalDayIndex],
        meals: newPlans[originalDayIndex].meals.filter((_, index) => index !== originalMealIndex)
      };

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

      return newPlans;
    });

    setShowEditMealModal(false);
    setCurrentMealEditInfo(null);
  };

  const handleCloseEditMealModal = () => {
    setShowEditMealModal(false);
    setCurrentMealEditInfo(null);
  };

  const selectedPlan = weeklyMealPlans[selectedDayIndex];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.profileButton}>
            <User size={24} color="#F97966" />
          </TouchableOpacity>
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>Hello, Chef!</Text>
          </View>
          <View style={styles.placeholder} />
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
                                      <Image
                                        source={{ uri: meal.mealRecipes[0].imageUrl }}
                                        style={styles.recipeImage}
                                      />
                                      <View style={styles.recipeTextAndButtons}>
                                        <View style={styles.titleAndEditContainer}>
                                          <Text style={styles.recipeTitle}>
                                            {meal.mealRecipes[0].title}
                                          </Text>
                                          <TouchableOpacity
                                            style={styles.editTitleButton}
                                            onPress={() => handleEditMeal(meal, dayIndex, originalMealIndex)}
                                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                          >
                                            <Pencil size={16} color="#6B7280" />
                                          </TouchableOpacity>
                                        </View>
                                        
                                        {/* Meal Flags */}
                                        <View style={styles.mealFlagsContainer}>
                                          {meal.mealRecipes[0].leftover && (
                                            <View style={styles.flagChip}>
                                              <Text style={styles.flagChipText}>Leftover</Text>
                                            </View>
                                          )}
                                          {meal.mealRecipes[0].lunchbox && (
                                            <View style={styles.flagChip}>
                                              <Text style={styles.flagChipText}>Lunchbox</Text>
                                            </View>
                                          )}
                                          {meal.mealRecipes[0].aiSuggested && (
                                            <View style={[styles.flagChip, styles.aiSuggestedChip]}>
                                              <Text style={[styles.flagChipText, styles.aiSuggestedChipText]}>AI Suggested</Text>
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
                      onPress={() => {}}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
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
  placeholder: {
    width: 48,
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
  recipeImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
  },
  recipeTextAndButtons: {
    flex: 1,
  },
  titleAndEditContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    minHeight: 22, // Match the lineHeight of the text
    marginBottom: 8,
  },
  recipeTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    lineHeight: 22,
    flex: 1,
    marginRight: 8,
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
  },
  flagChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  flagChipText: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
  },
  aiSuggestedChip: {
    backgroundColor: '#BFDBFE',
    borderColor: '#93C5FD',
  },
  aiSuggestedChipText: {
    color: '#1D4ED8',
    fontFamily: 'Inter-SemiBold',
  },
});