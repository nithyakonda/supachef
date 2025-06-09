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
import { ChevronLeft, ChevronRight, Clock, ArrowRight, Plus, ChefHat } from 'lucide-react-native';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { sampleWeeklyMealPlans, sampleRecipes } from '@/data/sampleData';
import { Meal } from '@/types';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    // Initialize to today's index in the week (0 = Sunday, 1 = Monday, etc.)
    const today = new Date();
    return today.getDay();
  });
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
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

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const getMealIcon = (mealType: string) => {
    switch (mealType) {
      case 'breakfast':
        return '🥞';
      case 'lunch':
        return '🥗';
      case 'dinner':
        return '🍽️';
      case 'snack':
        return '🍎';
      default:
        return '🍽️';
    }
  };

  const selectedPlan = sampleWeeklyMealPlans[selectedDayIndex];
  const selectedDate = selectedPlan.date;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning!</Text>
            <Text style={styles.date}>{formatDate(new Date())}</Text>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <ChefHat size={24} color="#F97966" />
          </TouchableOpacity>
        </View>

        {/* Week Calendar */}
        <View style={styles.weekContainer}>
          {sampleWeeklyMealPlans.map((plan, index) => {
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
              <Text style={styles.dailyMealsDate}>
                {selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
              {selectedDayIndex === todayIndex && (
                <Text style={styles.todayLabel}>Today</Text>
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
            {sampleWeeklyMealPlans.map((plan, dayIndex) => (
              <View key={dayIndex} style={[styles.dayMealsContainer, { width }]}>
                {plan.meals.length > 0 ? (
                  plan.meals.map((meal) => (
                    <Card key={meal.id} style={styles.mealCard}>
                      <TouchableOpacity
                        style={styles.mealContent}
                        onPress={() => setSelectedMeal(meal)}
                      >
                        <View style={styles.mealHeader}>
                          <View style={styles.mealInfo}>
                            <Text style={styles.mealEmoji}>{getMealIcon(meal.type)}</Text>
                            <View style={styles.mealDetails}>
                              <Text style={styles.mealType}>
                                {meal.type.charAt(0).toUpperCase() + meal.type.slice(1)}
                              </Text>
                              {meal.time && (
                                <View style={styles.timeContainer}>
                                  <Clock size={12} color="#6B7280" />
                                  <Text style={styles.mealTime}>{meal.time}</Text>
                                </View>
                              )}
                            </View>
                          </View>
                          <ArrowRight size={16} color="#9CA3AF" />
                        </View>

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
                          </View>
                        )}
                      </TouchableOpacity>
                    </Card>
                  ))
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

        {/* Recent Recipes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Recipes</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {sampleRecipes.slice(0, 3).map((recipe) => (
              <Card key={recipe.id} style={styles.recipeCard}>
                <Image
                  source={{ uri: recipe.imageUrl }}
                  style={styles.recipeCardImage}
                />
                <View style={styles.recipeCardContent}>
                  <Text style={styles.recipeCardTitle} numberOfLines={2}>
                    {recipe.title}
                  </Text>
                  <Text style={styles.recipeCardDetails}>
                    {recipe.cookingTime} min • {recipe.difficulty}
                  </Text>
                </View>
              </Card>
            ))}
          </ScrollView>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <Button
              title="Plan This Week"
              onPress={() => {}}
              variant="primary"
              style={styles.quickActionButton}
            />
            <Button
              title="Add Recipe"
              onPress={() => {}}
              variant="outline"
              style={styles.quickActionButton}
            />
          </View>
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  greeting: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  date: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 4,
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF3F2',
    alignItems: 'center',
    justifyContent: 'center',
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
  todayLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#F97966',
    backgroundColor: '#FEF3F2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  mealsScrollView: {
    flex: 1,
  },
  dayMealsContainer: {
    paddingHorizontal: 20,
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
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  seeAllText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#F97966',
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
  mealEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  mealDetails: {
    // No additional styles needed
  },
  mealType: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  mealTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginLeft: 4,
  },
  recipePreview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recipeImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 12,
  },
  recipeInfo: {
    flex: 1,
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
  recipeCard: {
    width: 160,
    marginLeft: 20,
    marginRight: 8,
  },
  recipeCardImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    marginBottom: 12,
  },
  recipeCardContent: {
    // No additional styles needed
  },
  recipeCardTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 4,
  },
  recipeCardDetails: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
  },
});