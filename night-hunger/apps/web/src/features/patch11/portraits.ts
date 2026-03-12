interface SkinPortrait {
  skinId: string;
  name: string;
  portrait: string;
}

const SKIN_PORTRAITS: SkinPortrait[] = [
  { skinId: 'default', name: 'Новорождённый', portrait: '🧛' },
  { skinId: 'skin_crimson', name: 'Crimson Cloak', portrait: '🧛‍♂️' },
  { skinId: 'skin_noble', name: 'Ночной аристократ', portrait: '🧛‍♀️' },
];

export function getSkinPortrait(skinId?: string | null): SkinPortrait {
  if (!skinId) {
    return SKIN_PORTRAITS[0];
  }
  return SKIN_PORTRAITS.find((entry) => entry.skinId === skinId) || SKIN_PORTRAITS[0];
}

export function getAllSkinPortraits(): SkinPortrait[] {
  return SKIN_PORTRAITS;
}
