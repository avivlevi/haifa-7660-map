import { ChevronDown, ChevronUp, MapPin, AlertCircle, X } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
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
  defaultExpanded?: boolean
  listMaxHeight?: number
}

const RADII = [500, 1000, 2000]
const RADIUS_LABELS: Record<number, string> = {
  500:  '500מ\'',
  1000: '1 ק"מ',
  2000: '2 ק"מ',
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
  defaultExpanded = false,
  listMaxHeight,
}: Props) => {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const touchStartY = useRef(0)
  const didDrag = useRef(false)

  useEffect(() => {
    setExpanded(defaultExpanded)
  }, [incidentAddress, defaultExpanded])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
    didDrag.current = false
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = touchStartY.current - e.changedTouches[0].clientY
    if (Math.abs(delta) > 40) {
      didDrag.current = true
      setExpanded(delta > 0)
    }
  }

  const handleHeaderClick = () => {
    if (didDrag.current) { didDrag.current = false; return }
    setExpanded(e => !e)
  }

  return (
    <div
      className="flex flex-col bg-white/95 backdrop-blur-xl rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden"
      style={{ direction: 'rtl' }}
    >
      {/* Drag handle — mobile only */}
      <div
        className="md:hidden flex justify-center pt-2 pb-0.5 cursor-grab touch-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="w-8 h-[3px] rounded-full bg-gray-200" />
      </div>

      {/* Header — production size */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
        onClick={handleHeaderClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && handleHeaderClick()}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <AlertCircle className="h-4 w-4 text-red-500" />
          </div>
          <div className="text-right min-w-0">
            <p className="text-sm font-bold text-gray-900 leading-tight">מקומות בסביבה</p>
            {incidentAddress && (
              <p className="text-xs text-gray-400 truncate max-w-[200px] md:max-w-[320px] leading-tight">{incidentAddress}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-white bg-red-500 rounded-full px-2 py-0.5 min-w-[24px] text-center">
            {locations.length}
          </span>
          <button
            onClick={e => { e.stopPropagation(); onClear() }}
            className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors active:scale-90"
            aria-label="נקה סימון"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          {expanded
            ? <ChevronDown className="h-4 w-4 text-gray-400" />
            : <ChevronUp   className="h-4 w-4 text-gray-400" />
          }
        </div>
      </div>

      {/* Animated expand/collapse */}
      <div
        className="grid transition-grid duration-500 ease-ios"
        style={{ gridTemplateRows: expanded ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden flex flex-col min-h-0">
          <div className="mx-4 border-t border-gray-100" />

          {/* Radius selector */}
          <div className="flex gap-2 px-4 pt-2.5 pb-1.5 items-center">
            <span className="text-xs text-gray-400 font-medium shrink-0">רדיוס:</span>
            {RADII.map(r => (
              <button
                key={r}
                onClick={() => onRadiusChange(r)}
                className="shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all active:scale-90"
                style={{
                  backgroundColor: radiusM === r ? '#3B82F6' : '#F1F5F9',
                  color: radiusM === r ? 'white' : '#64748B',
                  boxShadow: radiusM === r ? '0 2px 8px rgba(59,130,246,0.3)' : 'none',
                }}
              >
                {RADIUS_LABELS[r]}
              </button>
            ))}
          </div>

          {/* Location list */}
          <div
            className="overflow-y-auto flex-1 px-2 py-2 space-y-1"
            style={fillHeight ? undefined : { maxHeight: `${listMaxHeight ?? 160}px` }}
          >
            {locations.length === 0 ? (
              <div className="text-center py-6 text-gray-400 fade-in-delayed">
                <MapPin className="h-6 w-6 mx-auto mb-1.5 opacity-30" />
                <p className="text-xs">אין מקומות ברדיוס שנבחר</p>
              </div>
            ) : (
              locations.map((loc, i) => (
                <LocationCard
                  key={loc.id}
                  location={loc}
                  selected={selectedId === loc.id}
                  onClick={() => onSelect(loc.id, loc.lat, loc.lng)}
                  className="card-animate-in"
                  style={{ '--card-delay': `${Math.min(i * 30, 250)}ms` } as React.CSSProperties}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
