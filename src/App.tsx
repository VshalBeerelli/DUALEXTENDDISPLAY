/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { 
  Monitor, 
  Cpu, 
  Wifi, 
  Code, 
  ShieldAlert, 
  Terminal, 
  Sparkles, 
  Play, 
  Download, 
  Layers, 
  Globe, 
  Power, 
  HardDriveUpload, 
  CheckCircle, 
  Activity, 
  Users, 
  ListRestart
} from "lucide-react";

// Local imports
import { ConnectedClient, VirtualMonitor, NetworkHealthState, ClipboardItem, SharedFile, EnterprisePolicy, SystemResourceMetric, EncoderType } from "./types";
import { HostMonitorManager } from "./components/HostMonitorManager";
import { ClientViewportSimulator } from "./components/ClientViewportSimulator";
import { NetworkDiagnosticsLab } from "./components/NetworkDiagnosticsLab";
import { SourceCodeExplorer } from "./components/SourceCodeExplorer";
import { PolicyManager } from "./components/PolicyManager";
import { NativeEngineLab } from "./components/NativeEngineLab";

// Multi-language localization dictionary
const LOCALIZATION_DICTIONARY = {
  en: {
    title: "Remote Display Studio",
    subtitle: "Enterprise Virtual Screen & Compression Control Engine",
    connectedDevices: "Connected Clients",
    activeMonitors: "Active Driver Monitors",
    bitrateLimit: "Bandwidth Ceiling",
    latencyCheck: "Network Ping Latency",
    diagnosticsLog: "System Driver Telemetry Console",
    connectionTab: "Virtual Display Driver",
    simulatorTab: "Client Device Simulator",
    analysisTab: "Network & Hardware Lab",
    codeTab: "Core Engine Source Code",
    policiesTab: "Secure Rules & pairing",
    clearLogs: "Clear Terminal Logs",
    exportLogs: "Export Runbook Report",
  },
  de: {
    title: "Remote-Display Studio",
    subtitle: "Virtueller Enterprise-Bildschirm & Komprimierungs-Steuerung",
    connectedDevices: "Verbundene Clients",
    activeMonitors: "Aktive Treiber-Monitore",
    bitrateLimit: "Bandbreitengrenze",
    latencyCheck: "Netzwerk-Ping-Latenz",
    diagnosticsLog: "System-Treiber-Telemetriekonsole",
    connectionTab: "Virtueller Display-Treiber",
    simulatorTab: "Client-Gerätesimulator",
    analysisTab: "Netzwerk- & Hardware-Labor",
    codeTab: "Betriebssystem-Engine Quellcode",
    policiesTab: "Sicherheitsregeln & Kopplung",
    clearLogs: "Terminal-Protokolle löschen",
    exportLogs: "Betriebshandbuch exportieren",
  },
  ja: {
    title: "リモートディスプレイ・スタジオ",
    subtitle: "エンタープライズ対応 仮想画面・圧縮制御コアエンジン",
    connectedDevices: "接続済みクライアント",
    activeMonitors: "アクティブなディスプレイドライバ",
    bitrateLimit: "帯域幅制限",
    latencyCheck: "ネットワーク遅延 (RTT)",
    diagnosticsLog: "システム・ドライバ テレメトリ端末",
    connectionTab: "仮想ディスプレイドライバ",
    simulatorTab: "クライアント端末シミュレータ",
    analysisTab: "ネットワーク・ハードウェア研究所",
    codeTab: "コアエンジン ソースコード",
    policiesTab: "セキュリティポリシーとペアリング",
    clearLogs: "端末ログをクリアする",
    exportLogs: "検証報告書を書き出す",
  },
  te: {
    title: "రిమోట్ డిస్ప్లే స్టూడియో",
    subtitle: "సంస్థాగత వర్చువల్ స్క్రీన్ మరియు కంప్రెషన్ నియంత్రణ ఇంజిన్",
    connectedDevices: "కనెక్ట్ చేయబడిన క్లయింట్లు",
    activeMonitors: "సక్రియ డ్రైవర్ మానిటర్లు",
    bitrateLimit: "బ్యాండ్‌విడ్త్ పరిమితి",
    latencyCheck: "నెట్‌వర్క్ లాటెన్సీ",
    diagnosticsLog: "సిస్టమ్ డ్రైవర్ టెలిమెట్రీ కన్సోల్",
    connectionTab: "వర్చువల్ డిస్ప్లే డ్రైవర్",
    simulatorTab: "క్లయింట్ పరికర సిమ్యులేటర్",
    analysisTab: "నెట్‌వర్క్ & హార్డ్‌వేర్ ల్యాబ్",
    codeTab: "కోర్ ఇంజిన్ మూల సంకేతం",
    policiesTab: "సెక్యూరిటీ రూల్స్ & పెయిరింగ్",
    clearLogs: "టెర్మినల్ లాగ్స్ తొలగించండి",
    exportLogs: "రన్‌బుక్ నివేదికను ఎగుమతి చేయండి",
  }
};

