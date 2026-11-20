import type { AchievementDefinition } from '../../framework/types';

export const INITIAL_ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'junior-architect',
    title: 'Junior Architect',
    description:
      'Reward for successfully delivering your first architectural floor plan.',
    visualTheme: 'junior-bronze',
    linkedCommissionId: 'commission-1',
    rankTitle: 'Junior Architect',
    lockedHint: 'Complete Commission 1 to earn this architectural honor.',
  },
  {
    id: 'building-designer',
    title: 'Building Designer',
    description:
      'Reward for designing wall openings and estimating construction costs.',
    visualTheme: 'designer-silver',
    linkedCommissionId: 'commission-2',
    rankTitle: 'Building Designer',
    lockedHint: 'Complete a future commission to reveal this honor.',
  },
  {
    id: '3d-architect',
    title: '3D Architect',
    description:
      'Reward for bringing an architectural design into three dimensions.',
    visualTheme: '3d-gold',
    linkedCommissionId: 'commission-3',
    rankTitle: '3D Architect',
    lockedHint: 'Complete a future commission to reveal this honor.',
  },
  {
    id: 'creative-architect',
    title: 'Creative Architect',
    description:
      'Reward for enriching a space with materials, color, and warm lighting.',
    visualTheme: 'creative-amethyst',
    linkedCommissionId: 'commission-4',
    rankTitle: 'Creative Architect',
    lockedHint: 'Complete a future commission to reveal this honor.',
  },
  {
    id: 'master-architect',
    title: 'Master Architect',
    description:
      'Reward for delivering a complete furnished home and an inspiring architecture studio.',
    visualTheme: 'master-emerald',
    linkedCommissionId: 'commission-5',
    rankTitle: 'Master Architect',
    lockedHint: 'Complete the final studio commission to reveal this honor.',
  },
];

export const ACHIEVEMENTS_BY_ID: Record<string, AchievementDefinition> =
  Object.fromEntries(INITIAL_ACHIEVEMENTS.map((item) => [item.id, item]));
