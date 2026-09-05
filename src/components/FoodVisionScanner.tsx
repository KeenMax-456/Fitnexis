import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Plus,
  AlertCircle,
  Tag,
  Flame,
  Scale,
  Zap,
} from 'lucide-react';
import { FoodAnalysisResult, MealEntry } from '../types';

interface FoodVisionScannerProps {
  onLogAnalyzedMeal: (meal: MealEntry) => void;
}

// Sample preset meal photos with base64/data URLs or standard food representations for instantaneous testing
const samplePresetMeals = [
  {
    name: 'Grilled Salmon & Quinoa',
    imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80',
    notes: 'Wild salmon fillet with mixed quinoa and steamed greens',
  },
  {
    name: 'Avocado Toast & Poached Eggs',
    imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80',
    notes: 'Sourdough toast with sliced avocado, poached eggs and chili flakes',
  },
  {
    name: 'Ribeye Steak & Sweet Potato',
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
    notes: 'Grass-fed beef steak with roasted sweet potato wedges',
  },
  {
    name: 'Acai Berry Protein Bowl',
    imageUrl: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=600&q=80',
    notes: 'Blended acai with chia seeds, banana slices, and crushed almonds',
  },
];

export const FoodVisionScanner: React.FC<FoodVisionScannerProps> = ({ onLogAnalyzedMeal }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedMimeType, setSelectedMimeType] = useState<string>('image/jpeg');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<FoodAnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [targetSlot, setTargetSlot] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [addedSuccess, setAddedSuccess] = useState(false);

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedMimeType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = (ev) => {
      setSelectedImage(ev.target?.result as string);
      setAnalysisResult(null);
      setAnalysisError(null);
      setAddedSuccess(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = async (preset: typeof samplePresetMeals[0]) => {
    setNotes(preset.notes);
    setAnalysisResult(null);
    setAnalysisError(null);
    setAddedSuccess(false);

    try {
      // Fetch image and convert to base64
      const response = await fetch(preset.imageUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setSelectedMimeType(blob.type || 'image/jpeg');
      };
      reader.readAsDataURL(blob);
    } catch (e) {
      console.warn('Preset load fallback:', e);
      // Fallback preview
      setSelectedImage(preset.imageUrl);
    }
  };

  const startCamera = async () => {
    try {
      setAnalysisError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 } },
      });
      setCameraStream(stream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setAnalysisError('Could not access camera. Please check browser permissions or upload an image.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUri = canvas.toDataURL('image/jpeg', 0.85);
      setSelectedImage(dataUri);
      setSelectedMimeType('image/jpeg');
      stopCamera();
      setAnalysisResult(null);
      setAddedSuccess(false);
    }
  };

  const analyzeMealImage = async () => {
    if (!selectedImage) return;

    setAnalyzing(true);
    setAnalysisError(null);
    setAddedSuccess(false);

    try {
      const res = await fetch('/api/analyze-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImage,
          mimeType: selectedMimeType,
          notes,
        }),
      });

      if (!res.ok) {
        throw new Error(`Analysis failed with status ${res.status}`);
      }

      const data = await res.json();
      setAnalysisResult(data);
    } catch (err: any) {
      console.error('AI food analysis error:', err);
      setAnalysisError(err.message || 'Failed to analyze food photo. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveToDailyLog = () => {
    if (!analysisResult) return;

    const newMeal: MealEntry = {
      id: `ai-meal-${Date.now()}`,
      mealType: targetSlot,
      title: analysisResult.dishName,
      calories: analysisResult.calories,
      protein: analysisResult.protein,
      carbs: analysisResult.carbs,
      fats: analysisResult.fats,
      fiber: analysisResult.fiber,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      photoUrl: selectedImage || undefined,
      healthScore: analysisResult.healthScore,
      healthScoreReason: analysisResult.healthScoreReason,
      dietaryTags: analysisResult.dietaryTags,
      ingredients: analysisResult.ingredients,
      micronutrients: analysisResult.micronutrients,
    };

    onLogAnalyzedMeal(newMeal);
    setAddedSuccess(true);
  };

  return (
    <div className="space-y-6" id="food-vision-scanner-container">
      {/* Intro Header */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 tracking-tight">
                AI Vision Food & Nutrition Identifier
              </h3>
              <p className="text-xs text-slate-500">
                Snap or upload any meal photo. Gemini 3.8 Flash accurately estimates portion weights, calories, macros & micros.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isCameraActive ? (
              <button
                id="open-camera-btn"
                onClick={startCamera}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Camera className="w-4 h-4 text-slate-700" />
                Live Camera
              </button>
            ) : (
              <button
                onClick={stopCamera}
                className="px-4 py-2 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                Stop Camera
              </button>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              Upload Meal Photo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        </div>

        {/* Live Camera Viewfinder */}
        {isCameraActive && (
          <div className="mt-5 p-4 bg-slate-900 rounded-2xl flex flex-col items-center">
            <div className="relative w-full max-w-md aspect-video bg-black rounded-xl overflow-hidden border border-slate-700">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 border-2 border-white/20 rounded-xl pointer-events-none flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-indigo-400 border-dashed rounded-xl opacity-60"></div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={capturePhoto}
                className="px-6 py-2.5 text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Camera className="w-4 h-4 text-indigo-600" />
                Capture Plate Photo
              </button>
              <button
                onClick={stopCamera}
                className="px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Preset Sample Meals */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
            Or test instantly with sample nutritionist meals:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {samplePresetMeals.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectPreset(preset)}
                className="p-2 bg-slate-50 hover:bg-indigo-50/50 hover:border-indigo-200 rounded-xl border border-slate-200/80 text-left transition-all group flex items-center gap-2.5 cursor-pointer"
              >
                <img
                  src={preset.imageUrl}
                  alt={preset.name}
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 rounded-lg object-cover group-hover:scale-105 transition-transform shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{preset.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">Tap to analyze</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Image & Analysis Trigger */}
      {selectedImage && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 aspect-video md:aspect-square bg-slate-100">
              <img
                src={selectedImage}
                alt="Meal to analyze"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="md:col-span-2 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Optional Context or Dietary Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Olive oil dressing, double protein portion, gluten-free bread..."
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  id="run-food-analysis-btn"
                  onClick={analyzeMealImage}
                  disabled={analyzing}
                  className="px-6 py-2.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className={`w-4 h-4 text-white ${analyzing ? 'animate-spin' : ''}`} />
                  {analyzing ? 'Analyzing with Gemini Vision...' : 'Analyze Nutritional Content'}
                </button>

                <button
                  onClick={() => {
                    setSelectedImage(null);
                    setAnalysisResult(null);
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Clear Photo
                </button>
              </div>

              {analysisError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Analysis Failed</p>
                    <p>{analysisError}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Analysis Result Display */}
      {analysisResult && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2.5">
                <h4 className="text-2xl font-bold font-sans text-slate-800">
                  {analysisResult.dishName}
                </h4>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Health Score: {analysisResult.healthScore} / 100
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                {analysisResult.summary}
              </p>

              {analysisResult.dietaryTags && analysisResult.dietaryTags.length > 0 && (
                <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                  {analysisResult.dietaryTags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-slate-50 text-slate-600 rounded-md text-[11px] font-medium flex items-center gap-1 border border-slate-200"
                    >
                      <Tag className="w-2.5 h-2.5 text-slate-400" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Action: Log to meals */}
            <div className="flex items-center gap-2 bg-[#F8FAFC] p-2 rounded-xl border border-slate-100">
              <select
                value={targetSlot}
                onChange={(e) => setTargetSlot(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-800 cursor-pointer"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>

              <button
                id="add-scanned-to-log-btn"
                onClick={handleSaveToDailyLog}
                disabled={addedSuccess}
                className="px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm flex items-center gap-1.5 disabled:bg-emerald-600 cursor-pointer"
              >
                {addedSuccess ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Added to Daily Log
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" /> Add to Today's Meals
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Macro Breakdown Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-slate-900 text-white rounded-xl p-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Calories</span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-black font-display text-white">
                  {analysisResult.calories}
                </span>
                <span className="text-xs text-slate-400 font-semibold">kcal</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Est. {analysisResult.estimatedWeightGrams}g portion</p>
            </div>

            <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4">
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Protein</span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-black font-display text-indigo-950">
                  {analysisResult.protein}
                </span>
                <span className="text-xs text-indigo-500 font-semibold">g</span>
              </div>
              <p className="text-[11px] text-indigo-600 font-medium mt-1">
                {Math.round((analysisResult.protein * 4 / analysisResult.calories) * 100)}% of calories
              </p>
            </div>

            <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-4">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Carbs</span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-black font-display text-amber-950">
                  {analysisResult.carbs}
                </span>
                <span className="text-xs text-amber-500 font-semibold">g</span>
              </div>
              <p className="text-[11px] text-amber-600 font-medium mt-1">
                {Math.round((analysisResult.carbs * 4 / analysisResult.calories) * 100)}% of calories
              </p>
            </div>

            <div className="bg-rose-50/70 border border-rose-100 rounded-xl p-4">
              <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Fats</span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-black font-display text-rose-950">
                  {analysisResult.fats}
                </span>
                <span className="text-xs text-rose-500 font-semibold">g</span>
              </div>
              <p className="text-[11px] text-rose-600 font-medium mt-1">
                {Math.round((analysisResult.fats * 9 / analysisResult.calories) * 100)}% of calories
              </p>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-4">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Fiber</span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-black font-display text-emerald-950">
                  {analysisResult.fiber}
                </span>
                <span className="text-xs text-emerald-500 font-semibold">g</span>
              </div>
              <p className="text-[11px] text-emerald-600 font-medium mt-1">Gut & glucose support</p>
            </div>
          </div>

          {/* Itemized Ingredients Breakdown */}
          {analysisResult.ingredients && analysisResult.ingredients.length > 0 && (
            <div>
              <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
                Identified Ingredients & Portion Estimates
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {analysisResult.ingredients.map((ing, i) => (
                  <div
                    key={i}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800">{ing.name}</p>
                      {ing.notes && <p className="text-[11px] text-slate-500">{ing.notes}</p>}
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-900">{ing.estimatedGrams}g</span>
                      <span className="text-[11px] text-slate-400 block">{ing.calories} kcal</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Micronutrient table & Health tips */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {analysisResult.micronutrients && analysisResult.micronutrients.length > 0 && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <h6 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Key Micronutrients
                </h6>
                <div className="space-y-2">
                  {analysisResult.micronutrients.map((micro, mIdx) => (
                    <div key={mIdx} className="flex items-center justify-between text-xs">
                      <span className="text-slate-700">{micro.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{micro.amount}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700">
                          {micro.percentageDailyValue}% DV
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysisResult.healthTips && analysisResult.healthTips.length > 0 && (
              <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                <h6 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-indigo-600" /> Performance & Health Insights
                </h6>
                <ul className="space-y-2 text-xs text-indigo-950">
                  {analysisResult.healthTips.map((tip, tIdx) => (
                    <li key={tIdx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
