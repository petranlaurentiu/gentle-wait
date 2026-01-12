/**
 * Mindfulness content library for GentleWait
 * Affirmations, journaling prompts, grounding exercises, and more
 */

// Daily affirmations for digital wellbeing
export const AFFIRMATIONS = [
  "I am in control of my attention.",
  "I choose presence over distraction.",
  "Every pause is a step toward freedom.",
  "I am worthy of my own time and attention.",
  "My peace is more valuable than any notification.",
  "I trust myself to use technology intentionally.",
  "I am building habits that serve my wellbeing.",
  "This moment is enough. I am enough.",
  "I can feel uncomfortable without reaching for my phone.",
  "My mind deserves rest from constant stimulation.",
  "I am learning to sit with my thoughts.",
  "Progress, not perfection, is my goal.",
  "I choose connection over distraction.",
  "My attention is precious, and I guard it wisely.",
  "I am stronger than my habits.",
  "Each mindful breath brings me back to myself.",
  "I can pause, and that is powerful.",
  "I am rewiring my brain for presence.",
  "The urge will pass. I can wait.",
  "I am creating space for what truly matters.",
];

// Journaling prompts for reflection
export const JOURNALING_PROMPTS = [
  "What emotion was I seeking when I reached for my phone?",
  "What would I do with this time if screens didn't exist?",
  "What am I avoiding right now?",
  "How does my body feel in this moment?",
  "What's one thing I'm grateful for today?",
  "What would make today meaningful?",
  "How have I been kind to myself lately?",
  "What does my ideal relationship with technology look like?",
  "What triggers my urge to scroll?",
  "How do I feel after extended screen time vs. after time in nature?",
  "What's something I've been putting off that I could do right now?",
  "Who do I want to be when it comes to my digital habits?",
  "What brings me genuine joy that doesn't involve a screen?",
  "How can I be more present with the people around me?",
  "What would I tell a friend struggling with the same habit?",
];

// Quick grounding exercises (5-4-3-2-1 and variations)
export const GROUNDING_EXERCISES = [
  {
    id: "5-4-3-2-1",
    name: "5-4-3-2-1 Senses",
    durationSec: 60,
    instructions:
      "Notice 5 things you can see, 4 things you can touch, 3 things you can hear, 2 things you can smell, and 1 thing you can taste. Take your time with each sense.",
    icon: "🌿",
  },
  {
    id: "body-scan-quick",
    name: "Quick Body Scan",
    durationSec: 45,
    instructions:
      "Close your eyes. Starting from your head, slowly scan down to your toes. Notice any tension without trying to change it. Just observe.",
    icon: "🧘",
  },
  {
    id: "feet-grounding",
    name: "Feet on Ground",
    durationSec: 30,
    instructions:
      "Feel your feet firmly on the ground. Press down gently. Notice the weight of your body. You are here, now, supported by the earth.",
    icon: "👣",
  },
  {
    id: "hand-awareness",
    name: "Hand Awareness",
    durationSec: 30,
    instructions:
      "Look at your hands. Really look. Notice the lines, the texture, the way they move. Feel them from the inside. They are yours.",
    icon: "✋",
  },
  {
    id: "cold-water",
    name: "Cold Water Reset",
    durationSec: 20,
    instructions:
      "If possible, run cold water over your wrists for 20 seconds. Notice the sensation. This resets your nervous system and brings you to the present.",
    icon: "💧",
  },
  {
    id: "squeeze-release",
    name: "Squeeze and Release",
    durationSec: 30,
    instructions:
      "Make tight fists with both hands. Squeeze for 5 seconds. Then release completely. Notice the difference. Repeat 3 times.",
    icon: "✊",
  },
];

// Breathing techniques
export const BREATHING_EXERCISES = [
  {
    id: "box-breathing",
    name: "Box Breathing",
    cycles: 4,
    inhale: 4,
    hold1: 4,
    exhale: 4,
    hold2: 4,
    description: "Used by Navy SEALs to stay calm under pressure",
    icon: "📦",
  },
  {
    id: "4-7-8",
    name: "4-7-8 Relaxing Breath",
    cycles: 3,
    inhale: 4,
    hold1: 7,
    exhale: 8,
    hold2: 0,
    description: "Promotes deep relaxation and sleep",
    icon: "😴",
  },
  {
    id: "coherent",
    name: "Coherent Breathing",
    cycles: 6,
    inhale: 5,
    hold1: 0,
    exhale: 5,
    hold2: 0,
    description: "Balances the nervous system",
    icon: "⚖️",
  },
  {
    id: "energizing",
    name: "Energizing Breath",
    cycles: 10,
    inhale: 2,
    hold1: 0,
    exhale: 2,
    hold2: 0,
    description: "Quick energy boost when feeling sluggish",
    icon: "⚡",
  },
];

