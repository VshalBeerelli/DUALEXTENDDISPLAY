/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { ShieldCheck, Key, Lock, RefreshCw, Smartphone, Trash2, Eye, EyeOff, Check, Sliders } from "lucide-react";
import { ConnectedClient, EnterprisePolicy, ClientType } from "../types";

interface Props {
  policy: EnterprisePolicy;
  onUpdatePolicy: (updates: Partial<EnterprisePolicy>) => void;
  trustedDevices: ConnectedClient[];
  onDisconnectDevice: (id: string) => void;
  onBlockDevice: (id: string) => void;
  onLogMessage: (msg: string) => void;
}

export function PolicyManager({
  policy,
  onUpdatePolicy,
  trustedDevices,
  onDisconnectDevice,
  onBlockDevice,
  onLogMessage,
}: Props) {
  const [pairingPin, setPairingPin] = useState("482 915");
  const [showTokenSettings, setShowTokenSettings] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);

  // Generate a randomized secure pairing token pin
  const handleRegenPin = () => {
    const p1 = Math.floor(Math.random() * 900) + 100;
    const p2 = Math.floor(Math.random() * 900) + 100;
    const nextPin = `${p1} ${p2}`;
    setPairingPin(nextPin);
    onLogMessage(`[SecurityManager] Re-keyed standard cryptographic handshake PIN: ${nextPin}`);
  };

  const handleCopyPin = () => {
    navigator.clipboard.writeText(pairingPin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const toggleClientCategory = (cat: ClientType) => {
    const current = [...policy.allowedClientCategories];
    const exists = current.includes(cat);
    const updated = exists ? current.filter((item) => item !== cat) : [...current, cat];
    onUpdatePolicy({ allowedClientCategories: updated });
    onLogMessage(`[EnterprisePolicy] Updated permitted client categories list. Allowed: ${updated.join(", ")}`);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left column: Security pairing center and token vault */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 border-b border-slate-850 pb-2">
              <Key className="w-5 h-5 text-cyan-400" />
              <h3 className="text-xs font-semibold uppercase text-slate-200 tracking-wider font-display">
                Credentials & Pairing Gate
              </h3>
            </div>

            <p className="text-[11px] text-slate-400 font-sans mb-4 leading-normal">
              First-time mobile or tablet clients must authenticate with the Windows host displays before establishing an active desktop extension.
            </p>

            {/* Cryptographic PIN Pair block */}
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-850 flex flex-col items-center justify-center space-y-2 mb-4 relative overflow-hidden">
              <span className="text-[9px] uppercase font-mono text-slate-500 tracking-widest block">
                Secure Authentication PIN
              </span>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold font-mono text-cyan-400 tracking-wider">
                  {pairingPin}
                </span>
                <button
                  onClick={handleRegenPin}
                  className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  title="Generate a secure pin"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={handleCopyPin}
                className="text-[9px] text-[#06b6d4] hover:text-[#0891b2] font-mono cursor-pointer underline decoration-dotted transition-colors"
              >
                {copiedPin ? "✔ PIN Copied to clipboard" : "Copy pairing token PIN"}
              </button>
            </div>

            {/* Beautiful QR Code Mockup */}
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-850 flex flex-col items-center justify-center relative">
              <span className="text-[9px] uppercase font-mono text-slate-500 tracking-widest mb-3">
                Scan QR Code to Pair Tablet
              </span>
              
              {/* Premium dark grid CSS QR drawing */}
              <div className="w-24 h-24 bg-slate-900 border border-slate-800 p-2 flex flex-wrap gap-[2px] rounded-md relative select-none">
                {/* Visual corners represent correct QR anchors */}
                <div className="absolute top-1 left-1 w-5 h-5 bg-cyan-400 border border-slate-900 rounded-[2px]" />
                <div className="absolute top-1 right-1 w-5 h-5 bg-cyan-400 border border-slate-900 rounded-[2px]" />
                <div className="absolute bottom-1 left-1 w-5 h-5 bg-cyan-400 border border-slate-900 rounded-[2px]" />
                
                {/* Procedural dots generator simulation inside QR grids */}
                {Array.from({ length: 96 }).map((_, idx) => {
                  const isBlack = (idx * 17) % 3 === 0;
                  return (
                    <div
                      key={idx}
                      className={`w-[6px] h-[6px] rounded-[1px] ${isBlack ? "bg-slate-500" : "bg-transparent"}`}
                    />
                  );
                })}
              </div>

              <span className="text-[8px] text-slate-500 font-sans text-center max-w-[180px] mt-2.5 leading-tight block">
                Download DuetCast for iOS/Android, tap scan, and point camera to this display.
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-850 flex items-center justify-between text-[10px] font-mono">
            <span className="text-slate-500">Security Standard:</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> TLS 1.3 + ChaCha20
            </span>
          </div>
        </div>

        {/* Right column: Enterprise Group Policies */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-850 pb-2">
            <Sliders className="w-5 h-5 text-violet-400" />
            <h3 className="text-xs font-semibold uppercase text-slate-200 tracking-wider font-display">
              Enterprise Active Directory Policies
            </h3>
          </div>

          <p className="text-[11px] text-slate-400 font-sans mb-5 leading-normal">
            Configure system administration limits. System admins can deploy pre-packaged configurations across organizations via Registry paths or MSI templates.
          </p>

          <div className="space-y-4">
            
            {/* Rule 1: Subnet locking */}
            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-850">
              <div>
                <span className="text-[11px] font-bold text-slate-200 block">Lock Sessions to Local Subnet Only</span>
                <span className="text-[9px] text-slate-500 block max-w-sm">
                  Prohibits streaming over cloud-relay paths to secure organizational IP boundaries.
                </span>
              </div>
              <button
                onClick={() => {
                  const next = !policy.restrictToLocalSubnet;
                  onUpdatePolicy({ restrictToLocalSubnet: next });
                  onLogMessage(`[EnterprisePolicy] Subnet locking toggled: ${next ? "ACTIVE" : "DISABLED"}`);
                }}
                className={`w-10 h-6.5 rounded-full p-1 transition-all flex items-center cursor-pointer ${policy.restrictToLocalSubnet ? "bg-cyan-500 justify-end" : "bg-slate-800 justify-start"}`}
              >
                <div className="w-4.5 h-4.5 rounded-full bg-slate-950 shadow" />
              </button>
            </div>

            {/* Rule 2: Strict PIN Auth */}
            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-850">
              <div>
                <span className="text-[11px] font-bold text-slate-200 block">Enforce Mandatory Secure PIN Handshakes</span>
                <span className="text-[9px] text-slate-500 block max-w-sm">
                  Requires inputting the cryptographic pairing PIN during first device connections.
                </span>
              </div>
              <button
                onClick={() => {
                  const next = !policy.enforceMpinAuth;
                  onUpdatePolicy({ enforceMpinAuth: next });
                  onLogMessage(`[EnterprisePolicy] Mandatory PIN handshakes toggled: ${next ? "ENABLED" : "DISABLED"}`);
                }}
                className={`w-10 h-6.5 rounded-full p-1 transition-all flex items-center cursor-pointer ${policy.enforceMpinAuth ? "bg-cyan-500 justify-end" : "bg-slate-800 justify-start"}`}
              >
                <div className="w-4.5 h-4.5 rounded-full bg-slate-950 shadow" />
              </button>
            </div>

            {/* Rule 3: Allowed Device types */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-850 space-y-2">
              <span className="text-[11px] font-bold text-slate-200 block">Permitted Client Device Classrooms</span>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(["Android Phone", "Android Tablet", "iPhone", "iPad", "macOS", "Linux"] as ClientType[]).map((cat) => {
                  const allowed = policy.allowedClientCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => toggleClientCategory(cat)}
                      className={`px-2 py-1.5 text-[10px] rounded font-mono border text-left flex items-center justify-between transition-all cursor-pointer ${
                        allowed
                          ? "bg-violet-950/40 border-violet-800/40 text-violet-300 font-semibold"
                          : "bg-slate-900 border-transparent text-slate-500"
                      }`}
                    >
                      {cat}
                      {allowed && <Check className="w-3 h-3 text-violet-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rule 4: Bandwidth throttling */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-850">
              <div className="flex justify-between items-center text-[11px] font-bold text-slate-200 mb-2">
                <span>Maximum Streaming Bandwidth Allocator</span>
                <span className="text-cyan-400 font-mono">{policy.bandwidthCapMbps} Mbps Cap</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                value={policy.bandwidthCapMbps}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  onUpdatePolicy({ bandwidthCapMbps: val });
                  onLogMessage(`[EnterprisePolicy] Bandwidth hard capping established to ${val} Mbps per stream`);
                }}
              />
              <span className="text-[9px] text-slate-500 font-sans block mt-1.5 leading-none">
                Clamps dynamic bitrate adaptation within safety buffers to prevent local network saturation.
              </span>
            </div>

          </div>
        </div>

      </div>

      {/* Trusted Devices list */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-display mb-3">
          Authorized Secure Hardware Trust Vault (Trusted Devices)
        </h4>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-400 font-sans">
            <thead className="text-[9px] uppercase font-mono bg-slate-950 border-b border-slate-800 text-slate-500">
              <tr>
                <th className="p-2.5">Device Identifier</th>
                <th className="p-2.5">Category</th>
                <th className="p-2.5">Socket Address</th>
                <th className="p-2.5">Encrypted Tunnel</th>
                <th className="p-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {trustedDevices.map((dev) => (
                <tr key={dev.id} className="hover:bg-slate-950/40">
                  <td className="p-2.5 font-bold text-slate-200 flex items-center gap-1.5 font-display">
                    <Smartphone className="w-4 h-4 text-cyan-400 shrink-0" /> {dev.name}
                  </td>
                  <td className="p-2.5 font-mono text-[10px]">{dev.type}</td>
                  <td className="p-2.5 font-mono text-[10px]">{dev.ip}</td>
                  <td className="p-2.5 text-[10px]">
                    <span className="px-1.5 py-0.5 rounded bg-cyan-950/40 text-cyan-400 border border-cyan-800/20 uppercase font-mono font-bold text-[8px]">
                      ChaCha-Poly 256
                    </span>
                  </td>
                  <td className="p-2.5 text-right">
                    <button
                      onClick={() => {
                        onBlockDevice(dev.id);
                        onLogMessage(`[SecurityVault] Blocked device UUID hash: ${dev.id}`);
                      }}
                      className="px-2 py-1 bg-rose-950/40 hover:bg-rose-900/40 border border-rose-800/20 text-rose-400 text-[10px] font-mono rounded cursor-pointer transition-colors"
                    >
                      Revoke Key
                    </button>
                  </td>
                </tr>
              ))}
              {trustedDevices.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-slate-500 italic">
                    No active tokens inside the hardware master trust registry. Pair a client to start.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
