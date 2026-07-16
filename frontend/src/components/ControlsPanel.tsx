import { useState } from "react";
import { Play, Pause, RotateCcw, Sliders, Settings2, Database } from "lucide-react";
import type { LettuceEnvironmentalStats, NutrientSolution, ReservoirStats } from "../types";

interface ControlsPanelProps {
  scenario: string;
  onScenarioChange: (scenario: string) => void;
  growthStage: string;
  onStageChange: (stage: "Germination" | "Seedling" | "Vegetative" | "Mature") => void;
  cropType: string;
  onCropChange: (crop: string) => void;
  isRunning: boolean;
  onToggleRunning: () => void;
  onReset: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  realTime: boolean;
  onRealTimeToggle: () => void;
  autoCorrect: boolean;
  onAutoCorrectToggle: () => void;
  metrics: {
    growthRate: number;
    health: number;
    age: number;
  };
  harvestDays: number;
  waterUptake: number;
  nutrientsFed: number;
  environmentalStats: LettuceEnvironmentalStats;
  onStatsChange: (stats: LettuceEnvironmentalStats) => void;
  onManualDose: () => void;
  onManualRefill: () => void;
  nutrients: NutrientSolution;
  onNutrientChange: (key: keyof NutrientSolution, val: number) => void;
  onResetNutrients: () => void;
  onAgeChange: (newAge: number) => void;
  simMinutes: number;
  reservoir: ReservoirStats;
  onReservoirChange: (reservoir: ReservoirStats) => void;
  turbidity: number;
  onTurbidityChange: (turbidity: number) => void;
  onFiveHourJump: () => void;
}

