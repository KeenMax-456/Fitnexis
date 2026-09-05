import React, { useState } from 'react';
import {
  Utensils,
  Sparkles,
  Clock,
  Check,
  Plus,
  Flame,
  ChefHat,
  Target,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { MealPlanResponse, MealEntry, BiometricState } from '../types';

interface MealPlannerProps {
  biometrics: BiometricState;
  onLogMeal: (meal: MealEntry) => void;
}

export const MealPlanner: React.FC<MealPlannerProps> = ({ biometrics, onLogMeal }) => {
  const [goal, setGoal] = useState<string>('Muscle Hypertrophy');
  const [calorieTarget, setCalorieTarget] = useState<number>(2450);
  const [dietaryPreference, setDietaryPreference] = useState<string>('High Protein Balanced');
  const [allergies, setAllergies] = useState<string>('');
  const [mealsPerDay, setMealsPerDay] = useState<number>(4);
  const [loadingPlan, setLoadingPlan] = useState<boolean>(false);
  const [planResult, setPlanResult] = useState<MealPlanResponse | null>(null);
  const [loggedMeals, setLoggedMeals] = useState<{ [key: number]: boolean }>({});

  const generateMealPlan = async () => {
    setLoadingPlan(true);
    setLoggedMeals({});
    try {
      const res = await fetch('/api/suggest-meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal,
          calorieTarget,
          dietaryPreference,
          allergies,
          mealsPerDay,
          currentBiometrics: {
            restingHR: biometrics.restingBpm,
            recoveryScore: biometrics.recoveryScore,
          },
        }),
      });

      if (!res.ok) throw new Error('Meal plan generation failed');
      const data = await res.json();
      setPlanResult(data);
    } catch (err) {
      console.error('Meal plan suggestion error:', err);
    } finally {
      setLoadingPlan(false);
    }
  };

  const handleLogSuggestedMeal = (meal: MealPlanResponse['meals'][0], index: number) => {
    let slot: 'breakfast' | 'lunch' | 'dinner' | 'snack' = 'lunch';
    const lower = meal.mealType.toLowerCase();
    if (lower.includes('breakfast')) slot = 'breakfast';
    else if (lower.includes('lunch')) slot = 'lunch';
    else if (lower.includes('dinner')) slot = 'dinner';
    else slot = 'snack';

    const newMeal: MealEntry = {
      id: `suggested-${Date.now()}-${index}`,
      mealType: slot,
      title: meal.name,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fats: meal.fats,
      fiber: 6,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      healthScore: 94,
      healthScoreReason: 'Scientifically calibrated for ' + goal,
      ingredients: meal.ingredients.map((ing) => ({
        name: ing,
        estimatedGrams: 100,
        calories: Math.round(meal.calories / meal.ingredients.length),
      })),
    };

    onLogMeal(newMeal);
    setLoggedMeals((prev) => ({ ...prev, [index]: true }));
  };

  return (
    <div className="space-y-6" id="meal-planner-container">
      {/* Configuration Card */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">
              AI Customized Meal Plan Suggestions
            </h3>
            <p className="text-xs text-slate-500">
              Tailored nutrition aligned with your fitness goals, biometric recovery status ({biometrics.recoveryScore}%), and dietary preferences.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-slate-500" /> Primary Fitness Goal
            </label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="Muscle Hypertrophy">Muscle Hypertrophy & Strength</option>
              <option value="Fat Loss & Shredding">Fat Loss & Leaning Out</option>
              <option value="Athletic Endurance">Athletic Endurance (Running/Triathlon)</option>
              <option value="Body Recomposition">Clean Body Recomposition</option>
              <option value="Metabolic Health">Metabolic Health & Longevity</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Daily Calorie Target</span>
              <span className="text-slate-900 font-bold font-sans">{calorieTarget} kcal</span>
            </label>
            <input
              type="range"
              min={1500}
              max={4000}
              step={50}
              value={calorieTarget}
              onChange={(e) => setCalorieTarget(Number(e.target.value))}
              className="w-full accent-blue-600 h-2 bg-slate-100 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>1500 kcal (Deficit)</span>
              <span>2400 kcal (Maintenance)</span>
              <span>4000 kcal (Bulk)</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Dietary Profile</label>
            <select
              value={dietaryPreference}
              onChange={(e) => setDietaryPreference(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="High Protein Balanced">High Protein Balanced (Omnivore)</option>
              <option value="Mediterranean Diet">Mediterranean (Rich in Olive Oil & Fish)</option>
              <option value="Vegetarian High Protein">Vegetarian High Protein</option>
              <option value="Plant-Based Vegan">100% Plant-Based Vegan</option>
              <option value="Low-Carb Ketogenic">Low-Carb Ketogenic</option>
              <option value="Pescatarian Clean">Pescatarian Clean</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4 pt-4 border-t border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Allergies or Disliked Foods
            </label>
            <input
              type="text"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              placeholder="e.g. Dairy-free, no peanuts, gluten sensitive, no shellfish..."
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="flex items-end justify-between gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-700 mb-1">Meals Per Day</label>
              <div className="flex items-center gap-2">
                {[3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setMealsPerDay(num)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                      mealsPerDay === num
                        ? 'bg-blue-50 text-blue-700 border-blue-200 font-bold'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {num} Meals
                  </button>
                ))}
              </div>
            </div>

            <button
              id="generate-meal-plan-btn"
              onClick={generateMealPlan}
              disabled={loadingPlan}
              className="px-6 py-2.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className={`w-4 h-4 text-white ${loadingPlan ? 'animate-spin' : ''}`} />
              {loadingPlan ? 'Designing Custom Plan...' : 'Generate Plan'}
            </button>
          </div>
        </div>
      </div>

      {/* Suggested Meal Plan Result */}
      {planResult && (
        <div className="space-y-4">
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Personalized Nutrition Blueprint
                </span>
                <h4 className="text-xl font-bold font-display text-white mt-1">
                  {planResult.planTitle}
                </h4>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  {planResult.dailyAdvice}
                </p>
              </div>

              <div className="flex items-center gap-4 bg-slate-800/80 px-4 py-3 rounded-xl border border-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Protein</span>
                  <p className="text-sm font-bold text-indigo-400">
                    {planResult.macroSplit.proteinGrams}g
                  </p>
                </div>
                <div className="h-6 w-px bg-slate-700"></div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Carbs</span>
                  <p className="text-sm font-bold text-amber-400">
                    {planResult.macroSplit.carbsGrams}g
                  </p>
                </div>
                <div className="h-6 w-px bg-slate-700"></div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Fats</span>
                  <p className="text-sm font-bold text-rose-400">
                    {planResult.macroSplit.fatsGrams}g
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Meals List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {planResult.meals.map((meal, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                      {meal.mealType}
                    </span>
                    <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {meal.prepTime}
                    </span>
                  </div>

                  <h5 className="text-base font-bold text-slate-800 mt-2">{meal.name}</h5>

                  {/* Macros line */}
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 font-medium">
                    <span className="font-bold text-slate-800">{meal.calories} kcal</span>
                    <span className="text-blue-600 font-semibold">{meal.protein}g P</span>
                    <span className="text-amber-600 font-semibold">{meal.carbs}g C</span>
                    <span className="text-rose-600 font-semibold">{meal.fats}g F</span>
                  </div>

                  {/* Ingredients */}
                  <div className="mt-3">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Ingredients
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {meal.ingredients.map((ing, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-md text-[11px] text-slate-700"
                        >
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Quick Prep Instructions */}
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 leading-relaxed">
                    <p className="font-semibold text-slate-800 text-[11px] mb-1">Instructions:</p>
                    {meal.instructions}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Add to today's log</span>
                  <button
                    onClick={() => handleLogSuggestedMeal(meal, idx)}
                    disabled={Boolean(loggedMeals[idx])}
                    className="px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-emerald-600 shadow-sm cursor-pointer"
                  >
                    {loggedMeals[idx] ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Logged
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" /> Log Meal
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
