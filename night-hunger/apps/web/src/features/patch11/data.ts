export type AbilityBranch = 'hunt' | 'survival' | 'dominance';
export type AbilityType = 'passive' | 'active';

export interface AbilityCard {
  id: string;
  name: string;
  branch: AbilityBranch;
  type: AbilityType;
  costXp: number;
  description: string;
}

export interface PatronFamiliarBonus {
  attackBonusPercent?: number;
  defenseBonusFlat?: number;
  escapeBonus?: number;
}

export interface PatronFamiliar {
  id: string;
  name: string;
  title: string;
  description: string;
  bonus: PatronFamiliarBonus;
}

export interface GrotEnemyTemplate {
  type: 'rat' | 'spider';
  name: string;
  portrait: string;
  hp: number;
  attack: number;
  defense: number;
  rewardXp: number;
}

export const HUNT_PATCH_CONSTANTS = {
  maxEnka: 100,
  searchCost: 10,
  nightCooldownMs: 4 * 60 * 60 * 1000,
  crystalBonus: 40,
  lowHungerThreshold: 30,
  summonBatsHungerCost: 20,
} as const;

export const ABILITY_CARDS: AbilityCard[] = [
  {
    id: 'keen_fangs',
    name: 'Острые клыки',
    branch: 'hunt',
    type: 'passive',
    costXp: 160,
    description: '+2 к базовой атаке.',
  },
  {
    id: 'grot_instinct',
    name: 'Инстинкт Грота',
    branch: 'hunt',
    type: 'passive',
    costXp: 210,
    description: '+10% опыта за боевые события в Гроте.',
  },
  {
    id: 'dense_blood',
    name: 'Густая кровь',
    branch: 'survival',
    type: 'passive',
    costXp: 190,
    description: '+2 к защите.',
  },
  {
    id: 'starved_fury',
    name: 'Голодная ярость',
    branch: 'survival',
    type: 'passive',
    costXp: 240,
    description: 'При низком голоде бонус урона усиливается.',
  },
  {
    id: 'cold_mind',
    name: 'Холодный разум',
    branch: 'dominance',
    type: 'passive',
    costXp: 230,
    description: 'Шанс гипноза +5%.',
  },
  {
    id: 'shadow_gait',
    name: 'Теневая поступь',
    branch: 'dominance',
    type: 'passive',
    costXp: 180,
    description: 'Побег немного надёжнее.',
  },
  {
    id: 'summon_bats',
    name: 'Призыв летучих мышей',
    branch: 'survival',
    type: 'active',
    costXp: 280,
    description: 'Боевой навык: призывает временную защиту с 1 HP и высоким уклонением.',
  },
];

export const PATRON_FAMILIARS: PatronFamiliar[] = [
  {
    id: 'none',
    name: 'Без спутника',
    title: 'Без донатного фамильяра',
    description: 'Нейтральный режим, без пассивных бонусов.',
    bonus: {},
  },
  {
    id: 'amber_bat',
    name: 'Янтарная летучая мышь',
    title: 'Донат-фамильяр',
    description: '+5% к урону вампира.',
    bonus: {
      attackBonusPercent: 0.05,
    },
  },
  {
    id: 'obsidian_raven',
    name: 'Обсидиановый ворон',
    title: 'Донат-фамильяр',
    description: '+1 к защите и +5% к шансу побега.',
    bonus: {
      defenseBonusFlat: 1,
      escapeBonus: 0.05,
    },
  },
];

export const GROT_ENEMIES: GrotEnemyTemplate[] = [
  {
    type: 'rat',
    name: 'Крыса',
    portrait: '🐀',
    hp: 34,
    attack: 7,
    defense: 2,
    rewardXp: 42,
  },
  {
    type: 'spider',
    name: 'Паук',
    portrait: '🕷️',
    hp: 42,
    attack: 9,
    defense: 3,
    rewardXp: 54,
  },
];
