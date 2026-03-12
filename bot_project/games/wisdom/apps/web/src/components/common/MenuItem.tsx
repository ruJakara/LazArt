import { memo } from 'react';

interface MenuItemProps {
  label: string;
  path: string;
  color: string;
  onClick: () => void;
  icon?: string;
}

export const MenuItem = memo(function MenuItem({
  label,
  path,
  color,
  onClick,
  icon,
}: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      className={`${color} w-full py-4 px-6 rounded-xl font-semibold text-white
        active:scale-95 transition-transform shadow-lg flex items-center justify-center gap-2`}
    >
      {icon && <span className="text-xl">{icon}</span>}
      {label}
    </button>
  );
});
