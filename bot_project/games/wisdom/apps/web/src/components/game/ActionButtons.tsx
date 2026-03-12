interface ActionButtonsProps {
  onAttack: () => void;
  onEscape: () => void;
  onFeed: () => void;
  canFeed: boolean;
  isLoading?: boolean;
}

export function ActionButtons({
  onAttack,
  onEscape,
  onFeed,
  canFeed,
  isLoading = false,
}: ActionButtonsProps) {
  return (
    <div className="grid grid-cols-3 gap-3 w-full max-w-sm mx-auto mt-4">
      <button
        onClick={onAttack}
        disabled={isLoading}
        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-bold py-4 px-6 rounded-xl transition-all active:scale-95 flex flex-col items-center"
      >
        <span className="text-2xl">⚔️</span>
        <span className="text-xs mt-1">Атака</span>
      </button>

      <button
        onClick={onEscape}
        disabled={isLoading}
        className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white font-bold py-4 px-6 rounded-xl transition-all active:scale-95 flex flex-col items-center"
      >
        <span className="text-2xl">🏃</span>
        <span className="text-xs mt-1">Побег</span>
      </button>

      <button
        onClick={onFeed}
        disabled={!canFeed || isLoading}
        className={`font-bold py-4 px-6 rounded-xl transition-all active:scale-95 flex flex-col items-center ${
          canFeed
            ? 'bg-purple-600 hover:bg-purple-700 text-white'
            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
        }`}
      >
        <span className="text-2xl">🩸</span>
        <span className="text-xs mt-1">Поглощение</span>
      </button>
    </div>
  );
}
