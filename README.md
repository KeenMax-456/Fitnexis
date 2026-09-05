# ApexPulse Fitness & Biometric Health Tracker

ApexPulse is an all-in-one athletic performance, nutrition, and biometric tracking web application. Powered by Google Gemini AI and the Web Bluetooth API, ApexPulse brings together real-time wearable heart rate monitoring, AI-driven meal photo analysis, automated nutrition tracking, workout logging, personalized meal planning, and an athlete community forum.

---

## Features

### 1. Wearable Heart Rate & Biometrics Monitor
- **Web Bluetooth Integration**: Directly connects to Bluetooth Low Energy (BLE) chest straps and smartwatches using the standard Bluetooth Heart Rate Service (`0x180D`).
- **Telemetry & Live Graphing**: Continuous BPM line graph, heart rate training zones (Warm-up, Aerobic, Threshold, Peak Anaerobic), and Heart Rate Variability (HRV - RMSSD) tracking.
- **AI Readiness & Recovery Coach**: Evaluates resting heart rate, HRV trends, sleep duration, and strain score using Gemini AI to provide training recommendations.

### 2. Workout & Strength Tracker
- **Set & Rep Tracking**: Detailed logging for exercises across Strength, Hypertrophy, Cardio, and HIIT.
- **Metric Computation**: Computes total session volume, duration, estimated calories burned, and strain score.
- **Personal Records (PRs)**: Tracks individual exercise maxes and historical workout milestones.

### 3. Nutrition & Macro Tracker
- **Macronutrient Tracking**: Monitors daily calories, protein, carbohydrates, fats, and dietary fiber against personalized target goals.
- **Organized Meal Slots**: Categorizes food into Breakfast, Lunch, Dinner, and Snacks with visual progress indicators.
- **Hydration Tracker**: Quick-log buttons for daily water intake (+250 ml, +500 ml) with target tracking.

### 4. AI Food Vision Scanner
- **Live Camera & Photo Upload**: Capture food through your device's camera or upload photos from your device.
- **Computer Vision Analysis**: Uses Gemini Vision to identify dishes, estimate portion weights in grams, breakdown ingredients, calculate macro ratios, and assign a health score (1–100).
- **One-Click Meal Logging**: Directly log scanned meals into your daily nutrition targets.

### 5. AI Customized Meal Planner
- **Goal-Tailored Plans**: Generates customized meals tailored to muscle hypertrophy, fat loss, endurance, or maintenance.
- **Dietary Preferences & Allergens**: Supports omnivore, Mediterranean, vegetarian, vegan, and keto regimens with custom allergen exclusions.
- **Actionable Recipes**: Provides ingredients, macro breakdowns, prep times, and step-by-step cooking instructions.

### 6. Athlete Community Forum & Goals
- **Social Activity Feed**: Share workout completions, personal records, and athletic achievements with fellow athletes.
- **Interactive Engagement**: Like posts, cheer achievements, and engage through comment threads.
- **Fitness Goals Tracker**: Set specific strength, endurance, or body composition targets with deadlines and progress updates.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Motion, Lucide Icons
- **Backend**: Node.js, Express
- **Build System**: Vite, tsx, esbuild
- **AI / LLM**: `@google/genai` (Google Gen AI TypeScript SDK) with `gemini-3.8-flash`
- **Device APIs**: Web Bluetooth API (`navigator.bluetooth`), MediaDevices API (`navigator.mediaDevices.getUserMedia`)

---

## Project Structure

```
├── public/                 # Static assets and icons
├── src/
│   ├── components/
│   │   ├── CommunityForum.tsx       # Athlete social feed & goal tracker
│   │   ├── FoodVisionScanner.tsx    # AI camera food analysis & logging
│   │   ├── HeartRateMonitor.tsx     # Web Bluetooth BLE telemetry & AI recovery
│   │   ├── MealPlanner.tsx          # AI meal plan generator
│   │   ├── NutritionTracker.tsx     # Daily calories, macros & hydration tracker
│   │   └── WorkoutTracker.tsx       # Exercise set & volume logger
│   ├── App.tsx             # Main application shell and navigation
│   ├── index.css           # Tailwind CSS imports & global styles
│   ├── main.tsx            # Application entry point
│   ├── mockData.ts         # Initial mock metrics and preset data
│   └── types.ts            # TypeScript interfaces and data models
├── server.ts               # Express backend with Gemini AI endpoints & Vite middleware
├── metadata.json           # Application permissions and metadata
├── package.json            # Node.js dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite bundler configuration
└── README.md               # Project documentation
```

---

## API Endpoints

The Express server exposes the following endpoints:

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/health` | `GET` | Health check endpoint returning server status and Gemini configuration |
| `/api/analyze-food` | `POST` | Accepts base64 meal photos and returns nutritional analysis from Gemini Vision |
| `/api/suggest-meal-plan` | `POST` | Generates a daily meal plan based on goals, calories, and dietary restrictions |
| `/api/biometric-insights` | `POST` | Analyzes heart rate, HRV, and sleep data to generate recovery recommendations |

---

## Getting Started

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** or **bun**
- **Google Gemini API Key** (optional; simulated fallbacks are provided when the key is not configured)

### Environment Variables

Create a `.env` file in the root directory (see `.env.example`):

```env
# Gemini API Key for server-side AI endpoints
GEMINI_API_KEY="your-gemini-api-key"
```

### Installation

Install the dependencies:

```bash
npm install
```

### Running in Development

Start the development server with live Vite middleware:

```bash
npm run dev
```

The application will be accessible at `http://localhost:3000`.

### Production Build

Build the client assets and compile the server bundle:

```bash
npm run build
```

Run the production server:

```bash
npm start
```

### Code Quality

Run the TypeScript compiler to verify types:

```bash
npm run lint
```

---

## Hardware & Browser Requirements

- **Bluetooth Heart Rate Sensors**: Requires a browser that supports the Web Bluetooth API (Google Chrome, Microsoft Edge, Opera, or Chrome for Android). Ensure Bluetooth is enabled on your device. A built-in simulation mode is available if no hardware sensor is connected.
- **Camera Access**: Requires standard camera permissions (`navigator.mediaDevices.getUserMedia`) for the Food Vision Scanner. An image file upload option is also supported as an alternative.

---

## License

This project is licensed under the MIT License.
