import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  ABILITY_CARDS,
  AbilityCard,
  GROT_ENEMIES,
  HUNT_PATCH_CONSTANTS,
  PATRON_FAMILIARS,
  PatronFamiliar,
} from '../features/patch11/data';
import { useUserStore } from './userStore';

export type HuntLocationId = 'grot' | 'forest';
export type HuntStage = 'idle' | 'location' | 'event' | 'combat' | 'final_choice' | 'cooldown';
export type HuntEventType = 'battle' | 'chest' | 'victim' | 'empty' | 'soon';
export type FinalChoice = 'execute' | 'drain' | 'hypnosis';

export interface CombatStatsInput {
  strength: number;
  agility: number;
  hp: number;
}

export interface HuntEnemy {
  id: string;
  type: string;
  name: string;
  portrait: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  rewardXp: number;
  canBecomeFamiliar: boolean;
}

export interface FamiliarState {
  id: string;
  name: string;
  portrait: string;
  hp: number;
  maxHp: number;
  attack: number;
  dodgeChance: number;
  temporary: boolean;
}

export interface HuntEventCard {
  type: HuntEventType;
  title: string;
  description: string;
}

interface CombatPlayerSnapshot {
  attack: number;
  defense: number;
  hunger: number;
  lowHunger: boolean;
  canEscape: boolean;
}

interface AbilityPurchaseResult {
  ok: boolean;
  message: string;
}

interface HuntPatchState {
  stage: HuntStage;
  selectedLocation: HuntLocationId | null;
  nightEnergy: number;
  nightCooldownEndsAt: number | null;
  crystalUsedThisNight: boolean;
  showCrystalPrompt: boolean;
  hunger: number;
  droppedPotions: number;
  combatLog: string[];
  currentEvent: HuntEventCard | null;
  currentEnemy: HuntEnemy | null;
  activeFamiliar: FamiliarState | null;
  combatFamiliar: FamiliarState | null;
  purchasedAbilityIds: string[];
  spentXp: number;
  selectedPatronFamiliarId: string;
  shouldReturnToHub: boolean;

