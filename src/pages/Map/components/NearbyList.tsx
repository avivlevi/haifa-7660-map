import { ChevronDown, ChevronUp, MapPin, AlertCircle, X } from 'lucide-react'
import { useState } from 'react'
import { LocationCard } from './LocationCard'
import type { LocationWithDistance } from '../hooks/useNearbyLocations'

interface Props {
  locations: LocationWithDistance[]
  selectedId: string | null
  onSelect: (id: string, lat: number, lng: number) => void
  radiusM: number
  onRadiusChange: (r: number) => void
  incidentAddress: string
  onClear: () => void
  fillHeight?: boolean
}

const RADII = [500, 1000, 2000, 5000]
const RADIUS_LABELS: Record<number, string> = {
  500:  '500 מ\'',
  1000: '1 ק"מ',
  2000: '2 ק"מ',
  5000: '5 ק"מ',
}

export const NearbyList = ({
  locations,
  selectedId,
  onSelect,
  radiusM,
  onRadiusChange,
  incidentAddress,
  onClear,
  fillHeight = false,
}: Props) => {
  const [expanded, setExpanded] = useState(true)

  return (
    <div
      className="flex flex-col bg-white rounded-t-2xl md:rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
      style={{ direction: 'rtl' }}
    >
      {/* Header — tap to collapse on mobile */}
      <button
        className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <div className="text-right">
            <p className="text-sm font-bold text-gray-900">מקומות בסביבה</p>
            {incidentAddress && (
              <p className="text-xs text-gray-500 truncate max-w-[200px]">{incidentAddress}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 bg-gray-200 rounded-full px-2 py-0.5">
            {locations.length}
          </span>
          <button
            onClick={e => { e.stopPropagation(); onClear() }}
            className="p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            aria-label="נקה סימון"
          >
            <X className="h-4 w-4" />
          </button>
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </button>

      {expanded && (
        <>
          {/* Radius selector */}
          <div className="flex gap-2 px-4 py-2 border-b border-gray-100 overflow-x-auto scrollbar-none">
            <span className="text-xs text-gray-500 self-center shrink-0 ms-1">רדיוס:</span>
            {RADII.map(r => (
              <button
                key={r}
                onClick={() => onRadiusChange(r)}
                className="shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-colors"
                style={{
                  backgroundColor: radiusM === r ? '#3B82F6' : '#F1F5F9',
                  color: radiusM === r ? 'white' : '#64748B',
                }}
              >
                {RADIUS_LABELS[r]}
              </button>
            ))}
          </div>

          {/* Location list */}
          <div
            className="overflow-y-auto flex-1 p-3 space-y-2"
            style={fillHeight ? undefined : { maxHeight: '55vh' }}
          >
            {locations.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <MapPin className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">אין מקומות ברדיוס שנבחר</p>
              </div>
            ) : (
              locations.map(loc => (
                <LocationCard
                  key={loc.id}
                  location={loc}
                  selected={selectedId === loc.id}
                  onClick={() => onSelect(loc.id, loc.lat, loc.lng)}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
