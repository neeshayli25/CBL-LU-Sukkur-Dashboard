import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// ============================================================
// KpiTile — Flat enterprise KPI tile
// SAP Fiori Analytics Tile pattern
// ============================================================

type AccentColor = 'primary' | 'danger' | 'warning' | 'success' | 'info' | 'neutral';

interface KpiTileProps {
  label: string;
  value: string | number;
  unit?: string;
  /** Positive = up trend, negative = down trend */
  trend?: number;
  trendLabel?: string;
  icon: React.ReactNode;
  accent?: AccentColor;
  onClick?: () => void;
  className?: string;
}

const ACCENT_MAP: Record<AccentColor, { bar: string; iconBg: string; iconColor: string }> = {
  primary: { bar: '#CB0017', iconBg: '#FFF7F7', iconColor: '#CB0017' },
  danger:  { bar: '#B3001B', iconBg: '#FEF2F2', iconColor: '#B3001B' },
  warning: { bar: '#DC8E00', iconBg: '#FFFBEB', iconColor: '#B45309' },
  success: { bar: '#1B7C1B', iconBg: '#ECFDF5', iconColor: '#065F46' },
  info:    { bar: '#0C71D1', iconBg: '#EFF6FF', iconColor: '#1D4ED8' },
  neutral: { bar: '#6B7280', iconBg: '#F9FAFB', iconColor: '#374151' },
};

export const KpiTile: React.FC<KpiTileProps> = ({
  label,
  value,
  unit,
  trend,
  trendLabel,
  icon,
  accent = 'primary',
  onClick,
  className = '',
}) => {
  const a = ACCENT_MAP[accent];

  // For HSE: up trend on incidents is BAD (red), up trend on training is GOOD (green)
  // We let the consumer decide by using accent color as signal
  const trendBad  = accent === 'danger' || accent === 'primary';
  const trendUp   = trend !== undefined && trend > 0;
  const trendDown = trend !== undefined && trend < 0;

  const trendColor =
    trendUp   ? (trendBad ? '#DC2626' : '#16A34A') :
    trendDown ? (trendBad ? '#16A34A' : '#DC2626') :
    '#9CA3AF';

  const TrendIcon = trendUp ? TrendingUp : trendDown ? TrendingDown : Minus;

  return (
    <div
      className={`bg-white border border-[#E0E0E0] rounded-lg flex flex-col relative overflow-hidden transition-shadow duration-150
        ${onClick ? 'cursor-pointer hover:shadow-[0_3px_14px_0_rgba(0,0,0,0.10)]' : 'hover:shadow-[0_2px_8px_0_rgba(0,0,0,0.08)]'}
        ${className}`}
      style={{ boxShadow: '0 1px 4px 0 rgba(0,0,0,0.06)', padding: '16px' }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Top accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{ backgroundColor: a.bar }}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-3 mt-1">
        <p
          className="text-[12px] font-medium leading-tight"
          style={{ color: '#6B7280', maxWidth: 'calc(100% - 40px)' }}
        >
          {label}
        </p>
        <div
          className="p-1.5 rounded shrink-0"
          style={{ backgroundColor: a.iconBg, color: a.iconColor }}
        >
          <span className="[&>svg]:h-4 [&>svg]:w-4 block">{icon}</span>
        </div>
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1.5">
        <span
          className="leading-none tabular-nums"
          style={{ fontSize: '26px', fontWeight: 700, color: '#1A1818' }}
        >
          {value}
        </span>
        {unit && (
          <span className="text-[13px] font-medium" style={{ color: '#9CA3AF' }}>{unit}</span>
        )}
      </div>

      {/* Trend */}
      {(trend !== undefined || trendLabel) && (
        <div className="flex items-center gap-1 mt-2">
          {trend !== undefined && (
            <>
              <TrendIcon
                style={{ width: 12, height: 12, color: trendColor, flexShrink: 0 }}
              />
              <span className="text-[11px] font-semibold" style={{ color: trendColor }}>
                {Math.abs(trend)}
              </span>
            </>
          )}
          {trendLabel && (
            <span className="text-[11px]" style={{ color: '#9CA3AF' }}>{trendLabel}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default KpiTile;
