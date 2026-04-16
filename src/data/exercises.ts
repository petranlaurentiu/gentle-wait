/**
 * Exercise library for GentleWait
 * Provides a variety of exercises across 4 categories for pause breaks
 */
import { Exercise } from "@/src/domain/models";
import type {
  ExerciseCategory,
  ExerciseEntryPoint,
  EyeResetExercisePreference,
  MoveExercisePreference,
} from "@/src/domain/models";

export const MOVE_EXERCISE_CATEGORIES: ExerciseCategory[] = [
  "desk-stretch",
  "standing",
  "energy",
];
export const EYE_RESET_CATEGORY: ExerciseCategory = "eye-posture";
export const DEFAULT_MOVE_EXERCISE_PREFERENCE: MoveExercisePreference =
  "random";
export const DEFAULT_EYE_RESET_EXERCISE_PREFERENCE: EyeResetExercisePreference =
  "random";

export const EXERCISE_ENTRY_METADATA: Record<
  ExerciseEntryPoint,
  {
    label: string;
    iconName: "fitness-outline" | "eye-outline";
    description: string;
  }
> = {
  move: {
    label: "Move",
    iconName: "fitness-outline",
    description: "Quick physical resets to wake up your body",
  },
  "eye-reset": {
    label: "Eye Reset",
    iconName: "eye-outline",
    description: "Ease eye strain and release screen-time tension",
  },
};

/**
 * Exercise image assets — map exercise IDs to their demonstration images.
 * Images are generated externally (Nano Banana Pro 2) and placed in assets/exercises/.
 * Uncomment entries as images are added. The app renders a text fallback when no image exists.
 */
export const EXERCISE_IMAGES: Partial<Record<string, number>> = {
  // Desk Stretches
  // "desk-stretch-1": require("@/assets/exercises/desk-stretch-1.png"),
  // "desk-stretch-2": require("@/assets/exercises/desk-stretch-2.png"),
  // "desk-stretch-3": require("@/assets/exercises/desk-stretch-3.png"),
  // "desk-stretch-4": require("@/assets/exercises/desk-stretch-4.png"),
  // "desk-stretch-5": require("@/assets/exercises/desk-stretch-5.png"),
  // Standing
  // "standing-1": require("@/assets/exercises/standing-1.png"),
  // "standing-2": require("@/assets/exercises/standing-2.png"),
  // "standing-3": require("@/assets/exercises/standing-3.png"),
  // "standing-4": require("@/assets/exercises/standing-4.png"),
  // "standing-5": require("@/assets/exercises/standing-5.png"),
  // Energy Boost
  // "energy-1": require("@/assets/exercises/energy-1.png"),
  // "energy-2": require("@/assets/exercises/energy-2.png"),
  // "energy-3": require("@/assets/exercises/energy-3.png"),
  // "energy-4": require("@/assets/exercises/energy-4.png"),
  // "energy-5": require("@/assets/exercises/energy-5.png"),
  // Eye & Posture
  // "eye-posture-1": require("@/assets/exercises/eye-posture-1.png"),
  // "eye-posture-2": require("@/assets/exercises/eye-posture-2.png"),
  // "eye-posture-3": require("@/assets/exercises/eye-posture-3.png"),
  // "eye-posture-4": require("@/assets/exercises/eye-posture-4.png"),
  // "eye-posture-5": require("@/assets/exercises/eye-posture-5.png"),
};

/** Get exercise image if available, otherwise returns undefined */
export const getExerciseImage = (exerciseId: string): number | undefined => {
  return EXERCISE_IMAGES[exerciseId];
};

/**
 * Exercise video assets — map exercise IDs to their demonstration videos.
 * Videos are 6-second clips of a wooden mannequin demonstrating each exercise.
 */
