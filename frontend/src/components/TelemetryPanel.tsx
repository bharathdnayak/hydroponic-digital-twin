import { useState, useMemo, useRef } from "react";
import type { TelemetryPoint } from "../types";

interface TelemetryPanelProps {
  history: TelemetryPoint[];
  currentPH: number;
  currentTDS: number;
  currentTurbidity: number;
  currentWaterTemp: number;
  currentHealth: number;
}

export default function TelemetryPanel({
  history,
  currentPH,
  currentTDS,
  currentTurbidity,
  currentWaterTemp,
  currentHealth,
}: TelemetryPanelProps) {
  const [chartTab, setChartTab] = useState<"Chemistry" | "Climate">("Chemistry");
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  // Baselines for the Simulation Analysis Table
  const baselines = {
    ph: 6.0,
    tds: 900,
    turbidity: 4.2,
    waterTemp: 21.0,
    health: 98.0,
  };

  // 1. Process History Data
  const chartData = useMemo(() => {
    if (history.length === 0) {
      // Return empty or default array of length 10
      return Array.from({ length: 10 }, (_, i) => ({
        label: `-${9 - i}h`,
        tds: 9.0,
        turbidity: 4.2,
        ph: 6.0,
        waterTemp: 21.0,
        airTemp: 23.0,
        humidity: 60.0,
      }));
    }

    // Pad or map history to at least 10 items
    const mapped = history.map((pt, idx) => {
      const hoursAgo = history.length - 1 - idx;
      return {
        label: hoursAgo === 0 ? "-0h" : `-${hoursAgo}h`,
        tds: parseFloat((pt.ec * 6.4).toFixed(1)), // map EC to TDS scale / 100 (e.g. 1.4 mS * 6.4 = 8.96 x100 ppm)
        turbidity: pt.waterTemp > 24 ? 6.5 : 4.2, // dynamic turbidity
        ph: pt.pH,
        waterTemp: pt.waterTemp,
        airTemp: pt.airTemp,
        humidity: pt.humidity,
      };
    });

    if (mapped.length < 10) {
      const paddingCount = 10 - mapped.length;
      const padding = Array.from({ length: paddingCount }, (_, i) => {
        const hoursAgo = 10 - 1 - i + mapped.length;
        return {
          label: `-${hoursAgo}h`,
          tds: 9.0,
          turbidity: 4.2,
          ph: 6.0,
          waterTemp: 21.0,
          airTemp: 23.0,
          humidity: 60.0,
        };
      });
      return [...padding, ...mapped];
    }

    return mapped.slice(-10);
  }, [history]);

  // Handle Chart Hovering
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!chartRef.current || chartData.length === 0) return;
    const rect = chartRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const padding = 40;
    const chartWidth = rect.width - padding * 2;
    
    // Find closest data index
    const relativeX = Math.max(0, Math.min(chartWidth, x - padding));
    const ratio = relativeX / chartWidth;
    const index = Math.round(ratio * (chartData.length - 1));
    setHoverIdx(index);
  };

  const handleMouseLeave = () => {
    setHoverIdx(null);
  };

  // Math scale variables
  const width = 500;
  const height = 160;
  const paddingX = 45;
  const paddingY = 20;

  // Render Chemistry lines
  const chemistryPaths = useMemo(() => {
    if (chartData.length < 2) return { phD: "", tdsD: "", turbidityD: "" };

    const getCoords = (val: number, min: number, max: number, idx: number) => {
      const x = paddingX + (idx / (chartData.length - 1)) * (width - paddingX * 2);
      const y = height - paddingY - ((val - min) / (max - min || 1)) * (height - paddingY * 2);
      return { x, y };
    };

    const phPoints = chartData.map((d, i) => getCoords(d.ph, 4.0, 8.0, i));
    const tdsPoints = chartData.map((d, i) => getCoords(d.tds, 6.0, 12.0, i));
    const turbPoints = chartData.map((d, i) => getCoords(d.turbidity, 2.0, 10.0, i));

    return {
      phD: `M ${phPoints.map((p) => `${p.x},${p.y}`).join(" L ")}`,
      tdsD: `M ${tdsPoints.map((p) => `${p.x},${p.y}`).join(" L ")}`,
      turbidityD: `M ${turbPoints.map((p) => `${p.x},${p.y}`).join(" L ")}`,
      phPts: phPoints,
      tdsPts: tdsPoints,
      turbPts: turbPoints,
    };
  }, [chartData]);

  // Render Climate lines
  const climatePaths = useMemo(() => {
    if (chartData.length < 2) return { airTempD: "", waterTempD: "", humidityD: "" };

    const getCoords = (val: number, min: number, max: number, idx: number) => {
      const x = paddingX + (idx / (chartData.length - 1)) * (width - paddingX * 2);
      const y = height - paddingY - ((val - min) / (max - min || 1)) * (height - paddingY * 2);
      return { x, y };
    };

    const airPoints = chartData.map((d, i) => getCoords(d.airTemp, 10.0, 35.0, i));
    const waterPoints = chartData.map((d, i) => getCoords(d.waterTemp, 10.0, 30.0, i));
    const humPoints = chartData.map((d, i) => getCoords(d.humidity, 20.0, 90.0, i));

    return {
      airTempD: `M ${airPoints.map((p) => `${p.x},${p.y}`).join(" L ")}`,
      waterTempD: `M ${waterPoints.map((p) => `${p.x},${p.y}`).join(" L ")}`,
      humidityD: `M ${humPoints.map((p) => `${p.x},${p.y}`).join(" L ")}`,
      airPts: airPoints,
      waterPts: waterPoints,
      humPts: humPoints,
    };
  }, [chartData]);

  // Helper row difference calculaters
  const rowDiff = (current: number, base: number) => {
    const diff = current - base;
    if (diff === 0) return "0.00";
    return diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2);
  };

  const rowTdsDiff = (current: number, base: number) => {
    const diff = Math.round(current - base);
    if (diff === 0) return "0 ppm";
    return diff > 0 ? `+${diff} ppm` : `${diff} ppm`;
  };

  const getEffect = (param: string, current: number, _base: number) => {
    if (param === "pH Level") {
      if (current < 5.6) return "Acidic stress";
      if (current > 6.4) return "Alkaline lockout";
      return "Stable";
    }
    if (param === "TDS (Nutrients)") {
      if (current < 750) return "Depleted";
      if (current > 1100) return "Excess Burn";
      return "Stable";
    }
    if (param === "Turbidity") {
      if (current > 6.0) return "Algae Accumulation";
      return "Stable";
    }
    if (param === "Water Temp") {
      if (current > 24.0) return "Rot Risk";
      if (current < 17.0) return "Stunted";
      return "Stable";
    }
    if (param === "Plant Health") {
      if (current < 85) return "Metabolic Strain";
      return "Stable";
    }
    return "Stable";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 font-mono text-xs select-none items-stretch" id="telemetry-bento-section">
      
      {/* MULTI PARAMETER SIMULATION CHART */}
      <div className="lg:col-span-7 bg-[#12141c]/60 border border-slate-900 rounded-lg p-3 flex flex-col space-y-3" id="multi-parameter-card">
        
        {/* Header and toggle tabs */}
        <div className="flex items-center justify-between border-b border-slate-900 pb-2">
          <span className="text-[10px] text-yellow-500 font-bold uppercase tracking-wider">
            Multi Parameter Simulation
          </span>
          <div className="flex items-center space-x-1 bg-slate-900/60 p-0.5 rounded border border-slate-850">
            <button
              onClick={() => setChartTab("Chemistry")}
              className={`px-2 py-0.5 rounded-[3px] text-[9px] font-bold transition-all ${
                chartTab === "Chemistry"
                  ? "bg-[#a3e635] text-slate-950"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              id="tab-chemistry"
            >
              Chemistry
            </button>
            <button
              onClick={() => setChartTab("Climate")}
              className={`px-2 py-0.5 rounded-[3px] text-[9px] font-bold transition-all ${
                chartTab === "Climate"
                  ? "bg-[#a3e635] text-slate-950"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              id="tab-climate"
            >
              Climate / Stats
            </button>
          </div>
        </div>

        {/* SVG Live Chart Area */}
        <div
          ref={chartRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative w-full aspect-[21/9] bg-[#14151b] border border-slate-950 rounded p-2 overflow-visible cursor-crosshair"
          id="svg-chart-container"
        >
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
            {/* Horizontal Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1.0].map((ratio, i) => {
              const y = paddingY + ratio * (height - paddingY * 2);
              return (
                <line
                  key={`grid-y-${i}`}
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="#1a1b24"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              );
            })}

            {chartData.map((_, i) => {
              const x = paddingX + (i / (chartData.length - 1)) * (width - paddingX * 2);
              return (
                <line
                  key={`grid-x-${i}`}
                  x1={x}
                  y1={paddingY}
                  x2={x}
                  y2={height - paddingY}
                  stroke="#161720"
                  strokeWidth="1"
                />
              );
            })}

            {/* Lines rendering */}
            {chartTab === "Chemistry" ? (
              <>
                {/* TDS line */}
                <path
                  d={chemistryPaths.tdsD}
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.85"
                />
                {/* Turbidity line */}
                <path
                  d={chemistryPaths.turbidityD}
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.85"
                />
                {/* pH line */}
                <path
                  d={chemistryPaths.phD}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.85"
                />
              </>
            ) : (
              <>
                {/* Humidity line */}
                <path
                  d={climatePaths.humidityD}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.85"
                />
                {/* Air Temp line */}
                <path
                  d={climatePaths.airTempD}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.85"
                />
                {/* Water Temp line */}
                <path
                  d={climatePaths.waterTempD}
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.85"
                />
              </>
            )}

            {/* X-Axis labels */}
            {chartData.map((d, i) => {
              const x = paddingX + (i / (chartData.length - 1)) * (width - paddingX * 2);
              return (
                <text
                  key={`lbl-x-${i}`}
                  x={x}
                  y={height - 5}
                  fill="#475569"
                  fontSize="7"
                  textAnchor="middle"
                  className="font-mono"
                >
                  {d.label}
                </text>
              );
            })}

            {/* Hover Guides */}
            {hoverIdx !== null && chartData[hoverIdx] && (
              <g>
                {/* Vertical slider line */}
                {(() => {
                  const x = paddingX + (hoverIdx / (chartData.length - 1)) * (width - paddingX * 2);
                  return (
                    <line
                      x1={x}
                      y1={paddingY}
                      x2={x}
                      y2={height - paddingY}
                      stroke="#a3e635"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                  );
                })()}

                {/* Draw highlighting dots */}
                {chartTab === "Chemistry" ? (
                  <>
                    {/* TDS dot */}
                    {chemistryPaths.tdsPts && (
                      <circle
                        cx={chemistryPaths.tdsPts[hoverIdx].x}
                        cy={chemistryPaths.tdsPts[hoverIdx].y}
                        r="3.5"
                        fill="#22d3ee"
                        stroke="#0f111a"
                        strokeWidth="1.2"
                      />
                    )}
                    {/* Turb dot */}
                    {chemistryPaths.turbPts && (
                      <circle
                        cx={chemistryPaths.turbPts[hoverIdx].x}
                        cy={chemistryPaths.turbPts[hoverIdx].y}
                        r="3.5"
                        fill="#f97316"
                        stroke="#0f111a"
                        strokeWidth="1.2"
                      />
                    )}
                    {/* pH dot */}
                    {chemistryPaths.phPts && (
                      <circle
                        cx={chemistryPaths.phPts[hoverIdx].x}
                        cy={chemistryPaths.phPts[hoverIdx].y}
                        r="3.5"
                        fill="#3b82f6"
                        stroke="#0f111a"
                        strokeWidth="1.2"
                      />
                    )}
                  </>
                ) : (
                  <>
                    {/* Hum dot */}
                    {climatePaths.humPts && (
                      <circle
                        cx={climatePaths.humPts[hoverIdx].x}
                        cy={climatePaths.humPts[hoverIdx].y}
                        r="3.5"
                        fill="#10b981"
                        stroke="#0f111a"
                        strokeWidth="1.2"
                      />
                    )}
                    {/* Air dot */}
                    {climatePaths.airPts && (
                      <circle
                        cx={climatePaths.airPts[hoverIdx].x}
                        cy={climatePaths.airPts[hoverIdx].y}
                        r="3.5"
                        fill="#ef4444"
                        stroke="#0f111a"
                        strokeWidth="1.2"
                      />
                    )}
                    {/* Water dot */}
                    {climatePaths.waterPts && (
                      <circle
                        cx={climatePaths.waterPts[hoverIdx].x}
                        cy={climatePaths.waterPts[hoverIdx].y}
                        r="3.5"
                        fill="#06b6d4"
                        stroke="#0f111a"
                        strokeWidth="1.2"
                      />
                    )}
                  </>
                )}
              </g>
            )}
          </svg>

          {/* Interactive Floating Tooltip */}
          {hoverIdx !== null && chartData[hoverIdx] && (
            <div
              className="absolute bg-[#181a24] border border-slate-800 rounded p-2 text-[8px] text-slate-300 pointer-events-none z-30"
              style={{
                left: `${Math.max(
                  10,
                  Math.min(
                    chartRef.current ? chartRef.current.clientWidth - 110 : 350,
                    (hoverIdx / (chartData.length - 1)) * (chartRef.current ? chartRef.current.clientWidth - 90 : 400) + 20
                  )
                )}px`,
                top: "10px",
              }}
              id="chart-tooltip"
            >
              <div className="font-bold border-b border-slate-900 pb-1 mb-1 text-slate-100 flex justify-between gap-4">
                <span>SIM TIME:</span>
                <span>{chartData[hoverIdx].label}</span>
              </div>
              {chartTab === "Chemistry" ? (
                <div className="flex flex-col space-y-1">
                  <div className="flex justify-between gap-4">
                    <span className="text-cyan-400">TDS (x100 ppm):</span>
                    <span className="font-bold text-white">
                      {chartData[hoverIdx].tds.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-orange-500">Turbidity (NTU):</span>
                    <span className="font-bold text-white">
                      {chartData[hoverIdx].turbidity.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-blue-500">pH Level:</span>
                    <span className="font-bold text-white">
                      {chartData[hoverIdx].ph.toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col space-y-1">
                  <div className="flex justify-between gap-4">
                    <span className="text-emerald-400">Humidity:</span>
                    <span className="font-bold text-white">
                      {chartData[hoverIdx].humidity.toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-red-500">Air Temp:</span>
                    <span className="font-bold text-white">
                      {chartData[hoverIdx].airTemp.toFixed(1)}°C
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-cyan-400">Water Temp:</span>
                    <span className="font-bold text-white">
                      {chartData[hoverIdx].waterTemp.toFixed(1)}°C
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center space-x-6 text-[8px] text-slate-400 mt-1">
          {chartTab === "Chemistry" ? (
            <>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" />
                TDS (x100 ppm)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
                Turbidity (NTU)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                pH Level
              </span>
            </>
          ) : (
            <>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                Humidity (%)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                Air Temp (°C)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" />
                Water Temp (°C)
              </span>
            </>
          )}
        </div>

      </div>

      {/* SIMULATION ANALYSIS TABLE */}
      <div className="lg:col-span-5 bg-[#12141c]/60 border border-slate-900 rounded-lg p-3 flex flex-col space-y-2" id="simulation-analysis-card">
        <span className="text-[10px] text-yellow-500 font-bold uppercase tracking-wider">
          Simulation Analysis
        </span>
        <div className="overflow-x-auto w-full border border-slate-900 rounded bg-[#101117] mt-1" id="analysis-table-wrapper">
          <table className="w-full text-left border-collapse text-[9px] text-slate-300">
            <thead>
              <tr className="border-b border-slate-900 bg-slate-950/40 text-slate-500 font-bold uppercase">
                <th className="p-2 pl-3">Parameter</th>
                <th className="p-2">Before</th>
                <th className="p-2">After</th>
                <th className="p-2">Change</th>
                <th className="p-2 pr-3">Effect</th>
              </tr>
            </thead>
            <tbody>
              {/* pH Level Row */}
              <tr className="border-b border-slate-900/65 hover:bg-slate-900/30">
                <td className="p-2 pl-3 flex items-center gap-1.5 font-bold text-slate-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  pH Level
                </td>
                <td className="p-2 text-slate-400">{baselines.ph.toFixed(2)}</td>
                <td className="p-2 text-slate-200 font-bold">{currentPH.toFixed(2)}</td>
                <td className="p-2 font-bold text-cyan-400">{rowDiff(currentPH, baselines.ph)}</td>
                <td className="p-2 pr-3">
                  <span className={`font-bold ${getEffect("pH Level", currentPH, baselines.ph) === "Stable" ? "text-emerald-400" : "text-amber-500"}`}>
                    {getEffect("pH Level", currentPH, baselines.ph)}
                  </span>
                </td>
              </tr>

              {/* TDS Row */}
              <tr className="border-b border-slate-900/65 hover:bg-slate-900/30">
                <td className="p-2 pl-3 flex items-center gap-1.5 font-bold text-slate-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  TDS (Nutrients)
                </td>
                <td className="p-2 text-slate-400">{baselines.tds}</td>
                <td className="p-2 text-slate-200 font-bold">{currentTDS}</td>
                <td className="p-2 font-bold text-cyan-400">{rowTdsDiff(currentTDS, baselines.tds)}</td>
                <td className="p-2 pr-3">
                  <span className={`font-bold ${getEffect("TDS (Nutrients)", currentTDS, baselines.tds) === "Stable" ? "text-emerald-400" : "text-rose-500"}`}>
                    {getEffect("TDS (Nutrients)", currentTDS, baselines.tds)}
                  </span>
                </td>
              </tr>

              {/* Turbidity Row */}
              <tr className="border-b border-slate-900/65 hover:bg-slate-900/30">
                <td className="p-2 pl-3 flex items-center gap-1.5 font-bold text-slate-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  Turbidity
                </td>
                <td className="p-2 text-slate-400">{baselines.turbidity.toFixed(1)}</td>
                <td className="p-2 text-slate-200 font-bold">{currentTurbidity.toFixed(1)}</td>
                <td className="p-2 font-bold text-cyan-400">{rowDiff(currentTurbidity, baselines.turbidity)}</td>
                <td className="p-2 pr-3">
                  <span className={`font-bold ${getEffect("Turbidity", currentTurbidity, baselines.turbidity) === "Stable" ? "text-emerald-400" : "text-amber-500 font-black animate-pulse"}`}>
                    {getEffect("Turbidity", currentTurbidity, baselines.turbidity)}
                  </span>
                </td>
              </tr>

              {/* Water Temp Row */}
              <tr className="border-b border-slate-900/65 hover:bg-slate-900/30">
                <td className="p-2 pl-3 flex items-center gap-1.5 font-bold text-slate-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  Water Temp
                </td>
                <td className="p-2 text-slate-400">{baselines.waterTemp.toFixed(1)}°C</td>
                <td className="p-2 text-slate-200 font-bold">{currentWaterTemp.toFixed(1)}°C</td>
                <td className="p-2 font-bold text-cyan-400">{rowDiff(currentWaterTemp, baselines.waterTemp)}</td>
                <td className="p-2 pr-3">
                  <span className={`font-bold ${getEffect("Water Temp", currentWaterTemp, baselines.waterTemp) === "Stable" ? "text-emerald-400" : "text-amber-500"}`}>
                    {getEffect("Water Temp", currentWaterTemp, baselines.waterTemp)}
                  </span>
                </td>
              </tr>

              {/* Plant Health Row */}
              <tr className="hover:bg-slate-900/30">
                <td className="p-2 pl-3 flex items-center gap-1.5 font-bold text-slate-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  Plant Health
                </td>
                <td className="p-2 text-slate-400">{baselines.health.toFixed(1)}%</td>
                <td className="p-2 text-slate-200 font-bold">{currentHealth.toFixed(1)}%</td>
                <td className="p-2 font-bold text-cyan-400">{rowDiff(currentHealth, baselines.health)}%</td>
                <td className="p-2 pr-3">
                  <span className={`font-bold ${getEffect("Plant Health", currentHealth, baselines.health) === "Stable" ? "text-emerald-400" : "text-rose-500"}`}>
                    {getEffect("Plant Health", currentHealth, baselines.health)}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
