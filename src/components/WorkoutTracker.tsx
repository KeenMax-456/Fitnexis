import React, { useState, useEffect } from 'react';
import {
  Dumbbell,
  Plus,
  Trophy,
  Flame,
  Clock,
  ChevronDown,
  ChevronUp,
  Check,
  Calendar,
  Share2,
  Trash2,
  Play,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { WorkoutLog, ExerciseEntry, ExerciseSet, WorkoutCategory } from '../types';

interface WorkoutTrackerProps {
  workouts: WorkoutLog[];
  onAddWorkout: (workout: WorkoutLog) => void;
  onDeleteWorkout: (id: string) => void;
  onShareToCommunity: (workout: WorkoutLog) => void;
}

export const WorkoutTracker: React.FC<WorkoutTrackerProps> = ({
  workouts,
  onAddWorkout,
  onDeleteWorkout,
  onShareToCommunity,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(workouts[0]?.id || null);
  const [showLogModal, setShowLogModal] = useState(false);

  // Rest Timer State
  const [restTimerSeconds, setRestTimerSeconds] = useState<number>(0);
  const [isRestTimerActive, setIsRestTimerActive] = useState<boolean>(false);

  useEffect(() => {
    let interval: any = null;
    if (isRestTimerActive && restTimerSeconds > 0) {
      interval = setInterval(() => {
        setRestTimerSeconds((sec) => sec - 1);
      }, 1000);
    } else if (restTimerSeconds === 0 && isRestTimerActive) {
      setIsRestTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [isRestTimerActive, restTimerSeconds]);

  const startRestTimer = (seconds: number) => {
    setRestTimerSeconds(seconds);
    setIsRestTimerActive(true);
  };

  // Form state for creating a new workout
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<WorkoutCategory>('strength');
  const [newDuration, setNewDuration] = useState(55);
  const [newCalories, setNewCalories] = useState(420);
  const [newAvgHr, setNewAvgHr] = useState(135);
  const [newNotes, setNewNotes] = useState('');
  const [exercisesList, setExercisesList] = useState<ExerciseEntry[]>([
    {
      id: 'ex-1',
      name: 'Barbell Bench Press',
      muscleGroup: 'Chest',
      category: 'strength',
      sets: [
        { id: 's-1', setNumber: 1, reps: 10, weightKg: 80, completed: true, rpe: 8 },
        { id: 's-2', setNumber: 2, reps: 8, weightKg: 85, completed: true, rpe: 8.5 },
        { id: 's-3', setNumber: 3, reps: 6, weightKg: 90, completed: true, rpe: 9, isPR: true },
      ],
    },
  ]);

  const handleAddSet = (exerciseIndex: number) => {
    const updated = [...exercisesList];
    const currentSets = updated[exerciseIndex].sets;
    const lastSet = currentSets[currentSets.length - 1] || { reps: 10, weightKg: 60 };
    currentSets.push({
      id: `s-${Date.now()}-${Math.random()}`,
      setNumber: currentSets.length + 1,
      reps: lastSet.reps,
      weightKg: lastSet.weightKg,
      completed: true,
      rpe: 8,
    });
    setExercisesList(updated);
  };

  const handleAddExercise = (presetName?: string, presetGroup?: string) => {
    setExercisesList([
      ...exercisesList,
      {
        id: `ex-${Date.now()}`,
        name: presetName || 'Squat',
        muscleGroup: presetGroup || 'Legs',
        category: 'strength',
        sets: [
          { id: `s-${Date.now()}-1`, setNumber: 1, reps: 8, weightKg: 80, completed: true, rpe: 7 },
          { id: `s-${Date.now()}-2`, setNumber: 2, reps: 8, weightKg: 85, completed: true, rpe: 8 },
        ],
      },
    ]);
  };

  const handleSaveWorkout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    // Detect any PRs marked
    const prs: string[] = [];
    exercisesList.forEach((ex) => {
      ex.sets.forEach((st) => {
        if (st.isPR) {
          prs.push(`${ex.name} ${st.weightKg}kg x ${st.reps}`);
        }
      });
    });

    const newLog: WorkoutLog = {
      id: `w-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      date: 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      durationMinutes: Number(newDuration) || 45,
      caloriesBurned: Number(newCalories) || 350,
      avgHeartRate: Number(newAvgHr) || 135,
      notes: newNotes,
      exercises: exercisesList,
      prsAchieved: prs.length > 0 ? prs : undefined,
    };

    onAddWorkout(newLog);
    setShowLogModal(false);
    // Reset form
    setNewTitle('');
    setNewNotes('');
  };

  // Filtered workouts
  const filteredWorkouts = workouts.filter((w) => {
    if (activeCategory === 'all') return true;
    return w.category === activeCategory;
  });

  // Calculate volume stats
  const totalVolumeKg = workouts.reduce((total, w) => {
    let workoutVol = 0;
    w.exercises.forEach((ex) => {
      ex.sets.forEach((s) => {
        workoutVol += (s.weightKg || 0) * (s.reps || 0);
      });
    });
    return total + workoutVol;
  }, 0);

  const totalPrs = workouts.reduce((acc, w) => acc + (w.prsAchieved?.length || 0), 0);

  return (
    <div className="space-y-6" id="workout-tracker-container">
      {/* Top Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Volume</span>
            <Dumbbell className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-sans text-slate-800">
              {totalVolumeKg.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-slate-400">kg lifted</span>
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Across all logged sets</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Personal Records</span>
            <Trophy className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-sans text-slate-800">{totalPrs}</span>
            <span className="text-xs font-semibold text-slate-400">PRs</span>
          </div>
          <p className="text-[11px] text-amber-600 font-medium mt-1">Strength benchmarks</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Workouts Logged</span>
            <Calendar className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-sans text-slate-800">{workouts.length}</span>
            <span className="text-xs font-semibold text-slate-400">sessions</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Consistency score: 94%</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Rest Timer</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-sans text-slate-800 font-mono">
              {Math.floor(restTimerSeconds / 60)}:{(restTimerSeconds % 60).toString().padStart(2, '0')}
            </span>
            {isRestTimerActive && (
              <span className="text-[11px] font-bold text-blue-600 animate-pulse">Running</span>
            )}
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <button
              onClick={() => startRestTimer(60)}
              className="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
            >
              60s
            </button>
            <button
              onClick={() => startRestTimer(90)}
              className="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
            >
              90s
            </button>
            <button
              onClick={() => startRestTimer(120)}
              className="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
            >
              120s
            </button>
            {isRestTimerActive && (
              <button
                onClick={() => setIsRestTimerActive(false)}
                className="p-0.5 text-slate-400 hover:text-slate-700 ml-auto cursor-pointer"
                title="Reset timer"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Action bar with filters & Log button */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-1.5 flex-wrap">
          {['all', 'strength', 'cardio', 'hiit', 'mobility'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all cursor-pointer ${
                activeCategory === cat
                  ? 'bg-blue-50 text-blue-700 border border-blue-100'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {cat === 'all' ? 'All Sessions' : cat}
            </button>
          ))}
        </div>

        <button
          id="log-new-workout-btn"
          onClick={() => {
            setNewTitle('Push Hypertrophy & Arms');
            setShowLogModal(true);
          }}
          className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Log Workout Session
        </button>
      </div>

      {/* Workout Logs List */}
      <div className="space-y-4">
        {filteredWorkouts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
            <Dumbbell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-800">No workout logs in this category</h4>
            <p className="text-xs text-slate-500 mt-1">
              Start by logging a fresh strength or cardio workout session.
            </p>
          </div>
        ) : (
          filteredWorkouts.map((workout) => {
            const isExpanded = expandedWorkoutId === workout.id;
            const workoutVolume = workout.exercises.reduce((acc, ex) => {
              return acc + ex.sets.reduce((sAcc, s) => sAcc + (s.weightKg || 0) * (s.reps || 0), 0);
            }, 0);

            return (
              <div
                key={workout.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all"
              >
                {/* Header row */}
                <div
                  className="p-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50"
                  onClick={() => setExpandedWorkoutId(isExpanded ? null : workout.id)}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                        workout.category === 'strength'
                          ? 'bg-indigo-50 text-indigo-600'
                          : workout.category === 'cardio'
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-amber-50 text-amber-600'
                      }`}
                    >
                      {workout.category === 'strength' ? (
                        <Dumbbell className="w-5 h-5" />
                      ) : workout.category === 'cardio' ? (
                        <Flame className="w-5 h-5" />
                      ) : (
                        <Zap className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-slate-900 tracking-tight">
                          {workout.title}
                        </h4>
                        <span className="text-xs text-slate-400">&bull;</span>
                        <span className="text-xs text-slate-500 font-medium">{workout.date}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {workout.durationMinutes} mins
                        </span>
                        <span className="flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5 text-orange-500" />
                          {workout.caloriesBurned} kcal
                        </span>
                        <span>Avg HR: {workout.avgHeartRate} bpm</span>
                        {workoutVolume > 0 && (
                          <span className="font-semibold text-slate-700">
                            Vol: {workoutVolume.toLocaleString()} kg
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {workout.prsAchieved && workout.prsAchieved.length > 0 && (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                        <Trophy className="w-3.5 h-3.5 text-amber-600" />
                        {workout.prsAchieved[0]}
                      </span>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onShareToCommunity(workout);
                      }}
                      className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Share to Community Forum"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteWorkout(workout.id);
                      }}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete workout"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="p-1 text-slate-400">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details: Exercises and Sets */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 border-t border-slate-100 bg-slate-50/40">
                    {workout.notes && (
                      <div className="mb-4 p-3 bg-white rounded-xl border border-slate-200/60 text-xs text-slate-600 italic">
                        "{workout.notes}"
                      </div>
                    )}

                    <div className="space-y-4">
                      {workout.exercises.map((exercise, eIdx) => (
                        <div
                          key={exercise.id || eIdx}
                          className="bg-white rounded-xl border border-slate-200/80 p-4"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                              <h5 className="text-sm font-bold text-slate-900">{exercise.name}</h5>
                              <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                                {exercise.muscleGroup}
                              </span>
                            </div>
                            <span className="text-xs text-slate-500 font-medium">
                              {exercise.sets.length} sets completed
                            </span>
                          </div>

                          {/* Sets Table */}
                          {exercise.sets.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs text-left">
                                <thead>
                                  <tr className="text-slate-400 border-b border-slate-100">
                                    <th className="py-1.5 font-semibold">SET</th>
                                    <th className="py-1.5 font-semibold">WEIGHT (KG)</th>
                                    <th className="py-1.5 font-semibold">REPS</th>
                                    <th className="py-1.5 font-semibold">RPE</th>
                                    <th className="py-1.5 font-semibold text-right">STATUS</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                  {exercise.sets.map((set) => (
                                    <tr key={set.id} className="hover:bg-slate-50/60">
                                      <td className="py-2 text-slate-400 font-mono">#{set.setNumber}</td>
                                      <td className="py-2 font-bold text-slate-900">{set.weightKg} kg</td>
                                      <td className="py-2">{set.reps} reps</td>
                                      <td className="py-2 text-slate-500">{set.rpe ? `@ ${set.rpe}` : '-'}</td>
                                      <td className="py-2 text-right">
                                        {set.isPR ? (
                                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                                            <Trophy className="w-3 h-3 text-amber-600" /> PR Hit
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center text-emerald-600">
                                            <Check className="w-4 h-4" />
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : exercise.cardioStats ? (
                            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg text-xs">
                              <div>
                                <span className="text-slate-400">Distance</span>
                                <p className="font-bold text-slate-900 text-sm">
                                  {exercise.cardioStats.distanceKm} km
                                </p>
                              </div>
                              <div>
                                <span className="text-slate-400">Avg Speed</span>
                                <p className="font-bold text-slate-900 text-sm">
                                  {exercise.cardioStats.avgSpeedKmh} km/h
                                </p>
                              </div>
                              <div>
                                <span className="text-slate-400">Avg Heart Rate</span>
                                <p className="font-bold text-slate-900 text-sm">
                                  {exercise.cardioStats.avgHeartRate} bpm
                                </p>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Log Workout Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <Dumbbell className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Log Workout Session</h3>
              </div>
              <button
                onClick={() => setShowLogModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveWorkout} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Workout Title
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Push Hypertrophy, Leg Day"
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as WorkoutCategory)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="strength">Strength & Hypertrophy</option>
                    <option value="cardio">Cardio & Running</option>
                    <option value="hiit">HIIT & Conditioning</option>
                    <option value="mobility">Mobility & Core</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Duration (min)</label>
                  <input
                    type="number"
                    value={newDuration}
                    onChange={(e) => setNewDuration(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Calories Burned</label>
                  <input
                    type="number"
                    value={newCalories}
                    onChange={(e) => setNewCalories(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Avg HR (bpm)</label>
                  <input
                    type="number"
                    value={newAvgHr}
                    onChange={(e) => setNewAvgHr(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Exercises builder */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Exercises & Sets
                  </label>
                  <button
                    type="button"
                    onClick={() => handleAddExercise()}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Exercise
                  </button>
                </div>

                <div className="space-y-3">
                  {exercisesList.map((exercise, eIdx) => (
                    <div
                      key={exercise.id}
                      className="p-3.5 bg-slate-50 rounded-xl border border-slate-200"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <input
                          type="text"
                          value={exercise.name}
                          onChange={(e) => {
                            const updated = [...exercisesList];
                            updated[eIdx].name = e.target.value;
                            setExercisesList(updated);
                          }}
                          className="font-bold text-sm text-slate-900 bg-transparent border-b border-transparent focus:border-slate-400 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setExercisesList(exercisesList.filter((_, i) => i !== eIdx));
                          }}
                          className="text-rose-500 hover:text-rose-700 text-xs font-semibold"
                        >
                          Remove
                        </button>
                      </div>

                      {/* Sets list */}
                      <div className="space-y-1.5">
                        {exercise.sets.map((set, sIdx) => (
                          <div key={set.id} className="flex items-center gap-2 text-xs">
                            <span className="w-6 text-slate-400 font-mono">#{set.setNumber}</span>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={set.weightKg}
                                onChange={(e) => {
                                  const updated = [...exercisesList];
                                  updated[eIdx].sets[sIdx].weightKg = Number(e.target.value);
                                  setExercisesList(updated);
                                }}
                                className="w-16 px-2 py-1 bg-white border border-slate-200 rounded text-center font-bold"
                              />
                              <span className="text-slate-500 text-[11px]">kg</span>
                            </div>

                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={set.reps}
                                onChange={(e) => {
                                  const updated = [...exercisesList];
                                  updated[eIdx].sets[sIdx].reps = Number(e.target.value);
                                  setExercisesList(updated);
                                }}
                                className="w-14 px-2 py-1 bg-white border border-slate-200 rounded text-center"
                              />
                              <span className="text-slate-500 text-[11px]">reps</span>
                            </div>

                            <label className="flex items-center gap-1 ml-auto text-[11px] text-amber-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={Boolean(set.isPR)}
                                onChange={(e) => {
                                  const updated = [...exercisesList];
                                  updated[eIdx].sets[sIdx].isPR = e.target.checked;
                                  setExercisesList(updated);
                                }}
                                className="rounded text-amber-600 focus:ring-amber-500"
                              />
                              PR Set
                            </label>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddSet(eIdx)}
                        className="mt-2 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add Set
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Session Notes & Mindset
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Focus points, muscle activation, pump, energy levels..."
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs"
                >
                  Save Workout Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
