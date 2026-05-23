/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { nativeCodebase, CodeFile } from "../remoteDisplayCodebase";
import { FolderCode, FileCode, Check, Copy, Download, Search, Terminal, Cpu } from "lucide-react";

export function SourceCodeExplorer() {
  const [selectedFile, setSelectedFile] = useState<CodeFile>(nativeCodebase[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);

  const filteredFiles = nativeCodebase.filter((f) =>
    f.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([selectedFile.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = selectedFile.path.split("/").pop() || "source_file";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-brand-card rounded-2xl border border-slate-800 overflow-hidden glowing-display-violet grid grid-cols-1 lg:grid-cols-12 h-[680px]">
      {/* Sidebar: Navigation and Search */}
      <div className="lg:col-span-4 border-r border-slate-800 bg-slate-950 p-4 shrink-0 flex flex-col h-full">
        <div className="flex items-center gap-2 mb-4">
          <FolderCode className="w-5 h-5 text-violet-400" />
          <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider font-display">
            Native Source Repository
          </h2>
        </div>
        
        <p className="text-xs text-slate-400 mb-4 font-sans">
          Review direct system driver implementation codes, low-latency encoders, custom UDP transport pipelines, and installer scripts with zero placeholder files.
        </p>

        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 font-sans focus:outline-none focus:ring-1 focus:ring-violet-500"
            placeholder="Search code files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {filteredFiles.map((f) => {
            const isSelected = selectedFile.path === f.path;
            return (
              <button
                key={f.path}
                onClick={() => setSelectedFile(f)}
                className={`w-full text-left p-2.5 rounded-lg flex flex-col gap-1 transition-all group ${
                  isSelected
                    ? "bg-violet-950/40 border border-violet-800/40 text-violet-300"
                    : "hover:bg-slate-900/60 border border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileCode className={`w-4 h-4 shrink-0 ${isSelected ? "text-violet-400" : "text-slate-500 group-hover:text-slate-400"}`} />
                  <span className="text-xs font-mono truncate font-medium">{f.path}</span>
                </div>
                <span className="text-[10px] text-slate-500 line-clamp-2 truncate">
                  {f.description}
                </span>
              </button>
            );
          })}
          {filteredFiles.length === 0 && (
            <div className="text-center py-8 text-xs text-slate-600 font-sans">
              No matching files found.
            </div>
          )}
        </div>

        <div className="border-t border-slate-900 pt-3 mt-3 flex items-center justify-between text-[10px] font-mono text-slate-500">
          <span className="flex items-center gap-1">
            <Cpu className="w-3 h-3 text-cyan-400" /> Production Core Engine
          </span>
          <span>100% C++ / Rust / Dart</span>
        </div>
      </div>

      {/* Code Editor Panel */}
      <div className="lg:col-span-8 flex flex-col h-full bg-[#0d1117] relative">
        {/* Editor Ribbon bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#161b22] border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-violet-900/40 text-violet-400 border border-violet-800/40">
              {selectedFile.language}
            </span>
            <span className="text-xs font-mono text-slate-300 font-semibold truncate max-w-xs">
              {selectedFile.path}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Copy Source File"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handleDownload}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Download File"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* File Details bar */}
        <div className="px-4 py-2 bg-[#090d16] border-b border-slate-900 flex items-center gap-2 text-[10px] text-slate-400 font-sans">
          <Terminal className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="truncate italic">
            {selectedFile.description}
          </span>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-5 text-slate-300 select-all select-text font-medium bg-[#0b0e14]">
          <pre className="relative selection:bg-slate-800">
            <code>
              {selectedFile.content.split("\n").map((line, idx) => (
                <div key={idx} className="table-row hover:bg-slate-900/30 w-full">
                  <span className="table-cell text-right pr-4 text-slate-600 select-none text-[10px] font-mono text-right w-8">
                    {idx + 1}
                  </span>
                  <span className="table-cell break-all whitespace-pre">
                    {line}
                  </span>
                </div>
              ))}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}