const EXERCISE_VIDEOS: Record<string, number> = {
  "desk-stretch-1": require("@/assets/video/figurine/Neck-Rolls.mp4"),
  "desk-stretch-2": require("@/assets/video/figurine/Shoulder-Shrugs.mp4"),
  "desk-stretch-3": require("@/assets/video/figurine/Wrist-Stretches.mp4"),
  "desk-stretch-4": require("@/assets/video/figurine/Seated-Spinal-Twist.mp4"),
  "desk-stretch-5": require("@/assets/video/figurine/Chest-Opener.mp4"),
  "standing-1": require("@/assets/video/figurine/Bodyweight-Squats.mp4"),
  "standing-2": require("@/assets/video/figurine/Standing-Side-Bends.mp4"),
  "standing-3": require("@/assets/video/figurine/Calf-Raises.mp4"),
  "standing-4": require("@/assets/video/figurine/Arm-Circles.mp4"),
  "standing-5": require("@/assets/video/figurine/Forward-Fold.mp4"),
  "energy-1": require("@/assets/video/figurine/Jumping-Jacks.mp4"),
  "energy-2": require("@/assets/video/figurine/High-Knees.mp4"),
  "energy-3": require("@/assets/video/figurine/Desk-Push-ups.mp4"),
  "energy-4": require("@/assets/video/figurine/Burpees.mp4"),
  "energy-5": require("@/assets/video/figurine/Mountain-Climbers.mp4"),
  "eye-posture-2": require("@/assets/video/figurine/Chin-Tucks.mp4"),
  "eye-posture-3": require("@/assets/video/figurine/Wall-Angels.mp4"),
  "eye-posture-4": require("@/assets/video/figurine/Breathing-with-Posture-Check.mp4"),
  "eye-posture-6": require("@/assets/video/figurine/Palming.mp4"),
  "eye-posture-7": require("@/assets/video/figurine/Neck-Side-Stretch.mp4"),
  "eye-posture-8": require("@/assets/video/figurine/Shoulder-Rolls-(Seated).mp4"),
  "eye-posture-9": require("@/assets/video/figurine/Temple-Massage.mp4"),
  "eye-posture-10": require("@/assets/video/figurine/Look-Up-Stretch.mp4"),
};

/** Get exercise video source for a given exercise ID */
export const getExerciseVideo = (exerciseId: string): number | undefined => {
  return EXERCISE_VIDEOS[exerciseId];
};

export const EXERCISE_CATEGORY_METADATA: {
  id: ExerciseCategory;
  label: string;
  iconName: "body-outline" | "walk-outline" | "flash-outline" | "eye-outline";
  description: string;
  entry: ExerciseEntryPoint;
  color: string;
}[] = [
  {
    id: "desk-stretch",
    label: "Desk Stretches",
    iconName: "body-outline",
    description: "Quick stretches you can do sitting down",
    entry: "move",
    color: "rgba(0, 212, 255, 0.15)",
  },
  {
    id: "standing",
    label: "Standing",
    iconName: "walk-outline",
    description: "Get up and move your body",
    entry: "move",
    color: "rgba(168, 85, 247, 0.15)",
  },
  {
    id: "energy",
    label: "Energy Boost",
    iconName: "flash-outline",
    description: "Quick exercises to wake you up",
    entry: "move",
    color: "rgba(255, 107, 157, 0.15)",
  },
  {
    id: "eye-posture",
    label: "Eye Reset",
    iconName: "eye-outline",
    description: "Reduce eye strain and reset posture",
    entry: "eye-reset",
    color: "rgba(16, 185, 129, 0.15)",
  },
];

