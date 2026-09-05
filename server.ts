import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));

// Lazy Gemini client helper
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Endpoint: AI Food Image Analysis
app.post("/api/analyze-food", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg", notes = "" } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "No image data provided" });
    }

    if (!process.env.GEMINI_API_KEY) {
      // Return a realistic simulation if API key is not yet set
      return res.json({
        dishName: "Grilled Salmon with Quinoa & Steamed Asparagus",
        summary: "Balanced nutrient-dense meal rich in lean protein, omega-3 fatty acids, and fiber.",
        estimatedWeightGrams: 380,
        calories: 520,
        protein: 42,
        carbs: 38,
        fats: 18,
        fiber: 7,
        healthScore: 94,
        healthScoreReason: "High protein bioavailability, heart-healthy fats, and low glycemic index carbs.",
        dietaryTags: ["High Protein", "Omega-3 Rich", "Gluten-Free", "Clean Eating"],
        ingredients: [
          { name: "Wild Alaskan Salmon fillet", estimatedGrams: 180, calories: 280, notes: "Rich in EPA/DHA" },
          { name: "Cooked Tri-Color Quinoa", estimatedGrams: 120, calories: 150, notes: "Complex carbohydrates" },
          { name: "Steamed Green Asparagus", estimatedGrams: 70, calories: 30, notes: "Folate and vitamin K" },
          { name: "Olive oil & lemon seasoning", estimatedGrams: 10, calories: 60, notes: "Monounsaturated fat" },
        ],
        micronutrients: [
          { name: "Vitamin D", amount: "14 mcg", percentageDailyValue: 70 },
          { name: "Potassium", amount: "890 mg", percentageDailyValue: 25 },
          { name: "Iron", amount: "3.2 mg", percentageDailyValue: 18 },
          { name: "Vitamin C", amount: "18 mg", percentageDailyValue: 20 },
        ],
        healthTips: [
          "Excellent post-workout recovery meal for muscle protein synthesis.",
          "High satiety index helps sustain energy levels without glucose spikes.",
        ],
      });
    }

    const ai = getAi();
    // Clean base64 string if user passed data URI prefix
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+]+;base64,/, "");

    const prompt = `Analyze this food image carefully as a certified sports nutritionist.
Identify the meal, estimate the serving weight in grams, total calories, macronutrients (protein, carbs, fats in grams), dietary fiber, health score (1-100), individual ingredients breakdown, micronutrients, and actionable health guidance.
Optional user context: "${notes || "None provided"}".
Be realistic with portion estimates. If multiple items are on the plate, itemize them clearly.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType || "image/jpeg",
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dishName: { type: Type.STRING, description: "Name of the dish or meal" },
            summary: { type: Type.STRING, description: "Short descriptive summary" },
            estimatedWeightGrams: { type: Type.NUMBER, description: "Estimated total portion weight in grams" },
            calories: { type: Type.NUMBER, description: "Total estimated calories (kcal)" },
            protein: { type: Type.NUMBER, description: "Protein in grams" },
            carbs: { type: Type.NUMBER, description: "Carbohydrates in grams" },
            fats: { type: Type.NUMBER, description: "Fats in grams" },
            fiber: { type: Type.NUMBER, description: "Dietary fiber in grams" },
            healthScore: { type: Type.NUMBER, description: "Nutritional health rating from 1 to 100" },
            healthScoreReason: { type: Type.STRING, description: "Brief justification for the health score" },
            dietaryTags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Dietary tags, e.g., High-Protein, Low-Carb, Vegan, etc.",
            },
            ingredients: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  estimatedGrams: { type: Type.NUMBER },
                  calories: { type: Type.NUMBER },
                  notes: { type: Type.STRING },
                },
                required: ["name", "estimatedGrams", "calories"],
              },
            },
            micronutrients: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  amount: { type: Type.STRING },
                  percentageDailyValue: { type: Type.NUMBER },
                },
                required: ["name", "amount", "percentageDailyValue"],
              },
            },
            healthTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "1-2 practical tips for timing, digestion, or fitness alignment",
            },
          },
          required: [
            "dishName",
            "summary",
            "estimatedWeightGrams",
            "calories",
            "protein",
            "carbs",
            "fats",
            "fiber",
            "healthScore",
            "ingredients",
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    return res.json(parsed);
  } catch (error: any) {
    console.error("Food analysis error:", error);
    return res.status(500).json({
      error: "Failed to analyze meal image",
      details: error?.message || String(error),
    });
  }
});

// Endpoint: AI Customized Meal Plan Suggestions
app.post("/api/suggest-meal-plan", async (req, res) => {
  try {
    const {
      goal = "Muscle Gain",
      calorieTarget = 2400,
      dietaryPreference = "Balanced",
      allergies = "",
      mealsPerDay = 3,
      currentBiometrics = {},
    } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      // Simulated response if key is absent
      return res.json({
        planTitle: `${goal} Optimization Plan (${calorieTarget} kcal)`,
        targetCalories: calorieTarget,
        macroSplit: { proteinGrams: 180, carbsGrams: 240, fatsGrams: 65 },
        dailyAdvice: "Prioritize protein distribution evenly across all meals to maximize muscle protein synthesis.",
        meals: [
          {
            mealType: "Breakfast",
            name: "Protein Oatmeal with Berries & Almond Butter",
            calories: 550,
            protein: 38,
            carbs: 65,
            fats: 15,
            prepTime: "10 mins",
            ingredients: ["Rolled oats (80g)", "Whey isolate (30g)", "Blueberries (50g)", "Almond butter (15g)", "Chia seeds (10g)"],
            instructions: "Cook oats in hot water or almond milk. Stir in whey powder off the heat. Top with fresh berries and almond butter.",
          },
          {
            mealType: "Lunch",
            name: "Citrus Herb Chicken Breast & Sweet Potato Bowl",
            calories: 680,
            protein: 52,
            carbs: 72,
            fats: 16,
            prepTime: "25 mins",
            ingredients: ["Grilled chicken breast (200g)", "Roasted sweet potato (220g)", "Steamed broccoli (120g)", "Olive oil drizzle (1 tsp)"],
            instructions: "Bake sweet potato cubes. Grill chicken with lemon and Italian seasoning. Serve with fresh steamed broccoli florets.",
          },
          {
            mealType: "Post-Workout Snack",
            name: "Greek Yogurt Bowl with Honey & Walnuts",
            calories: 380,
            protein: 32,
            carbs: 35,
            fats: 12,
            prepTime: "5 mins",
            ingredients: ["0% Greek yogurt (250g)", "Raw honey (1 tbsp)", "Crushed walnuts (15g)", "Cinnamon sprinkle"],
            instructions: "Scoop cold Greek yogurt into a bowl, swirl in honey and cinnamon, top with crushed walnuts.",
          },
          {
            mealType: "Dinner",
            name: "Baked Cod Fillet with Garlic Quinoa & Roasted Veggies",
            calories: 620,
            protein: 48,
            carbs: 58,
            fats: 18,
            prepTime: "30 mins",
            ingredients: ["Cod or white fish (220g)", "Cooked quinoa (150g)", "Zucchini and bell peppers (150g)", "Avocado oil spray"],
            instructions: "Bake seasoned cod at 200°C for 15 mins. Roast diced zucchini and bell peppers until caramelized. Plate over fluffy quinoa.",
          },
        ],
      });
    }

    const ai = getAi();
    const prompt = `Create a customized, realistic, and delicious meal plan suggestion for a user with the following profile:
