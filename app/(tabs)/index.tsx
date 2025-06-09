import React, { useState } from 'react';
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
import { Calendar, Clock, ArrowRight, Plus, ChefHat } from 'lucide-react-native';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { sampleMealPlan, sampleRecipes } from '@/data/sampleData';
import { Meal } from '@/types';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const [viewMode, setViewMode] = useState<'today' | 'weekly'>('today');
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

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

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.toDateString() === date2.toDateString();
  };

  const weekDates = getWeekDates(selectedDate);

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

        {/* View Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === 'today' && styles.activeToggle,
            ]}
            onPress={() => setViewMode('today')}
          >
            <Text style={[
              styles.toggleText,
              viewMode === 'today' && styles.activeToggleText,
            ]}>
              Today's Plan
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === 'weekly' && styles.activeToggle,
            ]}
            onPress={() => setViewMode('weekly')}
          >
            <Text style={[
              styles.toggleText,
              viewMode === 'weekly' && styles.activeToggleText,
            ]}>
              Weekly Plan
            </Text>
          </TouchableOpacity>
        </View>

        {/* Week Calendar */}
        <View style={styles.weekContainer}>
          {weekDates.map((date, index) => (
            <View
              key={index}
              style={[
                styles.dayButton,
                isSameDay(date, new Date()) && styles.selectedDay,
              ]}
            >
              <Text style={[
                styles.dayName,
                isSameDay(date, new Date()) && styles.selectedDayText,
              ]}>
                {weekDays[index]}
              </Text>
              <Text style={[
                styles.dayNumber,
                isSameDay(date, new Date()) && styles.selectedDayText,
              ]}>
                {date.getDate()}
              </Text>
            </View>
          ))}
        </View>

        {/* Today's Meals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Meals</Text>
            <TouchableOpacity>
              <Plus size={20} color="#F97966" />
            </TouchableOpacity>
          </View>

          {sampleMealPlan.meals.map((meal) => (
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
          ))}
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
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeToggle: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  activeToggleText: {
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
    marginHorizontal: 20,
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