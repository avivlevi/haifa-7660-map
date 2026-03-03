import type React from 'react'
import type { LocationWithDistance } from '../hooks/useNearbyLocations'
import { CATEGORY_COLORS, CATEGORY_LABELS, CATEGORY_ICONS } from '../data/locations'

interface Props {
  location: LocationWithDistance
  onClick: () => void
  selected: boolean
  className?: string
  style?: React.CSSProperties
}

function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)} מ'`
  return `${(m / 1000).toFixed(1)} ק"מ`
}

export const LocationCard = ({ location, onClick, selected, className = '', style: extraStyle }: Props) => {
  const color = CATEGORY_COLORS[location.category]
  const Icon  = CATEGORY_ICONS[location.category]

  return (
    <button
      onClick={onClick}
      className={`w-full text-right px-2.5 py-2 rounded-lg border transition-all active:scale-95 ${className}`}
      style={{
        backgroundColor: selected ? `${color}12` : 'white',
        borderColor: selected ? color : '#f1f5f9',
        direction: 'rtl',
        ...extraStyle,
      }}
    >
      {/* Row 1: icon + name + distance */}
      <div className="flex items-center gap-2">
        <Icon className="h-3 w-3 shrink-0" style={{ color }} />
        <span className="font-semibold text-xs text-gray-900 truncate flex-1 leading-tight">
          {location.name}
        </span>
        <span
          className="shrink-0 text-[10px] font-medium px-1.5 py-px rounded-full leading-tight"
          style={{ backgroundColor: `${color}12`, color, border: `1px solid ${color}30` }}
        >
          {formatDistance(location.distanceM)}
        </span>
      </div>

      {/* Row 2: category chip + address */}
      <div className="flex items-center gap-1.5 mt-0.5 ps-4 min-w-0">
        <span
          className="shrink-0 flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-px rounded-full leading-tight"
          style={{ backgroundColor: `${color}12`, color, border: `1px solid ${color}30` }}
        >
          <Icon className="h-2 w-2" />
          {CATEGORY_LABELS[location.category]}
        </span>
        <span className="text-[10px] text-gray-400 truncate leading-tight">{location.address}</span>
      </div>
    </button>
  )
}