export default function ControlsPanel({
  scenario,
  onScenarioChange,
  growthStage,
  onStageChange,
  cropType,
  onCropChange,
  isRunning,
  onToggleRunning,
  onReset,
  speed,
  onSpeedChange,
  realTime,
  onRealTimeToggle,
  autoCorrect,
  onAutoCorrectToggle,
  metrics,
  harvestDays,
  waterUptake,
  nutrientsFed,
  environmentalStats,
  onStatsChange,
  onManualDose,
  onManualRefill,
  nutrients,
  onNutrientChange,
  onResetNutrients,
  onAgeChange,
  simMinutes,
  reservoir,
  onReservoirChange,
  turbidity,
  onTurbidityChange,
  onFiveHourJump,
}: ControlsPanelProps) {
  const [controlTab, setControlTab] = useState<"Scenarios" | "Tuning" | "Nutrients" | "Days">("Scenarios");

  // Handle slider updates
  const handleSliderChange = (key: keyof LettuceEnvironmentalStats, val: number) => {
    const updated = { ...environmentalStats, [key]: val };
    
    // Automatically recalculate derived stats like Flow Rate from pumpSpeed
    if (key === "pumpSpeed") {
      updated.flowRate = parseFloat(((val / 100) * 1.5).toFixed(2));
    }
    onStatsChange(updated);
  };

  // Scenario description text
  const getScenarioDescription = (scen: string) => {
    switch (scen) {
      case "Normal Growth":
        return "Optimal variables configured. Ready for homeostasis.";
      case "Tipburn Risk":
        return "Hot room & transpiration arrest restricts Calcium uptake.";
      case "Algae Bloom":
        return "High light & organic accumulation spurs algal growth.";
      case "Pump Failure":
        return "Circulating pump stops. Solution film in channels dried.";
      default:
        return "Custom parameters configured.";
    }
  };

  return (
    <div className="flex flex-col space-y-4 text-sm font-mono select-none h-full" id="sim-control-sidebar">
      
      {/* Simulation Playback Bar */}
      <div className="flex flex-col space-y-3.5 bg-slate-950/40 p-4 rounded-lg border border-slate-900" id="sim-playback-box">
        <span className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wide">
          Simulation Control Engine
        </span>
        
        {/* Core Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onToggleRunning}
            className={`flex-1 py-2.5 px-3 rounded-lg font-black transition-all text-xs flex items-center justify-center gap-1.5 shadow-md ${
              isRunning
                ? "bg-slate-900 text-amber-500 border border-amber-500/30 hover:bg-slate-950 cursor-pointer"
                : "bg-[#a3e635] text-slate-950 border-transparent hover:bg-[#bbf246] active:scale-95 cursor-pointer"
            }`}
            id="btn-toggle-sim"
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause Sim</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Resume Sim</span>
              </>
            )}
          </button>
          <button
            onClick={onReset}
            className="p-2.5 border border-slate-800 bg-slate-900 hover:bg-slate-950 rounded-lg transition-colors text-slate-400 hover:text-white cursor-pointer flex items-center justify-center"
            title="Reset Sim Clock"
            id="btn-reset-sim"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Speed Dials */}
        <div className="flex items-center space-x-1 bg-slate-950/60 p-1 rounded-lg border border-slate-900">
          {[1, 2, 5, 10, 30, 50, 100].map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`flex-1 py-1.5 rounded-md text-[10.5px] font-black transition-all cursor-pointer ${
                speed === s && isRunning
                  ? "bg-[#a3e635] text-slate-950 font-black"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              id={`speed-btn-${s}`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Speed Growth - 5-Hour Jump Button */}
        <button
          onClick={onFiveHourJump}
          className="w-full py-2.5 px-3 bg-gradient-to-r from-[#a3e635] to-emerald-500 text-slate-950 font-black rounded-lg text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 hover:from-[#bbf246] hover:to-emerald-400 cursor-pointer shadow active:scale-[0.98] transition-all"
          id="btn-five-hour-jump"
          title="Instantly advance crop growth by 5 hours"
        >
          <span className="text-[12px]">⚡</span>
          <span>Fast Growth (5-Hr Jump)</span>
        </button>
      </div>

      {/* Control Tabs Toggle */}
      <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-900" id="tabs-toggle">
        <button
          onClick={() => setControlTab("Scenarios")}
          className={`py-2 px-2.5 rounded-md text-[10.5px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            controlTab === "Scenarios"
              ? "bg-[#a3e635] text-slate-950 shadow-md"
              : "text-slate-450 hover:text-slate-200"
          }`}
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>Scenarios</span>
        </button>
        <button
          onClick={() => setControlTab("Tuning")}
          className={`py-2 px-2.5 rounded-md text-[10.5px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            controlTab === "Tuning"
              ? "bg-[#a3e635] text-slate-950 shadow-md"
              : "text-slate-450 hover:text-slate-200"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Climate</span>
        </button>
        <button
          onClick={() => setControlTab("Nutrients")}
          className={`py-2 px-2.5 rounded-md text-[10.5px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            controlTab === "Nutrients"
              ? "bg-[#a3e635] text-slate-950 shadow-md"
              : "text-slate-450 hover:text-slate-200"
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Nutrients</span>
        </button>
        <button
          onClick={() => setControlTab("Days")}
          className={`py-2 px-2.5 rounded-md text-[10.5px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            controlTab === "Days"
              ? "bg-[#a3e635] text-slate-950 shadow-md"
              : "text-slate-450 hover:text-slate-200"
          }`}
        >
          <span className="text-[11px]">📅</span>
          <span>Days & Age</span>
        </button>
      </div>

      {controlTab === "Scenarios" && (
        <div className="flex flex-col space-y-4 flex-grow min-h-0 py-1" id="tab-scenarios-panel">
          {/* SIMULATION SCENARIO SELECT */}
          <div className="flex flex-col space-y-2 bg-slate-900/40 p-4 rounded-lg border border-slate-900 shrink-0">
            <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
              Anomalies & Scenarios
            </label>
            <select
              value={scenario}
              onChange={(e) => onScenarioChange(e.target.value)}
              className="w-full bg-[#14151c] text-slate-100 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 text-xs font-extrabold"
              id="select-scenario"
            >
              <option value="Normal Growth">Normal Growth (Baseline)</option>
              <option value="Tipburn Risk">Tipburn Risk (Transpiration Block)</option>
              <option value="Algae Bloom">Algae Bloom (Microbiology)</option>
              <option value="Pump Failure">Pump Failure (Circulation Cut)</option>
            </select>
            <p className="text-[10px] text-slate-500 leading-normal mt-1 italic">
              {getScenarioDescription(scenario)}
            </p>
          </div>

          {/* PLANT GROWTH STAGE SELECT */}
          <div className="flex flex-col space-y-2 bg-slate-900/40 p-4 rounded-lg border border-slate-900 shrink-0">
            <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
              Plant Growth Stage
            </label>
            <div className="grid grid-cols-2 gap-1.5" id="stage-buttons-grid">
              {(["Germination", "Seedling", "Vegetative", "Mature"] as const).map((stg) => (
                <button
                  key={stg}
                  onClick={() => onStageChange(stg)}
                  className={`py-2 px-3 rounded-lg font-bold text-[10px] border transition-colors cursor-pointer shrink-0 ${
                    growthStage === stg
                      ? "bg-slate-900 text-[#a3e635] border-[#a3e635]/30"
                      : "bg-[#14151b] text-slate-450 border-slate-950 hover:text-slate-200"
                  }`}
                >
                  {stg}
                </button>
              ))}
            </div>
          </div>

          {/* CROP TYPE SELECT */}
          <div className="flex flex-col space-y-2 bg-slate-900/40 p-4 rounded-lg border border-slate-900 shrink-0">
            <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
              Crop Species
            </label>
            <select
              value={cropType}
              onChange={(e) => onCropChange(e.target.value)}
              className="w-full bg-[#14151c] text-slate-100 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 text-xs font-extrabold"
              id="select-crop-type"
            >
              <option value="Lettuce">Green Coral Lettuce (L. sativa)</option>
              <option value="Basil">Genovese Sweet Basil (O. basilicum)</option>
              <option value="Spinach">Bloomsdale Spinach (S. oleracea)</option>
            </select>
          </div>
        </div>
      )}

      {controlTab === "Tuning" && (
        <div className="flex flex-col space-y-4 bg-slate-900/20 p-4 rounded-lg border border-slate-900 overflow-y-auto flex-grow min-h-0" id="tab-tuning-panel">
          
          <div className="flex justify-between items-center border-b border-slate-950 pb-2.5 mb-1.5 shrink-0">
            <span className="text-xs text-yellow-500 font-black uppercase tracking-wide">
              Microclimate Tuning
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={onManualRefill}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-black cursor-pointer uppercase transition-colors"
                title="Refill reservoir water back to 95L"
              >
                💧 Refill
              </button>
              <button
                onClick={onManualDose}
                className="px-2 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded text-[10px] font-black cursor-pointer uppercase transition-colors"
                title="Dose concentrated nutrient solution"
              >
                ⚡ Dose
              </button>
            </div>
          </div>

          {/* LED intensity */}
          <div className="flex flex-col space-y-1.5 shrink-0">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-400 font-bold">LED intensity (PPFD)</span>
              <span className="text-white font-black">{environmentalStats.ledIntensity} µmol</span>
            </div>
            <input
              type="range"
              min="0"
              max="400"
              value={environmentalStats.ledIntensity}
              onChange={(e) => handleSliderChange("ledIntensity", parseInt(e.target.value))}
              className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-[#a3e635]"
            />
          </div>

          {/* Photoperiod */}
          <div className="flex flex-col space-y-1.5 shrink-0">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-400 font-bold">Photoperiod</span>
              <span className="text-white font-black">{environmentalStats.photoperiod} hrs/day</span>
            </div>
            <input
              type="range"
              min="0"
              max="24"
              value={environmentalStats.photoperiod}
              onChange={(e) => handleSliderChange("photoperiod", parseInt(e.target.value))}
              className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-[#a3e635]"
            />
          </div>

          {/* Pump speed */}
          <div className="flex flex-col space-y-1.5 shrink-0">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-400 font-bold">Recirculation Pump</span>
              <span className="text-white font-black">{environmentalStats.pumpSpeed}% ({environmentalStats.flowRate} L/m)</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={environmentalStats.pumpSpeed}
              onChange={(e) => handleSliderChange("pumpSpeed", parseInt(e.target.value))}
              className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-[#a3e635]"
            />
          </div>

          {/* Ambient Air Temp */}
          <div className="flex flex-col space-y-1.5 shrink-0">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-400 font-bold">Ambient Air Temp</span>
              <span className="text-white font-black">{environmentalStats.airTemp.toFixed(1)} °C</span>
            </div>
            <input
              type="range"
              min="10"
              max="45"
              step="0.5"
              value={environmentalStats.airTemp}
              onChange={(e) => handleSliderChange("airTemp", parseFloat(e.target.value))}
              className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-[#a3e635]"
            />
          </div>

          {/* Nutrient Water Temp */}
          <div className="flex flex-col space-y-1.5 shrink-0">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-400 font-bold">Nutrient Water Temp</span>
              <span className="text-white font-black">{environmentalStats.waterTemp.toFixed(1)} °C</span>
            </div>
            <input
              type="range"
              min="10"
              max="40"
              step="0.5"
              value={environmentalStats.waterTemp}
              onChange={(e) => handleSliderChange("waterTemp", parseFloat(e.target.value))}
              className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-[#a3e635]"
            />
          </div>

          {/* Cabin Humidity */}
          <div className="flex flex-col space-y-1.5 shrink-0">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-400 font-bold">Cabin Humidity</span>
              <span className="text-white font-black">{environmentalStats.humidity}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={environmentalStats.humidity}
              onChange={(e) => handleSliderChange("humidity", parseInt(e.target.value))}
              className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-[#a3e635]"
            />
          </div>

          {/* Nutrient Target EC */}
          <div className="flex flex-col space-y-1.5 shrink-0">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-400 font-bold">Target EC (Concentration)</span>
              <span className="text-white font-black">{environmentalStats.targetEC.toFixed(2)} mS/cm</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="3.0"
              step="0.05"
              value={environmentalStats.targetEC}
              onChange={(e) => handleSliderChange("targetEC", parseFloat(e.target.value))}
              className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-[#a3e635]"
            />
          </div>

          {/* Target pH */}
          <div className="flex flex-col space-y-1.5 shrink-0">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-400 font-bold">Target pH</span>
              <span className="text-white font-black">{environmentalStats.targetPH.toFixed(2)} pH</span>
            </div>
            <input
              type="range"
              min="4.5"
              max="8.5"
              step="0.05"
              value={environmentalStats.targetPH}
              onChange={(e) => handleSliderChange("targetPH", parseFloat(e.target.value))}
              className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-[#a3e635]"
            />
          </div>

          {/* Direct Solution Overrides Separator */}
          <div className="border-t border-slate-950 my-1 pt-2.5 flex flex-col space-y-3.5 shrink-0">
            <span className="text-[11px] text-amber-500 font-black uppercase tracking-wide">
              Direct Solution Overrides
            </span>

            {/* Direct Reservoir pH */}
            <div className="flex flex-col space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-400 font-bold">Direct Reservoir pH</span>
                <span className="text-[#a3e635] font-black">{reservoir.pH.toFixed(2)} pH</span>
              </div>
              <input
                type="range"
                min="3.0"
                max="10.0"
                step="0.05"
                value={reservoir.pH}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onReservoirChange({
                    ...reservoir,
                    pH: val,
                  });
                }}
                className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-[#a3e635]"
              />
            </div>

            {/* Direct Reservoir TDS / EC */}
            <div className="flex flex-col space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-400 font-bold">Direct Reservoir TDS</span>
                <span className="text-[#a3e635] font-black">{reservoir.tds} ppm ({reservoir.ec.toFixed(2)} mS/cm)</span>
              </div>
              <input
                type="range"
                min="100"
                max="2500"
                step="25"
                value={reservoir.tds}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  const nextEC = parseFloat((val / 640).toFixed(2));
                  onReservoirChange({
                    ...reservoir,
                    tds: val,
                    ec: nextEC,
                  });
                }}
                className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-[#a3e635]"
              />
            </div>

            {/* Direct Solution Turbidity */}
            <div className="flex flex-col space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-400 font-bold">Direct Water Turbidity</span>
                <span className="text-[#a3e635] font-black">{turbidity.toFixed(1)} NTU</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="15.0"
                step="0.1"
                value={turbidity}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onTurbidityChange(val);
                }}
                className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-[#a3e635]"
              />
            </div>
          </div>
        </div>
      )}

      {controlTab === "Nutrients" && (
        <div className="flex flex-col space-y-4 bg-slate-900/20 p-4 rounded-lg border border-slate-900 overflow-y-auto flex-grow min-h-0" id="tab-nutrients-panel">
          <div className="flex justify-between items-center border-b border-slate-950 pb-2.5 mb-1.5 shrink-0">
            <span className="text-xs text-yellow-500 font-black uppercase tracking-wide">
              Macronutrient Tuning
            </span>
            <button
              onClick={onResetNutrients}
              className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-[10px] font-black cursor-pointer uppercase transition-colors"
            >
              Reset Recipe
            </button>
          </div>

          {/* Nitrogen N */}
          <div className="flex flex-col space-y-1.5 shrink-0">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-400 font-bold">Nitrogen (N)</span>
              <span className="text-white font-black">{nutrients.nitrogen} ppm</span>
            </div>
            <input
              type="range"
              min="0"
              max="300"
              value={nutrients.nitrogen}
              onChange={(e) => onNutrientChange("nitrogen", parseInt(e.target.value))}
              className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-[#3b82f6]"
            />
          </div>

          {/* Phosphorus P */}
          <div className="flex flex-col space-y-1.5 shrink-0">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-400 font-bold">Phosphorus (P)</span>
              <span className="text-white font-black">{nutrients.phosphorus} ppm</span>
            </div>
            <input
              type="range"
              min="0"
              max="150"
              value={nutrients.phosphorus}
              onChange={(e) => onNutrientChange("phosphorus", parseInt(e.target.value))}
              className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-[#a855f7]"
            />
          </div>

          {/* Potassium K */}
          <div className="flex flex-col space-y-1.5 shrink-0">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-400 font-bold">Potassium (K)</span>
              <span className="text-white font-black">{nutrients.potassium} ppm</span>
            </div>
            <input
              type="range"
              min="0"
              max="400"
              value={nutrients.potassium}
              onChange={(e) => onNutrientChange("potassium", parseInt(e.target.value))}
              className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-[#eab308]"
            />
          </div>

          {/* Calcium Ca */}
          <div className="flex flex-col space-y-1.5 shrink-0">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-400 font-bold">Calcium (Ca)</span>
              <span className="text-white font-black">{nutrients.calcium} ppm</span>
            </div>
            <input
              type="range"
              min="0"
              max="300"
              value={nutrients.calcium}
              onChange={(e) => onNutrientChange("calcium", parseInt(e.target.value))}
              className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-[#ef4444]"
            />
          </div>

          {/* Magnesium Mg */}
          <div className="flex flex-col space-y-1.5 shrink-0">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-400 font-bold">Magnesium (Mg)</span>
              <span className="text-white font-black">{nutrients.magnesium} ppm</span>
            </div>
            <input
              type="range"
              min="0"
              max="150"
              value={nutrients.magnesium}
              onChange={(e) => onNutrientChange("magnesium", parseInt(e.target.value))}
              className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-[#ec4899]"
            />
          </div>

          {/* Sulfur S */}
          <div className="flex flex-col space-y-1.5 shrink-0">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-400 font-bold">Sulfur (S)</span>
              <span className="text-white font-black">{nutrients.sulfur} ppm</span>
            </div>
            <input
              type="range"
              min="0"
              max="150"
              value={nutrients.sulfur}
              onChange={(e) => onNutrientChange("sulfur", parseInt(e.target.value))}
              className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-[#14b8a6]"
            />
          </div>
        </div>
      )}

      {controlTab === "Days" && (
        <div className="flex flex-col space-y-4 bg-slate-900/20 p-4 rounded-lg border border-slate-900 overflow-y-auto flex-grow min-h-0" id="tab-days-panel">
          <div className="flex justify-between items-center border-b border-slate-950 pb-2.5 mb-1.5 shrink-0">
            <span className="text-xs text-yellow-500 font-black uppercase tracking-wide">
              Simulated Time & Crop Age
            </span>
            <span className="text-[10px] text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 px-2 py-0.5 rounded-lg font-mono font-black">
              Day {Math.floor(simMinutes / 1440) + 1}
            </span>
          </div>

          {/* Simulated Elapsed Time readout */}
          <div className="bg-[#14151b] p-3 rounded-lg border border-slate-900 text-xs text-slate-300 space-y-1.5 shrink-0">
            <div className="flex justify-between">
              <span className="text-slate-500">Total Sim Elapsed:</span>
              <span className="text-white font-black">{Math.floor(simMinutes / 1440)}d {Math.floor((simMinutes % 1440) / 60)}h {simMinutes % 60}m</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Current Crop Age:</span>
              <span className="text-[#a3e635] font-black">{metrics.age.toFixed(1)} Days</span>
            </div>
          </div>

          {/* Quick 5-Hour Jump */}
          <button
            onClick={onFiveHourJump}
            className="w-full py-2.5 px-3 bg-gradient-to-r from-[#a3e635] to-emerald-500 hover:from-[#bbf246] hover:to-emerald-400 text-slate-950 font-black rounded-lg text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow shrink-0"
            id="btn-days-five-hour-jump"
            title="Advance crop life and solution updates by exactly 5 hours"
          >
            <span>⚡ Jump +5 Hours Growth</span>
          </button>

          {/* Crop Age fine-tuning Slider */}
          <div className="flex flex-col space-y-1.5 bg-slate-900/40 p-3 rounded-lg border border-slate-900 shrink-0">
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-slate-400 uppercase tracking-wide">Fine-Tune Crop Age</span>
              <span className="text-white font-black text-xs">{metrics.age.toFixed(1)} Days</span>
            </div>
            <input
              type="range"
              min="0"
              max="35"
              step="0.5"
              value={metrics.age}
              onChange={(e) => onAgeChange(parseFloat(e.target.value))}
              className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-[#a3e635]"
            />
            <p className="text-[9px] text-slate-500 mt-1 leading-normal">
              Adjusting the age immediately recalculates leaves, root length, and canopy biomass.
            </p>
          </div>

          {/* Quick-Jump Milestone Buttons */}
          <div className="flex flex-col space-y-2 bg-slate-900/40 p-3 rounded-lg border border-slate-900 shrink-0">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-bold">
              Lifecycle Milestones
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onAgeChange(0)}
                className={`py-1.5 px-2.5 rounded-lg font-bold text-[10px] border text-left flex flex-col justify-between h-14 transition-all cursor-pointer ${
                  metrics.age >= 0 && metrics.age < 5
                    ? "bg-slate-950 border-[#a3e635] text-[#a3e635]"
                    : "bg-[#14151b] border-slate-900 text-slate-400 hover:text-slate-200"
                }`}
              >
                <span className="font-extrabold">Day 0: Germination</span>
                <span className="text-[8.5px] text-slate-500 font-normal">Sprout begins</span>
              </button>
              <button
                onClick={() => onAgeChange(5)}
                className={`py-1.5 px-2.5 rounded-lg font-bold text-[10px] border text-left flex flex-col justify-between h-14 transition-all cursor-pointer ${
                  metrics.age >= 5 && metrics.age < 14
                    ? "bg-slate-950 border-[#a3e635] text-[#a3e635]"
                    : "bg-[#14151b] border-slate-900 text-slate-400 hover:text-slate-200"
                }`}
              >
                <span className="font-extrabold">Day 5: Seedling</span>
                <span className="text-[8.5px] text-slate-500 font-normal">Roots active</span>
              </button>
              <button
                onClick={() => onAgeChange(14)}
                className={`py-1.5 px-2.5 rounded-lg font-bold text-[10px] border text-left flex flex-col justify-between h-14 transition-all cursor-pointer ${
                  metrics.age >= 14 && metrics.age < 28
                    ? "bg-slate-950 border-[#a3e635] text-[#a3e635]"
                    : "bg-[#14151b] border-slate-900 text-slate-400 hover:text-slate-200"
                }`}
              >
                <span className="font-extrabold">Day 14: Vegetative</span>
                <span className="text-[8.5px] text-slate-500 font-normal">Rapid leafing</span>
              </button>
              <button
                onClick={() => onAgeChange(28)}
                className={`py-1.5 px-2.5 rounded-lg font-bold text-[10px] border text-left flex flex-col justify-between h-14 transition-all cursor-pointer ${
                  metrics.age >= 28
                    ? "bg-slate-950 border-[#a3e635] text-[#a3e635]"
                    : "bg-[#14151b] border-slate-900 text-slate-400 hover:text-slate-200"
                }`}
              >
                <span className="font-extrabold">Day 28: Mature</span>
                <span className="text-[8.5px] text-slate-500 font-normal">Ready for yield</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Switches & Safeties */}
      <div className="flex flex-col space-y-1.5 bg-[#12141c]/50 p-2.5 rounded border border-slate-900" id="automatic-safeties">
        <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">
          Automation Loops
        </span>
        <div className="flex justify-between gap-4">
          <label className="flex items-center space-x-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={realTime}
              onChange={onRealTimeToggle}
              className="rounded accent-[#a3e635] bg-slate-800 border-slate-700 text-[#a3e635] focus:ring-0"
              id="chk-real-time"
            />
            <span className="text-[9.5px] text-slate-300 font-bold">Real-time stats</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoCorrect}
              onChange={onAutoCorrectToggle}
              className="rounded accent-[#a3e635] bg-slate-800 border-slate-700 text-[#a3e635] focus:ring-0"
              id="chk-auto-correct"
            />
            <span className="text-[9.5px] text-slate-300 font-bold">Auto Dosing</span>
          </label>
        </div>
      </div>

      {/* Accumulated simulation telemetry readout */}
      <div className="bg-[#12141c]/60 p-4 rounded-lg border border-slate-900 flex flex-col space-y-2 mt-auto" id="accumulated-ledger">
        <span className="text-[9px] text-yellow-500 font-bold uppercase tracking-wider">
          Resources Accumulated Ledger
        </span>
        <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-[10px] text-slate-400" id="ledger-stats">
          <div>
            <span className="text-slate-500 text-[8px] uppercase font-bold">Water Absorbed</span>
            <span className="text-slate-200 font-black block mt-0.5 text-[11px]">{waterUptake.toFixed(2)} L</span>
          </div>
          <div>
            <span className="text-slate-500 text-[8px] uppercase font-bold">Minerals Fed</span>
            <span className="text-slate-200 font-black block mt-0.5 text-[11px]">{nutrientsFed.toFixed(2)} g</span>
          </div>
          <div>
            <span className="text-slate-500 text-[8px] uppercase font-bold">Net Growth Rate</span>
            <span className="text-emerald-400 font-black block mt-0.5 text-[11px]">+{metrics.growthRate.toFixed(2)}%</span>
          </div>
          <div>
            <span className="text-slate-500 text-[8px] uppercase font-bold">Harvest Horizon</span>
            <span className="text-slate-200 font-black block mt-0.5 text-[11px]">{harvestDays.toFixed(1)} Days</span>
          </div>
        </div>
      </div>

    </div>
  );
}
