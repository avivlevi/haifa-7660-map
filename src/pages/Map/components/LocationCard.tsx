import { Phone, MapPin, Users } from 'lucide-react'
import type { LocationWithDistance } from '../hooks/useNearbyLocations'
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../data/locations'

interface Props {
  location: LocationWithDistance
  onClick: () => void
  selected: boolean
}

function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)} מ'`
  return `${(m / 1000).toFixed(1)} ק"מ`
}

export const LocationCard = ({ location, onClick, selected }: Props) => {
  const color = CATEGORY_COLORS[location.category]

  return (
    <button
      onClick={onClick}
      className="w-full text-right p-3 rounded-xl border transition-all hover:shadow-md active:scale-95"
      style={{
        backgroundColor: selected ? `${color}15` : 'white',
        borderColor: selected ? color : '#e2e8f0',
        direction: 'rtl',
      }}
    >
      <div className="flex items-start gap-3">
        {/* Color dot */}
        <div
          className="mt-1 w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
        <div className="flex-1 min-w-0">
          {/* Name + distance */}
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-sm text-gray-900 truncate">{location.name}</span>
            <span
              className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${color}20`, color }}
            >
              {formatDistance(location.distanceM)}
            </span>
          </div>

          {/* Category */}
          <p className="text-xs text-gray-500 mt-0.5">{CATEGORY_LABELS[location.category]}</p>

          {/* Address */}
          <div className="flex items-center gap-1 mt-1">
            <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
            <span className="text-xs text-gray-600 truncate">{location.address}</span>
          </div>

          {/* Capacity */}
          {location.capacity && (
            <div className="flex items-center gap-1 mt-0.5">
              <Users className="h-3 w-3 text-gray-400 shrink-0" />
              <span className="text-xs text-gray-600">קיבולת: {location.capacity}</span>
            </div>
          )}

          {/* Phone */}
          {location.phone && (
            <a
              href={`tel:${location.phone.replace(/-/g, '')}`}
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1 mt-0.5 w-fit"
            >
              <Phone className="h-3 w-3 shrink-0" style={{ color }} />
              <span className="text-xs font-medium" style={{ color }}>
                {location.phone}
              </span>
            </a>
          )}

          {/* Notes */}
          {location.notes && (
            <p className="text-xs text-gray-400 mt-0.5 italic">{location.notes}</p>
          )}
        </div>
      </div>
    </button>
  )
}
