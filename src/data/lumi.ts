import type { ExerciseCategory, ExerciseEntryPoint } from "@/src/domain/models";

export const LUMI_ASSETS = {
  breathe: require("@/assets/lumi/lumi-breathe.png"),
  breatheInhale: require("@/assets/lumi/lumi-breathe-exercise-inhale.png"),
  celebration: require("@/assets/lumi/lumi-celebration.png"),
  eyeReset: require("@/assets/lumi/lumi-eye-reset.png"),
  grounding: require("@/assets/lumi/lumi-grounding.png"),
  journal: require("@/assets/lumi/lumi-journal-reflection.png"),
  mascot: require("@/assets/lumi/lumi-mascot.png"),
  pray: require("@/assets/lumi/lumi-pray.png"),
  stretch: require("@/assets/lumi/lumi-stretch.png"),
} as const;

export type LumiAlternativeType =
  | "breathe"
  | "grounding"
  | "reflect"
  | "prayer";

export const getLumiAssetForAlternative = (
  type: LumiAlternativeType,
  isComplete: boolean = false,
) => {
  if (isComplete) {
    return LUMI_ASSETS.celebration;
  }

  switch (type) {
    case "breathe":
      return LUMI_ASSETS.breathe;
    case "grounding":
      return LUMI_ASSETS.grounding;
    case "reflect":
      return LUMI_ASSETS.journal;
    case "prayer":
      return LUMI_ASSETS.pray;
  }
};

export const getLumiAssetForExercise = ({
  entry,
  category,
  isComplete = false,
}: {
  entry?: ExerciseEntryPoint;
  category?: ExerciseCategory | null;
  isComplete?: boolean;
}) => {
  if (isComplete) {
    return LUMI_ASSETS.celebration;
  }

  if (entry === "eye-reset" || category === "eye-posture") {
    return LUMI_ASSETS.eyeReset;
  }

  if (entry === "move") {
    return LUMI_ASSETS.stretch;
  }

  if (
    category === "desk-stretch" ||
    category === "standing" ||
    category === "energy"
  ) {
    return LUMI_ASSETS.stretch;
  }

  return LUMI_ASSETS.mascot;
};
