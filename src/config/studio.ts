export interface StudioRankStep {
  minAchievements: number;
  title: string;
}

export const DEFAULT_STUDIO_CONFIG = {
  studioTitle: "Himari's Architecture Studio",
  studentName: 'Himari',
  initialRank: 'Apprentice Architect',
} as const;

export const ARCHITECT_RANKS: StudioRankStep[] = [
  { minAchievements: 0, title: 'Apprentice Architect' },
  { minAchievements: 1, title: 'Junior Architect' },
  { minAchievements: 2, title: 'Building Designer' },
  { minAchievements: 3, title: '3D Architect' },
  { minAchievements: 4, title: 'Creative Architect' },
  { minAchievements: 5, title: 'Master Architect' },
];
