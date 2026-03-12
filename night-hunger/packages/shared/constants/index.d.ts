export declare const GAME_CONFIG: {
    readonly BASE_XP: 100;
    readonly BASE_HP: 100;
    readonly BASE_DAMAGE: 10;
    readonly HUNT_COOLDOWN: 5000;
    readonly ACTION_COOLDOWN: 1000;
    readonly MAX_LEVEL: 100;
    readonly XP_MULTIPLIER: 1.5;
    readonly MIN_DAMAGE: 1;
    readonly MAX_ESCAPE_CHANCE: 90;
    readonly MIN_ESCAPE_CHANCE: 10;
    readonly BASE_UPGRADE_COST: 100;
    readonly BLOOD_PER_LEVEL: 20;
    readonly MAX_ACTIONS_PER_MINUTE: 60;
    readonly SUSPICIOUS_DAMAGE_THRESHOLD: 1000;
};
export declare const ENEMY_TYPES: readonly [{
    readonly type: "wolf";
    readonly baseHp: 50;
    readonly baseDamage: 5;
    readonly xpReward: 50;
}, {
    readonly type: "vampire_hunter";
    readonly baseHp: 80;
    readonly baseDamage: 8;
    readonly xpReward: 80;
}, {
    readonly type: "witch";
    readonly baseHp: 60;
    readonly baseDamage: 12;
    readonly xpReward: 70;
}, {
    readonly type: "demon";
    readonly baseHp: 100;
    readonly baseDamage: 15;
    readonly xpReward: 120;
}, {
    readonly type: "angel";
    readonly baseHp: 70;
    readonly baseDamage: 18;
    readonly xpReward: 100;
}];
export declare const ITEM_TYPES: {
    readonly POTION: "potion";
    readonly SKIN: "skin";
    readonly BOOST: "boost";
};
export declare const SKINS: readonly [{
    readonly id: "default";
    readonly name: "Классический";
    readonly rarity: "common";
}, {
    readonly id: "vampire_lord";
    readonly name: "Вампир Лорд";
    readonly rarity: "legendary";
}, {
    readonly id: "night_stalker";
    readonly name: "Ночной Сталкер";
    readonly rarity: "epic";
}, {
    readonly id: "blood_moon";
    readonly name: "Кровавая Луна";
    readonly rarity: "rare";
}];
