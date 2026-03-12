import { memo } from 'react';
import { motion } from 'framer-motion';
import { Enemy } from '../../api/game';
import { HealthBar } from './HealthBar';

interface EnemyCardProps {
  enemy: Enemy;
}

// Мемоизация маппинга имен врагов
const ENEMY_NAMES: Record<string, string> = {
  wolf: '🐺 Волк',
  vampire_hunter: '🗡️ Охотник на вампиров',
  witch: '🧙‍♀️ Ведьма',
  demon: '👹 Демон',
  angel: '👼 Ангел',
};

export const EnemyCard = memo(function EnemyCard({ enemy }: EnemyCardProps) {
  const displayName = ENEMY_NAMES[enemy.type] || `👾 ${enemy.type}`;
  const emoji = displayName.split(' ')[0];

  return (
    <motion.div
      className="bg-gray-800 rounded-xl p-6 w-full max-w-sm mx-auto"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      key={enemy.hp}
    >
      <div className="text-center mb-4">
        <motion.div
          className="text-6xl mb-2"
          animate={enemy.hp < enemy.maxHp * 0.3 ? { shake: [0, -10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.5 }}
        >
          {emoji}
        </motion.div>
        <h3 className="text-white font-bold text-lg">{displayName}</h3>
        <p className="text-gray-400 text-sm">Уровень {enemy.level}</p>
      </div>

      <div className="space-y-3">
        <HealthBar
          current={enemy.hp}
          max={enemy.maxHp}
          label="HP Врага"
          color="red"
          showValue={true}
        />
        <div className="text-center text-gray-400 text-sm">
          ⚔️ Урон: {enemy.damage}
        </div>
      </div>
    </motion.div>
  );
});
