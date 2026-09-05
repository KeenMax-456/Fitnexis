import React, { useState, useEffect } from 'react';
import {
  Activity,
  Dumbbell,
  Utensils,
  Camera,
  Calendar,
  Users,
  Heart,
  Flame,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Bluetooth,
  Menu,
  X,
} from 'lucide-react';
import {
  WorkoutLog,
  MealEntry,
  BiometricState,
  CommunityPost,
  FitnessGoal,
  DailyNutritionTarget,
} from './types';
import {
  initialWorkouts,
  initialMealLogs,
  initialNutritionTarget,
  initialBiometrics,
  initialCommunityPosts,
  initialFitnessGoals,
} from './mockData';
import { HeartRateMonitor } from './components/HeartRateMonitor';
import { WorkoutTracker } from './components/WorkoutTracker';
import { NutritionTracker } from './components/NutritionTracker';
import { FoodVisionScanner } from './components/FoodVisionScanner';
import { MealPlanner } from './components/MealPlanner';
import { CommunityForum } from './components/CommunityForum';
import { getHeartRateZone } from './utils/bleHeartRate';

type ActiveTab = 'biometrics' | 'workouts' | 'nutrition' | 'scanner' | 'planner' | 'community';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('biometrics');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Show temporary toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Persistent States
  const [workouts, setWorkouts] = useState<WorkoutLog[]>(() => {
    try {
      const saved = localStorage.getItem('apex_workouts');
      return saved ? JSON.parse(saved) : initialWorkouts;
    } catch {
      return initialWorkouts;
    }
  });

  const [meals, setMeals] = useState<MealEntry[]>(() => {
    try {
      const saved = localStorage.getItem('apex_meals');
      return saved ? JSON.parse(saved) : initialMealLogs;
    } catch {
      return initialMealLogs;
    }
  });

  const [nutritionTarget, setNutritionTarget] = useState<DailyNutritionTarget>(() => {
    try {
      const saved = localStorage.getItem('apex_nutrition_target');
      return saved ? JSON.parse(saved) : initialNutritionTarget;
    } catch {
      return initialNutritionTarget;
    }
  });

  const [biometrics, setBiometrics] = useState<BiometricState>(() => {
    try {
      const saved = localStorage.getItem('apex_biometrics');
      return saved ? JSON.parse(saved) : initialBiometrics;
    } catch {
      return initialBiometrics;
    }
  });

  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>(() => {
    try {
      const saved = localStorage.getItem('apex_community_posts');
      return saved ? JSON.parse(saved) : initialCommunityPosts;
    } catch {
      return initialCommunityPosts;
    }
  });

  const [fitnessGoals, setFitnessGoals] = useState<FitnessGoal[]>(() => {
    try {
      const saved = localStorage.getItem('apex_fitness_goals');
      return saved ? JSON.parse(saved) : initialFitnessGoals;
    } catch {
      return initialFitnessGoals;
    }
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('apex_workouts', JSON.stringify(workouts));
  }, [workouts]);

  useEffect(() => {
    localStorage.setItem('apex_meals', JSON.stringify(meals));
  }, [meals]);

  useEffect(() => {
    localStorage.setItem('apex_nutrition_target', JSON.stringify(nutritionTarget));
  }, [nutritionTarget]);

  useEffect(() => {
    localStorage.setItem('apex_community_posts', JSON.stringify(communityPosts));
  }, [communityPosts]);

  useEffect(() => {
    localStorage.setItem('apex_fitness_goals', JSON.stringify(fitnessGoals));
  }, [fitnessGoals]);

  // Workout Handlers
  const handleAddWorkout = (newWorkout: WorkoutLog) => {
    setWorkouts((prev) => [newWorkout, ...prev]);
    showToast(`Workout "${newWorkout.title}" logged successfully!`);

    // Increment strain
    setBiometrics((prev) => ({
      ...prev,
      strainScore: Number((prev.strainScore + 2.1).toFixed(1)),
      maxBpmToday: Math.max(prev.maxBpmToday, newWorkout.avgHeartRate + 25),
    }));
  };

  const handleDeleteWorkout = (id: string) => {
    setWorkouts((prev) => prev.filter((w) => w.id !== id));
    showToast('Workout log removed.');
  };

  const handleShareWorkoutToCommunity = (workout: WorkoutLog) => {
    const post: CommunityPost = {
      id: `post-${Date.now()}`,
      authorName: 'Alex Mercer (You)',
      authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
      authorHandle: '@alex_m',
      timeAgo: 'Just now',
      category: workout.prsAchieved && workout.prsAchieved.length > 0 ? 'achievement' : 'workout',
      badgeTitle: workout.prsAchieved && workout.prsAchieved.length > 0 ? `🏆 ${workout.prsAchieved[0]}` : `⚡ Completed: ${workout.title}`,
      content: `Just completed ${workout.title} (${workout.durationMinutes} mins, ${workout.caloriesBurned} kcal burned, avg HR ${workout.avgHeartRate} bpm). ${workout.notes ? `"${workout.notes}"` : ''}`,
      tags: ['#ApexWorkout', `#${workout.category}`, '#FitnessJourney'],
      metricsHighlight: {
        label: 'Duration & Calories',
        value: `${workout.durationMinutes}m | ${workout.caloriesBurned} kcal`,
      },
      likes: 1,
      cheers: 1,
      userLiked: true,
      comments: [],
    };

    setCommunityPosts((prev) => [post, ...prev]);
    setActiveTab('community');
    showToast('Workout shared to community forum!');
  };

  // Nutrition Handlers
  const handleAddMeal = (newMeal: MealEntry) => {
    setMeals((prev) => [newMeal, ...prev]);
    showToast(`Logged "${newMeal.title}" (${newMeal.calories} kcal)`);
  };

  const handleDeleteMeal = (id: string) => {
    setMeals((prev) => prev.filter((m) => m.id !== id));
    showToast('Meal entry removed.');
  };

  const handleUpdateWater = (amountMl: number) => {
    setNutritionTarget((prev) => ({
      ...prev,
      waterCurrentMl: prev.waterCurrentMl + amountMl,
    }));
    showToast(`Added +${amountMl}ml hydration!`);
  };

  // Community Handlers
  const handleAddPost = (post: CommunityPost) => {
    setCommunityPosts((prev) => [post, ...prev]);
    showToast('Post shared with the community!');
  };

  const handleLikePost = (postId: string) => {
    setCommunityPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const liked = !p.userLiked;
          return {
            ...p,
            userLiked: liked,
            likes: liked ? p.likes + 1 : Math.max(0, p.likes - 1),
          };
        }
        return p;
      })
    );
  };

  const handleCheerPost = (postId: string) => {
    setCommunityPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const cheered = !p.userCheered;
          return {
            ...p,
            userCheered: cheered,
            cheers: cheered ? p.cheers + 1 : Math.max(0, p.cheers - 1),
          };
        }
        return p;
      })
    );
  };

  const handleAddComment = (postId: string, commentText: string) => {
    setCommunityPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            comments: [
              ...p.comments,
              {
                id: `cm-${Date.now()}`,
                authorName: 'Alex Mercer (You)',
                authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
                content: commentText,
                timeAgo: 'Just now',
              },
            ],
          };
        }
        return p;
      })
    );
    showToast('Comment posted.');
  };

  const handleAddGoal = (goal: FitnessGoal) => {
    setFitnessGoals((prev) => [goal, ...prev]);
    showToast(`New goal "${goal.title}" created!`);
  };

  const handleUpdateGoalProgress = (goalId: string, delta: number) => {
    setFitnessGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId) {
          const nextVal = Math.max(0, g.currentValue + delta);
          return { ...g, currentValue: nextVal };
        }
        return g;
      })
    );
    showToast('Goal progress updated.');
  };

  const currentZone = getHeartRateZone(biometrics.currentBpm);

  const navigationTabs = [
    { id: 'biometrics', label: 'Daily Overview', icon: Heart },
    { id: 'workouts', label: 'Workouts', icon: Dumbbell },
    { id: 'nutrition', label: 'Nutrition & Macros', icon: Utensils },
    { id: 'scanner', label: 'AI Food Vision', icon: Camera },
    { id: 'planner', label: 'Meal Suggestions', icon: Sparkles },
    { id: 'community', label: 'Community & Goals', icon: Users },
  ] as const;

  const getActiveTabTitle = () => {
    switch (activeTab) {
      case 'biometrics':
        return 'Daily Overview';
      case 'workouts':
        return 'Workouts & Exercises';
      case 'nutrition':
        return 'Daily Nutrition & Macros';
      case 'scanner':
        return 'AI Food Vision Scanner';
      case 'planner':
        return 'Personalized Meal Suggestions';
      case 'community':
        return 'Community Forum & Goals';
      default:
        return 'Dashboard';
    }
  };

  const handleQuickLogActivity = () => {
    if (activeTab === 'workouts') {
      showToast('Scroll down or click Log Workout Session to record sets!');
    } else {
      setActiveTab('workouts');
      showToast('Switched to Workouts. Log your activity session!');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans flex flex-col lg:flex-row selection:bg-blue-600 selection:text-white text-slate-800">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-800 flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sleek Interface Sidebar (Desktop) */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden lg:flex flex-col shrink-0 sticky top-0 h-screen">
        <div className="p-8 flex-1 flex flex-col overflow-y-auto">
          {/* Brand */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-base shadow-sm">
              V
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-800">VITALIS AI</span>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide">APEXPULSE HEALTH</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 flex-1">
            {navigationTabs.map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as ActiveTab)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'opacity-70 text-slate-500'}`} />
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Profile Card (Theme Snippet) */}
        <div className="mt-auto p-6 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-sm">
              AR
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Alex Rivers</p>
              <p className="text-xs text-slate-500">Pro Member</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Top Navigation Bar */}
      <header className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
                V
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-800">VITALIS AI</span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setActiveTab('biometrics')}
                className="flex items-center gap-1.5 bg-red-50 text-red-600 px-2.5 py-1 rounded-full text-xs font-semibold border border-red-100"
              >
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                <span>{biometrics.currentBpm} BPM</span>
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
            {navigationTabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  setActiveTab(id as ActiveTab);
                  setMobileMenuOpen(false);
                }}
                className={`w-full px-3 py-2.5 rounded-lg text-sm font-medium text-left flex items-center gap-3 transition-colors ${
                  activeTab === id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Main Content Area with Sleek Header */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Sleek Interface Header */}
        <header className="h-20 bg-white border-b border-slate-200 px-6 lg:px-8 flex items-center justify-between shrink-0 sticky top-0 z-30">
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">{getActiveTabTitle()}</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('biometrics')}
              className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-1.5 rounded-full text-sm font-semibold border border-red-100 hover:bg-red-100 transition-colors cursor-pointer"
              title="Real-time Heart Rate Telemetry"
            >
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              <span>{biometrics.currentBpm} BPM</span>
            </button>
            <button
              onClick={handleQuickLogActivity}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-blue-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              + Log Activity
            </button>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'biometrics' && (
            <HeartRateMonitor
              biometrics={biometrics}
              setBiometrics={setBiometrics}
            />
          )}

          {activeTab === 'workouts' && (
            <WorkoutTracker
              workouts={workouts}
              onAddWorkout={handleAddWorkout}
              onDeleteWorkout={handleDeleteWorkout}
              onShareToCommunity={handleShareWorkoutToCommunity}
            />
          )}

          {activeTab === 'nutrition' && (
            <NutritionTracker
              meals={meals}
              nutritionTarget={nutritionTarget}
              onAddMeal={handleAddMeal}
              onDeleteMeal={handleDeleteMeal}
              onUpdateWater={handleUpdateWater}
              onNavigateToScanner={() => setActiveTab('scanner')}
              onNavigateToPlanner={() => setActiveTab('planner')}
            />
          )}

          {activeTab === 'scanner' && (
            <FoodVisionScanner
              onLogAnalyzedMeal={(meal) => {
                handleAddMeal(meal);
                setActiveTab('nutrition');
              }}
            />
          )}

          {activeTab === 'planner' && (
            <MealPlanner
              biometrics={biometrics}
              onLogMeal={(meal) => {
                handleAddMeal(meal);
                setActiveTab('nutrition');
              }}
            />
          )}

          {activeTab === 'community' && (
            <CommunityForum
              posts={communityPosts}
              goals={fitnessGoals}
              onAddPost={handleAddPost}
              onLikePost={handleLikePost}
              onCheerPost={handleCheerPost}
              onAddComment={handleAddComment}
              onAddGoal={handleAddGoal}
              onUpdateGoalProgress={handleUpdateGoalProgress}
            />
          )}
        </main>

        {/* Sleek Footer */}
        <footer className="bg-white border-t border-slate-200 py-4 px-6 sm:px-8 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-4">
          <p className="font-medium text-slate-500">
            Vitalis AI / ApexPulse &bull; Intelligent Fitness, Vision Nutrition & Biometrics
          </p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-slate-400">
              <Bluetooth className="w-3.5 h-3.5 text-blue-500" /> Web Bluetooth SIG 0x180D
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" /> Gemini 3.8 Flash
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