export const EXERCISES: Exercise[] = [
  // Desk Stretches - Can be done while sitting or at desk
  {
    id: "desk-stretch-1",
    name: "Neck Rolls",
    category: "desk-stretch",
    durationSec: 20,
    instructions:
      "Slowly roll your head in circles. First clockwise for 10 seconds, then counterclockwise for 10 seconds. Move gently and mindfully.",
    imagePlaceholder: "🧠 Neck Rolls",
  },
  {
    id: "desk-stretch-2",
    name: "Shoulder Shrugs",
    category: "desk-stretch",
    durationSec: 20,
    reps: 10,
    instructions:
      "Lift your shoulders up to your ears, hold for 2 seconds, then release. Repeat 10 times. This releases tension from your upper back.",
    imagePlaceholder: "💪 Shoulder Shrugs",
  },
  {
    id: "desk-stretch-3",
    name: "Wrist Stretches",
    category: "desk-stretch",
    durationSec: 20,
    instructions:
      "Extend one arm in front of you. With the other hand, gently press your fingers back, then down. Hold each stretch for 10 seconds, then switch arms.",
    imagePlaceholder: "🤚 Wrist Stretches",
  },
  {
    id: "desk-stretch-4",
    name: "Seated Spinal Twist",
    category: "desk-stretch",
    durationSec: 30,
    instructions:
      "Sit upright. Cross your right leg over your left. Place your left elbow on your right knee and gently twist toward your right. Hold for 15 seconds, then switch sides.",
    imagePlaceholder: "🔄 Seated Twist",
  },
  {
    id: "desk-stretch-5",
    name: "Chest Opener",
    category: "desk-stretch",
    durationSec: 20,
    instructions:
      "Clasp your hands behind your back. Straighten your arms and lift your chest slightly. Feel the stretch across your chest for 20 seconds.",
    imagePlaceholder: "🫁 Chest Opener",
  },

  // Standing Exercises - Require standing up and moving
  {
    id: "standing-1",
    name: "Bodyweight Squats",
    category: "standing",
    durationSec: 20,
    reps: 10,
    instructions:
      "Stand with feet shoulder-width apart. Lower your body as if sitting in a chair, then stand back up. Repeat 10 times at a comfortable pace.",
    imagePlaceholder: "🏋️ Squats",
  },
  {
    id: "standing-2",
    name: "Standing Side Bends",
    category: "standing",
    durationSec: 20,
    instructions:
      "Stand tall with feet together. Reach your right arm overhead and gently bend to the left. Hold for 10 seconds, then switch sides.",
    imagePlaceholder: "↔️ Side Bends",
  },
  {
    id: "standing-3",
    name: "Calf Raises",
    category: "standing",
    durationSec: 20,
    reps: 15,
    instructions:
      "Stand with feet together. Rise up onto your toes, hold briefly, then lower your heels back down. Repeat 15 times. This strengthens your calves.",
    imagePlaceholder: "🦵 Calf Raises",
  },
  {
    id: "standing-4",
    name: "Arm Circles",
    category: "standing",
    durationSec: 20,
    instructions:
      "Extend your arms out to the sides. Make slow circles forward for 10 seconds, then backward for 10 seconds. This loosens your shoulder joints.",
    imagePlaceholder: "⭕ Arm Circles",
  },
  {
    id: "standing-5",
    name: "Forward Fold",
    category: "standing",
    durationSec: 30,
    instructions:
      "Stand with feet shoulder-width apart. Slowly bend forward from your hips, letting your arms hang. Breathe deeply for 30 seconds. Don't force it.",
    imagePlaceholder: "🤸 Forward Fold",
  },

  // Energy Boosters - High intensity, get heart rate up
  {
    id: "energy-1",
    name: "Jumping Jacks",
    category: "energy",
    durationSec: 20,
    reps: 20,
    instructions:
      "Jump with your feet apart while raising your arms over your head. Land with feet together and arms down. Repeat 20 times at a brisk pace.",
    imagePlaceholder: "⚡ Jumping Jacks",
  },
  {
    id: "energy-2",
    name: "High Knees",
    category: "energy",
    durationSec: 20,
    instructions:
      "Run in place, lifting your knees high with each step. Keep your core engaged. Continue for 20 seconds to elevate your heart rate.",
    imagePlaceholder: "🏃 High Knees",
  },
  {
    id: "energy-3",
    name: "Desk Push-ups",
    category: "energy",
    durationSec: 20,
    reps: 8,
    instructions:
      "Place your hands on a desk or table. Lower your body toward the desk, keeping your body straight. Push back up. Repeat 8 times.",
    imagePlaceholder: "💯 Push-ups",
  },
  {
    id: "energy-4",
    name: "Burpees",
    category: "energy",
    durationSec: 20,
    reps: 5,
    instructions:
      "Stand, bend down to touch the floor, step back to a plank position, step forward, and stand up. Repeat 5 times. Modified version without jumping.",
    imagePlaceholder: "🔥 Burpees",
  },
  {
    id: "energy-5",
    name: "Mountain Climbers",
    category: "energy",
    durationSec: 20,
    instructions:
      "Get in a plank position. Bring your right knee toward your chest, then quickly switch legs. Continue alternating for 20 seconds.",
    imagePlaceholder: "⛰️ Mountain Climbers",
  },

  // Eye & Posture Breaks - Reduce screen strain and improve posture
  {
    id: "eye-posture-1",
    name: "20-20-20 Eye Break",
    category: "eye-posture",
    durationSec: 20,
    instructions:
      "Look at something 20 feet away for 20 seconds. This rule reduces eye strain from screens. Let your eyes relax and refocus.",
    imagePlaceholder: "👀 Eye Break",
  },
  {
    id: "eye-posture-2",
    name: "Chin Tucks",
    category: "eye-posture",
    durationSec: 20,
    reps: 10,
    instructions:
      "Gently pull your chin straight back, creating a double chin briefly. Hold for 2 seconds, then release. Repeat 10 times. Great for posture.",
    imagePlaceholder: "🎯 Chin Tucks",
  },
  {
    id: "eye-posture-3",
    name: "Wall Angels",
    category: "eye-posture",
    durationSec: 30,
    instructions:
      "Stand with your back against a wall. Press your lower back, shoulders, and head against the wall. Slowly raise your arms up and down along the wall. Repeat 10 times.",
    imagePlaceholder: "😇 Wall Angels",
  },
  {
    id: "eye-posture-4",
    name: "Breathing with Posture Check",
    category: "eye-posture",
    durationSec: 30,
    instructions:
      "Stand or sit tall. Roll your shoulders back. Take 5 deep breaths, feeling your chest expand. Focus on maintaining good posture as you breathe.",
    imagePlaceholder: "🫁 Posture Breathing",
  },
  {
    id: "eye-posture-5",
    name: "Eye Circles",
    category: "eye-posture",
    durationSec: 20,
    instructions:
      "Look straight ahead. Slowly move your eyes in a large circle without moving your head. Do 5 circles one direction, then 5 the other way. This relaxes eye muscles.",
    imagePlaceholder: "🔄 Eye Circles",
  },
  {
    id: "eye-posture-6",
    name: "Palming",
    category: "eye-posture",
    durationSec: 30,
    instructions:
      "Rub your palms together until warm. Cup them gently over your closed eyes without pressing. Rest your elbows on a desk. Breathe slowly and let the warmth soothe your eyes for 30 seconds.",
    imagePlaceholder: "🤲 Palming",
  },
  {
    id: "eye-posture-7",
    name: "Neck Side Stretch",
    category: "eye-posture",
    durationSec: 20,
    instructions:
      "Tilt your head gently to the right, bringing your ear toward your shoulder. Place your right hand on the left side of your head for a gentle stretch. Hold for 10 seconds, then switch sides.",
    imagePlaceholder: "🦒 Neck Stretch",
  },
  {
    id: "eye-posture-8",
    name: "Shoulder Rolls",
    category: "eye-posture",
    durationSec: 20,
    reps: 10,
    instructions:
      "Sit upright. Roll both shoulders backward in slow circles. Do 5 rolls backward, then 5 forward. This releases tension from screen-hunching posture.",
    imagePlaceholder: "🔄 Shoulder Rolls",
  },
  {
    id: "eye-posture-9",
    name: "Temple Massage",
    category: "eye-posture",
    durationSec: 20,
    instructions:
      "Place your fingertips on your temples. Apply gentle pressure and make slow circular motions. Breathe deeply as you massage for 20 seconds. This relieves eye strain headaches.",
    imagePlaceholder: "💆 Temple Massage",
  },
  {
    id: "eye-posture-10",
    name: "Look Up Stretch",
    category: "eye-posture",
    durationSec: 20,
    instructions:
      "Sit tall with hands on your lap. Slowly tilt your head back to look up at the ceiling. Hold for 10 seconds, feeling the stretch in your neck. Return slowly to neutral. Repeat once.",
    imagePlaceholder: "🔝 Look Up",
  },
];

