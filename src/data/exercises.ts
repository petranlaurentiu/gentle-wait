/**
 * Exercise library for GentleWait
 * Provides a variety of exercises across 4 categories for pause breaks
 */
import { Exercise } from '@/src/domain/models';

export const EXERCISES: Exercise[] = [
  // Desk Stretches - Can be done while sitting or at desk
  {
    id: 'desk-stretch-1',
    name: 'Neck Rolls',
    category: 'desk-stretch',
    durationSec: 20,
    instructions: 'Slowly roll your head in circles. First clockwise for 10 seconds, then counterclockwise for 10 seconds. Move gently and mindfully.',
    imagePlaceholder: '🧠 Neck Rolls',
  },
  {
    id: 'desk-stretch-2',
    name: 'Shoulder Shrugs',
    category: 'desk-stretch',
    durationSec: 20,
    reps: 10,
    instructions: 'Lift your shoulders up to your ears, hold for 2 seconds, then release. Repeat 10 times. This releases tension from your upper back.',
    imagePlaceholder: '💪 Shoulder Shrugs',
  },
  {
    id: 'desk-stretch-3',
    name: 'Wrist Stretches',
    category: 'desk-stretch',
    durationSec: 20,
    instructions: 'Extend one arm in front of you. With the other hand, gently press your fingers back, then down. Hold each stretch for 10 seconds, then switch arms.',
    imagePlaceholder: '🤚 Wrist Stretches',
  },
  {
    id: 'desk-stretch-4',
    name: 'Seated Spinal Twist',
    category: 'desk-stretch',
    durationSec: 30,
    instructions: 'Sit upright. Cross your right leg over your left. Place your left elbow on your right knee and gently twist toward your right. Hold for 15 seconds, then switch sides.',
    imagePlaceholder: '🔄 Seated Twist',
  },
  {
    id: 'desk-stretch-5',
    name: 'Chest Opener',
    category: 'desk-stretch',
    durationSec: 20,
    instructions: 'Clasp your hands behind your back. Straighten your arms and lift your chest slightly. Feel the stretch across your chest for 20 seconds.',
    imagePlaceholder: '🫁 Chest Opener',
  },

  // Standing Exercises - Require standing up and moving
  {
    id: 'standing-1',
    name: 'Bodyweight Squats',
    category: 'standing',
    durationSec: 20,
    reps: 10,
    instructions: 'Stand with feet shoulder-width apart. Lower your body as if sitting in a chair, then stand back up. Repeat 10 times at a comfortable pace.',
    imagePlaceholder: '🏋️ Squats',
  },
  {
    id: 'standing-2',
    name: 'Standing Side Bends',
    category: 'standing',
    durationSec: 20,
    instructions: 'Stand tall with feet together. Reach your right arm overhead and gently bend to the left. Hold for 10 seconds, then switch sides.',
    imagePlaceholder: '↔️ Side Bends',
  },
  {
    id: 'standing-3',
    name: 'Calf Raises',
    category: 'standing',
    durationSec: 20,
    reps: 15,
    instructions: 'Stand with feet together. Rise up onto your toes, hold briefly, then lower your heels back down. Repeat 15 times. This strengthens your calves.',
    imagePlaceholder: '🦵 Calf Raises',
  },
  {
    id: 'standing-4',
    name: 'Arm Circles',
    category: 'standing',
    durationSec: 20,
    instructions: 'Extend your arms out to the sides. Make slow circles forward for 10 seconds, then backward for 10 seconds. This loosens your shoulder joints.',
    imagePlaceholder: '⭕ Arm Circles',
  },
  {
    id: 'standing-5',
    name: 'Forward Fold',
    category: 'standing',
    durationSec: 30,
    instructions: 'Stand with feet shoulder-width apart. Slowly bend forward from your hips, letting your arms hang. Breathe deeply for 30 seconds. Don&apos;t force it.',
    imagePlaceholder: '🤸 Forward Fold',
  },

  // Energy Boosters - High intensity, get heart rate up
  {
    id: 'energy-1',
    name: 'Jumping Jacks',
    category: 'energy',
    durationSec: 20,
    reps: 20,
    instructions: 'Jump with your feet apart while raising your arms over your head. Land with feet together and arms down. Repeat 20 times at a brisk pace.',
    imagePlaceholder: '⚡ Jumping Jacks',
  },
  {
    id: 'energy-2',
    name: 'High Knees',
    category: 'energy',
    durationSec: 20,
    instructions: 'Run in place, lifting your knees high with each step. Keep your core engaged. Continue for 20 seconds to elevate your heart rate.',
    imagePlaceholder: '🏃 High Knees',
  },
  {
    id: 'energy-3',
    name: 'Desk Push-ups',
    category: 'energy',
    durationSec: 20,
    reps: 8,
    instructions: 'Place your hands on a desk or table. Lower your body toward the desk, keeping your body straight. Push back up. Repeat 8 times.',
    imagePlaceholder: '💯 Push-ups',
  },
  {
    id: 'energy-4',
    name: 'Burpees (Modified)',
    category: 'energy',
    durationSec: 20,
    reps: 5,
    instructions: 'Stand, bend down to touch the floor, step back to a plank position, step forward, and stand up. Repeat 5 times. Modified version without jumping.',
    imagePlaceholder: '🔥 Burpees',
  },
  {
    id: 'energy-5',
    name: 'Mountain Climbers',
    category: 'energy',
    durationSec: 20,
    instructions: 'Get in a plank position. Bring your right knee toward your chest, then quickly switch legs. Continue alternating for 20 seconds.',
    imagePlaceholder: '⛰️ Mountain Climbers',
  },

  // Eye & Posture Breaks - Reduce screen strain and improve posture
  {
    id: 'eye-posture-1',
    name: '20-20-20 Eye Break',
    category: 'eye-posture',
    durationSec: 20,
    instructions: 'Look at something 20 feet away for 20 seconds. This rule reduces eye strain from screens. Let your eyes relax and refocus.',
    imagePlaceholder: '👀 Eye Break',
  },
  {
    id: 'eye-posture-2',
    name: 'Chin Tucks',
    category: 'eye-posture',
    durationSec: 20,
    reps: 10,
    instructions: 'Gently pull your chin straight back, creating a double chin briefly. Hold for 2 seconds, then release. Repeat 10 times. Great for posture.',
    imagePlaceholder: '🎯 Chin Tucks',
  },
  {
    id: 'eye-posture-3',
    name: 'Wall Angels',
    category: 'eye-posture',
    durationSec: 30,
    instructions: 'Stand with your back against a wall. Press your lower back, shoulders, and head against the wall. Slowly raise your arms up and down along the wall. Repeat 10 times.',
    imagePlaceholder: '😇 Wall Angels',
  },
  {
    id: 'eye-posture-4',
    name: 'Breathing with Posture Check',
    category: 'eye-posture',
    durationSec: 30,
    instructions: 'Stand or sit tall. Roll your shoulders back. Take 5 deep breaths, feeling your chest expand. Focus on maintaining good posture as you breathe.',
    imagePlaceholder: '🫁 Posture Breathing',
  },
  {
    id: 'eye-posture-5',
    name: 'Eye Circles',
    category: 'eye-posture',
    durationSec: 20,
    instructions: 'Look straight ahead. Slowly move your eyes in a large circle without moving your head. Do 5 circles one direction, then 5 the other way. This relaxes eye muscles.',
    imagePlaceholder: '🔄 Eye Circles',
  },
];

export const getRandomExercise = (): Exercise => {
  return EXERCISES[Math.floor(Math.random() * EXERCISES.length)];
};

export const getExercisesByCategory = (category: string): Exercise[] => {
  return EXERCISES.filter((exercise) => exercise.category === category);
};