  syncNightState: () => void;
  enterHunt: () => void;
  ackReturnToHub: () => void;
  selectLocation: (location: HuntLocationId) => void;
  searchEvent: () => AbilityPurchaseResult;
  dismissEvent: () => void;
  activateCrystal: () => void;
  declineCrystal: () => void;
  useHuntPotion: () => AbilityPurchaseResult;
  attackEnemy: (stats: CombatStatsInput) => void;
  useSkill: (stats: CombatStatsInput) => void;
  tryEscape: (stats: CombatStatsInput) => void;
  applyFinalChoice: (choice: FinalChoice) => void;
  buyAbility: (abilityId: string, totalXp: number) => AbilityPurchaseResult;
  selectPatronFamiliar: (patronId: string) => AbilityPurchaseResult;
  addCombatLog: (message: string) => void;
  getCooldownRemainingMs: () => number;
  getAvailableXp: (totalXp: number) => number;
  isAbilityOwned: (abilityId: string) => boolean;
  getCombatPlayerSnapshot: (stats: CombatStatsInput) => CombatPlayerSnapshot;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function copy<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function getPatronById(id: string): PatronFamiliar {
  return PATRON_FAMILIARS.find((entry) => entry.id === id) || PATRON_FAMILIARS[0];
}

function profileHp(): number {
  return useUserStore.getState().profile?.currentHp ?? 100;
}

function profileMaxHp(): number {
  return useUserStore.getState().profile?.maxHp ?? 100;
}

function setProfileHp(nextHp: number) {
  useUserStore.getState().updateHp(clamp(nextHp, 0, profileMaxHp()));
}

function addProfileXp(amount: number) {
  if (amount > 0) {
    useUserStore.getState().updateXp(amount);
  }
}

function calculateDefense(base: CombatStatsInput, ownedAbilities: string[], patronId: string): number {
  let defense = Math.max(1, Math.floor((base.agility + base.hp) / 2));
  if (ownedAbilities.includes('dense_blood')) {
    defense += 2;
  }
  const patron = getPatronById(patronId);
  defense += patron.bonus.defenseBonusFlat || 0;
  return Math.max(1, defense);
}

function calculateAttack(
  base: CombatStatsInput,
  hunger: number,
  ownedAbilities: string[],
  patronId: string,
): number {
  let attack = Math.max(1, Math.round(base.strength * 1.7));
  if (ownedAbilities.includes('keen_fangs')) {
    attack += 2;
  }

  const lowHunger = hunger <= HUNT_PATCH_CONSTANTS.lowHungerThreshold;
  if (lowHunger) {
    const modifier = ownedAbilities.includes('starved_fury') ? 1.3 : 1.15;
    attack = Math.round(attack * modifier);
  }

  const patron = getPatronById(patronId);
  if (patron.bonus.attackBonusPercent) {
    attack = Math.round(attack * (1 + patron.bonus.attackBonusPercent));
  }

  return Math.max(1, attack);
}

function calculateEscapeChance(base: CombatStatsInput, ownedAbilities: string[], patronId: string): number {
  let chance = clamp(0.35 + base.agility * 0.04, 0.2, 0.92);
  if (ownedAbilities.includes('shadow_gait')) {
    chance += 0.05;
  }
  const patron = getPatronById(patronId);
  chance += patron.bonus.escapeBonus || 0;
  return clamp(chance, 0.2, 0.94);
}

function createEnemy(type: 'rat' | 'spider'): HuntEnemy {
  const template = GROT_ENEMIES.find((entry) => entry.type === type) || GROT_ENEMIES[0];
  return {
    id: `${template.type}-${Date.now()}`,
    type: template.type,
    name: template.name,
    portrait: template.portrait,
    hp: template.hp,
    maxHp: template.hp,
    attack: template.attack,
    defense: template.defense,
    rewardXp: template.rewardXp,
    canBecomeFamiliar: true,
  };
}

function createWebWolfVictim(): HuntEnemy {
  return {
    id: `web-wolf-${Date.now()}`,
    type: 'web_wolf',
    name: 'Волк в паутине',
    portrait: '🐺',
    hp: 1,
    maxHp: 26,
    attack: 0,
    defense: 0,
    rewardXp: 48,
    canBecomeFamiliar: true,
  };
}

function createFamiliarFromEnemy(enemy: HuntEnemy): FamiliarState {
  const familiarHp = Math.max(2, Math.round(enemy.maxHp * 0.45));
  const familiarAttack = Math.max(2, Math.round(enemy.attack * 0.55));
  return {
    id: `familiar-${enemy.type}-${Date.now()}`,
    name: enemy.name,
    portrait: enemy.portrait,
    hp: familiarHp,
    maxHp: familiarHp,
    attack: familiarAttack,
    dodgeChance: 0.2,
    temporary: false,
  };
}

function createSummonedBats(): FamiliarState {
  return {
    id: `summoned-bats-${Date.now()}`,
    name: 'Летучие мыши',
    portrait: '🦇',
    hp: 1,
    maxHp: 1,
    attack: 0,
    dodgeChance: 0.78,
    temporary: true,
  };
}

function getHypnosisChance(ownedAbilities: string[]): number {
  return clamp(0.1 + (ownedAbilities.includes('cold_mind') ? 0.05 : 0), 0.1, 0.25);
}

function defaultCombatLog(): string[] {
  return ['🌒 Ночь началась. Выберите локацию и начните поиск события.'];
}

export const usePatch11Store = create<HuntPatchState>()(
  persist(
    (set, get) => ({
      stage: 'idle',
      selectedLocation: null,
      nightEnergy: HUNT_PATCH_CONSTANTS.maxEnka,
      nightCooldownEndsAt: null,
      crystalUsedThisNight: false,
      showCrystalPrompt: false,
      hunger: 100,
      droppedPotions: 0,
      combatLog: defaultCombatLog(),
      currentEvent: null,
      currentEnemy: null,
      activeFamiliar: null,
      combatFamiliar: null,
      purchasedAbilityIds: [],
      spentXp: 0,
      selectedPatronFamiliarId: 'none',
      shouldReturnToHub: false,

      syncNightState: () => {
        const state = get();
        if (!state.nightCooldownEndsAt) return;

        if (Date.now() >= state.nightCooldownEndsAt) {
          set({
            stage: 'idle',
            nightCooldownEndsAt: null,
            nightEnergy: HUNT_PATCH_CONSTANTS.maxEnka,
            crystalUsedThisNight: false,
            showCrystalPrompt: false,
            shouldReturnToHub: false,
            combatLog: ['🌘 Ночь вернулась. Энка восстановлена до 100.'],
          });
        } else {
          set({ stage: 'cooldown' });
        }
      },

      enterHunt: () => {
        get().syncNightState();
        const state = get();
        if (state.stage === 'cooldown') {
          set({
            combatLog: [
              `☀️ Рассвет. До следующей ночи осталось ${Math.ceil(
                state.getCooldownRemainingMs() / 60000,
              )} мин.`,
            ],
          });
          return;
        }
        set({
          stage: 'location',
          shouldReturnToHub: false,
          currentEvent: null,
        });
      },

      ackReturnToHub: () => {
        set({ shouldReturnToHub: false });
      },

      selectLocation: (location) => {
        set({
          selectedLocation: location,
          stage: 'location',
          currentEvent: null,
        });
      },

      searchEvent: () => {
        get().syncNightState();
        const state = get();

        if (state.stage === 'cooldown') {
          return { ok: false, message: 'Сейчас рассвет. Охота недоступна до конца КД.' };
        }

        if (!state.selectedLocation) {
          return { ok: false, message: 'Сначала выберите локацию.' };
        }

        if (state.selectedLocation === 'forest') {
          set({
            stage: 'event',
            currentEvent: {
              type: 'soon',
              title: 'Лес',
              description: 'Локация в патче 1.1 помечена как "Скоро".',
            },
            combatLog: [...state.combatLog, '🌲 Лес пока недоступен.'],
          });
          return { ok: false, message: 'Лес скоро появится.' };
        }

        if (state.nightEnergy <= 0) {
          if (!state.crystalUsedThisNight) {
            set({
              showCrystalPrompt: true,
              stage: 'event',
              currentEvent: {
                type: 'empty',
                title: 'Энка на нуле',
                description: 'Активировать Кристалл ночи (+40 энки)?',
              },
              combatLog: [...state.combatLog, '🧿 Энка закончилась. Можно активировать Кристалл ночи.'],
            });
            return { ok: false, message: 'Энка на нуле. Выберите действие с кристаллом.' };
          }

          const cooldownEndsAt = Date.now() + HUNT_PATCH_CONSTANTS.nightCooldownMs;
          set({
            stage: 'cooldown',
            currentEvent: null,
            currentEnemy: null,
            combatFamiliar: null,
            showCrystalPrompt: false,
            nightCooldownEndsAt: cooldownEndsAt,
            selectedLocation: null,
            crystalUsedThisNight: false,
            shouldReturnToHub: true,
            combatLog: [...state.combatLog, '☀️ Ночь окончена. Начался 4-часовой КД.'],
          });
          return { ok: true, message: 'Ночь завершена. Возвращаемся в Hub.' };
        }

        const nextEnergy = Math.max(0, state.nightEnergy - HUNT_PATCH_CONSTANTS.searchCost);
        const log = [...state.combatLog, `🔍 Поиск события в Гроте. Энка: ${nextEnergy}/${HUNT_PATCH_CONSTANTS.maxEnka}`];

        const roll = Math.random();
        if (roll < 0.45) {
          const enemyType = Math.random() < 0.55 ? 'rat' : 'spider';
          const enemy = createEnemy(enemyType);
          const combatFamiliar = state.activeFamiliar ? copy(state.activeFamiliar) : null;
          const startLog = [...log, `⚔️ Встречен враг: ${enemy.name}.`];
          if (combatFamiliar) {
            startLog.push(`🐾 Фамильяр "${combatFamiliar.name}" вступает в бой автоматически.`);
          }
          set({
            stage: 'combat',
            nightEnergy: nextEnergy,
            currentEvent: {
              type: 'battle',
              title: 'Боевой контакт',
              description: `Вы столкнулись с врагом: ${enemy.name}.`,
            },
            currentEnemy: enemy,
            combatFamiliar,
            showCrystalPrompt: false,
            combatLog: startLog,
          });
          return { ok: true, message: 'Начался бой.' };
        }

        if (roll < 0.65) {
          const shouldPromptCrystal = nextEnergy === 0 && !state.crystalUsedThisNight;
          const eventLog = [...log, '🎁 Найден сундук. Получено: зелье лечения (+1).'];
          if (shouldPromptCrystal) {
            eventLog.push('🧿 Энка на нуле. Можно активировать Кристалл ночи.');
          }
          set({
            stage: 'event',
            nightEnergy: nextEnergy,
            droppedPotions: state.droppedPotions + 1,
            currentEvent: {
              type: 'chest',
              title: 'Сундук',
              description: 'Вы нашли зелье лечения. Оно отправлено в инвентарь охоты.',
            },
            showCrystalPrompt: shouldPromptCrystal,
            combatLog: eventLog,
          });
          return { ok: true, message: 'Событие сундука обработано.' };
        }

        if (roll < 0.85) {
          const victim = createWebWolfVictim();
          set({
            stage: 'final_choice',
            nightEnergy: nextEnergy,
            currentEnemy: victim,
            currentEvent: {
              type: 'victim',
              title: 'Жертва',
              description: 'Волк в паутине. Полноценный бой не требуется.',
            },
            showCrystalPrompt: false,
            combatLog: [...log, '🕸️ Вы нашли жертву: волк в паутине.', '🩸 Выберите финальное действие.'],
          });
          return { ok: true, message: 'Открыт финальный выбор.' };
        }

        const shouldPromptCrystal = nextEnergy === 0 && !state.crystalUsedThisNight;
        const emptyLog = [...log, '🌫️ Ничего не произошло.'];
        if (shouldPromptCrystal) {
          emptyLog.push('🧿 Энка на нуле. Можно активировать Кристалл ночи.');
        }
        set({
          stage: 'event',
          nightEnergy: nextEnergy,
          currentEvent: {
            type: 'empty',
            title: 'Пустое событие',
            description: 'Ничего не произошло.',
          },
          showCrystalPrompt: shouldPromptCrystal,
          combatLog: emptyLog,
        });
        return { ok: true, message: 'Пустое событие обработано.' };
      },

      dismissEvent: () => {
        const state = get();
        if (state.stage !== 'event') return;

        if (state.nightEnergy <= 0 && state.crystalUsedThisNight) {
          const cooldownEndsAt = Date.now() + HUNT_PATCH_CONSTANTS.nightCooldownMs;
          set({
            stage: 'cooldown',
            currentEvent: null,
            currentEnemy: null,
            combatFamiliar: null,
            showCrystalPrompt: false,
            selectedLocation: null,
            nightCooldownEndsAt: cooldownEndsAt,
            crystalUsedThisNight: false,
            shouldReturnToHub: true,
            combatLog: [...state.combatLog, '☀️ Энка исчерпана. Ночь окончена, начался 4-часовой КД.'],
          });
          return;
        }

        set({
          stage: 'location',
          currentEvent: null,
        });
      },

      activateCrystal: () => {
        const state = get();
        if (!state.showCrystalPrompt || state.nightEnergy > 0 || state.crystalUsedThisNight) {
          return;
        }
        set({
          showCrystalPrompt: false,
          stage: 'location',
          currentEvent: null,
          nightEnergy: Math.min(HUNT_PATCH_CONSTANTS.maxEnka, state.nightEnergy + HUNT_PATCH_CONSTANTS.crystalBonus),
          crystalUsedThisNight: true,
          combatLog: [...state.combatLog, '🧿 Кристалл ночи активирован: +40 энки.'],
        });
      },

      declineCrystal: () => {
        const state = get();
        if (!state.showCrystalPrompt) return;
        const cooldownEndsAt = Date.now() + HUNT_PATCH_CONSTANTS.nightCooldownMs;
        set({
          showCrystalPrompt: false,
          stage: 'cooldown',
          currentEvent: null,
          currentEnemy: null,
          combatFamiliar: null,
          selectedLocation: null,
          nightCooldownEndsAt: cooldownEndsAt,
          crystalUsedThisNight: false,
          shouldReturnToHub: true,
          combatLog: [...state.combatLog, '☀️ Вы отказались от кристалла. Начался 4-часовой КД.'],
        });
      },

      useHuntPotion: () => {
        const state = get();
        if (state.droppedPotions <= 0) {
          return { ok: false, message: 'Нет зелья лечения из Грота.' };
        }
        const heal = 35;
        const hpBefore = profileHp();
        const hpAfter = Math.min(profileMaxHp(), hpBefore + heal);
        setProfileHp(hpAfter);
        set({
          droppedPotions: state.droppedPotions - 1,
          combatLog: [...state.combatLog, `🧪 Использовано зелье лечения. Восстановлено ${hpAfter - hpBefore} HP.`],
        });
        return { ok: true, message: `HP восстановлено на ${hpAfter - hpBefore}.` };
      },

      attackEnemy: (stats) => {
        const state = get();
        if (state.stage !== 'combat' || !state.currentEnemy) return;

        const enemy = copy(state.currentEnemy);
        const playerAttack = calculateAttack(stats, state.hunger, state.purchasedAbilityIds, state.selectedPatronFamiliarId);
        const playerDamage = Math.max(1, playerAttack - enemy.defense + randomInt(0, 2));
        enemy.hp = Math.max(0, enemy.hp - playerDamage);

        const nextLog = [...state.combatLog, `🧛 Вампир нанёс ${playerDamage} урона.`];
        let familiar = state.combatFamiliar ? copy(state.combatFamiliar) : null;
        let activeFamiliar = state.activeFamiliar ? copy(state.activeFamiliar) : null;

        if (familiar && familiar.attack > 0 && enemy.hp > 0) {
          const familiarDamage = Math.max(1, familiar.attack - enemy.defense + randomInt(0, 1));
          enemy.hp = Math.max(0, enemy.hp - familiarDamage);
          nextLog.push(`${familiar.portrait} ${familiar.name} нанес(ла) ${familiarDamage} урона.`);
        }

        if (enemy.hp <= 0) {
          nextLog.push('🩸 Враг на грани смерти. Выберите финальное действие.');
          set({
            stage: 'final_choice',
            currentEnemy: { ...enemy, hp: 0 },
            combatLog: nextLog,
            combatFamiliar: familiar,
            activeFamiliar,
          });
          return;
        }

        const playerDefense = calculateDefense(stats, state.purchasedAbilityIds, state.selectedPatronFamiliarId);
        const enemyDamage = Math.max(1, enemy.attack - playerDefense + randomInt(0, 2));

        if (familiar) {
          const dodge = Math.random() < familiar.dodgeChance;
          if (dodge) {
            nextLog.push(`${familiar.portrait} ${familiar.name} уклоняется от удара.`);
          } else {
            familiar.hp = Math.max(0, familiar.hp - enemyDamage);
            nextLog.push(`💥 ${enemy.name} атакует фамильяра на ${enemyDamage} урона.`);
            if (familiar.hp <= 0) {
              nextLog.push(`☠️ Фамильяр "${familiar.name}" погиб.`);
              if (!familiar.temporary && activeFamiliar && activeFamiliar.id === familiar.id) {
                activeFamiliar = null;
              }
              familiar = null;
            }
          }
        } else {
          const currentHp = profileHp();
          const nextHp = Math.max(1, currentHp - enemyDamage);
          setProfileHp(nextHp);
          nextLog.push(`🩸 ${enemy.name} наносит вам ${enemyDamage} урона.`);
        }

        set({
          currentEnemy: enemy,
          combatLog: nextLog,
          combatFamiliar: familiar,
          activeFamiliar,
        });
      },

      useSkill: (stats) => {
        const state = get();
        if (state.stage !== 'combat' || !state.currentEnemy) return;

        const nextLog = [...state.combatLog];
        if (!state.purchasedAbilityIds.includes('summon_bats')) {
          nextLog.push('🔒 Навык "Призыв летучих мышей" не изучен.');
          set({ combatLog: nextLog });
          return;
        }
        if (state.combatFamiliar || state.activeFamiliar) {
          nextLog.push('⚠️ Навык недоступен: уже есть активный фамильяр.');
          set({ combatLog: nextLog });
          return;
        }
        if (state.hunger < HUNT_PATCH_CONSTANTS.summonBatsHungerCost) {
          nextLog.push('🍽️ Недостаточно голода для применения навыка.');
          set({ combatLog: nextLog });
          return;
        }

        const familiar = createSummonedBats();
        const hunger = Math.max(0, state.hunger - HUNT_PATCH_CONSTANTS.summonBatsHungerCost);
        const enemy = copy(state.currentEnemy);
        const playerDefense = calculateDefense(stats, state.purchasedAbilityIds, state.selectedPatronFamiliarId);
        const enemyDamage = Math.max(1, enemy.attack - playerDefense + randomInt(0, 2));
        const updatedLog = [...nextLog, '🦇 Вы призвали летучих мышей (временная защита).'];

        const dodge = Math.random() < familiar.dodgeChance;
        if (dodge) {
          updatedLog.push('🦇 Летучие мыши увернулись от ответного удара.');
          set({
            hunger,
            combatFamiliar: familiar,
            combatLog: updatedLog,
          });
          return;
        }

        updatedLog.push(`💥 ${enemy.name} сразу атакует мышей на ${enemyDamage} урона.`);
        updatedLog.push('☁️ Призванные мыши рассеялись.');
        set({
          hunger,
          combatFamiliar: null,
          combatLog: updatedLog,
        });
      },

      tryEscape: (stats) => {
        const state = get();
        if (state.stage !== 'combat' || !state.currentEnemy) return;

        if (state.hunger <= HUNT_PATCH_CONSTANTS.lowHungerThreshold) {
          set({
            combatLog: [...state.combatLog, '🚫 При низком голоде побег недоступен.'],
          });
          return;
        }

        const enemy = copy(state.currentEnemy);
        const chance = calculateEscapeChance(stats, state.purchasedAbilityIds, state.selectedPatronFamiliarId);
        const escaped = Math.random() < chance;

        if (escaped) {
          let activeFamiliar = state.activeFamiliar;
          if (state.combatFamiliar && !state.combatFamiliar.temporary && state.combatFamiliar.hp > 0) {
            activeFamiliar = copy(state.combatFamiliar);
          }
          const nextLog = [...state.combatLog, '🏃 Вы успешно скрылись в тени.'];

          if (state.nightEnergy <= 0 && state.crystalUsedThisNight) {
            const cooldownEndsAt = Date.now() + HUNT_PATCH_CONSTANTS.nightCooldownMs;
            set({
              stage: 'cooldown',
              currentEnemy: null,
              currentEvent: null,
              combatFamiliar: null,
              activeFamiliar,
              selectedLocation: null,
              crystalUsedThisNight: false,
              nightCooldownEndsAt: cooldownEndsAt,
              shouldReturnToHub: true,
              combatLog: [...nextLog, '☀️ Ночь завершена. Начался 4-часовой КД.'],
            });
            return;
          }

          const showCrystalPrompt = state.nightEnergy <= 0 && !state.crystalUsedThisNight;
          set({
            stage: 'event',
            currentEnemy: null,
            currentEvent: {
              type: 'empty',
              title: 'Отступление',
              description: 'Вы покинули схватку и продолжаете охоту.',
            },
            combatFamiliar: null,
            activeFamiliar,
            showCrystalPrompt,
            combatLog: showCrystalPrompt
              ? [...nextLog, '🧿 Энка на нуле. Можно активировать Кристалл ночи.']
              : nextLog,
          });
          return;
        }

        const nextLog = [...state.combatLog, '⚠️ Побег не удался.'];
        const playerDefense = calculateDefense(stats, state.purchasedAbilityIds, state.selectedPatronFamiliarId);
        const enemyDamage = Math.max(1, enemy.attack - playerDefense + randomInt(0, 2));

        if (state.combatFamiliar) {
          const familiar = copy(state.combatFamiliar);
          const dodge = Math.random() < familiar.dodgeChance;
          if (dodge) {
            nextLog.push(`${familiar.portrait} ${familiar.name} принимает удар и уклоняется.`);
            set({ combatLog: nextLog });
            return;
          }
          familiar.hp = Math.max(0, familiar.hp - enemyDamage);
          nextLog.push(`💥 ${enemy.name} бьёт фамильяра на ${enemyDamage} урона.`);
          if (familiar.hp <= 0) {
            nextLog.push(`☠️ Фамильяр "${familiar.name}" погиб.`);
            set({
              combatFamiliar: null,
              activeFamiliar: familiar.temporary ? state.activeFamiliar : null,
              combatLog: nextLog,
            });
            return;
          }
          set({
            combatFamiliar: familiar,
            combatLog: nextLog,
          });
          return;
        }

        const currentHp = profileHp();
        const nextHp = Math.max(1, currentHp - enemyDamage);
        setProfileHp(nextHp);
        set({
          combatLog: [...nextLog, `🩸 ${enemy.name} наносит вам ${enemyDamage} урона.`],
        });
      },

      applyFinalChoice: (choice) => {
        const state = get();
        if (state.stage !== 'final_choice' || !state.currentEnemy) return;

        const enemy = copy(state.currentEnemy);
        const nextLog = [...state.combatLog];
        let xpReward = enemy.rewardXp;
        let hunger = state.hunger;
        let familiarToKeep = state.activeFamiliar ? copy(state.activeFamiliar) : null;

        if (state.combatFamiliar && !state.combatFamiliar.temporary && state.combatFamiliar.hp > 0) {
          familiarToKeep = copy(state.combatFamiliar);
        }

        if (choice === 'execute') {
          xpReward = Math.round(enemy.rewardXp * 1.5);
          nextLog.push(`🗡️ Добивание: +${xpReward} XP.`);
        }

        if (choice === 'drain') {
          const hpBefore = profileHp();
          const hpAfter = Math.min(profileMaxHp(), hpBefore + enemy.maxHp);
          setProfileHp(hpAfter);
          hunger = 100;
          nextLog.push(`🩸 Выпить досуха: +${xpReward} XP, восстановлено ${hpAfter - hpBefore} HP, голод = 100.`);
        }

        if (choice === 'hypnosis') {
          const chance = getHypnosisChance(state.purchasedAbilityIds);
          const success = Math.random() < chance;
          if (success && enemy.canBecomeFamiliar) {
            familiarToKeep = createFamiliarFromEnemy(enemy);
            nextLog.push(`🌀 Гипноз успешен (${Math.round(chance * 100)}%). ${enemy.name} стал фамильяром.`);
          } else {
            nextLog.push(`🌀 Гипноз не сработал (${Math.round(chance * 100)}%). Получено +${xpReward} XP.`);
          }
        }

        if (state.combatFamiliar?.temporary) {
          nextLog.push('🦇 Призванные мыши исчезают после боя.');
        }

        if (state.purchasedAbilityIds.includes('grot_instinct') && state.currentEvent?.type === 'battle') {
          xpReward = Math.round(xpReward * 1.1);
          nextLog.push('📚 Инстинкт Грота: бонус +10% XP.');
        }

        addProfileXp(xpReward);

        if (state.nightEnergy <= 0 && state.crystalUsedThisNight) {
          const cooldownEndsAt = Date.now() + HUNT_PATCH_CONSTANTS.nightCooldownMs;
          set({
            stage: 'cooldown',
            currentEnemy: null,
            currentEvent: null,
            combatFamiliar: null,
            activeFamiliar: familiarToKeep,
            selectedLocation: null,
            showCrystalPrompt: false,
            crystalUsedThisNight: false,
            nightCooldownEndsAt: cooldownEndsAt,
            hunger,
            shouldReturnToHub: true,
            combatLog: [...nextLog, '☀️ Энка исчерпана. Начался 4-часовой КД.'],
          });
          return;
        }

        const showCrystalPrompt = state.nightEnergy <= 0 && !state.crystalUsedThisNight;
        set({
          stage: 'event',
          currentEnemy: null,
          currentEvent: {
            type: 'empty',
            title: 'Схватка завершена',
            description: 'Вы можете продолжить поиск события.',
          },
          combatFamiliar: null,
          activeFamiliar: familiarToKeep,
          showCrystalPrompt,
          hunger,
          combatLog: showCrystalPrompt ? [...nextLog, '🧿 Энка на нуле. Можно активировать Кристалл ночи.'] : nextLog,
        });
      },

      buyAbility: (abilityId, totalXp) => {
        const state = get();
        const ability = ABILITY_CARDS.find((entry) => entry.id === abilityId);
        if (!ability) {
          return { ok: false, message: 'Способность не найдена.' };
        }
        if (state.purchasedAbilityIds.includes(abilityId)) {
          return { ok: false, message: 'Способность уже куплена.' };
        }

        const availableXp = Math.max(0, totalXp - state.spentXp);
        if (availableXp < ability.costXp) {
          return { ok: false, message: 'Недостаточно XP для покупки.' };
        }

        set({
          purchasedAbilityIds: [...state.purchasedAbilityIds, abilityId],
          spentXp: state.spentXp + ability.costXp,
        });
        return { ok: true, message: `Изучено: ${ability.name}.` };
      },

      selectPatronFamiliar: (patronId) => {
        const state = get();
        const patron = PATRON_FAMILIARS.find((entry) => entry.id === patronId);
        if (!patron) {
          return { ok: false, message: 'Неизвестный донатный фамильяр.' };
        }
        if (state.stage === 'combat' || state.stage === 'final_choice') {
          return { ok: false, message: 'Донатного фамильяра можно менять только вне охоты.' };
        }
        set({ selectedPatronFamiliarId: patronId });
        return { ok: true, message: `Выбран: ${patron.name}.` };
      },

      addCombatLog: (message) => {
        set((state) => ({
          combatLog: [...state.combatLog, message],
        }));
      },

      getCooldownRemainingMs: () => {
        const endsAt = get().nightCooldownEndsAt;
        if (!endsAt) return 0;
        return Math.max(0, endsAt - Date.now());
      },

      getAvailableXp: (totalXp) => Math.max(0, totalXp - get().spentXp),

      isAbilityOwned: (abilityId) => get().purchasedAbilityIds.includes(abilityId),

      getCombatPlayerSnapshot: (stats) => {
        const state = get();
        return {
          attack: calculateAttack(stats, state.hunger, state.purchasedAbilityIds, state.selectedPatronFamiliarId),
          defense: calculateDefense(stats, state.purchasedAbilityIds, state.selectedPatronFamiliarId),
          hunger: state.hunger,
          lowHunger: state.hunger <= HUNT_PATCH_CONSTANTS.lowHungerThreshold,
          canEscape: state.hunger > HUNT_PATCH_CONSTANTS.lowHungerThreshold,
        };
      },
    }),
    {
      name: 'patch11-hunt-storage',
      partialize: (state) => ({
        nightEnergy: state.nightEnergy,
        nightCooldownEndsAt: state.nightCooldownEndsAt,
        crystalUsedThisNight: state.crystalUsedThisNight,
        hunger: state.hunger,
        droppedPotions: state.droppedPotions,
        activeFamiliar: state.activeFamiliar,
        purchasedAbilityIds: state.purchasedAbilityIds,
        spentXp: state.spentXp,
        selectedPatronFamiliarId: state.selectedPatronFamiliarId,
      }),
    },
  ),
);

export const patch11AbilityCards: AbilityCard[] = ABILITY_CARDS;
export const patch11PatronFamiliars: PatronFamiliar[] = PATRON_FAMILIARS;