- Fitness Goal: ${goal}
- Daily Calorie Target: ${calorieTarget} kcal
- Dietary Preference: ${dietaryPreference}
- Allergies/Exclusions: ${allergies || "None"}
- Number of Meals/Snacks: ${mealsPerDay}
- User Biometric Context: Heart rate avg ${currentBiometrics.restingHR || 64} bpm, recovery score ${currentBiometrics.recoveryScore || 82}%.

Ensure total meal calories sum close to ${calorieTarget} kcal. Each meal should have exact gram macros, cooking time, ingredient list, and quick cooking instructions.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            planTitle: { type: Type.STRING },
            targetCalories: { type: Type.NUMBER },
            macroSplit: {
              type: Type.OBJECT,
              properties: {
                proteinGrams: { type: Type.NUMBER },
                carbsGrams: { type: Type.NUMBER },
                fatsGrams: { type: Type.NUMBER },
              },
              required: ["proteinGrams", "carbsGrams", "fatsGrams"],
            },
            dailyAdvice: { type: Type.STRING },
            meals: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  mealType: { type: Type.STRING, description: "e.g. Breakfast, Lunch, Snack, Dinner" },
                  name: { type: Type.STRING },
                  calories: { type: Type.NUMBER },
                  protein: { type: Type.NUMBER },
                  carbs: { type: Type.NUMBER },
                  fats: { type: Type.NUMBER },
                  prepTime: { type: Type.STRING },
                  ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                  instructions: { type: Type.STRING },
                },
                required: ["mealType", "name", "calories", "protein", "carbs", "fats", "ingredients", "instructions"],
              },
            },
          },
          required: ["planTitle", "targetCalories", "macroSplit", "dailyAdvice", "meals"],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    return res.json(parsed);
  } catch (error: any) {
    console.error("Meal plan suggestion error:", error);
    return res.status(500).json({
      error: "Failed to generate customized meal plan",
      details: error?.message || String(error),
    });
  }
});

