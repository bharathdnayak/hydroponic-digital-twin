import type { LettuceEnvironmentalStats, NutrientSolution, ReservoirStats } from "../types";

/**
 * Rules calibrated from Song et al. (2020), the supplied lettuce paper.
 * The study used a 2:1 red:blue LED spectrum and compared 150-450 PPFD with
 * 1/4, 1/2 and 3/4 nutrient-solution strength.
 */
export const LETTUCE_REFERENCE_RECIPE: NutrientSolution = {
  nitrogen: 210,
  phosphorus: 31,
  potassium: 234,
  calcium: 160,
  magnesium: 48,
  sulfur: 64,
  iron: 5.6,
  manganese: 0.5,
  boron: 0.5,
  zinc: 0.05,
  copper: 0.02,
  molybdenum: 0.01,
};

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export type LettuceModelAssessment = {
  solutionStrength: number;
  growthFactor: number;
  qualityFactor: number;
  antioxidantFactor: number;
  recommendation: string;
  mode: "Yield focus" | "Quality focus" | "Stress risk";
};

export function assessLettuceConditions(
  environment: LettuceEnvironmentalStats,
  reservoir: ReservoirStats,
): LettuceModelAssessment {
  // 3/4 strength in the paper is represented by 1.4 mS/cm in this interface.
  const strength = clamp(reservoir.ec / 1.87, 0, 1.2);
  const ppfd = environment.ledIntensity;
  const lightForYield = Math.exp(-Math.pow((ppfd - 350) / 125, 2));
  const nutrientForYield = Math.exp(-Math.pow((strength - 0.75) / 0.28, 2));
  const lightForAntioxidants = Math.exp(-Math.pow((ppfd - 350) / 105, 2));
  const nutrientForAntioxidants = Math.exp(-Math.pow((strength - 0.25) / 0.20, 2));
  const highLightPenalty = ppfd > 400 ? clamp((ppfd - 400) / 120) : 0;

  const climateFactor =
    Math.exp(-Math.pow((environment.airTemp - 23.5) / 8, 2)) *
    Math.exp(-Math.pow((environment.waterTemp - 21) / 5, 2)) *
    clamp(environment.humidity / 50, 0.55, 1) *
    clamp(environment.flowRate / 1.0, 0, 1);
  const chemistryFactor =
    Math.exp(-Math.pow((reservoir.pH - 6.0) / 0.8, 2)) *
    clamp(1 - Math.max(0, reservoir.ec - 2.0) / 1.2, 0.35, 1);

  const growthFactor = clamp((0.35 + 0.65 * lightForYield * nutrientForYield) * climateFactor * chemistryFactor * (1 - highLightPenalty));
  const antioxidantFactor = clamp(0.35 + 0.65 * lightForAntioxidants * nutrientForAntioxidants);
  const qualityFactor = clamp(0.45 * growthFactor + 0.55 * antioxidantFactor);

  if (ppfd >= 320 && ppfd <= 380 && strength >= 0.62 && strength <= 0.88) {
    return { solutionStrength: strength, growthFactor, qualityFactor, antioxidantFactor, mode: "Yield focus", recommendation: "Yield zone: 350 PPFD with about 3/4-strength solution supports the strongest biomass response." };
  }
  if (ppfd >= 300 && ppfd <= 380 && strength >= 0.15 && strength <= 0.38) {
    return { solutionStrength: strength, growthFactor, qualityFactor, antioxidantFactor, mode: "Quality focus", recommendation: "Quality zone: 350 PPFD with about 1/4-strength solution favours antioxidant accumulation, with a yield trade-off." };
  }
  if (ppfd > 400) {
    return { solutionStrength: strength, growthFactor, qualityFactor, antioxidantFactor, mode: "Stress risk", recommendation: "High-light risk: the reference study observed reduced lettuce biomass at 450 PPFD." };
  }
  return { solutionStrength: strength, growthFactor, qualityFactor, antioxidantFactor, mode: "Yield focus", recommendation: "Move toward 350 PPFD and 3/4-strength solution for yield, or 1/4 strength for antioxidant quality." };
}