export const getRandomExercise = (): Exercise => {
  return EXERCISES[Math.floor(Math.random() * EXERCISES.length)];
};

export const getExercisesByCategory = (category: string): Exercise[] => {
  return EXERCISES.filter((exercise) => exercise.category === category);
};

export const getExerciseById = (id: string): Exercise | undefined => {
  return EXERCISES.find((exercise) => exercise.id === id);
};

export const getMoveExercises = (): Exercise[] => {
  return EXERCISES.filter((exercise) =>
    MOVE_EXERCISE_CATEGORIES.includes(exercise.category),
  );
};

export const getEyeResetExercises = (): Exercise[] => {
  return getExercisesByCategory(EYE_RESET_CATEGORY);
};

export const getCategoryMeta = (category: ExerciseCategory) => {
  return EXERCISE_CATEGORY_METADATA.find((item) => item.id === category);
};

export const getMoveExercisePool = (
  preference: MoveExercisePreference = DEFAULT_MOVE_EXERCISE_PREFERENCE,
): Exercise[] => {
  if (preference === "random") {
    return getMoveExercises();
  }

  return getExercisesByCategory(preference);
};

export const getEyeResetExercisePool = (
  preference: EyeResetExercisePreference = DEFAULT_EYE_RESET_EXERCISE_PREFERENCE,
): Exercise[] => {
  if (preference === "random") {
    return getEyeResetExercises();
  }

  const preferredExercise = getExerciseById(preference);
  return preferredExercise ? [preferredExercise] : getEyeResetExercises();
};

