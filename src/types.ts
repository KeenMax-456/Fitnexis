export type WorkoutCategory = 'strength' | 'cardio' | 'hiit' | 'mobility';

export interface ExerciseSet {
  id: string;
  setNumber: number;
  reps: number;
  weightKg: number;
  completed: boolean;
  rpe?: number;
  isPR?: boolean;
}

export interface ExerciseEntry {
  id: string;
  name: string;
  muscleGroup: string;
  category: 'strength' | 'cardio';
  sets: ExerciseSet[];
  cardioStats?: {
    distanceKm?: number;
    durationMinutes?: number;
    avgSpeedKmh?: number;
    avgHeartRate?: number;
  };
}

export interface WorkoutLog {
  id: string;
  title: string;
  category: WorkoutCategory;
  date: string;
  durationMinutes: number;
  caloriesBurned: number;
  avgHeartRate: number;
  exercises: ExerciseEntry[];
  notes?: string;
  prsAchieved?: string[];
}

export interface MealIngredient {
  name: string;
  estimatedGrams: number;
  calories: number;
  notes?: string;
}

export interface MicronutrientItem {
  name: string;
  amount: string;
  percentageDailyValue: number;
}

export interface MealEntry {
  id: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  title: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  timestamp: string;
  photoUrl?: string;
  healthScore?: number;
  healthScoreReason?: string;
  dietaryTags?: string[];
  ingredients?: MealIngredient[];
  micronutrients?: MicronutrientItem[];
}

export interface DailyNutritionTarget {
  calorieTarget: number;
  proteinTarget: number;
  carbsTarget: number;
  fatsTarget: number;
  waterTargetMl: number;
  waterCurrentMl: number;
}

export interface SuggestedMealItem {
  mealType: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  prepTime: string;
  ingredients: string[];
  instructions: string;
}

export interface MealPlanResponse {
  planTitle: string;
  targetCalories: number;
  macroSplit: {
    proteinGrams: number;
    carbsGrams: number;
    fatsGrams: number;
  };
  dailyAdvice: string;
  meals: SuggestedMealItem[];
}

export interface FoodAnalysisResult {
  dishName: string;
  summary: string;
  estimatedWeightGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  healthScore: number;
  healthScoreReason: string;
  dietaryTags: string[];
  ingredients: MealIngredient[];
  micronutrients: MicronutrientItem[];
  healthTips: string[];
}

export interface HeartRatePoint {
  time: string;
  bpm: number;
  zone: 1 | 2 | 3 | 4 | 5;
}

export interface BiometricState {
  isConnected: boolean;
  isSimulated: boolean;
  deviceName: string;
  currentBpm: number;
  restingBpm: number;
  hrvMs: number;
  maxBpmToday: number;
  avgBpmToday: number;
  recoveryScore: number; // 0 - 100
  strainScore: number; // 0 - 21
  sleepHours: number;
  sleepQuality: 'Deep Restorative' | 'Good' | 'Moderate' | 'Disturbed';
  timeInZones: {
    z1: number; // minutes
    z2: number;
    z3: number;
    z4: number;
    z5: number;
  };
}

export interface BiometricInsightResult {
  recoveryStatus: string;
  recoveryScore: number;
  statusColor: string;
  trainingReadinessRecommendation: string;
  suggestedWorkoutType: string;
  heartRateInsights: string;
  actionableAdvice: string[];
  nutritionHydrationFocus: string;
  longTermTrend?: string;
}

export interface PostComment {
  id: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  timeAgo: string;
}

export interface CommunityPost {
  id: string;
  authorName: string;
  authorAvatar: string;
  authorHandle: string;
  timeAgo: string;
  category: 'achievement' | 'workout' | 'nutrition' | 'goal' | 'question';
  content: string;
  badgeTitle?: string;
  tags: string[];
  metricsHighlight?: {
    label: string;
    value: string;
  };
  imageUrl?: string;
  likes: number;
  cheers: number;
  comments: PostComment[];
  userLiked?: boolean;
  userCheered?: boolean;
}

export interface FitnessGoal {
  id: string;
  title: string;
  category: 'strength' | 'cardio' | 'nutrition' | 'habit';
  currentValue: number;
  targetValue: number;
  unit: string;
  deadline: string;
}
