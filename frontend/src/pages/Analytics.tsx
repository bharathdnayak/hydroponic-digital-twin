import { useState, useEffect, useMemo, useRef } from "react";
import { Leaf, Activity, BrainCircuit } from "lucide-react";
import ControlsPanel from "../components/ControlsPanel";
import PlantVisualizer from "../components/PlantVisualizer";
import TelemetryPanel from "../components/TelemetryPanel";
import DiagnosticsPanel from "../components/DiagnosticsPanel";
import ChatPanel from "../components/ChatPanel";
import type { LettuceEnvironmentalStats, ReservoirStats, LettuceMetrics, TelemetryPoint, ChatMessage, DiagnosticReport, NutrientSolution } from "../types";

const BACKEND_URL = "http://localhost:3001";

export default function Analytics() {
  // Simulation States
  const [scenario, setScenario] = useState<string>("Normal Growth");
  const [growthStage, setGrowthStage] = useState<"Germination" | "Seedling" | "Vegetative" | "Mature">("Vegetative");
  const [cropType, setCropType] = useState<string>("Lettuce");
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1);
  const [realTime, setRealTime] = useState<boolean>(true);
  const [autoCorrect, setAutoCorrect] = useState<boolean>(false);
  const [simMinutes, setSimMinutes] = useState<number>(0);
  const [turbidity, setTurbidity] = useState<number>(4.2);

  // Accumulators
  const [waterUptake, setWaterUptake] = useState<number>(1.0);
  const [nutrientsFed, setNutrientsFed] = useState<number>(0.0);

  // Core Environmental States
  const [environmentalStats, setEnvironmentalStats] = useState<LettuceEnvironmentalStats>({
    ledIntensity: 225,
    photoperiod: 16,
    pumpSpeed: 100,
    flowRate: 1.5,
    waterTemp: 21.0,
    airTemp: 23.0,
    humidity: 60,
    targetPH: 6.0,
    targetEC: 1.4,
    nutrientDoseAmount: 50,
  });

  // Detailed Macronutrient Solutes State (ppm)
  const [nutrients, setNutrients] = useState<NutrientSolution>({
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
  });

  // Reservoir States
  const [reservoir, setReservoir] = useState<ReservoirStats>({
    volume: 95.0,
    maxVolume: 100.0,
    ec: 1.4,
    tds: 900,
    pH: 6.00,
    nutrientPercentage: 100,
    waterConsumptionToday: 0.05,
    predictedRefillDays: 24,
    predictedNutrientRefillDays: 30,
  });

  // Biological Metrics States
  const [metrics, setMetrics] = useState<LettuceMetrics>({
    age: 14,
    stage: "Vegetative",
    height: 12.5,
    leafCount: 16,
    leafAreaIndex: 1.25,
    rootLength: 10.5,
    freshBiomass: 18.0,
    dryBiomass: 0.9,
    estimatedHarvestWeight: 180.0,
    health: 98,
    growthRate: 1.80,
    photosynthesisRate: 8.5,
    waterConsumption: 0.12,
    nutrientConsumption: 35.0,
  });

  // Telemetry history buffer
  const [history, setHistory] = useState<TelemetryPoint[]>([]);

  // Simulation Timeline Log
  const [timeline, setTimeline] = useState<string[]>([
    "[00:00] Simulation initialized for Lettuce (Vegetative stage).",
    "[00:00] System checks: NFT pump active, LED arrays online at 225 PPFD.",
    "[00:00] Lactuca sativa physiology synchronized: current health 98%."
  ]);

  // Active Workspace Tab
  const [activeTab, setActiveTab] = useState<"twin" | "analytics" | "ai">("twin");

  // AI Diagnostic States
  const [diagnosticReport, setDiagnosticReport] = useState<DiagnosticReport | null>(null);
  const [diagnosticsLoading, setDiagnosticsLoading] = useState<boolean>(false);

  // Chat States
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "twin",
      text: "Hello caretaker! I am ruffling my leaves and photosynthesizing happily. Ask me anything about my roots, nutrient appetite, or climate stress!",
      timestamp: "00:00"
    }
  ]);
  const [chatLoading, setChatLoading] = useState<boolean>(false);

  const timelineEndRef = useRef<HTMLDivElement>(null);
  const prevHourRef = useRef<number>(0);
  const lastRoutineLogRef = useRef<string>("");

  // Auto-scroll timeline logs
  useEffect(() => {
    timelineEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [timeline]);

  // Clock Formatting (e.g. "08:14")
  const formattedClock = useMemo(() => {
    const hours = Math.floor(simMinutes / 60) % 24;
    const mins = simMinutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  }, [simMinutes]);



  // Sync growthStage state when metrics.stage changes
  useEffect(() => {
    if (metrics.stage) {
      setGrowthStage(metrics.stage as any);
    }
  }, [metrics.stage]);

  // Map currentTurbidity to refer directly to turbidity state for seamless UI updates
  const currentTurbidity = turbidity;

  // Derived physiological properties for specs
  const leafColor = useMemo(() => {
    if (metrics.health < 40) return "Chlorotic Yellow";
    if (reservoir.pH > 6.6) return "Pale (Iron Lockout)";
    if (reservoir.ec < 0.9) return "Lime Green (Underfed)";
    if (reservoir.ec > 2.2) return "Deep Forest Green (Salt Excess)";
    return "Vibrant Emerald";
  }, [metrics.health, reservoir.pH, reservoir.ec]);

  const stressLevel = useMemo(() => {
    let baseStress = 5;
    if (scenario === "Tipburn Risk") baseStress += 25;
    if (scenario === "Algae Bloom") baseStress += 15;
    if (scenario === "Pump Failure") baseStress += 75;
    
    // Direct pH stress
    if (reservoir.pH < 4.5 || reservoir.pH > 8.0) baseStress += 40;
    else if (reservoir.pH < 5.5 || reservoir.pH > 6.5) baseStress += 15;
    
    // Direct Air Temp stress
    if (environmentalStats.airTemp > 30) baseStress += (environmentalStats.airTemp - 30) * 4;
    else if (environmentalStats.airTemp < 15) baseStress += (15 - environmentalStats.airTemp) * 3;
    
    // Direct Water Temp stress
    if (environmentalStats.waterTemp > 24) baseStress += (environmentalStats.waterTemp - 24) * 5;
    else if (environmentalStats.waterTemp < 15) baseStress += (15 - environmentalStats.waterTemp) * 3;
    
    // Direct TDS/EC stress (underfed vs overfed)
    if (reservoir.ec < 0.8) baseStress += (0.8 - reservoir.ec) * 30;
    else if (reservoir.ec > 2.2) baseStress += (reservoir.ec - 2.2) * 25;
    
    // Direct Light intensity stress (photo-inhibition)
    if (environmentalStats.ledIntensity > 320) baseStress += (environmentalStats.ledIntensity - 320) * 0.15;
    
    // Direct Turbidity stress (roots suffocation / block)
    if (turbidity > 6.0) baseStress += (turbidity - 6.0) * 4;

    return Math.max(0, Math.min(100, Math.round(baseStress)));
  }, [scenario, reservoir.pH, reservoir.ec, environmentalStats.airTemp, environmentalStats.waterTemp, environmentalStats.ledIntensity, turbidity]);

  const rootHealth = useMemo(() => {
    let baseRoot = 99;
    if (environmentalStats.waterTemp > 24) baseRoot -= (environmentalStats.waterTemp - 24) * 8;
    if (environmentalStats.waterTemp < 14) baseRoot -= (14 - environmentalStats.waterTemp) * 4;
    if (scenario === "Pump Failure") baseRoot -= Math.min(90, Math.floor(simMinutes / 15) * 5);
    if (turbidity > 6.0) baseRoot -= (turbidity - 6.0) * 5; // turbidity coats roots!
    return Math.max(5, Math.min(100, Math.round(baseRoot)));
  }, [environmentalStats.waterTemp, scenario, simMinutes, turbidity]);

  // Active deficiencies evaluation
  const activeDeficiencies = useMemo(() => {
    const issues: string[] = [];
    if (nutrients.nitrogen < 80) issues.push("Nitrogen Deficient (slow growth)");
    if (nutrients.nitrogen > 250) issues.push("Nitrogen Toxic (salt stress)");
    if (nutrients.phosphorus < 20) issues.push("Phosphorus Deficient (stunted roots)");
    if (nutrients.potassium < 100) issues.push("Potassium Deficient (chlorotic margins)");
    if (nutrients.calcium < 70) issues.push("Calcium Deficient (Tipburn risk!)");
    if (nutrients.magnesium < 30) issues.push("Magnesium Deficient (interveinal yellowing)");
    if (nutrients.sulfur < 30) issues.push("Sulfur Deficient (young-leaf chlorosis)");
    return issues;
  }, [nutrients]);

  // AI Diagnostic Probe API
  const handleTriggerDiagnostics = async () => {
    setDiagnosticsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/diagnose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          species: cropType,
          growthStage,
          environmentalStats,
          reservoir,
          pumpRunning: environmentalStats.flowRate > 0,
          plantMetrics: metrics,
          nutrients,
        }),
      });
      const data = await res.json();
      setDiagnosticReport(data);
    } catch (error) {
      console.error("Diagnosis fetch error:", error);
    } finally {
      setDiagnosticsLoading(false);
    }
  };

  // Chat API call
  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text,
      timestamp: formattedClock,
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...chatMessages, userMsg].map((m) => ({
            role: m.sender === "user" ? "user" : "model",
            content: m.text,
          })),
          context: {
            growthStage,
            reservoir,
            environmentalStats,
            pumpRunning: environmentalStats.flowRate > 0,
            plantMetrics: metrics,
            nutrients,
          },
        }),
      });
      const data = await res.json();
      setChatMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "twin",
          text: data.reply,
          timestamp: formattedClock,
        },
      ]);
    } catch (error) {
      console.error("Chat fetch error:", error);
    } finally {
      setChatLoading(false);
    }
  };

  // Auto-Diagnostics Trigger on parameter/scenario changes
  useEffect(() => {
    handleTriggerDiagnostics();
  }, [scenario, growthStage, cropType, nutrients]);

  // Handle Nutrient Sliders Change
  const handleNutrientChange = (key: keyof NutrientSolution, val: number) => {
    setNutrients((prev) => {
      const updated = { ...prev, [key]: val };
      
      // Compute total PPM (macronutrients + static micro elements)
      const totalPpm = Math.round(
        updated.nitrogen +
        updated.phosphorus +
        updated.potassium +
        updated.calcium +
        updated.magnesium +
        updated.sulfur +
        (updated.iron || 4.5) +
        (updated.manganese || 0.5) +
        (updated.boron || 0.5) +
        (updated.zinc || 0.05) +
        (updated.copper || 0.02) +
        (updated.molybdenum || 0.01)
      );

      // standard EC proxy calculation (TDS / 640)
      const nextEC = parseFloat((totalPpm / 640).toFixed(2));

      setReservoir((prevRes) => ({
        ...prevRes,
        ec: nextEC,
        tds: totalPpm,
      }));

      return updated;
    });
  };

  // Reset Nutrients Formula
  const handleResetNutrients = () => {
    const baseNutrients: NutrientSolution = {
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
    setNutrients(baseNutrients);
    setReservoir((prevRes) => ({
      ...prevRes,
      ec: 1.4,
      tds: 900,
    }));
    setTimeline((prev) => [
      ...prev,
      `[${formattedClock}] Nutrients reset: Solutes restored to standard lettuce recipe (EC ~1.4 mS/cm).`
    ]);
  };

  // Handle Scenario Change
  const handleScenarioChange = (newScen: string) => {
    setScenario(newScen);
    const clockLabel = formattedClock;

    if (newScen === "Normal Growth") {
      setEnvironmentalStats((prev) => ({
        ...prev,
        waterTemp: 21.0,
        airTemp: 23.0,
        humidity: 60,
        ledIntensity: 225,
        flowRate: 1.5,
        pumpSpeed: 100,
        targetEC: 1.4,
        targetPH: 6.0,
      }));
      setReservoir((prev) => ({ ...prev, pH: 6.0, ec: 1.4, tds: 900 }));
      setTurbidity(4.2);
      setTimeline((prev) => [
        ...prev,
        `[${clockLabel}] Scenario changed: Normal Growth loaded. Hydroponic variables restored to homeostasis.`
      ]);
    } else if (newScen === "Tipburn Risk") {
      setEnvironmentalStats((prev) => ({
        ...prev,
        waterTemp: 22.0,
        airTemp: 31.0,
        humidity: 30,
        ledIntensity: 350,
        flowRate: 1.5,
        pumpSpeed: 100,
        targetEC: 1.8,
      }));
      setTurbidity(4.2);
      setTimeline((prev) => [
        ...prev,
        `[${clockLabel}] WARNING: Scenario set to Tipburn Risk. Cabin heat at 31°C, humidity dropped to 30%.`
      ]);
    } else if (newScen === "Algae Bloom") {
      setEnvironmentalStats((prev) => ({
        ...prev,
        waterTemp: 26.0,
        airTemp: 25.0,
        humidity: 65,
        ledIntensity: 380,
      }));
      setTurbidity(4.2);
      setTimeline((prev) => [
        ...prev,
        `[${clockLabel}] WARNING: Algae Bloom scenario loaded. Solution temperature elevated to 26°C with excess light.`
      ]);
    } else if (newScen === "Pump Failure") {
      setEnvironmentalStats((prev) => ({
        ...prev,
        flowRate: 0.0,
        pumpSpeed: 0,
      }));
      setTurbidity(4.2);
      setTimeline((prev) => [
        ...prev,
        `[${clockLabel}] CRITICAL: Recirculating pump mechanics decoupled. Fluid film flow rate collapsed!`
      ]);
    }
  };

  // Handle Growth Stage Change
  const handleStageChange = (stage: "Germination" | "Seedling" | "Vegetative" | "Mature") => {
    setGrowthStage(stage);
    const clockLabel = formattedClock;

    if (stage === "Germination") {
      setMetrics((prev) => ({
        ...prev,
        age: 0,
        stage: "Germination",
        height: 0.5,
        leafCount: 2,
        leafAreaIndex: 0.02,
        rootLength: 1.2,
        freshBiomass: 0.1,
        health: 100,
        growthRate: 2.1,
      }));
      setTimeline((prev) => [...prev, `[${clockLabel}] Sprout initialized: Lettuce re-seeded at Germination stage.`]);
    } else if (stage === "Seedling") {
      setMetrics((prev) => ({
        ...prev,
        age: 5,
        stage: "Seedling",
        height: 3.2,
        leafCount: 6,
        leafAreaIndex: 0.25,
        rootLength: 4.1,
        freshBiomass: 2.8,
        health: 100,
        growthRate: 1.95,
      }));
      setTimeline((prev) => [...prev, `[${clockLabel}] Stage shifted: Root expansion active. Seedling initialized.`]);
    } else if (stage === "Vegetative") {
      setMetrics((prev) => ({
        ...prev,
        age: 14,
        stage: "Vegetative",
        height: 12.5,
        leafCount: 16,
        leafAreaIndex: 1.25,
        rootLength: 10.5,
        freshBiomass: 18.0,
        health: 98,
        growthRate: 1.80,
      }));
      setTimeline((prev) => [...prev, `[${clockLabel}] Stage shifted: Core canopy photosynthesis engaged. Vegetative initialized.`]);
    } else if (stage === "Mature") {
      setMetrics((prev) => ({
        ...prev,
        age: 28,
        stage: "Mature",
        height: 22.0,
        leafCount: 28,
        leafAreaIndex: 2.85,
        rootLength: 18.0,
        freshBiomass: 145.0,
        health: 98,
        growthRate: 1.25,
      }));
      setTimeline((prev) => [...prev, `[${clockLabel}] Stage shifted: Crown packing dense rosette leaves. Mature stage initialized.`]);
    }
  };

  // Handle Plant Age Change (Direct Day Interpolation)
  const handleAgeChange = (newAge: number) => {
    // Determine growth stage based on age
    let stage: "Germination" | "Seedling" | "Vegetative" | "Mature" = "Germination";
    if (newAge > 28) stage = "Mature";
    else if (newAge > 14) stage = "Vegetative";
    else if (newAge > 5) stage = "Seedling";

    setGrowthStage(stage);

    // Piecewise linear interpolation of biological parameters based on newAge (0 to 35 days)
    let height = 0.5;
    let leafCount = 2;
    let leafAreaIndex = 0.02;
    let rootLength = 1.2;
    let freshBiomass = 0.1;
    let growthRate = 2.1;

    if (newAge <= 5) {
      // Interpolate Germination (0) to Seedling (5)
      const ratio = newAge / 5;
      height = 0.5 + ratio * (3.2 - 0.5);
      leafCount = Math.round(2 + ratio * (6 - 2));
      leafAreaIndex = 0.02 + ratio * (0.25 - 0.02);
      rootLength = 1.2 + ratio * (4.1 - 1.2);
      freshBiomass = 0.1 + ratio * (2.8 - 0.1);
      growthRate = 2.1 + ratio * (1.95 - 2.1);
    } else if (newAge <= 14) {
      // Interpolate Seedling (5) to Vegetative (14)
      const ratio = (newAge - 5) / 9;
      height = 3.2 + ratio * (12.5 - 3.2);
      leafCount = Math.round(6 + ratio * (16 - 6));
      leafAreaIndex = 0.25 + ratio * (1.25 - 0.25);
      rootLength = 4.1 + ratio * (10.5 - 4.1);
      freshBiomass = 2.8 + ratio * (18.0 - 2.8);
      growthRate = 1.95 + ratio * (1.80 - 1.95);
    } else if (newAge <= 28) {
      // Interpolate Vegetative (14) to Mature (28)
      const ratio = (newAge - 14) / 14;
      height = 12.5 + ratio * (22.0 - 12.5);
      leafCount = Math.round(16 + ratio * (28 - 16));
      leafAreaIndex = 1.25 + ratio * (2.85 - 1.25);
      rootLength = 10.5 + ratio * (18.0 - 10.5);
      freshBiomass = 18.0 + ratio * (145.0 - 18.0);
      growthRate = 1.80 + ratio * (1.25 - 1.80);
    } else {
      // Interpolate Mature (28) to Harvest Day (35)
      const ratio = Math.min(1.0, (newAge - 28) / 7);
      height = 22.0 + ratio * (26.0 - 22.0);
      leafCount = Math.round(28 + ratio * (34 - 28));
      leafAreaIndex = 2.85 + ratio * (3.30 - 2.85);
      rootLength = 18.0 + ratio * (21.0 - 18.0);
      freshBiomass = 145.0 + ratio * (195.0 - 145.0);
      growthRate = 1.25 + ratio * (0.95 - 1.25);
    }

    setMetrics((prev) => ({
      ...prev,
      age: parseFloat(newAge.toFixed(2)),
      stage,
      height: parseFloat(height.toFixed(1)),
      leafCount,
      leafAreaIndex: parseFloat(leafAreaIndex.toFixed(2)),
      rootLength: parseFloat(rootLength.toFixed(1)),
      freshBiomass: parseFloat(freshBiomass.toFixed(1)),
      growthRate: parseFloat(growthRate.toFixed(2)),
    }));

    const clockLabel = formattedClock;
    setTimeline((prev) => [
      ...prev,
      `[${clockLabel}] Time Jump: Crop age manually updated to Day ${newAge.toFixed(1)} (${stage} stage). Physiology synchronized.`
    ]);
  };

  // Handle Crop Variety Change
  const handleCropChange = (crop: string) => {
    setCropType(crop);
    const clockLabel = formattedClock;
    setTimeline((prev) => [...prev, `[${clockLabel}] Crop variety switched to: ${crop}.`]);
    
    // Auto-adjust target parameters based on crop botanical recommendations
    let targetEC = 1.4;
    let targetPH = 6.0;
    if (crop === "Basil") {
      targetEC = 1.6;
      targetPH = 6.2;
    } else if (crop === "Spinach") {
      targetEC = 1.8;
      targetPH = 5.8;
    }
    
    setEnvironmentalStats((prev) => ({
      ...prev,
      targetEC,
      targetPH,
    }));
  };

  // Manual dosing (Tuning tool)
  const handleManualDose = () => {
    const clockLabel = formattedClock;
    setReservoir((prev) => {
      const nextEC = parseFloat(Math.min(3.0, prev.ec + 0.15).toFixed(2));
      return {
        ...prev,
        ec: nextEC,
        tds: Math.round(nextEC * 640),
      };
    });
    setNutrientsFed((f) => f + 1.2);
    setTimeline((prev) => [
      ...prev,
      `[${clockLabel}] Manual dosing: Injected 50 mL concentrated macronutrients. EC increased by +0.15 mS/cm.`
    ]);
    setTimeout(() => {
      handleTriggerDiagnostics();
    }, 150);
  };

  // Manual water refill
  const handleManualRefill = () => {
    const clockLabel = formattedClock;
    setReservoir((prev) => ({
      ...prev,
      volume: 95.0,
    }));
    setTimeline((prev) => [
      ...prev,
      `[${clockLabel}] Reservoir top-off: Replenished water level back to 95.0 Liters.`
    ]);
    setTimeout(() => {
      handleTriggerDiagnostics();
    }, 150);
  };

  // Reset Simulation
  const handleReset = () => {
    setSimMinutes(0);
    setWaterUptake(1.0);
    setNutrientsFed(0.0);
    prevHourRef.current = 0;
    lastRoutineLogRef.current = "";
    
    // Reset reservoir stats
    setReservoir({
      volume: 95.0,
      maxVolume: 100.0,
      pH: 6.0,
      ec: 1.4,
      tds: 900,
      nutrientPercentage: 100,
      waterConsumptionToday: 0.05,
      predictedRefillDays: 24,
      predictedNutrientRefillDays: 30,
    });

    // Reset plant metrics to healthy vegetative
    setMetrics({
      age: 14,
      stage: "Vegetative",
      height: 12.5,
      leafCount: 16,
      leafAreaIndex: 1.25,
      rootLength: 10.5,
      freshBiomass: 18.0,
      dryBiomass: 0.9,
      estimatedHarvestWeight: 180.0,
      health: 98,
      growthRate: 1.80,
      photosynthesisRate: 8.5,
      waterConsumption: 0.12,
      nutrientConsumption: 35.0,
    });

    // Reset macronutrient solution recipe
    setNutrients({
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
    });

    setGrowthStage("Vegetative");
    setScenario("Normal Growth");

    setTimeline([
      "[00:00] Simulation clock reset. Re-calibrating physical models...",
      "[00:00] Hydroponic parameters established at baseline configurations (95.0L, balanced nutrients)."
    ]);
  };

  // Interactive Harvest Event
  const handleHarvest = () => {
    const clockLabel = formattedClock;
    const finalWeight = metrics.freshBiomass;
    setTimeline((prev) => [
      ...prev,
      `[${clockLabel}] ✂️ HARVEST EVENT: Harvested delicious Green Coral ${cropType}! Fresh weight yield: ${finalWeight.toFixed(1)}g.`,
      `[${clockLabel}] Re-seeding new crops in NFT channels...`
    ]);
    handleStageChange("Germination");
  };

  // Instantaneous 5-Hour Fast Growth Time Warp Jump
  const handleFiveHourJump = () => {
    const clockLabel = formattedClock;
    
    setSimMinutes((prevMinutes) => {
      let currentMinutes = prevMinutes;
      let tempMetrics = { ...metrics };
      let tempReservoir = { ...reservoir };
      let tempTurbidity = turbidity;
      let tempWaterUptake = waterUptake;
      let tempNutrientsFed = nutrientsFed;
      const newTimelineLogs: string[] = [];
      const newTelemetryPoints: TelemetryPoint[] = [];

      for (let step = 1; step <= 5; step++) {
        currentMinutes += 60;
        const currentHour = Math.floor(currentMinutes / 60);


        // 1. Hourly Biology Update
        let nextHealth = tempMetrics.health;
        let healthDelta = 0.5;

        if (scenario === "Pump Failure") {
          healthDelta -= 3.5;
        }

        // Direct Air Temp stress
        if (environmentalStats.airTemp > 30) {
          healthDelta -= (environmentalStats.airTemp - 30) * 0.25;
        } else if (environmentalStats.airTemp < 15) {
          healthDelta -= (15 - environmentalStats.airTemp) * 0.15;
        }

        // Direct Water Temp stress
        if (environmentalStats.waterTemp > 24) {
          healthDelta -= (environmentalStats.waterTemp - 24) * 0.35;
        } else if (environmentalStats.waterTemp < 15) {
          healthDelta -= (15 - environmentalStats.waterTemp) * 0.15;
        }

        // Direct pH stress
        if (tempReservoir.pH < 4.5 || tempReservoir.pH > 8.0) {
          healthDelta -= 2.0;
        } else if (tempReservoir.pH < 5.5 || tempReservoir.pH > 6.5) {
          healthDelta -= 0.3;
        }

        // Direct EC/TDS stress
        if (tempReservoir.ec < 0.6) {
          healthDelta -= (0.6 - tempReservoir.ec) * 1.5;
        } else if (tempReservoir.ec > 2.4) {
          healthDelta -= (tempReservoir.ec - 2.4) * 1.0;
        }

        // Direct Turbidity stress
        if (tempTurbidity > 7.0) {
          healthDelta -= (tempTurbidity - 7.0) * 0.25;
        }

        // Direct Light stress
        if (environmentalStats.ledIntensity > 320) {
          healthDelta -= (environmentalStats.ledIntensity - 320) * 0.01;
        }

        nextHealth = Math.max(5, Math.min(100, nextHealth + healthDelta));

        // Macronutrient penalties
        let activePenalty = 0;
        if (nutrients.nitrogen < 80) activePenalty += 0.8;
        if (nutrients.calcium < 70) activePenalty += 1.5;
        if (nutrients.potassium < 100) activePenalty += 0.4;
        if (nutrients.magnesium < 30) activePenalty += 0.4;
        
        if (activePenalty > 0) {
          nextHealth = Math.max(5, nextHealth - activePenalty);
        }

        let growthMultiplier = nextHealth / 100;
        const lightFactor = Math.min(1.2, environmentalStats.ledIntensity / 225);
        growthMultiplier *= lightFactor;

        if (environmentalStats.airTemp > 28) {
          growthMultiplier *= Math.max(0.2, 1 - (environmentalStats.airTemp - 28) * 0.05);
        }

        const sizeInc = 0.05 * growthMultiplier;
        const nextAge = tempMetrics.age + 0.04;
        const nextStage: "Germination" | "Seedling" | "Vegetative" | "Mature" = nextAge > 28 ? "Mature" : nextAge > 14 ? "Vegetative" : nextAge > 5 ? "Seedling" : "Germination";

        tempMetrics = {
          ...tempMetrics,
          health: parseFloat(nextHealth.toFixed(1)),
          height: parseFloat((tempMetrics.height + sizeInc * 1.5).toFixed(1)),
          freshBiomass: parseFloat((tempMetrics.freshBiomass + sizeInc * 8.5).toFixed(1)),
          age: parseFloat(nextAge.toFixed(2)),
          stage: nextStage,
        };

        // 2. Hourly Turbidity Update
        if (scenario === "Algae Bloom") {
          tempTurbidity = Math.min(15.0, tempTurbidity + 0.4);
        }

        // 3. Hourly Reservoir Update
        const cropWaterAbsorption = scenario === "Tipburn Risk" ? 0.35 : 0.15;
        let nextVol = Math.max(10.0, tempReservoir.volume - cropWaterAbsorption);
        tempWaterUptake += cropWaterAbsorption;

        let nextPH = tempReservoir.pH + 0.03;
        let nextEC = tempReservoir.ec;

        if (scenario === "Algae Bloom") {
          nextEC = Math.max(0.5, nextEC - 0.02);
        }

        if (autoCorrect) {
          if (nextPH > 6.2) {
            nextPH = 6.0;
            newTimelineLogs.push(`Auto dosing: Injected pH Down. Corrected pH to 6.0.`);
          }
          if (nextEC < environmentalStats.targetEC) {
            nextEC = environmentalStats.targetEC;
            tempNutrientsFed += 0.8;
            newTimelineLogs.push(`Auto dosing: Nutrient pump active. Realigned EC to target ${environmentalStats.targetEC} mS/cm.`);
          }
          if (nextVol < 80.0) {
            nextVol = 95.0;
            newTimelineLogs.push(`Auto-Refill Valve: Reservoir fell below 80L. Automatically topped off water to 95.0 L.`);
          }
        } else {
          nextPH = Math.max(3.8, Math.min(9.5, nextPH));
        }

        tempReservoir = {
          ...tempReservoir,
          volume: parseFloat(nextVol.toFixed(1)),
          pH: parseFloat(nextPH.toFixed(2)),
          ec: parseFloat(nextEC.toFixed(2)),
          tds: Math.round(nextEC * 640),
          nutrientPercentage: tempReservoir.nutrientPercentage,
          waterConsumptionToday: tempReservoir.waterConsumptionToday,
          predictedRefillDays: tempReservoir.predictedRefillDays,
          predictedNutrientRefillDays: tempReservoir.predictedNutrientRefillDays,
        };

        // Generate dynamic Telemetry Point
        newTelemetryPoints.push({
          time: currentHour,
          pH: tempReservoir.pH,
          ec: tempReservoir.ec,
          waterTemp: environmentalStats.waterTemp,
          airTemp: environmentalStats.airTemp,
          humidity: environmentalStats.humidity,
          ledIntensity: environmentalStats.ledIntensity,
          plantHeight: tempMetrics.height,
          leafAreaIndex: tempMetrics.leafAreaIndex,
          freshBiomass: tempMetrics.freshBiomass,
          growthRate: tempMetrics.growthRate,
          waterConsumption: cropWaterAbsorption,
          nutrientConsumption: tempMetrics.nutrientConsumption,
        });
      }

      // Commit local accumulated state to react state
      setMetrics(tempMetrics);
      setReservoir(tempReservoir);
      setTurbidity(tempTurbidity);
      setWaterUptake(tempWaterUptake);
      setNutrientsFed(tempNutrientsFed);
      prevHourRef.current = Math.floor(currentMinutes / 60);

      // Append Telemetry History
      setHistory((prevHist) => {
        const combined = [...prevHist, ...newTelemetryPoints];
        if (combined.length > 15) {
          return combined.slice(combined.length - 15);
        }
        return combined;
      });

      // Append Timelines
      setTimeline((prevLogs) => {
        const uniqueDosingLogs = Array.from(new Set(newTimelineLogs));
        const formattedDosingLogs = uniqueDosingLogs.map(log => `  ↳ ${log}`);
        return [
          ...prevLogs,
          `[${clockLabel}] ⚡ FAST GROWTH WARP: Advanced simulation by exactly 5 Hours (+300 mins). Crop age is now ${tempMetrics.age.toFixed(2)} days.`,
          ...formattedDosingLogs
        ];
      });

      return currentMinutes;
    });
  };

  // Simulation Clock Ticking interval loop
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setSimMinutes((prev) => {
        const nextMin = prev + speed;
        const currentHour = Math.floor(nextMin / 60);

        // Simulated hour trigger
        if (currentHour > prevHourRef.current) {
          prevHourRef.current = currentHour;
          const clockLabel = `${(currentHour % 24).toString().padStart(2, "0")}:00`;

          // Hourly Biology Update
          setMetrics((prevMetrics) => {
            let nextHealth = prevMetrics.health;
            
            // Base delta is slow recovery if healthy, but stressors decrease it
            let healthDelta = 0.5;

            if (scenario === "Pump Failure") {
              healthDelta -= 3.5;
            }

            // Direct Air Temperature stress
            if (environmentalStats.airTemp > 30) {
              healthDelta -= (environmentalStats.airTemp - 30) * 0.25;
            } else if (environmentalStats.airTemp < 15) {
              healthDelta -= (15 - environmentalStats.airTemp) * 0.15;
            }

            // Direct Water Temperature stress
            if (environmentalStats.waterTemp > 24) {
              healthDelta -= (environmentalStats.waterTemp - 24) * 0.35;
            } else if (environmentalStats.waterTemp < 15) {
              healthDelta -= (15 - environmentalStats.waterTemp) * 0.15;
            }

            // Direct pH stress
            if (reservoir.pH < 4.5 || reservoir.pH > 8.0) {
              healthDelta -= 2.0;
            } else if (reservoir.pH < 5.5 || reservoir.pH > 6.5) {
              healthDelta -= 0.3;
            }

            // Direct EC/TDS stress
            if (reservoir.ec < 0.6) {
              healthDelta -= (0.6 - reservoir.ec) * 1.5;
            } else if (reservoir.ec > 2.4) {
              healthDelta -= (reservoir.ec - 2.4) * 1.0;
            }

            // Direct Turbidity stress
            if (turbidity > 7.0) {
              healthDelta -= (turbidity - 7.0) * 0.25;
            }

            // Direct Light intensity stress (photo-inhibition)
            if (environmentalStats.ledIntensity > 320) {
              healthDelta -= (environmentalStats.ledIntensity - 320) * 0.01;
            }

            nextHealth = Math.max(5, Math.min(100, nextHealth + healthDelta));

            // Apply specific macronutrient penalties
            let activePenalty = 0;
            if (nutrients.nitrogen < 80) activePenalty += 0.8;
            if (nutrients.calcium < 70) activePenalty += 1.5; // severe Tipburn triggers
            if (nutrients.potassium < 100) activePenalty += 0.4;
            if (nutrients.magnesium < 30) activePenalty += 0.4;
            
            if (activePenalty > 0) {
              nextHealth = Math.max(5, nextHealth - activePenalty);
            }

            // Height and freshBiomass increments based on health, light, and air temp
            let growthMultiplier = nextHealth / 100;
            
            // Optimal light factor peaking around 220-280 PPFD
            const lightFactor = Math.min(1.2, environmentalStats.ledIntensity / 225);
            growthMultiplier *= lightFactor;

            // Heat penalty
            if (environmentalStats.airTemp > 28) {
              growthMultiplier *= Math.max(0.2, 1 - (environmentalStats.airTemp - 28) * 0.05);
            }

            const sizeInc = 0.05 * growthMultiplier;
            
            return {
              ...prevMetrics,
              health: parseFloat(nextHealth.toFixed(1)),
              height: parseFloat((prevMetrics.height + sizeInc * 1.5).toFixed(1)),
              freshBiomass: parseFloat((prevMetrics.freshBiomass + sizeInc * 8.5).toFixed(1)),
              age: parseFloat((prevMetrics.age + 0.04).toFixed(2)),
              stage: prevMetrics.age > 28 ? "Mature" : prevMetrics.age > 5 ? "Vegetative" : "Seedling",
            };
          });

          // Hourly Turbidity Update (Increments naturally if Algae Bloom and not manually lowered)
          if (scenario === "Algae Bloom") {
            setTurbidity((t) => Math.min(15.0, t + 0.4));
          }

          // Hourly Reservoir Update (Absorption and drifting)
          setReservoir((prevRes) => {
            const cropWaterAbsorption = scenario === "Tipburn Risk" ? 0.35 : 0.15;
            let nextVol = Math.max(10.0, prevRes.volume - cropWaterAbsorption);
            setWaterUptake((u) => u + cropWaterAbsorption);

            // Solution drifts up in pH naturally
            let nextPH = prevRes.pH + 0.03;
            let nextEC = prevRes.ec;

            if (scenario === "Algae Bloom") {
              nextEC = Math.max(0.5, nextEC - 0.02); // rapid depletion
            }

            // Auto dosing loops
            if (autoCorrect) {
              if (nextPH > 6.2) {
                nextPH = 6.0;
                setTimeline((timeline) => [
                  ...timeline,
                  `[${clockLabel}] Auto dosing: Injected pH Down. Corrected pH from ${prevRes.pH.toFixed(2)} to 6.0.`
                ]);
              }
              if (nextEC < environmentalStats.targetEC) {
                nextEC = environmentalStats.targetEC;
                setNutrientsFed((f) => f + 0.8);
                setTimeline((timeline) => [
                  ...timeline,
                  `[${clockLabel}] Auto dosing: Nutrient pump active. Realigned EC to target ${environmentalStats.targetEC} mS/cm.`
                ]);
              }
              if (nextVol < 80.0) {
                nextVol = 95.0;
                setTimeline((timeline) => [
                  ...timeline,
                  `[${clockLabel}] Auto-Refill Valve: Reservoir fell below 80L. Automatically topped off water to 95.0 L.`
                ]);
              }
            } else {
              nextPH = Math.max(3.8, Math.min(9.5, nextPH));
            }

            return {
              ...prevRes,
              volume: parseFloat(nextVol.toFixed(1)),
              pH: parseFloat(nextPH.toFixed(2)),
              ec: parseFloat(nextEC.toFixed(2)),
              tds: Math.round(nextEC * 640),
            };
          });

          // Accumulate History Buffer
          setHistory((prevHist) => {
            const point: TelemetryPoint = {
              time: currentHour,
              pH: reservoir.pH,
              ec: reservoir.ec,
              waterTemp: environmentalStats.waterTemp,
              airTemp: environmentalStats.airTemp,
              humidity: environmentalStats.humidity,
              ledIntensity: environmentalStats.ledIntensity,
              plantHeight: metrics.height,
              leafAreaIndex: metrics.leafAreaIndex,
              freshBiomass: metrics.freshBiomass,
              growthRate: metrics.growthRate,
              waterConsumption: scenario === "Tipburn Risk" ? 0.35 : 0.15,
              nutrientConsumption: metrics.nutrientConsumption,
            };

            const next = [...prevHist, point];
            if (next.length > 15) return next.slice(1);
            return next;
          });

          // Intermittent timeline status logs
          if (currentHour % 3 === 0) {
            let logMsg = "";
            if (scenario === "Normal Growth" && activeDeficiencies.length === 0) {
              logMsg = "Telemetry synched: Environmental variables perfectly within botanical boundaries.";
            } else if (activeDeficiencies.length > 0) {
              logMsg = `PHYSIOLOGICAL DISTRESS: Active deficiency - ${activeDeficiencies.join(", ")}.`;
            }

            if (logMsg && logMsg !== lastRoutineLogRef.current) {
              lastRoutineLogRef.current = logMsg;
              setTimeline((prevLogs) => [
                ...prevLogs,
                `[${clockLabel}] ${logMsg}`
              ]);
            }
          }
        }

        return nextMin;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, speed, scenario, reservoir, metrics, environmentalStats, autoCorrect, nutrients, activeDeficiencies, turbidity]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden' }} className="text-slate-100 font-mono text-sm antialiased selection:bg-[#a3e635] selection:text-slate-950 bg-[#090a0f]">
      
      {/* Dynamic Header */}
      <header className="border-b border-slate-900 bg-[#090a0f] px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded bg-gradient-to-tr from-emerald-600 to-yellow-400 flex items-center justify-center shadow-md">
            <Leaf className="w-4.5 h-4.5 text-slate-950 stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-extrabold text-white tracking-wider uppercase flex items-center gap-2">
              GreenTwin: Hydroponic Lettuce Digital Twin
            </h1>
            <p className="text-[10px] text-slate-500 font-bold leading-normal mt-0.5">
              Unified real-time NFT hydroponic control dashboard with custom LED lighting controls and individual macronutrient recipe sliders.
            </p>
          </div>
        </div>

        {/* Live Simulation Clock */}
        <div className="flex items-center space-x-3 bg-[#12141c] border border-slate-900 px-3 py-1.5 rounded shadow">
          <div className="flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#a3e635] animate-ping" />
            <span className="text-[10.5px] text-slate-400 font-bold">
              Sim Day: <span className="text-white font-black">Day {Math.floor(simMinutes / 1440) + 1}</span>
            </span>
          </div>
          <div className="w-px h-3.5 bg-slate-800" />
          <span className="text-[10.5px] text-slate-400 font-bold">
            Clock: <span className="text-white font-black">{formattedClock}</span>
          </span>
        </div>
      </header>

      {/* Main Grid: Fully Integrated Layout with Workspace Tabs */}
      <main style={{ flex: 1, minHeight: 0 }} className="w-full mx-auto p-2.5 lg:p-3.5 grid grid-cols-1 xl:grid-cols-12 gap-3 min-h-0 overflow-hidden">
        
        {/* COLUMN 1: INTERACTIVE SIMULATOR SIDEBAR */}
        <section className="xl:col-span-3 bg-[#111217]/50 border border-slate-900 rounded-lg p-2.5 flex flex-col justify-between min-h-0 overflow-y-auto animate-fade-in" id="controls-panel-container">
          <ControlsPanel
            scenario={scenario}
            onScenarioChange={handleScenarioChange}
            growthStage={growthStage}
            onStageChange={handleStageChange}
            cropType={cropType}
            onCropChange={handleCropChange}
            isRunning={isRunning}
            onToggleRunning={() => setIsRunning(!isRunning)}
            onReset={handleReset}
            speed={speed}
            onSpeedChange={setSpeed}
            realTime={realTime}
            onRealTimeToggle={() => setRealTime(!realTime)}
            autoCorrect={autoCorrect}
            onAutoCorrectToggle={() => setAutoCorrect(!autoCorrect)}
            metrics={metrics}
            harvestDays={Math.max(1.0, 28 - metrics.age)}
            waterUptake={waterUptake}
            nutrientsFed={nutrientsFed}
            environmentalStats={environmentalStats}
            onStatsChange={setEnvironmentalStats}
            onManualDose={handleManualDose}
            onManualRefill={handleManualRefill}
            nutrients={nutrients}
            onNutrientChange={handleNutrientChange}
            onResetNutrients={handleResetNutrients}
            onAgeChange={handleAgeChange}
            simMinutes={simMinutes}
            reservoir={reservoir}
            onReservoirChange={setReservoir}
            turbidity={turbidity}
            onTurbidityChange={setTurbidity}
            onFiveHourJump={handleFiveHourJump}
          />
        </section>

        {/* COLUMN 2 & 3 Combined: HIGH-DENSITY WORKSPACE WITH TAB TOGGLES */}
        <section className="xl:col-span-9 flex flex-col space-y-3 min-h-0 h-full" id="workspace-container">
          
          {/* Workspace Tabs Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-900 pb-3 shrink-0" id="workspace-tabs-bar">
            <div className="flex items-center space-x-2 bg-slate-950/80 p-1.5 rounded-xl border border-slate-900 shadow-lg flex-wrap">
              <button
                onClick={() => setActiveTab("twin")}
                className={`px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === "twin"
                    ? "bg-[#a3e635] text-slate-950 shadow-md font-black"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                id="btn-tab-twin"
              >
                <Leaf className="w-4 h-4" />
                <span>Digital Twin</span>
              </button>
              <button
                onClick={() => setActiveTab("analytics")}
                className={`px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === "analytics"
                    ? "bg-[#a3e635] text-slate-950 shadow-md font-black"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                id="btn-tab-analytics"
              >
                <Activity className="w-4 h-4" />
                <span>Analytics & Plots</span>
              </button>
              <button
                onClick={() => setActiveTab("ai")}
                className={`px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === "ai"
                    ? "bg-[#a3e635] text-slate-950 shadow-md font-black"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                id="btn-tab-ai"
              >
                <BrainCircuit className="w-4 h-4" />
                <span>AI Diagnostics & Chat</span>
              </button>
            </div>

            {/* High density specs readout right aligned */}
            <div className="flex items-center space-x-3.5 text-[9px] font-bold text-slate-400 uppercase">
              <div className="flex items-center gap-1">
                <span className="text-slate-500">HEALTH:</span>
                <span className={metrics.health > 85 ? "text-emerald-400" : "text-amber-400"}>
                  {metrics.health}%
                </span>
              </div>
              <div className="w-px h-3 bg-slate-900" />
              <div className="flex items-center gap-1">
                <span className="text-slate-500">GROWTH:</span>
                <span className="text-yellow-500">{Math.min(100, Math.round((metrics.age / 28) * 100))}%</span>
              </div>
              <div className="w-px h-3 bg-slate-900" />
              <div className="flex items-center gap-1">
                <span className="text-slate-500">RESERVOIR:</span>
                <span className="text-cyan-400">{reservoir.volume.toFixed(1)}L</span>
              </div>
            </div>
          </div>

          {/* TAB CONTENT: 1. DIGITAL TWIN */}
          {activeTab === "twin" && (
            <div style={{ height: 'calc(100% - 50px)' }} className="grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0 flex-1 overflow-hidden animate-fade-in" id="tab-twin-content">
              
              {/* Twin Left column: Bio specs & Solutes Status */}
              <div className="lg:col-span-7 flex flex-col space-y-2.5 min-h-0 h-full overflow-y-auto pr-1">
                
                {/* Twin Biological Specs Card */}
                <div className="flex flex-col border border-slate-900 rounded-lg overflow-hidden bg-[#12141c]/40 shadow-sm shrink-0" id="twin-biological-specs">
                  {/* Visualizer Frame */}
                  <div className="w-full h-[175px] border-b border-slate-900 p-3 flex flex-col justify-between bg-slate-950/40 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-yellow-500 font-bold uppercase tracking-wide">
                        Digital Twin Model
                      </span>
                      <span className="flex items-center gap-1 text-[8.5px] text-emerald-400 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                        Live
                      </span>
                    </div>
                    <div className="flex-1 w-full flex items-center justify-center">
                      <PlantVisualizer
                        stats={environmentalStats}
                        metrics={metrics}
                        reservoirLevel={(reservoir.volume / reservoir.maxVolume) * 100}
                        pumpRunning={environmentalStats.flowRate > 0}
                        onHarvest={handleHarvest}
                      />
                    </div>
                                  {/* Specs Readout */}
                  <div className="w-full p-3 flex flex-col justify-between bg-[#12141c]/20">
                    <div className="flex items-start justify-between border-b border-slate-900 pb-2">
                      <div className="flex flex-col">
                        <span className="text-[10.5px] text-yellow-500 font-bold uppercase tracking-wider">
                          Bio-Physical Specs
                        </span>
                        <span className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">
                          {cropType} ({growthStage} stage)
                        </span>
                      </div>
                      <div className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        metrics.health > 85
                          ? "text-emerald-400 bg-emerald-950/40 border-emerald-900/30"
                          : "text-amber-400 bg-amber-950/40 border-amber-900/30"
                      }`}>
                        Health Index: {metrics.health}%
                      </div>
                    </div>
 
                    {/* Specs Grid */}
                    <div className="grid grid-cols-3 gap-y-2 gap-x-3.5 text-[10px] text-slate-400 mt-2">
                      <div>
                        <span className="text-slate-500 block text-[8px] uppercase">Growth Progress</span>
                        <span className="text-slate-200 font-bold block mt-0.5">
                          {Math.min(100, Math.round((metrics.age / 28) * 100))}%
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[8px] uppercase">Fresh Biomass</span>
                        <span className="text-slate-200 font-bold block mt-0.5">{metrics.freshBiomass.toFixed(1)}g</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[8px] uppercase">Leaf Morphology</span>
                        <span className="text-slate-200 font-bold block mt-0.5">{leafColor}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[8px] uppercase">Lettuce Height</span>
                        <span className="text-slate-200 font-bold block mt-0.5">{metrics.height.toFixed(1)} cm</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[8px] uppercase">Root Health</span>
                        <span className="text-slate-200 font-bold block mt-0.5">{rootHealth}%</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[8px] uppercase">Cellular Stress</span>
                        <span className="text-slate-200 font-bold block mt-0.5">{stressLevel}%</span>
                      </div>
                    </div>
                  </div>    </div>
                </div>

                {/* Crop Growth Days & Lifecycle Timeline Card */}
                <div className="bg-[#12141c]/40 border border-slate-900 rounded-lg p-2.5 flex flex-col space-y-2 shadow-sm shrink-0" id="twin-days-timeline-card">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-[12px]">📅</span>
                      <span className="text-[9.5px] text-yellow-500 font-bold uppercase tracking-wider">
                        Crop Growth Days & Lifecycle Timeline
                      </span>
                    </div>
                    <span className="text-[8px] text-[#a3e635] bg-[#a3e635]/10 border border-[#a3e635]/20 px-1.5 py-0.5 rounded font-bold font-mono">
                      Current: Day {metrics.age.toFixed(1)}
                    </span>
                  </div>

                  {/* Horizontal Timeline */}
                  <div className="relative py-2">
                    {/* Background Progress Bar Track */}
                    <div className="absolute top-[10px] left-6 right-6 h-1 bg-slate-950 rounded-full overflow-hidden">
                      {/* Active Progress Fill */}
                      <div 
                        className="h-full bg-[#a3e635] rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (metrics.age / 35) * 100)}%` }}
                      />
                    </div>

                    {/* Timeline Nodes */}
                    <div className="relative flex justify-between px-6 z-10">
                      {/* Day 0 */}
                      <button 
                        onClick={() => handleAgeChange(0)}
                        className="flex flex-col items-center group focus:outline-none cursor-pointer"
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[8px] font-bold z-10 transition-all ${
                          metrics.age >= 0 && metrics.age < 5 
                            ? "bg-[#a3e635] text-slate-950 border-[#a3e635] scale-110 shadow-[0_0_8px_rgba(163,230,53,0.4)]"
                            : metrics.age >= 5 ? "bg-slate-900 text-emerald-400 border-emerald-500" : "bg-slate-900 text-slate-500 border-slate-800"
                        }`}>
                          0
                        </div>
                        <span className={`text-[8px] font-bold mt-1.5 transition-colors ${metrics.age >= 0 && metrics.age < 5 ? "text-[#a3e635]" : "text-slate-500"}`}>
                          Sprout
                        </span>
                      </button>

                      {/* Day 5 */}
                      <button 
                        onClick={() => handleAgeChange(5)}
                        className="flex flex-col items-center group focus:outline-none cursor-pointer"
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[8px] font-bold z-10 transition-all ${
                          metrics.age >= 5 && metrics.age < 14 
                            ? "bg-[#a3e635] text-slate-950 border-[#a3e635] scale-110 shadow-[0_0_8px_rgba(163,230,53,0.4)]"
                            : metrics.age >= 14 ? "bg-slate-900 text-emerald-400 border-emerald-500" : "bg-slate-900 text-slate-500 border-slate-800"
                        }`}>
                          5
                        </div>
                        <span className={`text-[8px] font-bold mt-1.5 transition-colors ${metrics.age >= 5 && metrics.age < 14 ? "text-[#a3e635]" : "text-slate-500"}`}>
                          Seedling
                        </span>
                      </button>

                      {/* Day 14 */}
                      <button 
                        onClick={() => handleAgeChange(14)}
                        className="flex flex-col items-center group focus:outline-none cursor-pointer"
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[8px] font-bold z-10 transition-all ${
                          metrics.age >= 14 && metrics.age < 28 
                            ? "bg-[#a3e635] text-slate-950 border-[#a3e635] scale-110 shadow-[0_0_8px_rgba(163,230,53,0.4)]"
                            : metrics.age >= 28 ? "bg-slate-900 text-emerald-400 border-emerald-500" : "bg-slate-900 text-slate-500 border-slate-800"
                        }`}>
                          14
                        </div>
                        <span className={`text-[8px] font-bold mt-1.5 transition-colors ${metrics.age >= 14 && metrics.age < 28 ? "text-[#a3e635]" : "text-slate-500"}`}>
                          Vegetative
                        </span>
                      </button>

                      {/* Day 28 */}
                      <button 
                        onClick={() => handleAgeChange(28)}
                        className="flex flex-col items-center group focus:outline-none cursor-pointer"
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[8px] font-bold z-10 transition-all ${
                          metrics.age >= 28 && metrics.age < 35 
                            ? "bg-[#a3e635] text-slate-950 border-[#a3e635] scale-110 shadow-[0_0_8px_rgba(163,230,53,0.4)]"
                            : metrics.age >= 35 ? "bg-slate-900 text-emerald-400 border-emerald-500" : "bg-slate-900 text-slate-500 border-slate-800"
                        }`}>
                          28
                        </div>
                        <span className={`text-[8px] font-bold mt-1.5 transition-colors ${metrics.age >= 28 && metrics.age < 35 ? "text-[#a3e635]" : "text-slate-500"}`}>
                          Mature
                        </span>
                      </button>

                      {/* Day 35 */}
                      <button 
                        onClick={() => handleAgeChange(35)}
                        className="flex flex-col items-center group focus:outline-none cursor-pointer"
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[8px] font-bold z-10 transition-all ${
                          metrics.age >= 35 
                            ? "bg-[#a3e635] text-slate-950 border-[#a3e635] scale-110 shadow-[0_0_8px_rgba(163,230,53,0.4)]"
                            : "bg-slate-900 text-slate-500 border-slate-800"
                        }`}>
                          35
                        </div>
                        <span className={`text-[8px] font-bold mt-1.5 transition-colors ${metrics.age >= 35 ? "text-[#a3e635]" : "text-slate-500"}`}>
                          Harvest
                        </span>
                      </button>
                    </div>
                  </div>
                               {/* Active stage target tips */}
                  <div className="bg-slate-950/40 border border-slate-900 p-2 rounded text-[8.5px] text-slate-400 font-mono mt-1 leading-normal">
                    <span className="text-[#a3e635] font-bold uppercase tracking-wider">
                      {metrics.age < 5 ? "Germination Guidance" : metrics.age < 14 ? "Seedling Guidance" : metrics.age < 28 ? "Vegetative Guidance" : "Mature Guidance"}:
                    </span>{" "}
                    {metrics.age < 5 
                      ? "Keep LED intensity low (~120-150 PPFD) and EC moderate (~1.0-1.2 mS/cm) to support fragile cotyledons and root establishment." 
                      : metrics.age < 14 
                      ? "Gradually increase LED output to ~180-220 PPFD. Target EC at 1.2-1.4 mS/cm. Keep circulation flow continuous." 
                      : metrics.age < 28 
                      ? "Maximum photosynthesis! Elevate LED intensity to ~220-280 PPFD. Feed full-strength nutrient recipe at 1.4-1.6 mS/cm." 
                      : "Canopy fully packed. Monitor for tipburn risk by securing humidity above 50% and ensuring constant fan/exhaust ventilation."}
                  </div>
                </div>
 
                {/* Real-time Macronutrients Solutes Dashboard */}
                <div className="bg-[#12141c]/60 border border-slate-900 rounded-lg p-2.5 flex flex-col space-y-2 shadow-sm flex-1">
                  <span className="text-[9.5px] text-yellow-500 font-bold uppercase tracking-wider flex items-center justify-between">
                    <span>Solutes Recipe Status (PPM)</span>
                    <span className="text-[8.5px] text-slate-400">Total TDS: {reservoir.tds} ppm</span>
                  </span>
 
                  {/* Active deficiencies warning banner */}
                  {activeDeficiencies.length > 0 && (
                    <div className="bg-amber-950/40 border border-amber-900/30 text-amber-400 px-2.5 py-1 rounded text-[8.5px] font-bold flex items-center gap-1.5 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 block shrink-0" />
                      <span>Deficiency alert: {activeDeficiencies.join(", ")}</span>
                    </div>
                  )}
 
                  {/* Micro progress columns */}
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[10px] py-1">
                    {/* Nitrogen */}
                    <div className="flex flex-col space-y-1">
                      <div className="flex justify-between font-bold text-slate-400">
                        <span>Nitrogen (N)</span>
                        <span className="text-slate-200">{nutrients.nitrogen} ppm</span>
                      </div>
                      <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${nutrients.nitrogen < 80 ? 'bg-amber-500 animate-pulse' : 'bg-blue-500'}`} 
                          style={{ width: `${Math.min(100, (nutrients.nitrogen / 300) * 100)}%` }} 
                        />
                      </div>
                      <div className="flex justify-between text-[8px] text-slate-650 uppercase font-extrabold">
                        <span>Min: 80</span>
                        <span>Target: 150</span>
                        <span>Max: 250</span>
                      </div>
                    </div>

                    {/* Phosphorus */}
                    <div className="flex flex-col space-y-1">
                      <div className="flex justify-between font-bold text-slate-400">
                        <span>Phosphorus (P)</span>
                        <span className="text-slate-200">{nutrients.phosphorus} ppm</span>
                      </div>
                      <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${nutrients.phosphorus < 20 ? 'bg-amber-500 animate-pulse' : 'bg-purple-500'}`} 
                          style={{ width: `${Math.min(100, (nutrients.phosphorus / 150) * 100)}%` }} 
                        />
                      </div>
                      <div className="flex justify-between text-[8px] text-slate-650 uppercase font-extrabold">
                        <span>Min: 20</span>
                        <span>Target: 50</span>
                        <span>Max: 100</span>
                      </div>
                    </div>

                    {/* Potassium */}
                    <div className="flex flex-col space-y-1">
                      <div className="flex justify-between font-bold text-slate-400">
                        <span>Potassium (K)</span>
                        <span className="text-slate-200">{nutrients.potassium} ppm</span>
                      </div>
                      <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${nutrients.potassium < 100 ? 'bg-amber-500 animate-pulse' : 'bg-yellow-500'}`} 
                          style={{ width: `${Math.min(100, (nutrients.potassium / 400) * 100)}%` }} 
                        />
                      </div>
                      <div className="flex justify-between text-[8px] text-slate-650 uppercase font-extrabold">
                        <span>Min: 100</span>
                        <span>Target: 200</span>
                        <span>Max: 350</span>
                      </div>
                    </div>

                    {/* Calcium */}
                    <div className="flex flex-col space-y-1">
                      <div className="flex justify-between font-bold text-slate-400">
                        <span>Calcium (Ca)</span>
                        <span className="text-slate-200">{nutrients.calcium} ppm</span>
                      </div>
                      <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${nutrients.calcium < 70 ? 'bg-red-500 animate-pulse' : 'bg-red-400'}`} 
                          style={{ width: `${Math.min(100, (nutrients.calcium / 300) * 100)}%` }} 
                        />
                      </div>
                      <div className="flex justify-between text-[8px] text-slate-650 uppercase font-extrabold">
                        <span>Min: 70</span>
                        <span>Target: 150</span>
                        <span>Max: 250</span>
                      </div>
                    </div>

                    {/* Magnesium */}
                    <div className="flex flex-col space-y-1">
                      <div className="flex justify-between font-bold text-slate-400">
                        <span>Magnesium (Mg)</span>
                        <span className="text-slate-200">{nutrients.magnesium} ppm</span>
                      </div>
                      <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${nutrients.magnesium < 10 ? 'bg-amber-500 animate-pulse' : 'bg-pink-500'}`} 
                          style={{ width: `${Math.min(100, (nutrients.magnesium / 150) * 100)}%` }} 
                        />
                      </div>
                      <div className="flex justify-between text-[8px] text-slate-650 uppercase font-extrabold">
                        <span>Min: 10</span>
                        <span>Target: 60</span>
                        <span>Max: 100</span>
                      </div>
                    </div>

                    {/* Sulfur */}
                    <div className="flex flex-col space-y-1">
                      <div className="flex justify-between font-bold text-slate-400">
                        <span>Sulfur (S)</span>
                        <span className="text-slate-200">{nutrients.sulfur} ppm</span>
                      </div>
                      <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${nutrients.sulfur < 20 ? 'bg-amber-500 animate-pulse' : 'bg-teal-500'}`} 
                          style={{ width: `${Math.min(100, (nutrients.sulfur / 150) * 100)}%` }} 
                        />
                      </div>
                      <div className="flex justify-between text-[8px] text-slate-650 uppercase font-extrabold">
                        <span>Min: 20</span>
                        <span>Target: 80</span>
                        <span>Max: 150</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Twin Right column: Live Probes & Simulation Timeline */}
              <div className="lg:col-span-5 flex flex-col space-y-2.5 min-h-0 h-full overflow-y-auto pr-1">
                
                {/* Probes Display */}
                <div className="bg-[#12141c]/60 border border-slate-900 rounded-lg p-2.5 flex flex-col space-y-2 shrink-0" id="live-sensors-card">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                    <span className="text-[10.5px] text-yellow-500 font-bold uppercase tracking-wider">
                      Live Probes
                    </span>
                    <span className="flex items-center gap-1 text-[8.5px] font-bold text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 px-1.5 py-0.5 rounded shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                      PUMP SPEED: {environmentalStats.pumpSpeed}%
                    </span>
                  </div>
 
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 font-mono">
                    {/* pH Probe */}
                    <div className="bg-[#14151b] p-2 rounded border border-slate-900 flex flex-col justify-between min-h-[50px]">
                      <div className="flex justify-between items-start">
                        <span className="text-slate-500 text-[8.5px] uppercase font-bold">pH</span>
                        <span className="text-[8.5px] text-slate-650 font-bold">pH</span>
                      </div>
                      <span className="text-xs font-black text-white mt-1">{reservoir.pH.toFixed(2)}</span>
                      <div className="w-full bg-slate-950 h-1 rounded overflow-hidden mt-1">
                        <div className="bg-blue-500 h-full" style={{ width: `${Math.min(100, (reservoir.pH / 14) * 100)}%` }} />
                      </div>
                    </div>
 
                    {/* EC Probe */}
                    <div className="bg-[#14151b] p-2 rounded border border-slate-900 flex flex-col justify-between min-h-[50px]">
                      <div className="flex justify-between items-start">
                        <span className="text-slate-500 text-[8.5px] uppercase font-bold">Solute EC</span>
                        <span className="text-[8.5px] text-slate-650 font-bold">mS/cm</span>
                      </div>
                      <span className="text-xs font-black text-white mt-1">{reservoir.ec.toFixed(2)}</span>
                      <div className="w-full bg-slate-950 h-1 rounded overflow-hidden mt-1">
                        <div className="bg-cyan-400 h-full" style={{ width: `${Math.min(100, (reservoir.ec / 3.0) * 100)}%` }} />
                      </div>
                    </div>
 
                    {/* Turbidity */}
                    <div className="bg-[#14151b] p-2 rounded border border-slate-900 flex flex-col justify-between min-h-[50px]">
                      <div className="flex justify-between items-start">
                        <span className="text-slate-500 text-[8.5px] uppercase font-bold">Turbidity</span>
                        <span className="text-[8.5px] text-slate-650 font-bold">NTU</span>
                      </div>
                      <span className="text-xs font-black text-white mt-1">{currentTurbidity.toFixed(1)}</span>
                      <div className="w-full bg-slate-950 h-1 rounded overflow-hidden mt-1">
                        <div className="bg-orange-500 h-full" style={{ width: `${Math.min(100, (currentTurbidity / 12) * 100)}%` }} />
                      </div>
                    </div>
 
                    {/* PAR Light intensity */}
                    <div className="bg-[#14151b] p-2 rounded border border-slate-900 flex flex-col justify-between min-h-[50px]">
                      <div className="flex justify-between items-start">
                        <span className="text-slate-500 text-[8.5px] uppercase font-bold">Light PPFD</span>
                        <span className="text-[8.5px] text-slate-650 font-bold">µmol</span>
                      </div>
                      <span className="text-xs font-black text-white mt-1">{environmentalStats.ledIntensity}</span>
                      <div className="w-full bg-slate-950 h-1 rounded overflow-hidden mt-1">
                        <div className="bg-yellow-400 h-full" style={{ width: `${Math.min(100, (environmentalStats.ledIntensity / 400) * 100)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
 
                {/* Timeline Console */}
                <div className="flex-1 bg-[#12141c]/60 border border-slate-900 rounded-lg p-2.5 flex flex-col space-y-1.5 min-h-[120px] shadow-sm overflow-hidden" id="simulation-timeline-card">
                  <span className="text-[11px] text-yellow-500 font-bold uppercase tracking-wider">
                    Simulation Timeline Log
                  </span>
                  <div className="flex-1 bg-slate-950/80 border border-slate-950 p-2.5 rounded overflow-y-auto text-[10.5px] text-slate-400 font-mono space-y-2" id="timeline-logs-viewport">
                    {timeline.map((log, idx) => (
                      <div key={`log-row-${idx}`} className="leading-relaxed border-l-2 border-slate-800 pl-2 hover:border-[#a3e635] transition-all duration-300">
                        <span className="text-slate-500 font-bold">{log.slice(0, 7)}</span>
                        <span className="text-slate-350">{log.slice(7)}</span>
                      </div>
                    ))}
                    <div ref={timelineEndRef} />
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB CONTENT: 2. ANALYTICS & PLOTS */}
          {activeTab === "analytics" && (
            <div className="flex-1 min-h-0 overflow-y-auto animate-fade-in" id="tab-analytics-content">
              <TelemetryPanel
                history={history}
                currentPH={reservoir.pH}
                currentTDS={reservoir.tds}
                currentTurbidity={currentTurbidity}
                currentWaterTemp={environmentalStats.waterTemp}
                currentHealth={metrics.health}
              />
            </div>
          )}

          {/* TAB CONTENT: 3. AI DIAGNOSTICS & CHAT */}
          {activeTab === "ai" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0 flex-1 overflow-hidden animate-fade-in" id="tab-ai-content">
              
              {/* AI Diagnostics Panel */}
              <div className="lg:col-span-5 flex flex-col min-h-0 h-full" id="ai-diagnostics-card">
                <DiagnosticsPanel
                  report={diagnosticReport}
                  onTriggerDiagnostics={handleTriggerDiagnostics}
                  loading={diagnosticsLoading}
                />
              </div>

              {/* Caretaker Terminal Chat */}
              <div className="lg:col-span-7 flex flex-col min-h-0 h-full" id="ai-chat-card">
                <ChatPanel
                  messages={chatMessages}
                  onSendMessage={handleSendMessage}
                  loading={chatLoading}
                />
              </div>

            </div>
          )}

        </section>
      </main>

    </div>
  );
}
