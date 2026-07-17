import { useMemo } from "react";
import type { LettuceEnvironmentalStats, LettuceMetrics } from "../types";

interface PlantVisualizerProps {
  stats: LettuceEnvironmentalStats;
  metrics: LettuceMetrics;
  reservoirLevel?: number; // unused in svg but required in page integration
  pumpRunning: boolean;
  onHarvest?: () => void;
  animationSpeed?: number;
}

export default function PlantVisualizer({
  stats,
  metrics,
  pumpRunning,
  onHarvest,
  animationSpeed = 1,
}: PlantVisualizerProps) {
  const { ledIntensity, flowRate, waterTemp, airTemp } = stats;
  const { stage, health, leafCount, rootLength } = metrics;

  // 1. Dynamic Leaf Colors based on health
  const leafColor = useMemo(() => {
    if (health <= 5) return "#3e2723"; // Dead, rotten dark brown
    if (health <= 15) return "#5c4033"; // Severely rotten brown
    if (health <= 30) return "#785f43"; // Decaying brown/yellowish
    if (health < 40) return "#a3e635"; // Sick yellowish-green
    if (stats.targetEC < 0.9) return "#bef264"; // Pale chlorotic
    if (stats.targetPH > 6.6) return "#eab308"; // High pH iron lockout
    if (stats.targetEC > 2.2) return "#15803d"; // Excess nitrogen dark
    return "#10b981"; // Healthy emerald
  }, [health, stats.targetEC, stats.targetPH]);

  // Leaf tip burn effect
  const tipBurnOpacity = useMemo(() => {
    if (health <= 10) return 0.95;
    if (health <= 30) return 0.6;
    if (stats.targetEC > 2.0) return 0.85;
    if (stats.targetEC > 1.8) return 0.4;
    return 0;
  }, [stats.targetEC, health]);

  // Wilt angle based on air temperature & water stress
  const wiltAngle = useMemo(() => {
    let angle = 0;
    if (health <= 5) angle += 40; // collapsed droop angle
    else if (health <= 15) angle += 30;
    else if (health <= 30) angle += 20;

    if (airTemp > 29) angle += (airTemp - 29) * 1.8;
    if (!pumpRunning) angle += 15;
    return Math.min(angle, 55);
  }, [airTemp, pumpRunning, health]);

  // Root color based on temperature and overall health
  const rootColor = useMemo(() => {
    if (health <= 5) return "#3e1c07"; // completely decayed blackish-brown
    if (health <= 15) return "#5c2e0b"; // severely rotten brown
    if (waterTemp > 24.5) return "#78350f"; // rotten brown
    if (waterTemp > 23.0) return "#b45309"; // muddy amber
    return "#fef08a"; // healthy white-yellow
  }, [waterTemp, health]);

  // Compute Lettuce rosette leaves
  const leaves = useMemo(() => {
    const list: Array<{
      id: number;
      angle: number;
      scaleX: number;
      scaleY: number;
    }> = [];

    const maxRenderLeaves = Math.min(leafCount, 24);
    for (let i = 0; i < maxRenderLeaves; i++) {
      const angle = (i * 137.5) % 360;
      const ageFactor = i / maxRenderLeaves; 
      let sizeX = 0.4 + ageFactor * 0.7;
      let sizeY = 0.5 + ageFactor * 0.8;

      // Shrivel effect if health is low
      if (health <= 5) {
        sizeX *= 0.55;
        sizeY *= 0.50; // Droop/collapse
      } else if (health <= 15) {
        sizeX *= 0.70;
        sizeY *= 0.65;
      } else if (health <= 30) {
        sizeX *= 0.85;
        sizeY *= 0.80;
      }

      list.push({
        id: i,
        angle,
        scaleX: sizeX,
        scaleY: sizeY,
      });
    }
    return list;
  }, [leafCount, health]);

  const stretchYMultiplier = useMemo(() => {
    if (health <= 5) return 0.45; // severely collapsed/drooped
    if (health <= 15) return 0.6;
    if (health <= 30) return 0.8;
    return ledIntensity < 120 ? 1.4 : 1.0;
  }, [health, ledIntensity]);

  const lettuceScale = useMemo(() => {
    if (stage === "Germination") return 0.22;
    if (stage === "Seedling") return 0.45;
    if (stage === "Vegetative") return 0.75;
    if (stage === "Mature" || stage === "Ready for Harvest") return 1.05;
    return 1.15;
  }, [stage]);

  // Root paths inside NFT channel
  const rootPaths = useMemo(() => {
    const paths: string[] = [];
    const maxDepth = Math.min(rootLength * 1.5, 95); // clamp visual depth to 95px
    
    paths.push(`M 200 240 Q 200 ${240 + maxDepth * 0.5} ${200 + Math.sin(rootLength) * 5} ${240 + maxDepth}`);
    
    if (rootLength > 3) {
      paths.push(`M 200 248 Q 185 260 170 270`);
      paths.push(`M 200 248 Q 215 260 230 270`);
    }
    if (rootLength > 8) {
      paths.push(`M 195 265 Q 175 285 160 295`);
      paths.push(`M 205 265 Q 225 285 240 295`);
    }
    if (rootLength > 15) {
      paths.push(`M 200 285 Q 185 305 175 320`);
      paths.push(`M 200 285 Q 215 305 225 320`);
    }
    return paths;
  }, [rootLength]);

  const isReady = stage === "Ready for Harvest";

  return (
    <div className="relative w-full h-full overflow-hidden flex items-center justify-center select-none" id="lettuce-nft-viewport">
      {/* Visual background lines */}
      <div className="absolute inset-0 bg-[radial-gradient(#10b9810b_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none opacity-40" />

      {/* Main SVG Render Stage */}
      <svg
        viewBox="0 0 400 400"
        className="w-full h-full max-h-[220px] z-0"
        id="lettuce-svg-stage"
      >
        <defs>
          {/* LED Glow beam gradient */}
          <linearGradient id="ledBeam" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={0.2} />
            <stop offset="60%" stopColor="#a3e635" stopOpacity={0.03} />
            <stop offset="100%" stopColor="#a3e635" stopOpacity={0} />
          </linearGradient>

          {/* Hydroponic Flow stream gradient */}
          <linearGradient id="streamGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* 1. OVERHEAD WHITE GROW LED FIXTURE */}
        <g id="overhead-grow-lights">
          <rect x="50" y="15" width="300" height="12" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
          <rect
            x="60"
            y="21"
            width="280"
            height="4"
            rx="1"
            fill="#ffffff"
            className="animate-pulse"
            style={{ filter: "drop-shadow(0 0 4px rgba(255,255,255,0.8))" }}
          />
          {ledIntensity > 0 && (
            <polygon
              points="60,27 340,27 380,240 20,240"
              fill="url(#ledBeam)"
              opacity={Math.min(ledIntensity / 250, 0.7)}
              className="transition-all duration-500 pointer-events-none"
            />
          )}
        </g>

        {/* 2. THE WHITE NFT GROW CHANNEL (CUT SECTION) */}
        <g id="nft-channel-structure">
          {/* Gutter back wall */}
          <rect x="15" y="240" width="370" height="90" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
          
          {/* Flowing thin film of nutrient solution */}
          {pumpRunning && flowRate > 0 ? (
            <g id="nutrient-film">
              <path
                d="M 15 315 Q 100 314 200 315 T 385 315 L 385 328 L 15 328 Z"
                fill="url(#streamGradient)"
                className="transition-all duration-300"
              />
              <line
                x1="25"
                y1="321"
                x2="375"
                y2="321"
                stroke="#e0f2fe"
                strokeWidth="1.5"
                strokeDasharray="12 40"
                strokeLinecap="round"
                className="water-flow-item"
                opacity="0.6"
              />
            </g>
          ) : (
            <line x1="15" y1="325" x2="385" y2="325" stroke="#451a03" strokeWidth="2.5" opacity="0.4" />
          )}

          {/* Gutter front glass facade */}
          <rect
            x="15"
            y="240"
            width="370"
            height="90"
            rx="4"
            fill="#1e293b"
            fillOpacity="0.1"
            stroke="#475569"
            strokeWidth="1.5"
            style={{ backdropFilter: "blur(1px)" }}
          />

          {/* Channel Lid hole rim */}
          <ellipse cx="200" cy="240" rx="35" ry="6" fill="#1e293b" stroke="#475569" strokeWidth="1.2" />
        </g>

        {/* 3. SUBMERGED FIBROUS ROOT SYSTEM */}
        <g id="fibrous-lettuce-roots" className="root-sway-group">
          <g stroke={rootColor} strokeLinecap="round" strokeWidth="2" fill="none" className="transition-all duration-1000">
            {rootPaths.map((path, idx) => (
              <path key={`root-hair-${idx}`} d={path} opacity={0.6 + Math.min(health / 250, 0.4)} />
            ))}
          </g>
        </g>

        {/* 4. BLACK NEST POT/CUP INSERTED IN THE LID */}
        <g id="net-pot-basket">
          <polygon
            points="172,240 228,240 216,258 184,258"
            fill="#090d16"
            stroke="#334155"
            strokeWidth="1.2"
          />
          {/* pebbles */}
          <circle cx="190" cy="242" r="4" fill="#a16207" />
          <circle cx="210" cy="241" r="4.5" fill="#a16207" />
          <circle cx="200" cy="243" r="4" fill="#854d0e" />
        </g>

        {/* 5. TELEMETRY SENSOR INDICATORS */}
        <g id="submersed-nft-probes" className="font-mono text-[8px] font-bold">
          <g transform="translate(50, 220)">
            <rect x="0" y="0" width="8" height="35" fill="#0f172a" stroke="#334155" strokeWidth="0.8" />
            <circle cx="4" cy="35" r="2.5" fill="#22d3ee" className="probe-pulse-item" />
          </g>
          <g transform="translate(110, 225)">
            <rect x="0" y="0" width="6" height="30" fill="#0f172a" stroke="#334155" strokeWidth="0.8" />
            <circle cx="3" cy="30" r="2" fill="#34d399" className="probe-pulse-item" />
          </g>
        </g>

        {/* 6. GREEN CORAL LETTUCE ROSETTE */}
        <g
          id="lettuce-rosette-crown"
          transform={`translate(200, 240) scale(${lettuceScale})`}
          className="transition-all duration-700"
        >
          {ledIntensity < 110 && stage !== "Germination" && (
            <rect x="-6" y="-35" width="12" height="36" fill="#4ade80" stroke="#166534" strokeWidth="1.5" rx="3" />
          )}

          {stage === "Germination" ? (
            <g className="animate-pulse">
              <path d="M 0 0 C 0 -6 -2 -14 -6 -16" fill="none" stroke="#22c55e" strokeWidth="2.5" />
              <path d="M 0 0 C 0 -6 2 -14 6 -16" fill="none" stroke="#22c55e" strokeWidth="2.5" />
              <ellipse cx="-7" cy="-17" rx="6" ry="4" fill="#10b981" transform="rotate(-20 -7 -17)" />
              <ellipse cx="7" cy="-17" rx="6" ry="4" fill="#10b981" transform="rotate(20 7 -17)" />
            </g>
          ) : (
            <g transform={`rotate(${wiltAngle})`} className="sway-lettuce-group">
              {leaves.map((leaf) => {
                const tiltAngle = leaf.angle;
                const pathData = "M 0 0 C -22 -18 -32 -48 -18 -68 C -8 -78 8 -78 18 -68 C 32 -48 22 -18 0 0";
                
                return (
                  <g
                    key={`lettuce-leaf-${leaf.id}`}
                    transform={`rotate(${tiltAngle}) scale(${leaf.scaleX}, ${leaf.scaleY * stretchYMultiplier})`}
                    className="transition-all duration-500 lettuce-leaf-item"
                  >
                    <path
                      d={pathData}
                      fill={leafColor}
                      stroke={health <= 5 ? "#1a0f08" : health <= 15 ? "#2c1a0e" : health < 50 ? "#a3e635" : "#14532d"}
                      strokeWidth="1.0"
                      opacity="0.94"
                    />
                    <path
                      d="M -15 -62 C -20 -50 -10 -40 0 -25 C 10 -40 20 -50 15 -62"
                      fill="none"
                      stroke={health <= 5 ? "#4e3629" : health <= 15 ? "#795c34" : "#86efac"}
                      strokeWidth="0.8"
                      opacity={health <= 15 ? 0.25 : 0.45}
                    />
                    {tipBurnOpacity > 0 && (
                      <path
                        d="M -15 -68 C -5 -78 5 -78 15 -68"
                        fill="none"
                        stroke="#78350f"
                        strokeWidth="3.5"
                        opacity={tipBurnOpacity}
                        strokeLinecap="round"
                      />
                    )}
                  </g>
                );
              })}
            </g>
          )}
        </g>
      </svg>

      {/* Harvest Overlay direct button */}
      {isReady && onHarvest && (
        <button
          onClick={onHarvest}
          className="absolute bottom-1 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-mono text-[9px] font-black px-3 py-1 rounded shadow-lg animate-bounce active:scale-95 z-20"
        >
          ✂️ Harvest Crop 🥬
        </button>
      )}

      {/* Styles */}
      <style>{`
        @keyframes flow {
          to { stroke-dashoffset: -200; }
        }
        .water-flow-item {
          animation: flow ${1.5 / animationSpeed}s linear infinite;
        }
        @keyframes lettuce-sway {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(1.2deg) skewX(0.4deg); }
        }
        .sway-lettuce-group {
          animation: lettuce-sway ${5 / animationSpeed}s ease-in-out infinite;
          transform-origin: 0px 0px;
        }
        .lettuce-leaf-item {
          transform-origin: 0px 0px;
        }
        @keyframes root-sway {
          0%, 100% { transform: rotate(0deg) scaleX(1); }
          50% { transform: rotate(-1.5deg) scaleX(1.04) skewX(-0.5deg); }
        }
        .root-sway-group {
          animation: root-sway ${6.8 / animationSpeed}s ease-in-out infinite;
          transform-origin: 200px 240px;
        }
        @keyframes probe-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .probe-pulse-item {
          animation: probe-pulse ${2 / animationSpeed}s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}
