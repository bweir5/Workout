import type { WorkoutTemplate } from '@/types'

export const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  {
    muscle: 'Chest',
    exercises: [
      {
        name: 'Incline Bench Press (Barbell)',
        muscleGroup: 'Chest',
        type: 'compound',
        targetRepRange: [5, 8],
        sets: [
          { tag: 'W', weight: 135, reps: 5 },
          { tag: 'W', weight: 155, reps: 3 },
          { tag: '★', weight: 190, reps: 5 },
          { tag: '', weight: 175, reps: 8 },
          { tag: '', weight: 175, reps: 8 },
          { tag: '', weight: 175, reps: 8 }
        ]
      },
      {
        name: 'Iso-Lateral Chest Press (Machine)',
        muscleGroup: 'Chest',
        type: 'compound',
        targetRepRange: [7, 10],
        sets: [
          { tag: '', weight: 275, reps: 8 },
          { tag: '', weight: 275, reps: 8 },
          { tag: '', weight: 275, reps: 8 }
        ]
      },
      {
        name: 'Butterfly (Pec Deck)',
        muscleGroup: 'Chest',
        type: 'isolation',
        targetRepRange: [9, 12],
        sets: [
          { tag: '', weight: 125, reps: 10 },
          { tag: '', weight: 125, reps: 10 },
          { tag: '', weight: 125, reps: 10 }
        ]
      },
      {
        name: 'Cable Fly Crossovers',
        muscleGroup: 'Chest',
        type: 'isolation',
        targetRepRange: [9, 12],
        sets: [
          { tag: '', weight: 85, reps: 10 },
          { tag: '', weight: 85, reps: 10 },
          { tag: '', weight: 85, reps: 10 }
        ]
      }
    ]
  },
  {
    muscle: 'Back',
    exercises: [
      {
        name: 'Lat Pulldown (Cable)',
        muscleGroup: 'Back',
        type: 'compound',
        targetRepRange: [5, 8],
        sets: [
          { tag: 'W', weight: 140, reps: 6 },
          { tag: '★', weight: 195, reps: 6 },
          { tag: '', weight: 180, reps: 8 },
          { tag: '', weight: 180, reps: 8 },
          { tag: '', weight: 180, reps: 8 }
        ]
      },
      {
        name: 'Iso-Lateral Row (Machine)',
        muscleGroup: 'Back',
        type: 'compound',
        targetRepRange: [8, 10],
        sets: [
          { tag: '', weight: 185, reps: 9 },
          { tag: '', weight: 185, reps: 9 },
          { tag: '', weight: 185, reps: 9 }
        ]
      },
      {
        name: 'Straight Arm Lat Pulldown (Cable)',
        muscleGroup: 'Back',
        type: 'isolation',
        targetRepRange: [10, 12],
        sets: [
          { tag: '', weight: 125, reps: 11 },
          { tag: '', weight: 125, reps: 11 },
          { tag: '', weight: 125, reps: 11 }
        ]
      },
      {
        name: 'Chest Supported Reverse Fly (Dumbbell)',
        muscleGroup: 'Back',
        type: 'isolation',
        targetRepRange: [12, 15],
        sets: [
          { tag: '', weight: 45, reps: 13 },
          { tag: '', weight: 45, reps: 13 },
          { tag: '', weight: 45, reps: 13 }
        ]
      }
    ]
  },
  {
    muscle: 'Legs',
    exercises: [
      {
        name: 'Squat (Barbell)',
        muscleGroup: 'Legs',
        type: 'compound',
        targetRepRange: [5, 8],
        sets: [
          { tag: 'W', weight: 135, reps: 5 },
          { tag: 'W', weight: 145, reps: 3 },
          { tag: '★', weight: 165, reps: 5 },
          { tag: '', weight: 145, reps: 10 },
          { tag: '', weight: 145, reps: 10 },
          { tag: '', weight: 145, reps: 10 }
        ]
      },
      {
        name: 'Leg Extension (Machine)',
        muscleGroup: 'Legs',
        type: 'isolation',
        targetRepRange: [10, 12],
        sets: [
          { tag: '', weight: 135, reps: 11 },
          { tag: '', weight: 135, reps: 11 },
          { tag: '', weight: 135, reps: 11 },
          { tag: '', weight: 135, reps: 11 }
        ]
      },
      {
        name: 'Seated Leg Curl (Machine)',
        muscleGroup: 'Legs',
        type: 'isolation',
        targetRepRange: [10, 12],
        sets: [
          { tag: '', weight: 115, reps: 11 },
          { tag: '', weight: 115, reps: 11 },
          { tag: '', weight: 115, reps: 11 }
        ]
      },
      {
        name: 'Crunch (Machine)',
        muscleGroup: 'Legs',
        type: 'isolation',
        targetRepRange: [9, 12],
        sets: [
          { tag: '', weight: 65, reps: 10 },
          { tag: '', weight: 65, reps: 10 },
          { tag: '', weight: 65, reps: 10 }
        ]
      }
    ]
  },
  {
    muscle: 'Arms',
    exercises: [
      {
        name: 'Overhead Press (Barbell)',
        muscleGroup: 'Shoulders',
        type: 'compound',
        targetRepRange: [6, 8],
        sets: [
          { tag: 'W', weight: 95, reps: 5 },
          { tag: '', weight: 145, reps: 7 },
          { tag: '', weight: 145, reps: 7 },
          { tag: '', weight: 145, reps: 7 }
        ]
      },
      {
        name: 'Seated Incline Curl (Dumbbell)',
        muscleGroup: 'Arms',
        type: 'isolation',
        targetRepRange: [8, 10],
        sets: [
          { tag: '', weight: 75, reps: 8 },
          { tag: '', weight: 75, reps: 8 },
          { tag: '', weight: 75, reps: 8 }
        ]
      },
      {
        name: 'Triceps Extension (Cable)',
        muscleGroup: 'Arms',
        type: 'isolation',
        targetRepRange: [10, 12],
        sets: [
          { tag: '', weight: 150, reps: 11 },
          { tag: '', weight: 150, reps: 11 },
          { tag: '', weight: 150, reps: 11 }
        ]
      },
      {
        name: 'EZ Bar Biceps Curl',
        muscleGroup: 'Arms',
        type: 'isolation',
        targetRepRange: [8, 10],
        sets: [
          { tag: '', weight: 80, reps: 8 },
          { tag: '', weight: 80, reps: 8 },
          { tag: '', weight: 80, reps: 8 }
        ]
      },
      {
        name: 'Skullcrusher (Barbell)',
        muscleGroup: 'Arms',
        type: 'isolation',
        targetRepRange: [8, 10],
        sets: [
          { tag: '', weight: 75, reps: 9 },
          { tag: '', weight: 75, reps: 9 },
          { tag: '', weight: 75, reps: 9 }
        ]
      }
    ]
  },
]

export const getTemplateForMuscle = (muscle: string): WorkoutTemplate | null =>
  WORKOUT_TEMPLATES.find(t => t.muscle === muscle) ?? null