// Endpoint: AI Biometric Health Insights & Recovery Analysis
app.post("/api/biometric-insights", async (req, res) => {
  try {
    const {
      currentHeartRate = 72,
      restingHeartRate = 60,
      hrv = 55,
      sleepHours = 7.5,
      sleepQuality = "Good",
      recentStrainScore = 14.2,
      recentWorkouts = [],
    } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      // Simulated response
      return res.json({
        recoveryStatus: "Prime Readiness",
        recoveryScore: 88,
        statusColor: "emerald",
        trainingReadinessRecommendation: "Your autonomic nervous system is well-recovered. High potential for maximum strength or anaerobic threshold training today.",
        suggestedWorkoutType: "High Intensity Strength or Threshold Intervals",
        heartRateInsights: "Resting HR of 60 bpm is 3 bpm below baseline, and HRV of 55ms signals strong parasympathetic tone.",
        actionableAdvice: [
          "Target your heavy compound lifts (Squat, Deadlift, Bench) during your peak energy window.",
          "Maintain optimal hydration with 500ml electrolyte water 45 minutes prior to exertion.",
          "Take standard 2-3 minute rest periods between work sets to maximize neuromuscular output.",
        ],
        nutritionHydrationFocus: "Elevate complex carbohydrate intake around your training window and consume 35g protein within 60 minutes post-session.",
        longTermTrend: "Consistent 7.5h sleep has improved your 7-day HRV trend by +12%. Keep this sleep consistency.",
      });
    }

    const ai = getAi();
    const prompt = `Act as an elite sports scientist and biometric health coach.
Analyze these biometric data points from the user's wearable and recent workouts:
- Current Real-time Heart Rate: ${currentHeartRate} bpm
- Resting Heart Rate: ${restingHeartRate} bpm
- Heart Rate Variability (HRV - RMSSD): ${hrv} ms
- Sleep Duration: ${sleepHours} hours (${sleepQuality} quality)
- Recent Day Strain Score: ${recentStrainScore} (Scale 0-21)
- Recent Workouts Logged: ${JSON.stringify(recentWorkouts.slice(0, 3))}

Provide an evidence-based assessment of recovery, nervous system readiness, recommended training intensity, heart rate insights, and 3-4 concrete actionable health tips.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recoveryStatus: { type: Type.STRING, description: "e.g. Prime Readiness, Well Recovered, Moderate Fatigue, High Strain Rest Day" },
            recoveryScore: { type: Type.NUMBER, description: "Recovery score percentage 0 to 100" },
            statusColor: { type: Type.STRING, description: "emerald, amber, red, or blue" },
            trainingReadinessRecommendation: { type: Type.STRING },
            suggestedWorkoutType: { type: Type.STRING },
            heartRateInsights: { type: Type.STRING },
            actionableAdvice: { type: Type.ARRAY, items: { type: Type.STRING } },
            nutritionHydrationFocus: { type: Type.STRING },
            longTermTrend: { type: Type.STRING },
          },
          required: [
            "recoveryStatus",
            "recoveryScore",
            "statusColor",
            "trainingReadinessRecommendation",
            "suggestedWorkoutType",
            "heartRateInsights",
            "actionableAdvice",
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    return res.json(parsed);
  } catch (error: any) {
    console.error("Biometric insights error:", error);
    return res.status(500).json({
      error: "Failed to generate biometric insights",
      details: error?.message || String(error),
    });
  }
});

// Vite middleware or static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ApexPulse server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
