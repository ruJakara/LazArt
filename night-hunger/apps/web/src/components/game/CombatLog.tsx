import { motion } from 'framer-motion';

interface CombatLogProps {
  logs: string[];
}

export function CombatLog({ logs }: CombatLogProps) {
  return (
    <div className="bg-gray-800 rounded-xl p-4 w-full max-w-sm mx-auto mt-4">
      <h4 className="text-gray-400 text-sm font-semibold mb-2">📜 Журнал боя</h4>
      <div className="h-32 overflow-y-auto space-y-1">
        {logs.length === 0 ? (
          <p className="text-gray-500 text-sm">Бой еще не начался...</p>
        ) : (
          logs.map((log, index) => (
            <motion.p
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="text-gray-300 text-sm"
            >
              {log}
            </motion.p>
          ))
        )}
      </div>
    </div>
  );
}
