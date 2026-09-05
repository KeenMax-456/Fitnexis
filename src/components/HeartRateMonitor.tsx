import React, { useEffect, useRef, useState } from 'react';
import {
  Activity,
  Heart,
  Bluetooth,
  BluetoothConnected,
  BluetoothOff,
  Zap,
  Moon,
  Sparkles,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Info,
} from 'lucide-react';
import { BiometricState, BiometricInsightResult } from '../types';
import {
  connectBleHeartRateMonitor,
  getHeartRateZone,
  isWebBluetoothSupported,
} from '../utils/bleHeartRate';

interface HeartRateMonitorProps {
  biometrics: BiometricState;
  setBiometrics: React.Dispatch<React.SetStateAction<BiometricState>>;
  onSaveInsight?: (insight: BiometricInsightResult) => void;
}

export const HeartRateMonitor: React.FC<HeartRateMonitorProps> = ({
  biometrics,
  setBiometrics,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [bleDevice, setBleDevice] = useState<any>(null);
  const [connectingBle, setConnectingBle] = useState(false);
  const [bleError, setBleError] = useState<string | null>(null);
  const [simulationPreset, setSimulationPreset] = useState<'rest' | 'warmup' | 'zone2' | 'hiit'>('rest');
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [insights, setInsights] = useState<BiometricInsightResult | null>(null);
  const [bpmHistory, setBpmHistory] = useState<number[]>(() => [68, 70, 71, 72, 74, 73, 72]);

  // Handle Bluetooth connection
  const handleConnectBle = async () => {
    setBleError(null);
    setConnectingBle(true);
    try {
      const conn = await connectBleHeartRateMonitor(
        (bpm, rrIntervals) => {
          setBiometrics((prev) => {
            const newMax = Math.max(prev.maxBpmToday, bpm);
            const calculatedHrv = rrIntervals && rrIntervals.length > 1
              ? Math.round(Math.abs(rrIntervals[1] - rrIntervals[0]))
              : prev.hrvMs;

            return {
              ...prev,
              isConnected: true,
              isSimulated: false,
              deviceName: conn.device.name || 'Bluetooth Heart Rate Monitor',
              currentBpm: bpm,
              maxBpmToday: newMax,
              hrvMs: calculatedHrv || prev.hrvMs,
            };
          });

          setBpmHistory((prev) => [...prev.slice(-30), bpm]);
        },
        () => {
          setBleDevice(null);
          setBiometrics((prev) => ({
            ...prev,
            isConnected: false,
            deviceName: 'Disconnected',
          }));
        }
      );

      setBleDevice(conn.device);
      setBiometrics((prev) => ({
        ...prev,
        isConnected: true,
        isSimulated: false,
        deviceName: conn.device.name || 'Heart Rate Wearable',
      }));
    } catch (err: any) {
      console.warn('Bluetooth connection error:', err);
      setBleError(err.message || 'Could not connect to Bluetooth device. Try the Wearable Simulator.');
    } finally {
      setConnectingBle(false);
    }
  };

  const handleDisconnectBle = () => {
    if (bleDevice && bleDevice.gatt?.connected) {
      bleDevice.gatt.disconnect();
    }
    setBleDevice(null);
    setBiometrics((prev) => ({
      ...prev,
      isConnected: false,
      isSimulated: true,
      deviceName: 'PulseWear BLE Pro (Simulated)',
    }));
  };

  // Simulated Heart Rate Stream (when not on physical BLE)
  useEffect(() => {
    if (biometrics.isConnected && !biometrics.isSimulated) return;

    let targetBase = 72;
    if (simulationPreset === 'rest') targetBase = 62;
    if (simulationPreset === 'warmup') targetBase = 110;
    if (simulationPreset === 'zone2') targetBase = 138;
    if (simulationPreset === 'hiit') targetBase = 168;

    const interval = setInterval(() => {
      setBiometrics((prev) => {
        // Natural physiological variance
        const jitter = (Math.random() - 0.5) * 3;
        const nextBpm = Math.round(targetBase + jitter);
        const nextMax = Math.max(prev.maxBpmToday, nextBpm);

        return {
          ...prev,
          currentBpm: nextBpm,
          maxBpmToday: nextMax,
          isSimulated: true,
        };
      });

      setBpmHistory((prev) => {
        const next = Math.round(targetBase + (Math.random() - 0.5) * 4);
        return [...prev.slice(-35), next];
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [biometrics.isConnected, biometrics.isSimulated, simulationPreset]);

  // Real-time Canvas ECG / Waveform Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let step = 0;

    const render = () => {
      step += 1;
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Subtle grid lines
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // ECG Waveform
      const bpm = biometrics.currentBpm;
      const zone = getHeartRateZone(bpm);
      ctx.strokeStyle = zone.color;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();

      const speed = Math.max(1, bpm / 50);
      for (let x = 0; x < width; x++) {
        const cycleLength = Math.max(70, 160 - bpm * 0.5);
        const phase = (x + step * speed) % cycleLength;
        let yOffset = 0;

        // P-Q-R-S-T synthetic complex
        if (phase > 30 && phase < 38) {
          yOffset = -Math.sin(((phase - 30) / 8) * Math.PI) * 6; // P wave
        } else if (phase >= 38 && phase < 42) {
          yOffset = 3; // Q dip
        } else if (phase >= 42 && phase < 48) {
          // Sharp R spike
          const progress = (phase - 42) / 6;
          yOffset = -Math.sin(progress * Math.PI) * 38;
        } else if (phase >= 48 && phase < 52) {
          yOffset = 10; // S dip
        } else if (phase >= 60 && phase < 74) {
          yOffset = -Math.sin(((phase - 60) / 14) * Math.PI) * 12; // T wave
        }

        const y = centerY + yOffset;
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Scan lead point
      const leadX = (step * speed * 2) % width;
      ctx.fillStyle = zone.color;
      ctx.beginPath();
      ctx.arc(leadX, centerY, 4, 0, Math.PI * 2);
      ctx.fill();

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [biometrics.currentBpm]);

  // Request Actionable Health Insights from Gemini
  const fetchBiometricInsights = async () => {
    setLoadingInsights(true);
    try {
      const res = await fetch('/api/biometric-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentHeartRate: biometrics.currentBpm,
          restingHeartRate: biometrics.restingBpm,
          hrv: biometrics.hrvMs,
          sleepHours: biometrics.sleepHours,
          sleepQuality: biometrics.sleepQuality,
          recentStrainScore: biometrics.strainScore,
        }),
      });
      const data = await res.json();
      setInsights(data);
    } catch (e) {
      console.error('Error fetching insights:', e);
    } finally {
      setLoadingInsights(false);
    }
  };

  const currentZone = getHeartRateZone(biometrics.currentBpm);

  return (
    <div className="space-y-6" id="heart-rate-monitor-container">
      {/* Top Banner: Device Connection & Status */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center ${
              biometrics.isConnected && !biometrics.isSimulated
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-blue-50 text-blue-600'
            }`}
          >
            {biometrics.isConnected && !biometrics.isSimulated ? (
              <BluetoothConnected className="w-5 h-5" />
            ) : (
              <Bluetooth className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-800 tracking-tight">
                {biometrics.deviceName}
              </h2>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  biometrics.isConnected && !biometrics.isSimulated
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    : 'bg-slate-50 text-slate-600 border border-slate-200'
                }`}
              >
                {biometrics.isConnected && !biometrics.isSimulated
                  ? 'BLE Hardware Synced'
                  : 'Simulated Stream'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {biometrics.isConnected && !biometrics.isSimulated
                ? 'Receiving live Bluetooth SIG Heart Rate Service (0x180D) telemetry'
                : 'High-fidelity physiological simulation with autonomous nervous jitter'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {biometrics.isConnected && !biometrics.isSimulated ? (
            <button
              id="disconnect-ble-btn"
              onClick={handleDisconnectBle}
              className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <BluetoothOff className="w-3.5 h-3.5" />
              Disconnect
            </button>
          ) : (
            <button
              id="connect-ble-btn"
              onClick={handleConnectBle}
              disabled={connectingBle}
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Bluetooth className="w-4 h-4 text-white" />
              {connectingBle ? 'Scanning BLE Devices...' : 'Sync BLE Wearable'}
            </button>
          )}

          {/* Simulator preset selector */}
          <div className="flex items-center bg-slate-50 rounded-lg p-1 border border-slate-200">
            <span className="text-[11px] font-medium text-slate-500 px-2 flex items-center gap-1">
              <Sliders className="w-3 h-3" /> Load:
            </span>
            <button
              onClick={() => setSimulationPreset('rest')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                simulationPreset === 'rest'
                  ? 'bg-white text-blue-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Rest
            </button>
            <button
              onClick={() => setSimulationPreset('warmup')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                simulationPreset === 'warmup'
                  ? 'bg-white text-blue-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Warmup
            </button>
            <button
              onClick={() => setSimulationPreset('zone2')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                simulationPreset === 'zone2'
                  ? 'bg-white text-blue-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Zone 2
            </button>
            <button
              onClick={() => setSimulationPreset('hiit')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                simulationPreset === 'hiit'
                  ? 'bg-white text-blue-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              HIIT Sprint
            </button>
          </div>
        </div>
      </div>

      {bleError && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Bluetooth Notice</p>
            <p>{bleError}</p>
          </div>
        </div>
      )}

      {/* Primary Biometrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Real-time Heart Rate Card */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ backgroundColor: currentZone.color }}
                ></span>
                <span
                  className="relative inline-flex rounded-full h-3 w-3"
                  style={{ backgroundColor: currentZone.color }}
                ></span>
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Live Heart Rate Telemetry
              </span>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${currentZone.badgeBg}`}
            >
              {currentZone.name}
            </span>
          </div>

          <div className="my-4 flex items-baseline gap-3">
            <div className="flex items-center gap-2">
              <Heart
                className="w-8 h-8 text-rose-500 fill-rose-500 animate-pulse-heart"
              />
              <span className="text-5xl font-bold font-sans text-slate-800 tracking-tight">
                {biometrics.currentBpm}
              </span>
            </div>
            <span className="text-sm font-semibold text-slate-400">BPM</span>
            <span className="text-xs text-slate-500 ml-auto">
              Max Today: <strong className="text-slate-800">{biometrics.maxBpmToday}</strong> BPM
            </span>
          </div>

          {/* Real-time Oscilloscope ECG Waveform */}
          <div className="bg-[#F8FAFC] rounded-xl p-2 border border-slate-100 overflow-hidden relative">
            <canvas
              ref={canvasRef}
              width={420}
              height={80}
              className="w-full h-20 block"
            />
            <div className="absolute bottom-1 right-2 text-[10px] text-slate-400 font-mono">
              Live Rhythm Trace
            </div>
          </div>
        </div>

        {/* Recovery Score & Readiness */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Recovery Score
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
              Prime
            </span>
          </div>

          <div className="my-3 flex items-center justify-between">
            <div>
              <span className="text-3xl font-bold font-sans text-slate-800">
                {biometrics.recoveryScore}%
              </span>
              <p className="text-xs text-slate-500 mt-1">High Parasympathetic Tone</p>
            </div>
            <div className="w-14 h-14 rounded-full border-4 border-emerald-500 border-t-emerald-200 flex items-center justify-center font-bold text-xs text-emerald-700">
              {biometrics.recoveryScore}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Resting HR: <strong>{biometrics.restingBpm} bpm</strong></span>
            <span>HRV: <strong>{biometrics.hrvMs} ms</strong></span>
          </div>
        </div>

        {/* Day Strain & Sleep Quality */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Cardiovascular Strain
            </span>
            <Flame className="w-4 h-4 text-orange-500" />
          </div>

          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-sans text-slate-800">
                {biometrics.strainScore}
              </span>
              <span className="text-xs font-semibold text-slate-400">/ 21.0</span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${(biometrics.strainScore / 21) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Moon className="w-3.5 h-3.5 text-blue-600" /> {biometrics.sleepHours}h sleep
            </span>
            <span className="font-semibold text-slate-700">{biometrics.sleepQuality}</span>
          </div>
        </div>
      </div>

      {/* Heart Rate Zones Distribution Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Heart Rate Zone Distribution</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Total active cardiovascular duration: {biometrics.timeInZones.z1 + biometrics.timeInZones.z2 + biometrics.timeInZones.z3 + biometrics.timeInZones.z4 + biometrics.timeInZones.z5} minutes
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">Formula: % Max HR (190 BPM)</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { zone: 'Zone 1', name: 'Warmup', range: '<114 bpm', mins: biometrics.timeInZones.z1, color: 'bg-blue-500', text: 'text-blue-600' },
            { zone: 'Zone 2', name: 'Aerobic Base', range: '114-133 bpm', mins: biometrics.timeInZones.z2, color: 'bg-emerald-500', text: 'text-emerald-600' },
            { zone: 'Zone 3', name: 'Tempo', range: '133-152 bpm', mins: biometrics.timeInZones.z3, color: 'bg-amber-500', text: 'text-amber-600' },
            { zone: 'Zone 4', name: 'Threshold', range: '152-171 bpm', mins: biometrics.timeInZones.z4, color: 'bg-orange-500', text: 'text-orange-600' },
            { zone: 'Zone 5', name: 'Max Effort', range: '>171 bpm', mins: biometrics.timeInZones.z5, color: 'bg-red-500', text: 'text-red-600' },
          ].map((z, idx) => (
            <div key={idx} className="bg-[#F8FAFC] rounded-xl p-3.5 border border-slate-100">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${z.text}`}>{z.zone}</span>
                <span className="text-[11px] font-mono text-slate-400">{z.range}</span>
              </div>
              <p className="text-xs text-slate-700 font-medium mt-0.5">{z.name}</p>
              <div className="mt-2.5 flex items-baseline justify-between">
                <span className="text-lg font-bold font-sans text-slate-800">{z.mins}m</span>
                <span className="text-[10px] text-slate-400">
                  {Math.round((z.mins / (biometrics.timeInZones.z1 + biometrics.timeInZones.z2 + biometrics.timeInZones.z3 + biometrics.timeInZones.z4 + biometrics.timeInZones.z5 || 1)) * 100)}%
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1.5 overflow-hidden">
                <div
                  className={`${z.color} h-1.5 rounded-full`}
                  style={{
                    width: `${Math.min(100, (z.mins / 45) * 100)}%`,
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Biometric Health Advisor Section */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-sky-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  AI Biometric Health Advisor
                </h3>
                <p className="text-xs text-slate-400">
                  Automated clinical analysis correlating HRV, resting heart rate, and training strain
                </p>
              </div>
            </div>

            <button
              id="analyze-biometrics-btn"
              onClick={fetchBiometricInsights}
              disabled={loadingInsights}
              className="px-4 py-2 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-lg transition-all flex items-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingInsights ? 'animate-spin' : ''}`} />
              {loadingInsights ? 'Analyzing Autonomic System...' : 'Generate Actionable Insights'}
            </button>
          </div>

          {insights ? (
            <div className="mt-5 space-y-4 pt-4 border-t border-slate-800">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/60">
                  <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">
                    Readiness Status
                  </span>
                  <h4 className="text-lg font-bold text-white mt-1">
                    {insights.recoveryStatus} ({insights.recoveryScore}%)
                  </h4>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    {insights.trainingReadinessRecommendation}
                  </p>
                </div>

                <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/60">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                    Suggested Target
                  </span>
                  <h4 className="text-lg font-bold text-white mt-1">
                    {insights.suggestedWorkoutType}
                  </h4>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    {insights.heartRateInsights}
                  </p>
                </div>

                <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/60">
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                    Nutrition & Hydration
                  </span>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    {insights.nutritionHydrationFocus}
                  </p>
                  {insights.longTermTrend && (
                    <div className="mt-2 text-[11px] text-slate-400 pt-2 border-t border-slate-700/60">
                      📈 {insights.longTermTrend}
                    </div>
                  )}
                </div>
              </div>

              {/* Actionable Tips List */}
              <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/40">
                <h5 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Prescribed Actions for Today
                </h5>
                <ul className="space-y-2">
                  {insights.actionableAdvice.map((advice, idx) => (
                    <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0"></span>
                      <span>{advice}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-2">
                <Info className="w-4 h-4 text-sky-400" />
                Tap 'Generate Actionable Insights' to have the AI interpret your live physiological telemetry.
              </span>
              <button
                onClick={fetchBiometricInsights}
                className="text-sky-400 hover:text-sky-300 font-semibold"
              >
                Run Quick Assessment &rarr;
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
