import React, { useState } from 'react';
import {
  Utensils,
  Flame,
  Plus,
  Droplets,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  Trash2,
  PieChart,
} from 'lucide-react';
import { MealEntry, DailyNutritionTarget } from '../types';

interface NutritionTrackerProps {
  meals: MealEntry[];
  nutritionTarget: DailyNutritionTarget;
  onAddMeal: (meal: MealEntry) => void;
  onDeleteMeal: (id: string) => void;
  onUpdateWater: (amountMl: number) => void;
  onNavigateToScanner: () => void;
  onNavigateToPlanner: () => void;
}

export const NutritionTracker: React.FC<NutritionTrackerProps> = ({
  meals,
  nutritionTarget,
  onAddMeal,
  onDeleteMeal,
  onUpdateWater,
  onNavigateToScanner,
  onNavigateToPlanner,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [title, setTitle] = useState('');
  const [calories, setCalories] = useState(450);
  const [protein, setProtein] = useState(30);
  const [carbs, setCarbs] = useState(45);
  const [fats, setFats] = useState(15);
  const [fiber, setFiber] = useState(6);

  // Compute totals
  const totalCalories = meals.reduce((acc, m) => acc + (m.calories || 0), 0);
  const totalProtein = meals.reduce((acc, m) => acc + (m.protein || 0), 0);
  const totalCarbs = meals.reduce((acc, m) => acc + (m.carbs || 0), 0);
  const totalFats = meals.reduce((acc, m) => acc + (m.fats || 0), 0);
  const totalFiber = meals.reduce((acc, m) => acc + (m.fiber || 0), 0);

  const caloriesRemaining = Math.max(0, nutritionTarget.calorieTarget - totalCalories);

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newMeal: MealEntry = {
      id: `m-${Date.now()}`,
      mealType,
      title: title.trim(),
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fats: Number(fats) || 0,
      fiber: Number(fiber) || 0,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      healthScore: 88,
      dietaryTags: ['Logged Meal'],
    };

    onAddMeal(newMeal);
    setShowAddModal(false);
    setTitle('');
  };

  const mealTypes = [
    { key: 'breakfast', label: 'Breakfast' },
    { key: 'lunch', label: 'Lunch' },
    { key: 'dinner', label: 'Dinner' },
    { key: 'snack', label: 'Snacks' },
  ] as const;

  return (
    <div className="space-y-6" id="nutrition-tracker-container">
      {/* Top Banner: Calorie & Macro Target Progress */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Daily Nutrition & Macro Targets
            </span>
            <h3 className="text-xl font-bold font-sans text-slate-800 mt-0.5">
              {totalCalories} / {nutritionTarget.calorieTarget} <span className="text-sm font-semibold text-slate-400">kcal</span>
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateToScanner}
              className="px-3.5 py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Scan Meal Photo
            </button>
            <button
              onClick={onNavigateToPlanner}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Utensils className="w-3.5 h-3.5" />
              Meal Plan Suggestions
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Log Meal
            </button>
          </div>
        </div>

        {/* Big Calorie Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
            <span>Energy Consumed: <strong>{totalCalories} kcal</strong></span>
            <span>Remaining Budget: <strong className="text-emerald-600">{caloriesRemaining} kcal</strong></span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, (totalCalories / nutritionTarget.calorieTarget) * 100)}%`,
              }}
            ></div>
          </div>
        </div>

        {/* Macro split cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          {/* Protein */}
          <div className="bg-[#F8FAFC] rounded-xl p-3.5 border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-700 uppercase">Protein</span>
              <span className="text-[11px] font-bold text-blue-600">
                {Math.round((totalProtein / nutritionTarget.proteinTarget) * 100)}%
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-bold font-sans text-slate-800">{totalProtein}g</span>
              <span className="text-xs text-slate-400">/ {nutritionTarget.proteinTarget}g</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-blue-600 h-1.5 rounded-full"
                style={{ width: `${Math.min(100, (totalProtein / nutritionTarget.proteinTarget) * 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Carbs */}
          <div className="bg-[#F8FAFC] rounded-xl p-3.5 border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700 uppercase">Carbohydrates</span>
              <span className="text-[11px] font-bold text-amber-600">
                {Math.round((totalCarbs / nutritionTarget.carbsTarget) * 100)}%
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-bold font-sans text-slate-800">{totalCarbs}g</span>
              <span className="text-xs text-slate-400">/ {nutritionTarget.carbsTarget}g</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-amber-500 h-1.5 rounded-full"
                style={{ width: `${Math.min(100, (totalCarbs / nutritionTarget.carbsTarget) * 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Fats */}
          <div className="bg-[#F8FAFC] rounded-xl p-3.5 border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-700 uppercase">Healthy Fats</span>
              <span className="text-[11px] font-bold text-rose-600">
                {Math.round((totalFats / nutritionTarget.fatsTarget) * 100)}%
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-bold font-sans text-slate-800">{totalFats}g</span>
              <span className="text-xs text-slate-400">/ {nutritionTarget.fatsTarget}g</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-rose-500 h-1.5 rounded-full"
                style={{ width: `${Math.min(100, (totalFats / nutritionTarget.fatsTarget) * 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Fiber */}
          <div className="bg-[#F8FAFC] rounded-xl p-3.5 border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 uppercase">Dietary Fiber</span>
              <span className="text-[11px] font-bold text-emerald-600">
                {Math.round((totalFiber / 35) * 100)}%
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-bold font-sans text-slate-800">{totalFiber}g</span>
              <span className="text-xs text-slate-400">/ 35g</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-1.5 rounded-full"
                style={{ width: `${Math.min(100, (totalFiber / 35) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Hydration tracker */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">Hydration Tracker</span>
                <span className="text-xs text-blue-700 font-bold">
                  {nutritionTarget.waterCurrentMl} / {nutritionTarget.waterTargetMl} ml
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Essential for cellular performance and optimal HRV</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdateWater(250)}
              className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-100 transition-colors cursor-pointer"
            >
              +250 ml
            </button>
            <button
              onClick={() => onUpdateWater(500)}
              className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-100 transition-colors cursor-pointer"
            >
              +500 ml
            </button>
          </div>
        </div>
      </div>

      {/* Meals Grouped by Category */}
      <div className="space-y-4">
        {mealTypes.map(({ key, label }) => {
          const groupMeals = meals.filter((m) => m.mealType === key);
          const groupCalories = groupMeals.reduce((sum, m) => sum + m.calories, 0);

          return (
            <div key={key} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-800 tracking-tight">{label}</h4>
                  <span className="text-xs text-slate-400 font-semibold">&bull;</span>
                  <span className="text-xs font-bold text-slate-700">{groupCalories} kcal</span>
                </div>
                <button
                  onClick={() => {
                    setMealType(key);
                    setShowAddModal(true);
                  }}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add to {label}
                </button>
              </div>

              {groupMeals.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No meals logged for {label.toLowerCase()} yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 mt-2">
                  {groupMeals.map((meal) => (
                    <div key={meal.id} className="py-3.5 flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h5 className="text-sm font-bold text-slate-900">{meal.title}</h5>
                          {meal.healthScore && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              Score {meal.healthScore}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="font-bold text-slate-800">{meal.calories} kcal</span>
                          <span>{meal.protein}g protein</span>
                          <span>{meal.carbs}g carbs</span>
                          <span>{meal.fats}g fats</span>
                          {meal.fiber > 0 && <span>{meal.fiber}g fiber</span>}
                          <span className="text-slate-400">{meal.timestamp}</span>
                        </div>

                        {meal.ingredients && meal.ingredients.length > 0 && (
                          <div className="text-[11px] text-slate-400 pt-1">
                            {meal.ingredients.map((ing) => ing.name).join(', ')}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => onDeleteMeal(meal.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete meal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Log Manual Meal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Meal Entry</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleManualAdd} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Meal Slot</label>
                <select
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Meal Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Grilled Chicken Salad with Olive Oil"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Calories (kcal)</label>
                  <input
                    type="number"
                    value={calories}
                    onChange={(e) => setCalories(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Protein (g)</label>
                  <input
                    type="number"
                    value={protein}
                    onChange={(e) => setProtein(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Carbs (g)</label>
                  <input
                    type="number"
                    value={carbs}
                    onChange={(e) => setCarbs(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fats (g)</label>
                  <input
                    type="number"
                    value={fats}
                    onChange={(e) => setFats(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs"
                >
                  Save to Daily Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