// Motivational quotes
export const MOTIVATIONAL_QUOTES = [
  {
    quote:
      "The present moment is the only moment available to us, and it is the door to all moments.",
    author: "Thich Nhat Hanh",
  },
  {
    quote:
      "Almost everything will work again if you unplug it for a few minutes, including you.",
    author: "Anne Lamott",
  },
  {
    quote: "You are not your thoughts. You are the observer of your thoughts.",
    author: "Eckhart Tolle",
  },
  {
    quote:
      "The ability to be in the present moment is a major component of mental wellness.",
    author: "Abraham Maslow",
  },
  {
    quote:
      "Feelings come and go like clouds in a windy sky. Conscious breathing is my anchor.",
    author: "Thich Nhat Hanh",
  },
  {
    quote:
      "In today's rush, we all think too much, seek too much, want too much and forget about the joy of just being.",
    author: "Eckhart Tolle",
  },
  {
    quote:
      "The greatest weapon against stress is our ability to choose one thought over another.",
    author: "William James",
  },
  {
    quote: "Mindfulness is a way of befriending ourselves and our experience.",
    author: "Jon Kabat-Zinn",
  },
  {
    quote: "Be where you are, not where you think you should be.",
    author: "Unknown",
  },
  {
    quote:
      "The phone is not the problem. The problem is our relationship with the phone.",
    author: "Cal Newport",
  },
  {
    quote:
      "Boredom is the gateway to mind-wandering, which helps our brains create those new connections.",
    author: "Dr. Sandi Mann",
  },
  {
    quote:
      "Every time you check your phone in company, what you gain is a hit of stimulation. What you lose is what you can never get back: time.",
    author: "Simon Sinek",
  },
  {
    quote:
      "We don't rise to the level of our goals. We fall to the level of our systems.",
    author: "James Clear",
  },
  {
    quote: "Your calm mind is the ultimate weapon against your challenges.",
    author: "Bryant McGill",
  },
  {
    quote: "The mind is everything. What you think you become.",
    author: "Buddha",
  },
];

// Helper functions
export function getRandomAffirmation(): string {
  return AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)];
}

export function getRandomJournalingPrompt(): string {
  return JOURNALING_PROMPTS[
    Math.floor(Math.random() * JOURNALING_PROMPTS.length)
  ];
}

export function getRandomGroundingExercise() {
  return GROUNDING_EXERCISES[
    Math.floor(Math.random() * GROUNDING_EXERCISES.length)
  ];
}

/**
 * Get a grounding exercise adjusted to fit within a given duration
 * @param durationSec - Target duration in seconds (e.g., 10, 15, 20, 30)
 */
export function getGroundingExerciseForDuration(durationSec: number) {
  // Filter exercises that fit within the duration
  const suitableExercises = GROUNDING_EXERCISES.filter(
    (exercise) => exercise.durationSec <= durationSec
  );

  // If we have suitable exercises, pick one randomly
  if (suitableExercises.length > 0) {
    return suitableExercises[
      Math.floor(Math.random() * suitableExercises.length)
    ];
  }

  // If no exercise fits, scale down the shortest one
  const shortestExercise = GROUNDING_EXERCISES.reduce((prev, current) =>
    prev.durationSec < current.durationSec ? prev : current
  );

  return {
    ...shortestExercise,
    durationSec: durationSec,
  };
}

export function getRandomBreathingExercise() {
  return BREATHING_EXERCISES[
    Math.floor(Math.random() * BREATHING_EXERCISES.length)
  ];
}

/**
 * Get a breathing exercise adjusted to fit within a given duration
 * @param durationSec - Target duration in seconds (e.g., 15, 20, 30)
 */
export function getBreathingExerciseForDuration(durationSec: number) {
  // Calculate how many cycles fit in the duration for each exercise
  const exercisesWithFit = BREATHING_EXERCISES.map((exercise) => {
    const cycleTime =
      exercise.inhale + exercise.hold1 + exercise.exhale + exercise.hold2;
    const maxCycles = Math.max(1, Math.floor(durationSec / cycleTime));
    return {
      ...exercise,
      cycles: Math.min(maxCycles, exercise.cycles), // Don't exceed original cycles
      totalTime: maxCycles * cycleTime,
    };
  });

  // Prefer exercises that use most of the available time but don't exceed it
  const bestFit = exercisesWithFit
    .filter((e) => e.totalTime <= durationSec + 5) // Allow 5s buffer
    .sort((a, b) => b.totalTime - a.totalTime)[0];

  return bestFit || exercisesWithFit[0];
}

export function getRandomQuote() {
  return MOTIVATIONAL_QUOTES[
    Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)
  ];
}

export function getDailyAffirmation(): string {
  // Use the day of year to get a consistent daily affirmation
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  return AFFIRMATIONS[dayOfYear % AFFIRMATIONS.length];
}

export function getDailyQuote() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  return MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];
}
