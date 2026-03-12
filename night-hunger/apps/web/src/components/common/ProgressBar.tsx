import { memo, useMemo } from 'react';

interface ProgressBarProps {
  value: number;
  max: number;
  color: string;
  label?: string;
  showValue?: boolean;
}

export const ProgressBar = memo(function ProgressBar({
  value,
  max,
  color,
  label,
  showValue = true,
}: ProgressBarProps) {
  // Мемоизация вычисления процента
  const percentage = useMemo(
    () => Math.min(100, Math.max(0, (value / max) * 100)),
    [value, max]
  );

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-400">{label}</span>
          {showValue && (
            <span className="text-gray-300">
              {value} / {max}
            </span>
          )}
        </div>
      )}
      <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
});