export const MOVE_EXERCISE_PREFERENCE_OPTIONS: {
  id: MoveExercisePreference;
  label: string;
  description: string;
}[] = [
  {
    id: "random",
    label: "Surprise Me",
    description: "Rotate across all Move exercise categories.",
  },
  {
    id: "desk-stretch",
    label: "Desk Stretches",
    description: "Prefer seated or desk-friendly movement breaks.",
  },
  {
    id: "standing",
    label: "Standing",
    description: "Prefer light full-body movement while standing.",
  },
  {
    id: "energy",
    label: "Energy Boost",
    description: "Prefer quicker, more energizing exercises.",
  },
];

export const EYE_RESET_PREFERENCE_OPTIONS: {
  id: EyeResetExercisePreference;
  label: string;
  description: string;
}[] = [
  {
    id: "random",
    label: "Surprise Me",
    description: "Rotate across all Eye Reset exercises.",
  },
  ...getEyeResetExercises().map((exercise) => ({
    id: exercise.id as EyeResetExercisePreference,
    label: exercise.name,
    description: exercise.instructions,
  })),
];

export const getMoveExercisePreferenceLabel = (
  preference: MoveExercisePreference = DEFAULT_MOVE_EXERCISE_PREFERENCE,
): string => {
  return (
    MOVE_EXERCISE_PREFERENCE_OPTIONS.find((item) => item.id === preference)
      ?.label || "Surprise Me"
  );
};

export const getEyeResetExercisePreferenceLabel = (
  preference: EyeResetExercisePreference = DEFAULT_EYE_RESET_EXERCISE_PREFERENCE,
): string => {
  return (
    EYE_RESET_PREFERENCE_OPTIONS.find((item) => item.id === preference)?.label ||
    "Surprise Me"
  );
};
