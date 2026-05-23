/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { MousePointer, Clipboard, Upload, CornerDownLeft, RefreshCw, PenTool, Type, HelpCircle, HardDrive, AlertTriangle } from "lucide-react";
import { ClipboardItem, SharedFile } from "../types";

interface Props {
  fpsLimit: number;
  selectedPreset: string;
  onLogMessage: (msg: string) => void;
  onAddClipboard: (item: ClipboardItem) => void;
  clipboardHistory: ClipboardItem[];
  onAddFile: (file: SharedFile) => void;
  files: SharedFile[];
}

export function ClientViewportSimulator({
  fpsLimit,
  selectedPreset,
  onLogMessage,
  onAddClipboard,
  clipboardHistory,
  onAddFile,
  files,
}: Props) {
  const [activeTab, setActiveTab] = useState<"screen" | "stylus" | "clipboard" | "files">("screen");
  
  // Virtual Windows Desktop states
  const [mockClock, setMockClock] = useState("");
  const [activeWindow, setActiveWindow] = useState<string | null>("code");
  const [zoomScale, setZoomScale] = useState(100);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [rotationDegrees, setRotationDegrees] = useState(0);

  // Stylus pen canvas setup
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [penColor, setPenColor] = useState("#06b6d4");
  const [penPressure, setPenPressure] = useState(0.8);
  const [penTilt, setPenTilt] = useState(15);
  const [isDrawing, setIsDrawing] = useState(false);

  // Input fields
  const [clientInputText, setClientInputText] = useState("");
  const [hostInputCopy, setHostInputCopy] = useState("Drafting high-priority design layout specs...");

  // Gesture selection
  const [selectedGesture, setSelectedGesture] = useState<"single-tap" | "pinch" | "scroll">("single-tap");
  const [gestureAlert, setGestureAlert] = useState<string | null>(null);

  // File Upload states
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragOverActive, setDragOverActive] = useState(false);

  // Real-time active WebSocket client connection
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    onLogMessage(`[WebSocket] Establishing local viewport loop: ${wsUrl}`);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setSocketConnected(true);
      setSocket(ws);
      onLogMessage("[WebSocket] Viewport channel synchronized perfectly with host driver");
      
      // Perform initial cryptographic PIN or policy pairing handshake
      ws.send(JSON.stringify({
        type: "pairing_handshake",
        clientName: "Android Client Simulator",
        clientType: "Android Tablet",
        ip: "127.0.0.1",
        pin: "482 915"
      }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "clipboard_in") {
          onLogMessage(`[DriverService] Received host physical clipboard replication: "${msg.content.substring(0, 30)}..."`);
          setClientInputText(msg.content);
          onAddClipboard({
            id: `CLIP-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            type: "text",
            content: msg.content,
            source: "host"
          });
        } else if (msg.type === "handshake_response") {
          if (msg.success) {
            onLogMessage(`[SecurityAuth] Session access level GRANTED by active directory.`);
          } else {
            onLogMessage(`[SecurityAuth] Handshake REJECTED: ${msg.reason}`);
          }
        }
      } catch (err: any) {
        console.error("Failed decoding WS frame", err);
      }
    };

    ws.onclose = () => {
      setSocketConnected(false);
      setSocket(null);
      onLogMessage("[WebSocket] Viewport session unregistered");
    };

    return () => {
      ws.close();
    };
  }, []);

  // Send input coordinates back to Express controller
  const sendInputCoordinates = (action: string, clientX: number, clientY: number, element: HTMLElement) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    const rect = element.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;

    socket.send(JSON.stringify({
      type: "input_emulation",
      action,
      x,
      y,
      pressure: penPressure,
      tilt: penTilt
    }));
  };

  // Clock ticks
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setMockClock(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // HTML5 Drawing canvas implementation
  const handleStartDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);

    onLogMessage(`[Stylus] Ink stroke started. Coord (${Math.round(x)}, ${Math.round(y)}), Pressure: ${penPressure}, Tilt: ${penTilt}°`);
    sendInputCoordinates("STYLUS_START", e.clientX, e.clientY, canvas);
  };

  const handleDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Use dynamic thickness mapped to Pen Pressure
    const thickness = penPressure * 8 + 1;
    ctx.lineWidth = thickness;
    ctx.strokeStyle = penColor;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.lineTo(x, y);
    ctx.stroke();

    sendInputCoordinates("STYLUS_DRAG", e.clientX, e.clientY, canvas);
  };

  const handleStopDraw = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onLogMessage("[Stylus] Sketchpad buffer cleared");
  };

  // Sync clipboard actions
  const handleHostToClientSync = () => {
    if (!hostInputCopy.trim()) return;
    const newItem: ClipboardItem = {
      id: Math.random().toString(),
      timestamp: new Date().toLocaleTimeString(),
      type: "text",
      content: hostInputCopy,
      source: "host"
    };
    onAddClipboard(newItem);
    setClientInputText(hostInputCopy); // Recieved by client
    onLogMessage(`[Clipboard] Synced host item -> client. Length: ${hostInputCopy.length} chars`);
  };

  const handleClientToHostSync = () => {
    if (!clientInputText.trim()) return;
    const newItem: ClipboardItem = {
      id: Math.random().toString(),
      timestamp: new Date().toLocaleTimeString(),
      type: "text",
      content: clientInputText,
      source: "client"
    };
    onAddClipboard(newItem);
    setHostInputCopy(clientInputText); // Recieved by host

    // Propagate clipboard changes to Express WebSocket channels instantly
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: "clipboard_out",
        content: clientInputText
      }));
      onLogMessage("[Clipboard] Broadcasted synchronized text over active WebSockets.");
    } else {
      onLogMessage(`[Clipboard] Synced client item -> host. Length: ${clientInputText.length} chars`);
    }
  };

  // Drag and Drop simulation mechanics
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverActive(true);
  };

  const handleDragLeave = () => {
    setDragOverActive(false);
  };

  const processFileInbound = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const rawFile = fileList[0];
    const sizeStr = rawFile.size > 1024 * 1024 
      ? `${(rawFile.size / (1024 * 1024)).toFixed(1)} MB` 
      : `${(rawFile.size / 1024).toFixed(0)} KB`;

    const fileId = `FILE-${Date.now()}`;
    const newFileObj: SharedFile = {
      id: fileId,
      name: rawFile.name,
      size: sizeStr,
      progress: 20,
      status: "transferring",
      direction: "to-host",
      timestamp: new Date().toLocaleTimeString()
    };

    onAddFile(newFileObj);
    onLogMessage(`[FileSync] Initiating disk-sync Base64 streaming: '${rawFile.name}'`);

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = (event.target?.result as string)?.split(",")[1];
      if (!base64Data) {
        onLogMessage(`[FileSync] Error decoding dropped file stream`);
        return;
      }

      onAddFile({ ...newFileObj, progress: 60 });

      // POST raw base64 data to Express filesystem write APIs
      fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: rawFile.name,
          size: rawFile.size,
          dataBase64: base64Data
        })
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            onAddFile({
              id: data.file.id,
              name: data.file.name,
              size: sizeStr,
              progress: 100,
              status: "completed",
              direction: "to-host",
              timestamp: data.file.timestamp
            });
            onLogMessage(`[FileSync] '${data.file.name}' completely integrated to backend physical host path: /uploads`);
          } else {
            onLogMessage(`[FileSync] Sync aborted: ${data.error}`);
            onAddFile({ ...newFileObj, progress: 0, status: "error" });
          }
        })
        .catch((err) => {
          onLogMessage(`[FileSync] Pipeline error uploading: ${err.message}`);
          onAddFile({ ...newFileObj, progress: 0, status: "error" });
        });
    };
    reader.readAsDataURL(rawFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverActive(false);
    processFileInbound(e.dataTransfer.files);
  };

  // Mock File Input Trigger
  const triggerManualFile = () => {
    fileInputRef.current?.click();
  };

  // Simulation parameters for CSS scale/rotate gestures
  const triggerSimulationGesture = (type: "single-tap" | "pinch" | "scroll") => {
    setSelectedGesture(type);
    if (type === "single-tap") {
      setGestureAlert("Single and double tap gesture verified (maps to click/double click on host WGC viewport)");
      setTimeout(() => setGestureAlert(null), 3500);
      onLogMessage("[Gesture] Triggered standard Mouse Down / Primary Click inject context");
    } else if (type === "pinch") {
      const zoomStates = [100, 125, 150, 75];
      const nextIdx = (zoomStates.indexOf(zoomScale) + 1) % zoomStates.length;
      setZoomScale(zoomStates[nextIdx]);
      setGestureAlert(`Multi-touch pinch scale zoomed viewport to ${zoomStates[nextIdx]}% dynamically`);
      setTimeout(() => setGestureAlert(null), 3500);
      onLogMessage(`[Gesture] Multi-finger scale bounding coordinate changed -> Zoom level: ${zoomStates[nextIdx]}%`);
    } else if (type === "scroll") {
      setGestureAlert("Two-finger continuous panoramic scroll (simulating desktop vertical page movements)");
      setTimeout(() => setGestureAlert(null), 3500);
      onLogMessage("[Gesture] Triggered mouse wheel axis delta coordinates scroll update");
    }
  };

  return (
    <div className="space-y-4">
      {/* Tab controls */}
      <div className="flex border-b border-slate-800 bg-slate-950 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab("screen")}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === "screen"
              ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-display"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <MousePointer className="w-4 h-4" /> Screen Session Simulator
        </button>
        <button
          onClick={() => setActiveTab("stylus")}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === "stylus"
              ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-display"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <PenTool className="w-4 h-4" /> Stylus/Sketchpad
        </button>
        <button
          onClick={() => setActiveTab("clipboard")}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === "clipboard"
              ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-display"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Clipboard className="w-4 h-4" /> Clipboard Sync
        </button>
        <button
          onClick={() => setActiveTab("files")}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === "files"
              ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-display"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Upload className="w-4 h-4" /> File Drag-Drop
        </button>
      </div>

      {/* Main interactive output frame */}
      <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 flex flex-col items-center">
        
        {/* Connection health banner inside screen */}
        <div className="w-full flex justify-between items-center text-[10px] text-slate-500 font-mono mb-3 bg-slate-900 px-3 py-1.5 rounded border border-slate-850">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
            Active Session Stream (Vibrance Profile: Off)
          </span>
          <span>Adaptive FPS Lock: {fpsLimit}Hz max</span>
          <span className="text-cyan-400">Status: Connection Optimal</span>
        </div>

        {/* Tab content screens */}
        {activeTab === "screen" && (
          <div className="relative w-full overflow-hidden rounded-xl border border-slate-800 bg-[#161a24] aspect-video flex flex-col glowing-display-cyan">
            
            {/* Extended monitor window interface */}
            <div 
              style={{ transform: `scale(${zoomScale / 100}) rotate(${rotationDegrees}deg)`, transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}
              className="flex-1 select-none flex flex-col justify-between p-4 relative"
            >
              {/* Overlay warning on low bandwidth preset */}
              {selectedPreset === "microwave" && (
                <div className="absolute inset-0 bg-[#0f172a]/95 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center text-center p-6">
                  <AlertTriangle className="w-10 h-10 text-amber-500 mb-2 animate-bounce" />
                  <h4 className="text-xs font-bold text-slate-200 font-display uppercase tracking-widest">
                    Bandwidth Adaptation Triggered
                  </h4>
                  <p className="text-[10px] text-slate-400 max-w-sm mt-1">
                    Severe Wi-Fi packet drops (12.80%). Dynamic compression downgraded stream codec buffer to Soft-x264 software mode to retain structural responsiveness.
                  </p>
                  <button 
                    onClick={() => onLogMessage("[AdaptiveBitrate] User acknowledged bandwidth throttling notice")} 
                    className="mt-3 px-3 py-1 rounded bg-[#1e293b] text-[10px] text-cyan-400 border border-[#334155] cursor-pointer"
                  >
                    Overlay Active Fallback Viewport
                  </button>
                </div>
              )}

              {/* Simulated Windows desktop container */}
              <div className="flex justify-between items-start z-10">
                {/* Simulated Floating Browser / Code Editor window */}
                <div className={`w-64 bg-[#111827] rounded-lg shadow-2xl border ${activeWindow === "code" ? "border-cyan-500" : "border-slate-800"} p-2`}>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2 cursor-pointer" onClick={() => setActiveWindow("code")}>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block" />
                      <span className="text-[9px] font-mono font-bold text-slate-400 ml-1">IDE Source Viewer</span>
                    </div>
                    <span className="text-[9px] opacity-60 text-emerald-400">144 FPS Lock</span>
                  </div>
                  <div className="text-[10px] font-mono text-cyan-300 leading-tight space-y-1">
                    <div>1: <span className="text-violet-400">import</span> {"{ createServer }"} <span className="text-violet-400">from</span> <span className="text-emerald-400">"vite"</span>;</div>
                    <div>2: <span className="text-slate-500">// Booting system capture</span></div>
                    <div>3: <span className="text-violet-400">const</span> WGC_Engine = <span className="text-slate-400">activateGPUDirect()</span>;</div>
                    <div className="text-slate-400 animate-pulse">4: streamingRemoteSocket.broadcast( ) _</div>
                  </div>
                </div>

                {/* Simulated Excel/Sheet Window */}
                <div className={`w-48 bg-[#0f172a] rounded-lg shadow-2xl border ${activeWindow === "sheet" ? "border-cyan-500" : "border-slate-800"} p-2`}>
                  <div className="flex items-center justify-between border-b border-slate-850 pb-1.5 mb-2 cursor-pointer" onClick={() => setActiveWindow("sheet")}>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 block" />
                      <span className="text-[9px] font-mono text-slate-400">Client Frame Pipeline</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[9px] font-mono">
                      <span className="text-slate-500">GPU Dec:</span>
                      <span className="text-emerald-400 font-bold">MediaCodec Native</span>
                    </div>
                    <div className="flex justify-between text-[9px] font-mono">
                      <span className="text-slate-500">Latency:</span>
                      <span className="text-indigo-400 font-bold">~0.4 MicroS</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic wallpaper graphics matching active connections */}
              <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none select-none">
                <HardDrive className="w-48 h-48 text-cyan-100" />
              </div>

              {/* Simulated Windows Desktop Taskbar */}
              <div className="w-full bg-[#0d1424]/90 backdrop-blur border border-slate-800 rounded-lg p-1.5 flex justify-between items-center text-[10px] font-sans z-10 mt-12 shadow-inner">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded uppercase font-display select-none">
                    Start (Extend Mode)
                  </span>
                  <div className="text-slate-400 pl-2 border-l border-slate-800">
                    Host Device: <span className="text-slate-200 font-mono font-medium">DESKTOP-WIN11PRO</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded font-mono text-[9px]">
                    Bitrate: {(6.2 + Math.random() * 0.4).toFixed(1)} Mbps
                  </span>
                  <div className="text-slate-300 font-mono pr-1">
                    {mockClock || "00:00:00"}
                  </div>
                </div>
              </div>

            </div>

            {/* Gesture Testing Control overlay on bottom */}
            <div className="absolute top-3 left-3 bg-[#020617]/90 backdrop-blur border border-slate-850 p-2 rounded-lg flex gap-1 z-30 max-w-sm">
              <button 
                onClick={() => triggerSimulationGesture("single-tap")}
                className={`px-1.5 py-1 text-[9px] font-mono rounded font-semibold cursor-pointer ${selectedGesture === "single-tap" ? "bg-cyan-500 text-slate-950" : "bg-slate-850 text-slate-300 hover:text-white"}`}
              >
                Tap
              </button>
              <button 
                onClick={() => triggerSimulationGesture("pinch")}
                className={`px-1.5 py-1 text-[9px] font-mono rounded font-semibold cursor-pointer ${selectedGesture === "pinch" ? "bg-cyan-500 text-slate-950" : "bg-slate-850 text-slate-300 hover:text-white"}`}
              >
                Pinch Zoom
              </button>
              <button 
                onClick={() => triggerSimulationGesture("scroll")}
                className={`px-1.5 py-1 text-[9px] font-mono rounded font-semibold cursor-pointer ${selectedGesture === "scroll" ? "bg-cyan-500 text-slate-950" : "bg-slate-850 text-slate-300 hover:text-white"}`}
              >
                Two Finger Scroll
              </button>
              <button 
                onClick={() => setRotationDegrees(prev => (prev + 90) % 360)}
                className="px-1.5 py-1 text-[9px] font-mono rounded bg-slate-850 text-slate-300 hover:text-white cursor-pointer"
                title="Rotate Mobile Display Screen Layout"
              >
                Rotate
              </button>
            </div>

            {gestureAlert && (
              <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-cyan-950 border border-cyan-800/60 text-cyan-300 text-[10px] px-3 py-1.5 rounded-full shadow-2xl z-40 max-w-xs text-center font-sans tracking-tight">
                {gestureAlert}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Pen stylus sketching simulation */}
        {activeTab === "stylus" && (
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* Draw surface */}
            <div className="lg:col-span-8 flex flex-col">
              <div className="flex justify-between items-center mb-2 px-1">
                <span className="text-xs text-slate-400 font-sans">
                  Draw below using stylus / mouse cursor to test dynamic digitizer telemetry propagation (pressure level, pen tilt angles).
                </span>
                <button
                  onClick={clearCanvas}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono font-bold cursor-pointer transition-colors"
                >
                  Clear Sketch buffer
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden aspect-video flex relative">
                <canvas
                  ref={canvasRef}
                  width={640}
                  height={360}
                  onMouseDown={handleStartDraw}
                  onMouseMove={handleDraw}
                  onMouseUp={handleStopDraw}
                  onMouseLeave={handleStopDraw}
                  className="w-full h-full bg-slate-950 cursor-crosshair relative z-10"
                />
              </div>
            </div>

            {/* Stylus pressure parameters */}
            <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <h4 className="text-[11px] uppercase font-bold text-slate-400 tracking-wider mb-3">
                  Pen Stylus Telemetry
                </h4>

                <div className="space-y-4">
                  {/* Color Selector */}
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-mono block mb-1">Ink Color Spectrum</span>
                    <div className="flex gap-2">
                      {["#06b6d4", "#8b5cf6", "#f43f5e", "#10b981", "#ff007f"].map((col) => (
                        <button
                          key={col}
                          onClick={() => setPenColor(col)}
                          className={`w-6 h-6 rounded-full cursor-pointer transition-transform ${penColor === col ? "scale-125 ring-2 ring-white" : ""}`}
                          style={{ backgroundColor: col }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Pressure Slider */}
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono uppercase mb-1">
                      <span>Mapped Pen Pressure</span>
                      <span className="text-cyan-400">{(penPressure * 1024).toFixed(0)} levels</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                      value={penPressure}
                      onChange={(e) => setPenPressure(parseFloat(e.target.value))}
                    />
                  </div>

                  {/* Tilt Selector */}
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono uppercase mb-1">
                      <span>Digitizer Tilt Profile</span>
                      <span className="text-cyan-400">{penTilt}° Degrees</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="60"
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                      value={penTilt}
                      onChange={(e) => setPenTilt(parseInt(e.target.value))}
                    />
                  </div>

                  {/* Palm rejection marker */}
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-850">
                    <span className="text-[9px] uppercase font-mono text-emerald-400 block mb-0.5">✔ PALM REJECTION ACTIVE</span>
                    <span className="text-[9px] text-slate-500 font-sans block leading-tight">
                      Sub-pixel capacitive boundaries filtered using standard operating system pointer rejection bounds.
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 italic font-sans leading-tight mt-4 pt-4 border-t border-slate-800 flex gap-1 items-start">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  Allows artist styluses (e.g., Apple Pencil, Surface Pen) to achieve genuine paper-like drawing inputs.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Clipboard Sync */}
        {activeTab === "clipboard" && (
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Sync Interface */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold font-display">
                  <Clipboard className="w-4 h-4 text-cyan-400" /> Clipboard Transceiver Buffer
                </div>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Copying files or strings on either client tablet or Windows host reflects immediately on the opposing machine's buffer without any duplication loops.
                </p>

                {/* Host Copy Source */}
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-mono text-slate-500 block">Host OS Clip Field</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 font-mono focus:outline-none"
                      value={hostInputCopy}
                      onChange={(e) => setHostInputCopy(e.target.value)}
                    />
                    <button 
                      onClick={handleHostToClientSync}
                      className="px-3 bg-cyan-700 hover:bg-cyan-600 rounded-lg text-xs text-slate-950 font-bold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      Sync-Client <CornerDownLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Client Copy Source */}
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-mono text-slate-500 block">Client OS Clip Field</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 font-mono focus:outline-none"
                      placeholder="Type text from mobile device..."
                      value={clientInputText}
                      onChange={(e) => setClientInputText(e.target.value)}
                    />
                    <button 
                      onClick={handleClientToHostSync}
                      className="px-3 bg-violet-600 hover:bg-violet-500 rounded-lg text-xs text-slate-100 font-semibold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      Sync-Host <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sync History Logs */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col">
              <span className="text-xs font-semibold text-slate-300 font-display uppercase tracking-wider mb-2.5">
                Propagation Queue Audit Log
              </span>
              <div className="flex-1 overflow-y-auto max-h-48 space-y-1.5 pr-1 text-[11px] font-mono">
                {clipboardHistory.map((item) => (
                  <div key={item.id} className="p-2 bg-slate-950 rounded border border-slate-850 flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <span className={`text-[8px] uppercase font-bold px-1 rounded ${item.source === "host" ? "bg-cyan-900/40 text-cyan-400" : "bg-violet-900/40 text-violet-400"} mr-1.5`}>
                        {item.source}
                      </span>
                      <span className="text-slate-300 break-all">{item.content}</span>
                    </div>
                    <span className="text-[8px] text-slate-600 self-center whitespace-nowrap">{item.timestamp}</span>
                  </div>
                ))}
                {clipboardHistory.length === 0 && (
                  <div className="text-center py-6 text-[10px] text-slate-600 italic">
                    Paste actions or synchronization inputs are not queued currently
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: File drag-and-drop storage simulated stream */}
        {activeTab === "files" && (
          <div className="w-full space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Drag Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                  dragOverActive
                    ? "bg-cyan-950/20 border-cyan-400 text-cyan-200"
                    : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
                }`}
                onClick={triggerManualFile}
              >
                <div className="p-3 bg-slate-950 rounded-full border border-slate-800 mb-3 text-cyan-400">
                  <Upload className="w-5 h-5 animate-bounce" />
                </div>
                <div className="text-xs font-semibold text-slate-200 font-display uppercase tracking-wider">
                  Drag & Drop Local Files Here
                </div>
                <p className="text-[10px] text-slate-500 max-w-xs mt-1 leading-normal">
                  Support text spreadsheets, drawing files, layouts etc. Simulate true low-latency background socket packet streams securely.
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={(e) => processFileInbound(e.target.files)}
                />
              </div>

              {/* Transfer list */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-display mb-2">
                    Socket File Queue Stats
                  </h4>
                  
                  <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                    {files.map((file) => (
                      <div key={file.id} className="p-2 bg-slate-950 border border-slate-850 rounded text-[10px] font-mono">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-slate-300 font-semibold truncate max-w-[130px]">{file.name}</span>
                          <span className="text-slate-500 shrink-0">Size: {file.size}</span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                          <div 
                            className={`h-1 transition-all duration-300 ${file.status === "completed" ? "bg-emerald-400" : "bg-cyan-400"}`} 
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                        
                        <div className="flex justify-between items-center mt-1 text-[8px]">
                          <span className={file.status === "completed" ? "text-emerald-400" : "text-cyan-400 animate-pulse"}>
                            {file.status === "completed" ? "✔ Transferred Successfully" : `Streaming Packages (${file.progress}%)`}
                          </span>
                          <span className="text-slate-600">{file.timestamp}</span>
                        </div>
                      </div>
                    ))}
                    {files.length === 0 && (
                      <div className="text-center py-8 text-[10px] text-slate-600 italic">
                        No active background packets streaming. Drag files onto the left matrix grid.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
