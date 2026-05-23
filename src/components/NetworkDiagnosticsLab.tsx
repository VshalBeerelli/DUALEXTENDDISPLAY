/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Zap, Wifi, Signal, AlertTriangle, ShieldCheck, Thermometer, Battery, Info } from "lucide-react";
import { NetworkHealthState, SystemResourceMetric, EncoderType } from "../types";

interface Props {
  metrics: NetworkHealthState;
  system: SystemResourceMetric;
  currentEncoder: EncoderType;
  selectedPreset: string;
  onApplyStress: (presetName: "normal" | "congested" | "microwave" | "usb" | "throttled") => void;
}

export function NetworkDiagnosticsLab({
  metrics,
  system,
  currentEncoder,
  selectedPreset,
  onApplyStress,
}: Props) {
  // Store a rolling memory buffer of history points to render gorgeous live custom SVG sparkline graphs
  const [latencyHistory, setLatencyHistory] = useState<number[]>([12, 11, 13, 15, 12, 10, 14, 11, 12, 16]);
  const [bitrateHistory, setBitrateHistory] = useState<number[]>([15, 14.8, 15.1, 15.0, 14.9, 15.2, 15.3, 14.7, 15.0, 15.1]);
  const [lossHistory, setLossHistory] = useState<number[]>([0, 0, 0, 0.1, 0, 0, 0.2, 0, 0, 0]);

  useEffect(() => {
    // Append current state into local rolling sparklines
    setLatencyHistory((prev) => {
      const next = [...prev.slice(1), metrics.rttMs];
      return next;
    });
    setBitrateHistory((prev) => {
      const next = [...prev.slice(1), metrics.actualBitrateBps / 1_000_000];
      return next;
    });
    setLossHistory((prev) => {
      const next = [...prev.slice(1), metrics.packetLossFraction * 100];
      return next;
    });
  }, [metrics]);

  // Renders a clean CSS-based sparkline graph inside an SVG viewport
  const renderSparkline = (data: number[], min: number, max: number, strokeColor: string, fillColor: string) => {
    const width = 160;
    const height = 40;
    const padding = 2;
    const range = max - min || 1;
    const points = data
      .map((val, i) => {
        const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
        const normY = (val - min) / range;
        const y = height - (normY * (height - padding * 2) + padding);
        return `${x},${y}`;
      })
      .join(" ");

    const fillPoints = `${padding},${height} ${points} ${width - padding},${height}`;

    return (
      <svg className="w-full h-10 overflow-hidden" viewBox={`0 0 ${width} ${height}`}>
        <polygon points={fillPoints} fill={fillColor} opacity="0.15" />
        <polyline points={points} fill="none" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: RTT Latency */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
              <span className="font-semibold uppercase tracking-wider">RTT Network Latency</span>
              <Signal className={`w-3.5 h-3.5 ${metrics.rttMs < 5 ? "text-cyan-400" : metrics.rttMs < 25 ? "text-indigo-400" : "text-amber-500"}`} />
            </div>
            <div className="flex items-baseline gap-1.5 py-1">
              <span className="text-2xl font-bold font-mono text-slate-100 tracking-tight">
                {metrics.rttMs.toFixed(1)}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">ms</span>
            </div>
          </div>
          <div className="mt-3">
            {renderSparkline(latencyHistory, 0, Math.max(...latencyHistory, 35), "#06b6d4", "#06b6d4")}
            <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono mt-1">
              <span>Stable Clock</span>
              <span>Jitter: {metrics.jitterMs.toFixed(1)}ms</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Adaptive Compression Bitrate */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
              <span className="font-semibold uppercase tracking-wider">Dynamic Stream Bitrate</span>
              <Zap className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <div className="flex items-baseline gap-1.5 py-1">
              <span className="text-2xl font-bold font-mono text-slate-100 tracking-tight">
                {(metrics.actualBitrateBps / 1_000_000).toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Mbps</span>
            </div>
          </div>
          <div className="mt-3">
            {renderSparkline(bitrateHistory, 0.5, 30, "#8b5cf6", "#8b5cf6")}
            <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono mt-1">
              <span>Limit Cap: 35.0M</span>
              <span>Target: {(metrics.targetBitrateBps / 1_000_000).toFixed(1)}M</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Frame Packet Loss */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
              <span className="font-semibold uppercase tracking-wider">Network Integrity Loss</span>
              <AlertTriangle className={`w-3.5 h-3.5 ${metrics.packetLossFraction > 0.01 ? "text-amber-500" : "text-green-500"}`} />
            </div>
            <div className="flex items-baseline gap-1.5 py-1">
              <span className="text-2xl font-bold font-mono text-slate-100 tracking-tight">
                {(metrics.packetLossFraction * 100).toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">%</span>
            </div>
          </div>
          <div className="mt-3">
            {renderSparkline(lossHistory, 0, Math.max(...lossHistory, 5), "#f59e0b", "#f59e0b")}
            <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono mt-1">
              <span>0% Loss Floor</span>
              <span>FEC Redundancy: +3%</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Hardware Encoding Pipelines */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="text-slate-500 text-[11px] mb-1 font-semibold uppercase tracking-wider">
              Enforced Hardware Engine
            </div>
            <div className="py-1 flex flex-col gap-0.5">
              <span className="text-sm font-bold font-sans text-white truncate">
                {currentEncoder}
              </span>
              <span className="text-[10px] text-slate-500 font-mono leading-none">
                Constant Rate Factor (CRF) VBR
              </span>
            </div>
          </div>
          <div className="mt-4 pt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono bg-slate-800 text-cyan-400 px-2 py-0.5 rounded font-bold">
              GPUDirect-WGC
            </span>
            <span className="text-[9px] text-slate-400 font-mono flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-green-500 shrink-0" /> Zero Copy
            </span>
          </div>
        </div>
      </div>

      {/* Network Stress Testing Lab */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Wifi className="w-5 h-5 text-cyan-400" />
          <h3 className="text-xs font-semibold uppercase text-slate-200 tracking-wider font-display">
            Real-Time Network Quality & Stress Injection Lab
          </h3>
        </div>
        <p className="text-xs text-slate-400 mb-5 max-w-3xl">
          Simulate standard connectivity modes or inject severe packet loss or Wi-Fi channel crowding to demonstrate how our the system's rate controller negotiates high resolution displays (downscaling frame-rate/bitrate dynamically instead of throwing fatal errors).
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Preset 1: Gigabit USB */}
          <button
            onClick={() => onApplyStress("usb")}
            className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
              selectedPreset === "usb"
                ? "bg-cyan-950/40 border-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.1)] text-cyan-100"
                : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
            }`}
          >
            <div className="font-bold text-xs font-display">Direct USB 3.0</div>
            <div className="text-[10px] opacity-75 mt-1 font-mono leading-tight">
              RTT: ~1ms<br />Loss: 0.00%<br />Rate: 144Hz Peak
            </div>
          </button>

          {/* Preset 2: Wi-Fi 5GHz Optimal */}
          <button
            onClick={() => onApplyStress("normal")}
            className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
              selectedPreset === "normal"
                ? "bg-cyan-950/40 border-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.1)] text-cyan-100"
                : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
            }`}
          >
            <div className="font-bold text-xs font-display">Wi-Fi 5GHz (Pure)</div>
            <div className="text-[10px] opacity-75 mt-1 font-mono leading-tight">
              RTT: ~8ms<br />Loss: 0.02%<br />Rate: 60-120Hz
            </div>
          </button>

          {/* Preset 3: Restricted Wi-Fi (2.4GHz Crowded) */}
          <button
            onClick={() => onApplyStress("congested")}
            className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
              selectedPreset === "congested"
                ? "bg-amber-950/40 border-amber-600 shadow-[0_0_12px_rgba(245,158,11,0.1)] text-amber-100"
                : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
            }`}
          >
            <div className="font-bold text-xs font-display">2.4GHz Overcrowded</div>
            <div className="text-[10px] opacity-75 mt-1 font-mono leading-tight">
              RTT: ~28ms<br />Loss: 2.10%<br />H.264 Fallback
            </div>
          </button>

          {/* Preset 4: High Microwave Interference */}
          <button
            onClick={() => onApplyStress("microwave")}
            className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
              selectedPreset === "microwave"
                ? "bg-rose-950/40 border-rose-600 shadow-[0_0_12px_rgba(244,63,94,0.1)] text-rose-100"
                : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
            }`}
          >
            <div className="font-bold text-xs font-display">Extreme Droppings</div>
            <div className="text-[10px] opacity-75 mt-1 font-mono leading-tight">
              RTT: ~45ms<br />Loss: 12.80%<br />Bitrate throttled
            </div>
          </button>

          {/* Preset 5: Battery Saver Low-Thermal Mode */}
          <button
            onClick={() => onApplyStress("throttled")}
            className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
              selectedPreset === "throttled"
                ? "bg-indigo-950/40 border-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.1)] text-indigo-100"
                : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
            }`}
          >
            <div className="font-bold text-xs font-display">Battery Saver Mode</div>
            <div className="text-[10px] opacity-75 mt-1 font-mono leading-tight">
              RTT: ~12ms<br />Loss: 0.10%<br />30 FPS Enforced
            </div>
          </button>
        </div>
      </div>

      {/* Resource & Energy Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h4 className="text-xs font-semibold uppercase text-slate-300 mb-4 font-display flex items-center gap-2">
            Windows Host Resource Profile
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-850">
              <span className="text-[10px] uppercase text-slate-500 font-mono block">CPU Usage</span>
              <span className="text-xl font-bold font-mono text-slate-100">{system.cpuUsage}%</span>
              <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
                <div className="bg-cyan-400 h-1" style={{ width: `${system.cpuUsage}%` }} />
              </div>
            </div>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-850">
              <span className="text-[10px] uppercase text-slate-500 font-mono block">GPU Encoding Load</span>
              <span className="text-xl font-bold font-mono text-slate-100">{system.gpuUsage}%</span>
              <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
                <div className="bg-violet-400 h-1" style={{ width: `${system.gpuUsage}%` }} />
              </div>
            </div>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-850">
              <span className="text-[10px] uppercase text-slate-500 font-mono block">VRAM Footprint</span>
              <span className="text-xl font-bold font-mono text-slate-100">{system.vramMb} MB</span>
              <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
                <div className="bg-indigo-400 h-1" style={{ width: `${(system.vramMb / 4096) * 100}%` }} />
              </div>
            </div>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-850">
              <span className="text-[10px] uppercase text-slate-500 font-mono block">System RAM</span>
              <span className="text-xl font-bold font-mono text-slate-100">{system.ramUsagePercent}%</span>
              <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
                <div className="bg-emerald-400 h-1" style={{ width: `${system.ramUsagePercent}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <h4 className="text-xs font-semibold uppercase text-slate-300 font-display flex items-center gap-1.5 mb-3">
            Thermal & Power Metrics
          </h4>

          <div className="space-y-3 flex-1 flex flex-col justify-center">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Thermometer className="w-4 h-4 text-rose-400" /> Host Temperature
              </span>
              <span className={`font-mono font-bold ${system.thermalStatus === "Throttled" ? "text-rose-400" : "text-slate-200"}`}>
                {system.thermalStatus === "Cool" ? "42°C (Cool)" : system.thermalStatus === "Warm" ? "56°C (Warm)" : "76°C (Throttled)"}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Battery className="w-4 h-4 text-emerald-400" /> Battery Condition
              </span>
              <span className="font-mono font-bold text-slate-200 uppercase">
                {system.batteryStatus}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5 bg-slate-850 px-2 py-0.5 rounded text-[10px]">
                Adaptive Quantization
              </span>
              <span className="font-mono text-cyan-400 font-semibold">
                QP: {selectedPreset === "microwave" ? "34 (Coarse)" : "16 (Pris)"}
              </span>
            </div>
          </div>

          <div className="mt-3 text-[10px] text-slate-500 flex items-start gap-1 p-2 bg-slate-950 rounded border border-slate-850">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>
              Real-time monitoring optimizes the encoder quantization parameter (QP) automatically to reduce tablet thermal fatigue.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
