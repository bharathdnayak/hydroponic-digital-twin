import { Sparkles, BrainCircuit, Activity, RefreshCw } from "lucide-react";
import type { DiagnosticReport } from "../types";

interface DiagnosticsPanelProps {
  report: DiagnosticReport | null;
  onTriggerDiagnostics: () => void;
  loading: boolean;
}

export default function DiagnosticsPanel({ report, onTriggerDiagnostics, loading }: DiagnosticsPanelProps) {
  // SVG circular path for health meter
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const score = report?.healthScore ?? 100;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getHealthColor = (hs: number) => {
    if (hs >= 90) return "stroke-emerald-400 shadow-emerald-400/50";
    if (hs >= 70) return "stroke-yellow-400 shadow-yellow-400/50";
    return "stroke-rose-500 shadow-rose-500/50";
  };

  const getHealthTextColor = (hs: number) => {
    if (hs >= 90) return "text-emerald-400";
    if (hs >= 70) return "text-yellow-400";
    return "text-rose-500";
  };

  return (
    <div className="bg-[#12141c]/60 border border-slate-900 rounded-lg p-3.5 flex flex-col space-y-3.5 font-mono text-xs select-none" id="diagnostics-ai-panel">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-2">
        <div className="flex flex-col">
          <span className="text-[10px] text-yellow-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <BrainCircuit className="w-3.5 h-3.5 text-yellow-500" />
            Predictive AI Diagnostics
          </span>
          <span className="text-[8px] text-slate-500 uppercase mt-0.5">
            Real-Time Plant Twin Diagnostics
          </span>
        </div>
        <button
          onClick={onTriggerDiagnostics}
          disabled={loading}
          className={`flex items-center space-x-1 py-1 px-2.5 rounded text-[8.5px] font-bold border transition-all ${
            loading
              ? "bg-[#181922] text-slate-500 border-slate-850 cursor-not-allowed"
              : "bg-[#a3e635] text-slate-950 border-transparent hover:bg-[#bbf246] active:scale-95 cursor-pointer"
          }`}
          id="btn-run-diagnostics"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          <span>{loading ? "Diagnosing..." : "Run Probe"}</span>
        </button>
      </div>

      {report ? (
        <div className="flex flex-col space-y-3.5" id="report-container">
          
          {/* Health Gauge & Status Summary Row */}
          <div className="flex items-center space-x-4 bg-slate-950/40 border border-slate-900 p-3 rounded-lg" id="health-score-card">
            
            {/* SVG Circular Health Meter */}
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r={radius}
                  className="stroke-slate-800 fill-none"
                  strokeWidth="4"
                />
                <circle
                  cx="32"
                  cy="32"
                  r={radius}
                  className={`fill-none transition-all duration-1000 ${getHealthColor(score)}`}
                  strokeWidth="4"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className={`text-xs font-black leading-none ${getHealthTextColor(score)}`}>{score}%</span>
                <span className="text-[6.5px] text-slate-500 font-bold mt-0.5 uppercase">Health</span>
              </div>
            </div>

            {/* Diagnostics status and summary */}
            <div className="flex-1 flex flex-col justify-center min-w-0">
              <span className="text-slate-500 text-[8px] uppercase font-bold tracking-wide">
                Diagnostics Status
              </span>
              <span className={`text-xs font-black mt-1 leading-normal truncate ${getHealthTextColor(score)}`}>
                {report.status}
              </span>
              <div className="flex items-center space-x-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                <span className="text-[8px] text-slate-400 font-bold uppercase">
                  Telemetry synched
                </span>
              </div>
            </div>
          </div>

          {/* Twin Speech Bubble thoughts */}
          {report.twinThoughts && (
            <div className="relative bg-[#161822]/80 border border-slate-900 p-3 rounded-lg text-slate-300 italic text-[9.5px] leading-relaxed" id="twin-thoughts-bubble">
              <div className="absolute -top-1.5 left-4 w-3 h-3 bg-[#161822] border-t border-l border-slate-900 transform rotate-45" />
              <div className="flex items-start space-x-2">
                <span className="text-xs shrink-0 select-none">💭</span>
                <p className="flex-1 text-slate-200">
                  "{report.twinThoughts}"
                </p>
              </div>
            </div>
          )}

          {/* Dual List: Insights vs Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="diagnostics-details">
            {/* Insights */}
            <div className="bg-[#14151b] p-3 rounded border border-slate-950 flex flex-col space-y-1.5">
              <span className="text-[8px] text-yellow-500 font-bold uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-yellow-500" />
                Physiological Insights
              </span>
              <ul className="flex-1 flex flex-col space-y-1.5 text-[8.5px] text-slate-400">
                {report.insights.map((ins, i) => (
                  <li key={`insight-${i}`} className="leading-normal list-none flex items-start gap-1">
                    <span className="text-emerald-500 shrink-0 select-none">•</span>
                    <span>{ins}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            <div className="bg-[#14151b] p-3 rounded border border-slate-950 flex flex-col space-y-1.5">
              <span className="text-[8px] text-[#a3e635] font-bold uppercase tracking-wider flex items-center gap-1">
                <Activity className="w-3 h-3 text-[#a3e635]" />
                Corrective Actions
              </span>
              <ul className="flex-1 flex flex-col space-y-1.5 text-[8.5px] text-slate-400">
                {report.recommendations.map((rec, i) => (
                  <li key={`rec-${i}`} className="leading-normal list-none flex items-start gap-1">
                    <span className="text-[#a3e635] shrink-0 select-none">✔</span>
                    <span className="text-slate-300 font-bold">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 bg-slate-950/20 border border-dashed border-slate-900 rounded-lg text-center text-slate-500" id="empty-report-wrapper">
          <BrainCircuit className="w-7 h-7 text-slate-700 animate-pulse mb-2" />
          <p className="text-[9.5px] font-bold">Diagnostics ready. Run a probe analysis to synchronize with live plant sensors.</p>
        </div>
      )}

    </div>
  );
}