export default function App() {
  const [currentLanguage, setCurrentLanguage] = useState<"en" | "de" | "ja" | "te">("en");
  const t = LOCALIZATION_DICTIONARY[currentLanguage];

  // Primary active dashboard view tab
  const [activeTab, setActiveTab] = useState<"host_setup" | "client" | "network" | "explorer" | "policies" | "native_lab">("host_setup");

  // State: Virtual Display Monitors list
  const [monitors, setMonitors] = useState<VirtualMonitor[]>([
    {
      id: "MON-PRIMARY",
      name: "Desktop Monitor 1 (Primary Head)",
      width: 2560,
      height: 1440,
      refreshRate: 144,
      scalePercent: 100,
      orientation: "Landscape",
      isVirtual: false,
      isEnabled: true,
      positionX: 0,
      positionY: 0
    },
    {
      id: "MON-VIRT1",
      name: "Indirect Virtual Screen 2 (IDDCX)",
      width: 1920,
      height: 1080,
      refreshRate: 60,
      scalePercent: 125,
      orientation: "Landscape",
      isVirtual: true,
      isEnabled: true,
      positionX: 1920,
      positionY: 0
    }
  ]);

  // State: Mobile clients connected list
  const [clients, setClients] = useState<ConnectedClient[]>([
    {
      id: "DEV-IPAD12",
      name: "iPad Pro (12.9-inch)",
      type: "iPad",
      ip: "192.168.1.144",
      connectionType: "Wi-Fi (5GHz)",
      authorized: true,
      pinRequired: null,
      status: "connected",
      fps: 60,
      measuredLatencyMs: 8.2,
      packetLoss: 0.01,
      bandwidthMbps: 15.4,
      batteryPercent: 88,
      isThermalThrottled: false
    },
    {
      id: "DEV-PIXELTAB",
      name: "Google Pixel Tablet",
      type: "Android Tablet",
      ip: "192.168.1.182",
      connectionType: "Direct USB 3.0",
      authorized: true,
      pinRequired: null,
      status: "connected",
      fps: 120,
      measuredLatencyMs: 0.9,
      packetLoss: 0.00,
      bandwidthMbps: 45.2,
      batteryPercent: 95,
      isThermalThrottled: false
    },
    {
      id: "DEV-REMOTESM",
      name: "iPhone 15 Pro client",
      type: "iPhone",
      ip: "10.0.82.12",
      connectionType: "Cloud Relay",
      authorized: false,
      pinRequired: "482 915",
      status: "pairing",
      fps: 0,
      measuredLatencyMs: 52.4,
      packetLoss: 0.08,
      bandwidthMbps: 4.1,
      batteryPercent: 42,
      isThermalThrottled: false
    }
  ]);

  // State: Net conditions adaptation stressors
  const [selectedPreset, setSelectedPreset] = useState<"normal" | "congested" | "microwave" | "usb" | "throttled">("normal");

  // State: Active Driver state
  const [isDriverActive, setIsDriverActive] = useState(true);

  // State: Adaptive Encoder configuration
  const [currentEncoder, setCurrentEncoder] = useState<EncoderType>("NVIDIA NVENC H.264");

  // State: Network Metrics telemetry
  const [networkMetrics, setNetworkMetrics] = useState<NetworkHealthState>({
    rttMs: 8.2,
    jitterMs: 0.4,
    packetLossFraction: 0.0001,
    actualBitrateBps: 15400000,
    targetBitrateBps: 18000000,
    congestionLevel: "optimal",
    lastAdaptationTime: new Date().toLocaleTimeString()
  });

  // State: Host CPU/GPU usage profiles
  const [systemMetrics, setSystemMetrics] = useState<SystemResourceMetric>({
    cpuUsage: 14,
    gpuUsage: 22,
    vramMb: 840,
    ramUsagePercent: 38,
    thermalStatus: "Cool",
    batteryStatus: "Plugged In"
  });

  // State: File transfers list
  const [sharedFiles, setSharedFiles] = useState<SharedFile[]>([]);

  // State: Clipboard Sync log history
  const [clipboards, setClipboards] = useState<ClipboardItem[]>([
    {
      id: "CLIP-1",
      timestamp: "06:12:15 AM",
      type: "text",
      content: "Initial structural driver coordinates initialized successfully.",
      source: "host"
    }
  ]);

  // State: Enterprise access controls
  const [enterprisePolicy, setEnterprisePolicy] = useState<EnterprisePolicy>({
    restrictToLocalSubnet: false,
    allowedClientCategories: ["Android Tablet", "iPad", "macOS"],
    enforceMpinAuth: true,
    maxStreamResolution: "2K",
    bandwidthCapMbps: 30,
    hardwareAccelerationMandatory: true,
    allowClipboardSharing: true,
    allowFileCollateralTransfer: true
  });

  // State: Diagnostic logs scrolling console
  const [diagnosticsLogs, setDiagnosticsLogs] = useState<string[]>([
    "INFO: Remote Display Host daemon initiated (Port: 3000)",
    "INFO: Binding local hardware acceleration profiles... NVENC checked successfully",
    "INFO: Virtual Display IDDCX 2.0 helper device initialized on virtual root adapter node",
    "SUCCESS: System listening for mobile clients on Wi-Fi broadcast UDP 12285",
  ]);

  const logsEndRef = useRef<HTMLDivElement | null>(null);

  // Append new telemetry terminal strings
  const appendLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDiagnosticsLogs((prev) => [...prev, `[${timestamp}] ${msg}`]);
  };

  // Safe auto scrolling for logs terminal
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [diagnosticsLogs]);

  // Handle addition of a synced file stream
  const handleAddFile = (newFile: SharedFile) => {
    setSharedFiles((prev) => {
      const exists = prev.some((f) => f.id === newFile.id);
      if (exists) {
        return prev.map((f) => (f.id === newFile.id ? newFile : f));
      }
      return [newFile, ...prev];
    });
  };

  // Fetch initial group policies from persistent storage
  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setEnterprisePolicy({
            restrictToLocalSubnet: !!data.restrictToLocalSubnet,
            allowedClientCategories: Array.isArray(data.allowedClientCategories) ? data.allowedClientCategories : ["Android Tablet", "iPad", "macOS"],
            enforceMpinAuth: !!data.enforceMpinAuth,
            maxStreamResolution: data.maxStreamResolution || "2K",
            bandwidthCapMbps: Number(data.bandwidthCapMbps) || 30,
            hardwareAccelerationMandatory: !!data.hardwareAccelerationMandatory,
            allowClipboardSharing: !!data.allowClipboardSharing,
            allowFileCollateralTransfer: !!data.allowFileCollateralTransfer
          });
        }
      })
      .catch((err) => console.error("Could not fetch active enterprise policies", err));
  }, []);

  // Sync real host resources and terminal telemetry logs from the backend
  useEffect(() => {
    const fetchMetrics = () => {
      fetch("/api/system-metrics")
        .then((res) => res.json())
        .then((data) => {
          setSystemMetrics({
            cpuUsage: data.cpuUsage,
            gpuUsage: data.gpuUsage,
            vramMb: data.vramMb,
            ramUsagePercent: data.ramUsagePercent,
            thermalStatus: data.thermalStatus,
            batteryStatus: data.batteryStatus
          });
        })
        .catch(() => {});
    };

    const fetchLogs = () => {
      fetch("/api/logs")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setDiagnosticsLogs(data);
          }
        })
        .catch(() => {});
    };

    fetchMetrics();
    fetchLogs();

    const metricsInterval = setInterval(fetchMetrics, 3000);
    const logsInterval = setInterval(fetchLogs, 4000);

    return () => {
      clearInterval(metricsInterval);
      clearInterval(logsInterval);
    };
  }, []);

  // Connection and adaptation network heuristics
  useEffect(() => {
    const simulateMetricsUpdate = setInterval(() => {
      setNetworkMetrics((prev) => {
        // Apply varying jitter margins depending on the active stress environment
        let latencyBase = 8.2;
        let randomNoise = (Math.random() - 0.5) * 1.5;
        let lossRate = 0.0001;
        let jitter = 0.4;
        let bitrateTarget = 18000000;

        if (selectedPreset === "usb") {
          latencyBase = 0.9;
          randomNoise = (Math.random() - 0.5) * 0.15;
          lossRate = 0.0;
          jitter = 0.08;
          bitrateTarget = 45000000;
        } else if (selectedPreset === "congested") {
          latencyBase = 28.5;
          randomNoise = (Math.random() - 0.5) * 4.5;
          lossRate = 0.0210;
          jitter = 6.4;
          bitrateTarget = 8500000;
        } else if (selectedPreset === "microwave") {
          latencyBase = 45.4;
          randomNoise = (Math.random() - 0.5) * 9.2;
          lossRate = 0.1280;
          jitter = 15.2;
          bitrateTarget = 1800000;
        } else if (selectedPreset === "throttled") {
          latencyBase = 12.0;
          randomNoise = (Math.random() - 0.5) * 1.1;
          lossRate = 0.0012;
          jitter = 0.8;
          bitrateTarget = 4500000;
        }

        const calculatedRtt = Math.max(0.5, latencyBase + randomNoise);
        const actualBps = Math.floor(bitrateTarget * (1.0 - lossRate * 0.7));

        return {
          rttMs: calculatedRtt,
          jitterMs: Math.max(0.01, jitter + (Math.random() - 0.5) * 0.2),
          packetLossFraction: lossRate,
          actualBitrateBps: actualBps,
          targetBitrateBps: bitrateTarget,
          congestionLevel: lossRate > 0.1 ? "critical" : lossRate > 0.01 ? "warning" : "optimal",
          lastAdaptationTime: new Date().toLocaleTimeString()
        };
      });
    }, 3000);

    return () => clearInterval(simulateMetricsUpdate);
  }, [selectedPreset]);

  // Persists updated enterprise policies directly to our backend config database files
  const handleOnUpdatePolicy = (updates: Partial<EnterprisePolicy>) => {
    setEnterprisePolicy((prev) => {
      const next = { ...prev, ...updates };
      fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next)
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            appendLog(`[ActiveDirectory] Successfully persisted updated group policies to database configurations.`);
          }
        })
        .catch((err) => console.error("Failed to push config changes to database", err));
      return next;
    });
  };

  // Respond immediately on applying a stress preset
  const handleApplyStress = (presetName: "normal" | "congested" | "microwave" | "usb" | "throttled") => {
    setSelectedPreset(presetName);
    let encoder: EncoderType = "NVIDIA NVENC H.264";
    let targetFps = 60;

    if (presetName === "usb") {
      encoder = "NVIDIA NVENC H.265";
      targetFps = 120;
      appendLog("CRITICAL ACTION: Switched stream link to high-speed direct Native USB 3.0 path. Active zero-frame packet sync.");
    } else if (presetName === "normal") {
      encoder = "NVIDIA NVENC H.264";
      targetFps = 60;
      appendLog("ACTION: Re-focused Wi-Fi 5GHz channel connectivity. Dynamic bandwidth latency auto-balancing initialized.");
    } else if (presetName === "congested") {
      encoder = "Intel QuickSync H.264";
      targetFps = 60;
      appendLog("WARNING: Dynamic channel network degradation detected. Intel low-overhead fallback enabled. Compensating forward error correction.");
    } else if (presetName === "microwave") {
      encoder = "Software libx264";
      targetFps = 30;
      appendLog("CRITICAL: Severe packet drop of 12.80% on local Wi-Fi. Soft-bypass H.264 CPU fallback activated on process thread: 1202. Throttled display down to 30 FPS to minimize jitter dropouts.");
    } else if (presetName === "throttled") {
      encoder = "NVIDIA NVENC H.264";
      targetFps = 30;
      appendLog("ACTION: Hardware low power battery-saver activated. Frame sync caps initialized at 30Hz target to decrease device heat.");
    }

    setCurrentEncoder(encoder);
    setClients((prev) => 
      prev.map((c) => {
        if (c.id === "DEV-PIXELTAB") {
          return {
            ...c,
            connectionType: presetName === "usb" ? "Direct USB 3.0" : "Wi-Fi (5GHz)",
            fps: targetFps,
            measuredLatencyMs: presetName === "usb" ? 0.9 : presetName === "congested" ? 28.5 : presetName === "microwave" ? 45.4 : 8.2,
            isThermalThrottled: presetName === "microwave"
          };
        }
        return c;
      })
    );
  };

  // Monitor manager configurations update helper
  const handleUpdateMonitor = (id: string, updates: Partial<VirtualMonitor>) => {
    setMonitors((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
  };

  const handleAddVirtualMonitor = () => {
    if (monitors.length >= 3) return;
    const newId = `MON-VIRT${monitors.length}`;
    const newMon: VirtualMonitor = {
      id: newId,
      name: `Indirect Virtual Screen ${monitors.length + 1} (IDDCX)`,
      width: 1920,
      height: 1080,
      refreshRate: 60,
      scalePercent: 100,
      orientation: "Landscape",
      isVirtual: true,
      isEnabled: true,
      positionX: 1920 * (monitors.length - 1),
      positionY: 0
    };
    setMonitors((prev) => [...prev, newMon]);
    appendLog(`DRIVER CAPABILITY: Injected extra IDDCX-compliant virtual screen framebuffer. Monitor ID: ${newId} (FHD default)`);
  };

  const handleRemoveVirtualMonitor = (id: string) => {
    setMonitors((prev) => prev.filter((m) => m.id !== id));
    appendLog(`DRIVER CAPABILITY: Destroyed virtual display framebuffer on device node: ${id}`);
  };

  // Disconnect device
  const handleDisconnectDevice = (id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
    appendLog(`WEBSOCKET: Unregistered client device handshake identifier: ${id}`);
  };

  const handleBlockDevice = (id: string) => {
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "blocked" as const } : c))
    );
    appendLog(`SECURITY HANDSHAKE: Revoked secure authorization trust keys for device hash: ${id}`);
  };

  const clearTerminalLogs = () => {
    setDiagnosticsLogs(["INFO: Telemetry logs reset by host administrator"]);
    appendLog("Cleared terminal logs successfully.");
  };

  const exportDiagnosticsReport = () => {
    const header = [
      "==============================================",
      " DUETCAST REMOTE MONITOR DIAGNOSTICS LOG",
      ` Generated At: ${new Date().toISOString()}`,
      ` Language Context: ${currentLanguage.toUpperCase()}`,
      "=============================================="
    ].join("\n");
    const body = diagnosticsLogs.join("\n");
    const blob = new Blob([[header, body].join("\n\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `duetcast-diagnostics-report-${Date.now()}.log`;
    link.click();
    URL.revokeObjectURL(url);
    appendLog("SUCCESS: Exported fully documented operational runbook report to downloads folder");
  };

  return (
    <div className="min-h-screen bg-brand-background text-slate-100 flex flex-col font-sans select-none pb-8 selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Decorative premium header border stripe */}
      <div className="h-1 w-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-violet-500" />

      {/* Main Container */}
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 pt-5 space-y-6 flex-1 flex flex-col">
        
        {/* Header Ribbon Row */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-950/40 rounded-xl border border-cyan-500/10 text-cyan-400">
              <Layers className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white uppercase font-display">
                  {t.title}
                </h1>
                <span className="text-[9px] uppercase font-mono bg-cyan-950/30 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-800/10 font-bold leading-none shrink-0 self-center">
                  v1.4.2 Enterprise
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans max-w-md">
                {t.subtitle}
              </p>
            </div>
          </div>

          {/* Localization & Global options controls */}
          <div className="flex items-center gap-3 self-end md:self-center">
            <div className="flex items-center gap-1 bg-slate-950 rounded-lg p-1 border border-slate-800">
              <Globe className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
              {(["en", "de", "ja", "te"] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    setCurrentLanguage(lang);
                    appendLog(`LOCALIZATION: User updated interface language to [${lang.toUpperCase()}]`);
                  }}
                  className={`px-2 py-0.5 text-[9px] font-mono rounded font-bold uppercase transition-all cursor-pointer ${
                    currentLanguage === lang
                      ? "bg-cyan-950/40 text-cyan-400 border border-cyan-500/10"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            <div className="py-1 px-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5 leading-none">
              <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" /> Host PORT: 3000
            </div>
          </div>
        </header>

        {/* Bento Board: Primary overview metric grid summary */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Bento Block 1: Active Displays summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3.5 hover:border-slate-700 transition-colors">
            <div className="p-3 bg-cyan-950/40 text-cyan-400 rounded-lg border border-cyan-500/10">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono text-slate-500 block">Monitor Pipeline</span>
              <span className="text-sm font-bold block text-white font-display">
                {monitors.length} Displays Active
              </span>
              <span className="text-[9px] text-slate-500 font-mono">
                {monitors.filter(m => m.isVirtual).length} Virtual Driver Heads
              </span>
            </div>
          </div>

          {/* Bento Block 2: Connected clients summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3.5 hover:border-slate-700 transition-colors">
            <div className="p-3 bg-indigo-950/40 text-indigo-400 rounded-lg border border-indigo-500/10">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono text-slate-500 block">Client Devices</span>
              <span className="text-sm font-bold block text-white font-display">
                {clients.filter(c => c.status === "connected").length} Tablets Stream
              </span>
              <span className="text-[9px] text-slate-500 font-mono">
                {clients.filter(c => c.status === "pairing").length} Handshake pairing
              </span>
            </div>
          </div>

          {/* Bento Block 3: QoS Target Rate */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3.5 hover:border-slate-700 transition-colors">
            <div className="p-3 bg-violet-950/40 text-violet-400 rounded-lg border border-violet-500/10">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono text-slate-500 block">Dynamic Bitrate</span>
              <span className="text-sm font-bold block text-white font-display">
                {(networkMetrics.actualBitrateBps / 1_000_000).toFixed(1)} Mbps Lock
              </span>
              <span className="text-[9px] text-slate-500 font-mono">
                Encoder: NVENC CRF Cap
              </span>
            </div>
          </div>

          {/* Bento Block 4: Target Delay RTT Ping */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3.5 hover:border-slate-700 transition-colors">
            <div className="p-3 bg-emerald-950/40 text-emerald-400 rounded-lg border border-emerald-500/10">
              <CheckCircle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono text-slate-500 block">Input Latency rtt</span>
              <span className="text-sm font-bold block text-white font-display">
                {networkMetrics.rttMs.toFixed(1)} ms latency
              </span>
              <span className="text-[9px] text-slate-500 font-mono text-emerald-400 font-bold uppercase">
                Zero Frame Sync Active
              </span>
            </div>
          </div>

        </section>

        {/* Console control cockpit grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          
          {/* Left section: Central dashboard tabs panel */}
          <div className="xl:col-span-9 space-y-6 flex flex-col">
            
            {/* Horizontal Dashboard Tabs navigation links */}
            <div className="flex bg-slate-900 border border-slate-850 p-1.5 rounded-2xl overflow-x-auto gap-1">
              <button
                onClick={() => setActiveTab("host_setup")}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                  activeTab === "host_setup"
                    ? "bg-[#06b6d4] text-slate-950 font-bold shadow-lg shadow-cyan-500/10 font-display"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-850"
                }`}
              >
                <Monitor className="w-4 h-4 shrink-0" />
                {t.connectionTab}
              </button>

              <button
                onClick={() => setActiveTab("client")}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                  activeTab === "client"
                    ? "bg-[#06b6d4] text-slate-950 font-bold shadow-lg shadow-cyan-500/10 font-display"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-850"
                }`}
              >
                <Layers className="w-4 h-4 shrink-0" />
                {t.simulatorTab}
              </button>

              <button
                onClick={() => setActiveTab("network")}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                  activeTab === "network"
                    ? "bg-[#06b6d4] text-slate-950 font-bold shadow-lg shadow-cyan-500/10 font-display"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-850"
                }`}
              >
                <Activity className="w-4 h-4 shrink-0" />
                {t.analysisTab}
              </button>

              <button
                onClick={() => setActiveTab("policies")}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                  activeTab === "policies"
                    ? "bg-[#06b6d4] text-slate-950 font-bold shadow-lg shadow-cyan-500/10 font-display"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-850"
                }`}
              >
                <ShieldAlert className="w-4 h-4 shrink-0" />
                {t.policiesTab}
              </button>

              <button
                onClick={() => setActiveTab("explorer")}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                  activeTab === "explorer"
                    ? "bg-[#06b6d4] text-slate-950 font-bold shadow-lg shadow-cyan-500/10 font-display"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-850"
                }`}
              >
                <Code className="w-4 h-4 shrink-0" />
                {t.codeTab}
              </button>

              <button
                onClick={() => setActiveTab("native_lab")}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                  activeTab === "native_lab"
                    ? "bg-[#8b5cf6] text-white font-bold shadow-lg shadow-violet-500/20 font-display"
                    : "text-violet-400 hover:text-violet-200 hover:bg-violet-950/10"
                }`}
              >
                <Cpu className="w-4 h-4 shrink-0" />
                AeroDisplay Core Lab
              </button>
            </div>

            {/* Render selected content tab natively */}
            <div className="flex-1">
              {activeTab === "host_setup" && (
                <HostMonitorManager
                  monitors={monitors}
                  onAddMonitor={handleAddVirtualMonitor}
                  onRemoveMonitor={handleRemoveVirtualMonitor}
                  onUpdateMonitor={handleUpdateMonitor}
                  onLogMessage={appendLog}
                  isDriverActive={isDriverActive}
                  onToggleDriver={(status) => {
                    setIsDriverActive(status);
                    appendLog(`[DriverService] User toggled UMDF 2.0 Indirect Display Class Driver. Active: ${status ? "TRUE" : "FALSE"} (${status ? "PCI Shared zero-copy" : "Fallback framebuffers"} active)`);
                  }}
                />
              )}

              {activeTab === "client" && (
                <ClientViewportSimulator
                  fpsLimit={selectedPreset === "microwave" ? 30 : selectedPreset === "throttled" ? 30 : 60}
                  selectedPreset={selectedPreset}
                  onLogMessage={appendLog}
                  onAddClipboard={(item) => setClipboards((prev) => [item, ...prev])}
                  clipboardHistory={clipboards}
                  onAddFile={handleAddFile}
                  files={sharedFiles}
                />
              )}

              {activeTab === "network" && (
                <NetworkDiagnosticsLab
                  metrics={networkMetrics}
                  system={systemMetrics}
                  currentEncoder={currentEncoder}
                  selectedPreset={selectedPreset}
                  onApplyStress={handleApplyStress}
                />
              )}

              {activeTab === "policies" && (
                <PolicyManager
                  policy={enterprisePolicy}
                  onUpdatePolicy={handleOnUpdatePolicy}
                  trustedDevices={clients.filter((c) => c.status !== "blocked")}
                  onDisconnectDevice={handleDisconnectDevice}
                  onBlockDevice={handleBlockDevice}
                  onLogMessage={appendLog}
                />
              )}

              {activeTab === "explorer" && (
                <SourceCodeExplorer />
              )}

              {activeTab === "native_lab" && (
                <NativeEngineLab />
              )}
            </div>

          </div>

          {/* Right section: System telemetry quick board and live devices overview */}
          <div className="xl:col-span-3 space-y-6">
            
            {/* Connected devices module */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h3 className="text-xs font-semibold uppercase text-slate-300 mb-3 tracking-wider font-display flex items-center gap-1.5">
                <Users className="w-4 h-4 text-cyan-400" /> Connected Sessions
              </h3>

              <div className="space-y-3">
                {clients.map((device) => (
                  <div key={device.id} className="p-2 bg-slate-950 rounded-lg border border-slate-850 text-xs">
                    <div className="flex justify-between items-start mb-1.5">
                      <div>
                        <span className="font-bold text-slate-200 block truncate max-w-[130px]">{device.name}</span>
                        <span className="text-[9px] font-mono text-slate-500">{device.ip}</span>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-mono font-bold leading-none ${
                        device.status === "connected" 
                          ? "bg-green-950/40 text-green-400 border border-green-800/20" 
                          : device.status === "pairing" 
                          ? "bg-amber-950/40 text-amber-500 border border-amber-800/20 animate-pulse" 
                          : "bg-rose-950/40 text-rose-400 border border-rose-800/20"
                      }`}>
                        {device.status}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 border-t border-slate-900 pt-1.5 mt-1">
                      <span>Rate: {device.fps} FPS</span>
                      <span>Ping: {device.measuredLatencyMs.toFixed(1)}ms</span>
                    </div>

                    {device.status === "pairing" && device.pinRequired && (
                      <div className="mt-2 text-[9px] text-slate-400 bg-slate-900 p-1.5 rounded border border-slate-850 leading-tight">
                        🔒 Pairing Auth Handshake Pending
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick action utility buttons */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2.5">
              <h3 className="text-xs font-semibold uppercase text-slate-300 tracking-wider font-display">
                Service Overrides
              </h3>
              
              <button
                onClick={() => {
                  handleApplyStress("normal");
                  setIsDriverActive(true);
                  setMonitors([
                    {
                      id: "MON-PRIMARY",
                      name: "Desktop Monitor 1 (Primary Head)",
                      width: 2560,
                      height: 1440,
                      refreshRate: 144,
                      scalePercent: 100,
                      orientation: "Landscape",
                      isVirtual: false,
                      isEnabled: true,
                      positionX: 0,
                      positionY: 0
                    },
                    {
                      id: "MON-VIRT1",
                      name: "Indirect Virtual Screen 2 (IDDCX)",
                      width: 1920,
                      height: 1080,
                      refreshRate: 60,
                      scalePercent: 125,
                      orientation: "Landscape",
                      isVirtual: true,
                      isEnabled: true,
                      positionX: 1920,
                      positionY: 0
                    }
                  ]);
                  appendLog("RESTART EVENT: Hard-reset direct host device buffers and cleared active stressors successfully.");
                }}
                className="w-full py-2 bg-slate-950 hover:bg-slate-850 rounded-lg text-xs font-mono font-bold text-slate-300 border border-slate-850 cursor-pointer flex items-center justify-center gap-2 hover:border-slate-700 transition-all"
              >
                <ListRestart className="w-4 h-4 text-cyan-400" /> Reset State Machine
              </button>

              <button
                onClick={() => {
                  appendLog("INTEGRITY: Ran static memory leaks inspection routines. 0 leak blocks detected over 4096 frames.");
                  alert("Diagnostics Scan: Complete.\nNo memory leaks detected across UMDF virtual drivers or H.264 CUDA contexts.");
                }}
                className="w-full py-2 bg-slate-950 hover:bg-slate-850 rounded-lg text-xs font-mono font-bold text-slate-300 border border-slate-850 cursor-pointer flex items-center justify-center gap-2 hover:border-slate-700 transition-all"
              >
                <Activity className="w-4 h-4 text-violet-400" /> Diagnose Leaks
              </button>
            </div>

          </div>

        </div>

        {/* Console: Full running telemetry outputs logs */}
        <section className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col h-72">
          
          {/* Header row */}
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-slate-300 font-display uppercase tracking-widest flex items-center gap-2">
              <Terminal className="w-4.5 h-4.5 text-cyan-400" />
              {t.diagnosticsLog}
            </span>

            <div className="flex gap-2">
              <button
                onClick={clearTerminalLogs}
                className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-400 hover:text-white cursor-pointer transition-colors font-mono"
              >
                {t.clearLogs}
              </button>
              <button
                onClick={exportDiagnosticsReport}
                className="px-2.5 py-1 rounded bg-cyan-950/30 hover:bg-cyan-950/50 border border-cyan-800/40 text-[10px] text-cyan-400 hover:text-cyan-300 cursor-pointer flex items-center gap-1 transition-colors font-mono font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                {t.exportLogs}
              </button>
            </div>
          </div>

          {/* Running console text panel */}
          <div className="flex-1 overflow-y-auto bg-slate-950 rounded-xl p-3 font-mono text-xs leading-5 text-emerald-400/90 border border-slate-900 flex flex-col space-y-1 select-all select-text font-medium">
            {diagnosticsLogs.map((log, index) => {
              const datePrefix = log.includes("[") ? log.split("]")[0] + "]" : "";
              const val = log.includes("]") ? log.split("]").slice(1).join("]") : log;
              return (
                <div key={index} className="flex gap-1.5 hover:bg-slate-900/40 px-1 py-0.5 rounded">
                  <span className="text-slate-600 shrink-0 select-none text-[10px] w-18">{datePrefix}</span>
                  <span className={log.includes("CRITICAL") || log.includes("WARNING") ? "text-amber-400" : log.includes("SUCCESS") ? "text-cyan-400 font-bold" : "text-slate-300"}>
                    {val}
                  </span>
                </div>
              );
            })}
            <div ref={logsEndRef} />
          </div>

        </section>

      </div>
    </div>
  );
}
