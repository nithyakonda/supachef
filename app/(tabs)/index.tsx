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
import { ChevronLeft, ChevronRight, Pencil, Plus, User } from 'lucide-react-native';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import EditMealModal from '../../components/ui/EditMealModal';
import { generateSampleWeeklyMealPlans } from '../../data/sampleData';
import { Meal, MealPlan } from '../../types';

const { width } = Dimensions.get('window');
const MEAL_CARD_CAROUSEL_WIDTH = width * 0.75; // 75% of screen width to show part of next card

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

  const handlePrevDay = () => {
    if (selectedDayIndex > 0) {
      const newIndex = selectedDayIndex - 1;
      setSelectedDayIndex(newIndex);
      scrollViewRef.current?.scrollTo({
        x: newIndex * width,
        animated: true,
      });
    }
  };

  const handleNextDay = () => {
    if (selectedDayIndex < 6) {
      const newIndex = selectedDayIndex + 1;
      setSelectedDayIndex(newIndex);
      scrollViewRef.current?.scrollTo({
        x: newIndex * width,
        animated: true,
      });
    }
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

  const handleSaveEditedMeal = (updatedMeal: Meal, newDayIndex?: number, newMealType?: string) => {
    if (!currentMealEditInfo) return;

    const { dayIndex: originalDayIndex, mealIndex: originalMealIndex } = currentMealEditInfo;
    const targetDayIndex = newDayIndex !== undefined ? newDayIndex : originalDayIndex;
    const targetMealType = newMealType || updatedMeal.type;

    setWeeklyMealPlans(prevPlans => {
      const newPlans = [...prevPlans];
      
      // Remove meal from original position
      newPlans[originalDayIndex] = {
        ...newPlans[originalDayIndex],
        meals: newPlans[originalDayIndex].meals.filter((_, index) => index !== originalMealIndex)
      };

      // Update meal with new type if changed
      const mealToAdd = {
        ...updatedMeal,
        type: targetMealType as 'breakfast' | 'lunch' | 'dinner' | 'snack',
        id: `${targetDayIndex}-${targetMealType}-${Date.now()}` // Generate new ID to avoid conflicts
      };

      // Add meal to target position
      newPlans[targetDayIndex] = {
        ...newPlans[targetDayIndex],
        meals: [...newPlans[targetDayIndex].meals, mealToAdd]
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
  const selectedDate = selectedPlan.date;
  const isViewingToday = selectedDayIndex === todayIndex;

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
          <View style={styles.dailyMealsHeader}>
            <TouchableOpacity
              style={[styles.navArrow, selectedDayIndex === 0 && styles.disabledArrow]}
              onPress={handlePrevDay}
              disabled={selectedDayIndex === 0}
            >
              <ChevronLeft size={20} color={selectedDayIndex === 0 ? '#E5E7EB' : '#6B7280'} />
            </TouchableOpacity>
            
            <View style={styles.dailyMealsTitle}>
              {isViewingToday ? (
                <Text style={styles.todayTitle}>Today</Text>
              ) : (
                <Text style={styles.dailyMealsDate}>
                  {selectedDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              )}
            </View>
            
            <TouchableOpacity
              style={[styles.navArrow, selectedDayIndex === 6 && styles.disabledArrow]}
              onPress={handleNextDay}
              disabled={selectedDayIndex === 6}
            >
              <ChevronRight size={20} color={selectedDayIndex === 6 ? '#E5E7EB' : '#6B7280'} />
            </TouchableOpacity>
          </View>

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
                        
                        {mealsOfType.length === 1 ? (
                          // Single meal card - full width
                          (() => {
                            const meal = mealsOfType[0];
                            const originalMealIndex = plan.meals.findIndex(m => m.id === meal.id);
                            
                            return (
                              <Card key={meal.id} style={styles.mealCard}>
                                <View style={styles.mealContent}>
                                  {meal.recipe && (
                                    <View style={styles.recipePreview}>
                                      <Image
                                        source={{ uri: meal.recipe.imageUrl }}
                                        style={styles.recipeImage}
                                      />
                                      <View style={styles.recipeInfo}>
                                        <Text style={styles.recipeTitle}>{meal.recipe.title}</Text>
                                        <Text style={styles.recipeDetails}>
                                          {meal.recipe.cookingTime} min • {meal.recipe.calories} cal
                                        </Text>
                                      </View>
                                      <TouchableOpacity
                                        style={styles.editButton}
                                        onPress={() => handleEditMeal(meal, dayIndex, originalMealIndex)}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                      >
                                        <Pencil size={16} color="#9CA3AF" />
                                      </TouchableOpacity>
                                    </View>
                                  )}
                                </View>
                              </Card>
                            );
                          })()
                        ) : (
                          // Multiple meal cards - horizontal carousel
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.mealCardsCarouselContent}
                            style={styles.mealCardsCarousel}
                          >
                            {mealsOfType.map((meal, mealIndex) => {
                              const originalMealIndex = plan.meals.findIndex(m => m.id === meal.id);
                              
                              return (
                                <Card key={meal.id} style={styles.mealCardCarousel}>
                                  <View style={styles.mealContent}>
                                    {meal.recipe && (
                                      <View style={styles.recipePreview}>
                                        <Image
                                          source={{ uri: meal.recipe.imageUrl }}
                                          style={styles.recipeImageCarousel}
                                        />
                                        <View style={styles.recipeInfo}>
                                          <Text style={styles.recipeTitle} numberOfLines={2}>
                                            {meal.recipe.title}
                                          </Text>
                                          <Text style={styles.recipeDetails}>
                                            {meal.recipe.cookingTime} min • {meal.recipe.calories} cal
                                          </Text>
                                        </View>
                                        <TouchableOpacity
                                          style={styles.editButton}
                                          onPress={() => handleEditMeal(meal, dayIndex, originalMealIndex)}
                                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                        >
                                          <Pencil size={16} color="#9CA3AF" />
                                        </TouchableOpacity>
                                      </View>
                                    )}
                                  </View>
                                </Card>
                              );
                            })}
                          </ScrollView>
                        )}
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
  dailyMealsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  navArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledArrow: {
    backgroundColor: '#F9FAFB',
  },
  dailyMealsTitle: {
    alignItems: 'center',
    flex: 1,
  },
  dailyMealsDate: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  todayTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#F97966',
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
    marginBottom: 12,
  },
  mealContent: {
    // No additional styles needed
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recipePreview: {
    position: 'relative',
  },
  recipeImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    marginBottom: 12,
  },
  recipeImageCarousel: {
    width: '100%',
    height: 100,
    borderRadius: 12,
    marginBottom: 12,
  },
  recipeInfo: {
    paddingHorizontal: 4,
  },
  recipeTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 4,
  },
  recipeDetails: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  // New carousel styles
  mealCardsCarousel: {
    marginHorizontal: -20, // Offset the container padding
  },
  mealCardsCarouselContent: {
    paddingHorizontal: 20,
    paddingRight: 40, // Extra padding at the end
  },
  mealCardCarousel: {
    width: MEAL_CARD_CAROUSEL_WIDTH,
    marginRight: 16,
    marginBottom: 12,
  },
});