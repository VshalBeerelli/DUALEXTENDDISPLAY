/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ClientType = "Android Phone" | "Android Tablet" | "iPhone" | "iPad" | "macOS" | "Linux";
export type ConnectionType = "Wi-Fi (5GHz)" | "Wi-Fi (2.4GHz)" | "Direct USB 3.0" | "Cloud Relay";
export type EncoderType = "NVIDIA NVENC H.264" | "NVIDIA NVENC H.265" | "Intel QuickSync H.264" | "AMD AMF H.264" | "Software libx264";
export type AudioStreamMode = "System audio" | "Selected application" | "Muted";
export type DisplayOrientation = "Landscape" | "Portrait" | "Landscape (Flipped)" | "Portrait (Flipped)";

export interface ConnectedClient {
  id: string;
  name: string;
  type: ClientType;
  ip: string;
  connectionType: ConnectionType;
  authorized: boolean;
  pinRequired: string | null;
  status: "connected" | "disconnected" | "pairing" | "blocked";
  fps: number;
  measuredLatencyMs: number;
  packetLoss: number;
  bandwidthMbps: number;
  batteryPercent: number;
  isThermalThrottled: boolean;
}

export interface VirtualMonitor {
  id: string;
  name: string;
  width: number;
  height: number;
  refreshRate: 60 | 120 | 144;
  scalePercent: 100 | 125 | 150 | 200;
  orientation: DisplayOrientation;
  isVirtual: boolean;
  isEnabled: boolean;
  positionX: number; // For arranging monitor positioning layout grid
  positionY: number;
}

export interface NetworkHealthState {
  rttMs: number;
  jitterMs: number;
  packetLossFraction: number;
  actualBitrateBps: number;
  targetBitrateBps: number;
  congestionLevel: "optimal" | "warning" | "critical";
  lastAdaptationTime: string;
}

export interface ClipboardItem {
  id: string;
  timestamp: string;
  type: "text" | "link";
  content: string;
  source: "host" | "client";
}

export interface SharedFile {
  id: string;
  name: string;
  size: string;
  progress: number; // 0 to 100
  status: "idle" | "transferring" | "completed" | "cancelled" | "error";
  direction: "to-client" | "to-host";
  timestamp: string;
}

export interface EnterprisePolicy {
  restrictToLocalSubnet: boolean;
  allowedClientCategories: ClientType[];
  enforceMpinAuth: boolean;
  maxStreamResolution: "4K" | "2K" | "1080p";
  bandwidthCapMbps: number;
  hardwareAccelerationMandatory: boolean;
  allowClipboardSharing: boolean;
  allowFileCollateralTransfer: boolean;
}

export interface SystemResourceMetric {
  cpuUsage: number;
  gpuUsage: number;
  vramMb: number;
  ramUsagePercent: number;
  thermalStatus: "Cool" | "Warm" | "Throttled";
  batteryStatus: "Plugged In" | "Discharging" | "Battery Low";
}
