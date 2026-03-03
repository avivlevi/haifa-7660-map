import 'leaflet/dist/leaflet.css'
import { useState, useCallback } from 'react'
import { MapView } from './components/MapView'
import { CategoryFilter } from './components/CategoryFilter'
import { SectionFilter } from './components/SectionFilter'
import { NearbyList } from './components/NearbyList'
import { AddressSearch } from './components/AddressSearch'
import { useNearbyLocations, useAllLocations } from './hooks/useNearbyLocations'
import type { Category, Section } from './data/locations'
import { MapPin } from 'lucide-react'

const ALL_CATEGORIES = new Set<Category>([
  'hospital', 'emergency', 'nursing_home', 'shelter',
  'evacuation', 'school', 'community', 'food', 'gas',
])

const ALL_SECTIONS = new Set<Section>(['west_haifa', 'ramat_carmel', 'tirat_carmel'])

export const MapPage = () => {
  const [activeCategories, setActiveCategories] = useState<Set<Category>>(ALL_CATEGORIES)
  const [activeSections, setActiveSections]     = useState<Set<Section>>(ALL_SECTIONS)
  const [incident, setIncident]                 = useState<{ lat: number; lng: number } | null>(null)
  const [incidentAddress, setIncidentAddress]   = useState('')
  const [radiusM, setRadiusM]                   = useState(1000)
  const [selectedId, setSelectedId]             = useState<string | null>(null)
  const [flyTarget, setFlyTarget]               = useState<{ lat: number; lng: number; trigger: number } | null>(null)

  const allLocations = useAllLocations(activeCategories, activeSections)
  const nearby = useNearbyLocations(incident, radiusM, activeCategories, activeSections)

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setIncident({ lat, lng })
    setIncidentAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`)
    setSelectedId(null)
  }, [])

  const handleAddressSelect = useCallback((lat: number, lng: number, label: string) => {
    setIncident({ lat, lng })
    setIncidentAddress(label)
    setSelectedId(null)
    setFlyTarget({ lat, lng, trigger: Date.now() })
  }, [])

  const handleLocationSelect = useCallback((id: string, lat: number, lng: number) => {
    setSelectedId(id)
    setFlyTarget({ lat, lng, trigger: Date.now() })
  }, [])

  const clearIncident = useCallback(() => {
    setIncident(null)
    setIncidentAddress('')
    setSelectedId(null)
  }, [])

  return (
    <div
      className="relative overflow-hidden"
      style={{ height: '100%', direction: 'rtl' }}
    >
      {/* ── Map (fills everything) ── */}
      <div className="absolute inset-0">
        <MapView
          allLocations={allLocations}
          nearby={nearby}
          incident={incident}
          radiusM={radiusM}
          selectedId={selectedId}
          flyTarget={flyTarget}
          onMapClick={handleMapClick}
          onMarkerClick={(id) => {
            const loc = allLocations.find(l => l.id === id)
            if (loc) handleLocationSelect(id, loc.lat, loc.lng)
          }}
        />
      </div>

      {/* ══════════════════════════════════════════
          DESKTOP: full-height sidebar panel
      ══════════════════════════════════════════ */}
      <div
        className="hidden md:flex flex-col absolute start-0 top-0 h-full z-[2000]"
        style={{ width: 320 }}
      >
        <div className="flex flex-col h-full bg-white/95 backdrop-blur shadow-xl border-e border-gray-200 overflow-hidden">

          {/* Search */}
          <div className="p-3 border-b border-gray-100 shrink-0">
            <AddressSearch onSelect={handleAddressSelect} />
          </div>

          {/* Section filter */}
          <div className="p-3 border-b border-gray-100 shrink-0">
            <p className="text-xs text-gray-400 mb-2 font-medium">אזורים</p>
            <SectionFilter active={activeSections} onChange={setActiveSections} wrap />
          </div>

          {/* Category filter */}
          <div className="p-3 border-b border-gray-100 shrink-0">
            <p className="text-xs text-gray-400 mb-2 font-medium">קטגוריות</p>
            <CategoryFilter active={activeCategories} onChange={setActiveCategories} wrap />
          </div>

          {/* Nearby list or placeholder */}
          {incident ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <NearbyList
                locations={nearby}
                selectedId={selectedId}
                onSelect={handleLocationSelect}
                radiusM={radiusM}
                onRadiusChange={setRadiusM}
                incidentAddress={incidentAddress}
                onClear={clearIncident}
                fillHeight
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3 p-6">
              <MapPin className="h-10 w-10 opacity-25" />
              <p className="text-sm text-center">לחץ על המפה לסימון נקודת פגיעה</p>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          MOBILE: top overlay (search + filters)
      ══════════════════════════════════════════ */}
      <div className="md:hidden absolute top-3 inset-x-3 z-[2000] flex flex-col gap-2">
        <AddressSearch onSelect={handleAddressSelect} />
        <div className="bg-white/90 backdrop-blur rounded-xl shadow-md border border-gray-200 px-3 py-2 flex flex-col gap-2">
          <SectionFilter active={activeSections} onChange={setActiveSections} />
          <div className="border-t border-gray-100" />
          <CategoryFilter active={activeCategories} onChange={setActiveCategories} />
        </div>
      </div>

      {/* ══════════════════════════════════════════
          MOBILE: bottom sheet (nearby list)
      ══════════════════════════════════════════ */}
      {incident && (
        <div className="md:hidden absolute bottom-0 inset-x-0 z-[2000]">
          <NearbyList
            locations={nearby}
            selectedId={selectedId}
            onSelect={handleLocationSelect}
            radiusM={radiusM}
            onRadiusChange={setRadiusM}
            incidentAddress={incidentAddress}
            onClear={clearIncident}
          />
        </div>
      )}
    </div>
  )
}
