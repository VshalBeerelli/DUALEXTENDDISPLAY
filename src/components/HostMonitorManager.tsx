/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Monitor, PlusCircle, Trash, Move, CheckSquare, Settings2, ShieldCheck, ToggleLeft, ToggleRight } from "lucide-react";
import { VirtualMonitor, DisplayOrientation } from "../types";

interface Props {
  monitors: VirtualMonitor[];
  onAddMonitor: () => void;
  onRemoveMonitor: (id: string) => void;
  onUpdateMonitor: (id: string, updates: Partial<VirtualMonitor>) => void;
  onLogMessage: (msg: string) => void;
  isDriverActive: boolean;
  onToggleDriver: (status: boolean) => void;
}

export function HostMonitorManager({
  monitors,
  onAddMonitor,
  onRemoveMonitor,
  onUpdateMonitor,
  onLogMessage,
  isDriverActive,
  onToggleDriver,
}: Props) {
  const [selectedMonitorId, setSelectedMonitorId] = useState<string>(monitors[0]?.id || "");

  const selectedMonitor = monitors.find((m) => m.id === selectedMonitorId);

  const handleResolutionPreset = (id: string, w: number, h: number) => {
    onUpdateMonitor(id, { width: w, height: h });
    onLogMessage(`[VirtualDisplayDriver] Updated monitor ID ${id} resolution preset to ${w}x${h}`);
  };

  const handleArrange = (id: string, direction: "left" | "right" | "top" | "bottom") => {
    let newX = 0;
    let newY = 0;
    if (direction === "left") { newX = -1920; newY = 0; }
    else if (direction === "right") { newX = 1920; newY = 0; }
    else if (direction === "top") { newX = 0; newY = -1080; }
    else if (direction === "bottom") { newX = 0; newY = 1080; }

    onUpdateMonitor(id, { positionX: newX, positionY: newY });
    onLogMessage(`[WDDM GridManager] Arranged monitor coordinate positions. ID: ${id} positioned relative to primary display at Offset (${newX}, ${newY})`);
  };

  const toggleDriverState = () => {
    const nextState = !isDriverActive;
    onToggleDriver(nextState);
  };

  return (
    <div className="space-y-6">
      {/* Driver status banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex gap-2.5 items-start">
          <ShieldCheck className={`w-5 h-5 shrink-0 ${isDriverActive ? "text-cyan-400" : "text-amber-500"}`} />
          <div>
            <span className="text-xs font-bold text-slate-200 block font-display">
              WDDM Windows Display Class Driver (UMDF v2)
            </span>
            <span className="text-[10px] text-slate-400 font-sans leading-tight block">
              {isDriverActive 
                ? "Indirect Display Driver (IDD) kernel subsystem loaded on PCI Virtual Adapter. Supports zero copy shared textures."
                : "Fallback virtualization mode active. Allocating host user-mode virtual screen frame buffers."}
            </span>
          </div>
        </div>
        <button
          onClick={toggleDriverState}
          className={`px-3 py-1 text-xs rounded-lg font-mono font-bold flex items-center gap-1 cursor-pointer transition-all ${
            isDriverActive 
              ? "bg-cyan-950/40 text-cyan-400 border border-cyan-800/40 hover:bg-cyan-900/40" 
              : "bg-amber-950/40 text-amber-500 border border-amber-800/40 hover:bg-amber-900/40"
          }`}
        >
          {isDriverActive ? (
            <>Active <ToggleRight className="w-5 h-5" /></>
          ) : (
            <>Degraded fallback <ToggleLeft className="w-5 h-5" /></>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left pane: Display layout visual mapping */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-display flex items-center gap-1.5">
                <Monitor className="w-4 h-4 text-cyan-400" /> Virtual Screens Layout Map
              </span>
              <button
                onClick={onAddMonitor}
                disabled={monitors.length >= 3}
                className="px-3 py-1 text-[10px] font-bold uppercase rounded bg-cyan-700 hover:bg-cyan-600 disabled:bg-slate-800 text-slate-950 disabled:text-slate-500 flex items-center gap-1 cursor-pointer transition-colors"
                title="Create a completely new virtual monitor display device"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Inject Display
              </button>
            </div>

            <p className="text-[11px] text-slate-400 font-sans mb-4 leading-normal">
              Click a monitor block below to highlight it and calibrate specific scaling, alignment coordinates, or color characteristics on the right setup pane.
            </p>
          </div>

          {/* Sizable visual grid representative layout box */}
          <div className="flex-1 min-h-[220px] bg-slate-950 rounded-lg p-4 border border-slate-850 flex flex-col items-center justify-center relative select-none">
            <div className="flex flex-wrap gap-4 items-center justify-center relative">
              {monitors.map((mon) => {
                const isSelected = mon.id === selectedMonitorId;
                return (
                  <div
                    key={mon.id}
                    onClick={() => setSelectedMonitorId(mon.id)}
                    className={`p-3 rounded-lg border flex flex-col items-center justify-between transition-all cursor-pointer relative ${
                      isSelected
                        ? "bg-cyan-950/30 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500 text-cyan-100"
                        : "bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                    style={{
                      width: mon.orientation === "Landscape" ? "140px" : "90px",
                      height: mon.orientation === "Landscape" ? "90px" : "140px",
                    }}
                  >
                    <span className="text-[10px] font-mono uppercase bg-slate-950 border border-slate-800 px-1.5 py-0.5 rounded font-bold">
                      ID: {mon.id.split("-")[1] || "Core"}
                    </span>
                    <div className="text-center">
                      <div className="text-[10px] font-bold truncate max-w-[80px] font-display">
                        {mon.name}
                      </div>
                      <span className="text-[8px] opacity-75 font-mono">
                        {mon.width}x{mon.height}
                      </span>
                    </div>

                    <span className="text-[8px] text-slate-500 font-mono">
                      Pos: {mon.positionX === 0 ? "Center" : mon.positionX < 0 ? "Left Offset" : "Right Offset"}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Visual alignment blueprint context reading */}
            <div className="absolute bottom-2 left-2 text-[9px] text-slate-600 font-mono">
              Virtual Coordinates: {monitors.length} Displays Registered
            </div>
          </div>
        </div>

        {/* Right pane: Selected monitor calibration rules */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-display flex items-center gap-1.5 mb-4 border-b border-slate-850 pb-2">
            <Settings2 className="w-4 h-4 text-violet-400" /> Active Screen Configuration
          </h4>

          {selectedMonitor ? (
            <div className="space-y-4">
              {/* Display name and status */}
              <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded border border-slate-850">
                <div>
                  <div className="text-xs font-bold text-slate-200">{selectedMonitor.name}</div>
                  <span className="text-[9px] font-mono text-slate-500">
                    {selectedMonitor.isVirtual ? "Driver Virtualized Device" : "Native Physical Head Adapter"}
                  </span>
                </div>
                {selectedMonitor.isVirtual && (
                  <button
                    onClick={() => {
                      onRemoveMonitor(selectedMonitor.id);
                      onLogMessage(`[VirtualDisplayDriver] Destroyed virtual display device instance ${selectedMonitor.id}`);
                      setSelectedMonitorId(monitors[0]?.id || "");
                    }}
                    className="p-1.5 rounded bg-rose-950/40 hover:bg-rose-900/40 text-rose-400 border border-rose-800/20 cursor-pointer text-[10px] font-mono flex items-center gap-1 transition-all"
                    title="Remove virtual monitor"
                  >
                    <Trash className="w-3.5 h-3.5" /> Delete
                  </button>
                )}
              </div>

              {/* Resolution settings selector */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase text-slate-500 font-mono block">Monitor Resolution Preset</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button 
                    onClick={() => handleResolutionPreset(selectedMonitor.id, 1920, 1080)}
                    className={`py-1 bg-slate-950 hover:bg-slate-850 text-[10px] rounded font-mono border text-center cursor-pointer ${selectedMonitor.width === 1920 ? "text-cyan-400 border-cyan-500/40" : "text-slate-400 border-transparent"}`}
                  >
                    1080p FHD (16:9)
                  </button>
                  <button 
                    onClick={() => handleResolutionPreset(selectedMonitor.id, 2560, 1440)}
                    className={`py-1 bg-slate-950 hover:bg-slate-850 text-[10px] rounded font-mono border text-center cursor-pointer ${selectedMonitor.width === 2560 ? "text-cyan-400 border-cyan-500/40" : "text-slate-400 border-transparent"}`}
                  >
                    1440p QHD (2K)
                  </button>
                  <button 
                    onClick={() => handleResolutionPreset(selectedMonitor.id, 3840, 2160)}
                    className={`py-1 bg-slate-950 hover:bg-slate-850 text-[10px] rounded font-mono border text-center cursor-pointer ${selectedMonitor.width === 3840 ? "text-cyan-400 border-cyan-500/40" : "text-slate-400 border-transparent"}`}
                  >
                    2160p UHD (4K)
                  </button>
                  <button 
                    onClick={() => handleResolutionPreset(selectedMonitor.id, 1080, 2400)}
                    className={`py-1 bg-slate-950 hover:bg-slate-850 text-[10px] rounded font-mono border text-center cursor-pointer ${selectedMonitor.width === 1080 && selectedMonitor.height === 2400 ? "text-cyan-400 border-cyan-500/40" : "text-slate-400 border-transparent"}`}
                  >
                    FHD Tall Portrait (Mobile)
                  </button>
                </div>
              </div>

              {/* Layout arrangements settings (Left right align context) */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase text-slate-500 font-mono block">Align Monitor Coordinate Grid</span>
                <div className="grid grid-cols-4 gap-1">
                  <button 
                    onClick={() => handleArrange(selectedMonitor.id, "left")}
                    className="py-1 bg-slate-950 hover:bg-slate-850 text-[10px] rounded font-mono text-slate-300 flex items-center justify-center gap-1 border border-slate-850 cursor-pointer"
                  >
                    <Move className="w-3 h-3 text-slate-500 rotate-180" /> Left
                  </button>
                  <button 
                    onClick={() => handleArrange(selectedMonitor.id, "right")}
                    className="py-1 bg-slate-950 hover:bg-slate-850 text-[10px] rounded font-mono text-slate-300 flex items-center justify-center gap-1 border border-slate-850 cursor-pointer"
                  >
                    Right <Move className="w-3 h-3 text-slate-500" />
                  </button>
                  <button 
                    onClick={() => handleArrange(selectedMonitor.id, "top")}
                    className="py-1 bg-slate-950 hover:bg-slate-850 text-[10px] rounded font-mono text-slate-300 flex items-center justify-center gap-1 border border-slate-850 cursor-pointer"
                  >
                    Top <Move className="w-3 h-3 text-slate-500 -rotate-90" />
                  </button>
                  <button 
                    onClick={() => handleArrange(selectedMonitor.id, "bottom")}
                    className="py-1 bg-slate-950 hover:bg-slate-850 text-[10px] rounded font-mono text-slate-300 flex items-center justify-center gap-1 border border-slate-850 cursor-pointer"
                  >
                    Bottom <Move className="w-3 h-3 text-slate-500 rotate-90" />
                  </button>
                </div>
              </div>

              {/* Refresh rate settings */}
              <div>
                <span className="text-[10px] uppercase text-slate-500 font-mono block mb-1">FPS Target Lock</span>
                <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-850">
                  {([60, 120, 144] as const).map((rate) => (
                    <button
                      key={rate}
                      onClick={() => {
                        onUpdateMonitor(selectedMonitor.id, { refreshRate: rate });
                        onLogMessage(`[VirtualDisplayDriver] Screen ID ${selectedMonitor.id} set refresh-rate to ${rate}Hz`);
                      }}
                      className={`flex-1 py-1 text-[10px] font-mono rounded font-bold transition-all cursor-pointer ${
                        selectedMonitor.refreshRate === rate
                          ? "bg-violet-900/30 text-violet-400 border border-violet-800/40"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {rate} Hz
                    </button>
                  ))}
                </div>
              </div>

              {/* DPI scale percentages selector */}
              <div>
                <span className="text-[10px] uppercase text-slate-500 font-mono block mb-1">DPI Scaling Adjust</span>
                <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-850">
                  {([100, 125, 150, 200] as const).map((scale) => (
                    <button
                      key={scale}
                      onClick={() => {
                        onUpdateMonitor(selectedMonitor.id, { scalePercent: scale });
                        onLogMessage(`[VirtualDisplayDriver] Updated monitor ID ${selectedMonitor.id} DPI scaling scale factor to ${scale}%`);
                      }}
                      className={`flex-1 py-1 text-[9px] font-mono rounded transition-all cursor-pointer ${
                        selectedMonitor.scalePercent === scale
                          ? "bg-violet-900/30 text-violet-400 border border-violet-800/40"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {scale}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Orientation Mode */}
              <div>
                <span className="text-[10px] uppercase text-slate-500 font-mono block mb-1">DPI Orientation Scan</span>
                <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-850">
                  {(["Landscape", "Portrait"] as DisplayOrientation[]).map((orient) => (
                    <button
                      key={orient}
                      onClick={() => {
                        onUpdateMonitor(selectedMonitor.id, { orientation: orient });
                        onLogMessage(`[VirtualDisplayDriver] Screen ID ${selectedMonitor.id} orientation rotated to ${orient}`);
                      }}
                      className={`flex-1 py-1 text-[10px] font-sans rounded transition-all cursor-pointer ${
                        selectedMonitor.orientation === orient
                          ? "bg-violet-900/30 text-violet-400 border border-violet-800/40"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {orient}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center py-12 text-slate-600 font-sans text-xs">
              Select or create a monitor node to customize configurations.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
