import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Plus, Sparkles } from 'lucide-react-native';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { sampleMealPlan } from '@/data/sampleData';

export default function PlannerScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAISuggestions, setShowAISuggestions] = useState(false);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const getWeekDates = (date: Date) => {
    const week = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const weekDates = getWeekDates(selectedDate);

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.toDateString() === date2.toDateString();
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedDate(newDate);
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Meal Planner</Text>
          <TouchableOpacity 
            style={styles.aiButton}
            onPress={() => setShowAISuggestions(true)}
          >
            <Sparkles size={20} color="#F97966" />
          </TouchableOpacity>
        </View>

        {/* Calendar Navigation */}
        <View style={styles.calendarHeader}>
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => navigateWeek('prev')}
          >
            <ChevronLeft size={20} color="#6B7280" />
          </TouchableOpacity>
          
          <Text style={styles.monthYear}>
            {formatMonthYear(selectedDate)}
          </Text>
          
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => navigateWeek('next')}
          >
            <ChevronRight size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Week Calendar */}
        <View style={styles.weekContainer}>
          {weekDates.map((date, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayButton,
                isSameDay(date, selectedDate) && styles.selectedDay,
              ]}
              onPress={() => setSelectedDate(date)}
            >
              <Text style={[
                styles.dayName,
                isSameDay(date, selectedDate) && styles.selectedDayText,
              ]}>
                {weekDays[index]}
              </Text>
              <Text style={[
                styles.dayNumber,
                isSameDay(date, selectedDate) && styles.selectedDayText,
              ]}>
                {date.getDate()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Daily Meal Plan */}
        <View style={styles.dailyPlanContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long',
                month: 'short',
                day: 'numeric'
              })}
            </Text>
            <TouchableOpacity>
              <Plus size={20} color="#F97966" />
            </TouchableOpacity>
          </View>

          {sampleMealPlan.meals.map((meal) => (
            <Card key={meal.id} style={styles.mealCard}>
              <View style={styles.mealContent}>
                <View style={styles.mealHeader}>
                  <View style={styles.mealInfo}>
                    <Text style={styles.mealEmoji}>{getMealIcon(meal.type)}</Text>
                    <Text style={styles.mealType}>
                      {meal.type.charAt(0).toUpperCase() + meal.type.slice(1)}
                    </Text>
                  </View>
                  {meal.time && (
                    <Text style={styles.mealTime}>{meal.time}</Text>
                  )}
                </View>

                {meal.recipe ? (
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
                ) : (
                  <TouchableOpacity style={styles.addMealButton}>
                    <Plus size={16} color="#9CA3AF" />
                    <Text style={styles.addMealText}>Add meal</Text>
                  </TouchableOpacity>
                )}
              </View>
            </Card>
          ))}
        </View>

        {/* AI Suggestions */}
        {showAISuggestions && (
          <View style={styles.aiSuggestionsContainer}>
            <Card style={styles.aiSuggestionsCard}>
              <View style={styles.aiHeader}>
                <Sparkles size={20} color="#F97966" />
                <Text style={styles.aiTitle}>AI Sous-Chef Suggestions</Text>
              </View>
              <Text style={styles.aiDescription}>
                Based on your preferences and available ingredients, here are some meal suggestions for this week:
              </Text>
              
              <View style={styles.suggestionsList}>
                <Text style={styles.suggestionItem}>
                  • Mediterranean Bowl for lunch
                </Text>
                <Text style={styles.suggestionItem}>
                  • Butternut Soup for dinner
                </Text>
                <Text style={styles.suggestionItem}>
                  • Avocado Toast for breakfast
                </Text>
              </View>

              <View style={styles.aiActions}>
                <Button
                  title="Apply Suggestions"
                  onPress={() => setShowAISuggestions(false)}
                  variant="primary"
                  size="small"
                />
                <Button
                  title="Dismiss"
                  onPress={() => setShowAISuggestions(false)}
                  variant="outline"
                  size="small"
                />
              </View>
            </Card>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Button
            title="Generate Weekly Plan"
            onPress={() => setShowAISuggestions(true)}
            variant="primary"
            style={styles.quickActionButton}
          />
          <Button
            title="Shopping List"
            onPress={() => {}}
            variant="outline"
            style={styles.quickActionButton}
          />
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
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  aiButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF3F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  monthYear: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
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
  },
  selectedDay: {
    backgroundColor: '#F97966',
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
  dailyPlanContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#111827',
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
    fontSize: 20,
    marginRight: 12,
  },
  mealType: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  mealTime: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
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
  addMealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  addMealText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
    marginLeft: 8,
  },
  aiSuggestionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  aiSuggestionsCard: {
    backgroundColor: '#FEF3F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginLeft: 8,
  },
  aiDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  suggestionsList: {
    marginBottom: 16,
  },
  suggestionItem: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    marginBottom: 8,
  },
  aiActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
  },
});