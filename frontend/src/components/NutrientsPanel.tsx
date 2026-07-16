import { useMemo } from "react";
import type { NutrientSolution } from "../types";

interface NutrientsPanelProps {
  currentTDS: number;
  scenario: string;
}

export default function NutrientsPanel({ currentTDS, scenario }: NutrientsPanelProps) {
  // Base formulation at standard 900 ppm (EC 1.4 mS/cm)
  const baseSolution: NutrientSolution = {
    nitrogen: 150,
    phosphorus: 50,
    potassium: 200,
    calcium: 150,
    magnesium: 50,
    sulfur: 64,
    iron: 4.5,
    manganese: 0.5,
    boron: 0.5,
    zinc: 0.05,
    copper: 0.02,
    molybdenum: 0.01,
  };

  const currentSolution = useMemo(() => {
    const scale = currentTDS / 900;
    const sol: NutrientSolution = {
      nitrogen: parseFloat((baseSolution.nitrogen * scale).toFixed(1)),
      phosphorus: parseFloat((baseSolution.phosphorus * scale).toFixed(1)),
      potassium: parseFloat((baseSolution.potassium * scale).toFixed(1)),
      calcium: parseFloat((baseSolution.calcium * scale).toFixed(1)),
      magnesium: parseFloat((baseSolution.magnesium * scale).toFixed(1)),
      sulfur: parseFloat((baseSolution.sulfur * scale).toFixed(1)),
      iron: parseFloat((baseSolution.iron * scale).toFixed(2)),
      manganese: parseFloat((baseSolution.manganese * scale).toFixed(2)),
      boron: parseFloat((baseSolution.boron * scale).toFixed(2)),
      zinc: parseFloat((baseSolution.zinc * scale).toFixed(2)),
      copper: parseFloat((baseSolution.copper * scale).toFixed(3)),
      molybdenum: parseFloat((baseSolution.molybdenum * scale).toFixed(3)),
    };

    // Scenario impacts
    if (scenario === "Algae Bloom") {
      // Algae absorbs nitrogen and phosphorus rapidly
      sol.nitrogen = parseFloat((sol.nitrogen * 0.45).toFixed(1));
      sol.phosphorus = parseFloat((sol.phosphorus * 0.3).toFixed(1));
    }

    return sol;
  }, [currentTDS, scenario]);

  const macronutrients = [
    { name: "Nitrogen (N)", val: currentSolution.nitrogen, max: 250, target: 150, unit: "ppm", color: "bg-emerald-500", desc: "Leaves & canopy vegetative expansion" },
    { name: "Phosphorus (P)", val: currentSolution.phosphorus, max: 100, target: 50, unit: "ppm", color: "bg-teal-500", desc: "Root growth & cell division" },
    { name: "Potassium (K)", val: currentSolution.potassium, max: 300, target: 200, unit: "ppm", color: "bg-cyan-500", desc: "Osmoregulation & stomatal mechanics" },
    { name: "Calcium (Ca)", val: currentSolution.calcium, max: 250, target: 150, unit: "ppm", color: "bg-blue-500", desc: "Cell wall structural integrity" },
    { name: "Magnesium (Mg)", val: currentSolution.magnesium, max: 100, target: 50, unit: "ppm", color: "bg-indigo-500", desc: "Central atom of chlorophyll molecule" },
    { name: "Sulfur (S)", val: currentSolution.sulfur, max: 120, target: 64, unit: "ppm", color: "bg-purple-500", desc: "Protein synthesis & enzyme activation" },
  ];

  const micronutrients = [
    { name: "Iron (Fe)", val: currentSolution.iron, target: 4.5, unit: "ppm" },
    { name: "Manganese (Mn)", val: currentSolution.manganese, target: 0.5, unit: "ppm" },
    { name: "Boron (B)", val: currentSolution.boron, target: 0.5, unit: "ppm" },
    { name: "Zinc (Zn)", val: currentSolution.zinc, target: 0.05, unit: "ppm" },
    { name: "Copper (Cu)", val: currentSolution.copper, target: 0.02, unit: "ppm" },
    { name: "Moly (Mo)", val: currentSolution.molybdenum, target: 0.01, unit: "ppm" },
  ];

  return (
    <div className="bg-[#12141c]/60 border border-slate-900 rounded-lg p-3.5 flex flex-col space-y-3.5 select-none" id="nutrients-composition-panel">
      <div className="flex items-center justify-between border-b border-slate-900 pb-2">
        <div className="flex flex-col">
          <span className="text-[10px] text-yellow-500 font-bold uppercase tracking-wider">
            Macronutrient Composition
          </span>
          <span className="text-[8px] text-slate-500 uppercase mt-0.5">
            Active mineral ions in root solution
          </span>
        </div>
        <div className="text-[9px] font-bold text-slate-400 bg-slate-900/60 px-1.5 py-0.5 rounded border border-slate-850">
          TDS: <span className="text-white font-extrabold">{currentTDS} ppm</span>
        </div>
      </div>

      {/* Macronutrient Progress Bars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="macros-grid">
        {macronutrients.map((macro) => {
          const percentage = Math.min(100, (macro.val / macro.max) * 100);
          const isDeficient = macro.val < macro.target * 0.75;
          const isExcess = macro.val > macro.target * 1.3;

          let statusText = "Optimal";
          let statusColor = "text-emerald-400";
          if (isDeficient) {
            statusText = "Deficient";
            statusColor = "text-rose-400 animate-pulse";
          } else if (isExcess) {
            statusText = "Excess Burn";
            statusColor = "text-red-500";
          }

          if (macro.name.includes("Calcium") && scenario === "Tipburn Risk") {
            statusText = "Canopy Blocked";
            statusColor = "text-amber-500 font-black animate-pulse";
          }
          if ((macro.name.includes("Nitrogen") || macro.name.includes("Phosphorus")) && scenario === "Algae Bloom") {
            statusText = "Algae Depleted";
            statusColor = "text-amber-500";
          }

          return (
            <div key={macro.name} className="bg-[#14151b] p-2.5 rounded border border-slate-950 flex flex-col justify-between" id={`macro-card-${macro.name.split(" ")[0].toLowerCase()}`}>
              <div className="flex items-center justify-between text-[9px] mb-1">
                <span className="font-bold text-slate-300">{macro.name}</span>
                <span className={`font-black uppercase text-[8px] ${statusColor}`}>{statusText}</span>
              </div>
              <div className="flex items-baseline space-x-1.5 mb-1.5">
                <span className="text-sm font-black text-white">{macro.val}</span>
                <span className="text-[8px] text-slate-500 font-bold uppercase">{macro.unit}</span>
                <span className="text-[8px] text-slate-600 font-bold ml-auto">Target: {macro.target}</span>
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div className={`${macro.color} h-full transition-all duration-500`} style={{ width: `${percentage}%` }} />
              </div>
              <span className="text-[7.5px] text-slate-500 mt-1.5 leading-tight">{macro.desc}</span>
            </div>
          );
        })}
      </div>

      {/* Micronutrients Micro Row */}
      <div className="border-t border-slate-950 pt-2 flex flex-col space-y-1.5">
        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">
          Micronutrient Traces
        </span>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-[8.5px]" id="micros-grid">
          {micronutrients.map((micro) => (
            <div key={micro.name} className="bg-[#14151b]/45 border border-slate-950 p-1.5 rounded flex flex-col items-center justify-center text-center">
              <span className="text-slate-500 block text-[7.5px]">{micro.name}</span>
              <span className="text-white font-bold block mt-0.5">{micro.val}</span>
              <span className="text-slate-600 block text-[6.5px] mt-0.5">Trgt: {micro.target}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
