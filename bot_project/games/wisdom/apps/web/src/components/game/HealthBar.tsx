import { ProgressBar } from '../common/ProgressBar';

interface HealthBarProps {
  current: number;
  max: number;
  label?: string;
  color?: 'green' | 'red' | 'blue';
  showValue?: boolean;
}

export function HealthBar({
  current,
  max,
  label,
  color = 'green',
  showValue = true,
}: HealthBarProps) {
  const colorMap = {
    green: 'bg-green-500',
    red: 'bg-red-500',
    blue: 'bg-blue-500',
  };

  return (
    <ProgressBar
      value={current}
      max={max}
      color={colorMap[color]}
      label={label}
      showValue={showValue}
    />
  );
}
