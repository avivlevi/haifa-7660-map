import 'leaflet/dist/leaflet.css'
import { useState, useCallback, useEffect, useRef } from 'react'
import { MapView } from './components/MapView'
import { NearbyList } from './components/NearbyList'
import { AddressSearch } from './components/AddressSearch'
import { useNearbyLocations, useAllLocations } from './hooks/useNearbyLocations'
import type { Category, Section } from './data/locations'
import { MobileFilterButton, MobileFilterPanel } from './components/MobileFilters'

const ALL_CATEGORIES = new Set<Category>([
  'hospital', 'emergency', 'nursing_home', 'shelter',
  'evacuation', 'school', 'community', 'food', 'gas',
])

const ALL_SECTIONS = new Set<Section>(['west_haifa', 'ramat_carmel', 'tirat_carmel'])

const SHEET_HEADER_H   = 76  // collapsed: just drag handle + header row
const SHEET_DEFAULT_H  = 290 // tap-to-expand: header + radius bar + ~160px list
const SHEET_MAX_FRAC   = 0.78 // max sheet via drag = 78% of viewport height

export const MapPage = () => {
  const [activeCategories, setActiveCategories] = useState<Set<Category>>(ALL_CATEGORIES)
  const [activeSections, setActiveSections]     = useState<Set<Section>>(ALL_SECTIONS)
  const [incident, setIncident]                 = useState<{ lat: number; lng: number } | null>(null)
  const [incidentAddress, setIncidentAddress]   = useState('')
  const [radiusM, setRadiusM]                   = useState(500)
  const [selectedId, setSelectedId]             = useState<string | null>(null)
  const [flyTarget, setFlyTarget]               = useState<{ lat: number; lng: number; trigger: number } | null>(null)
  const [filtersOpen, setFiltersOpen]           = useState(false)

  // ── Mobile bottom-sheet drag state ──────────────────────────────────────
  const [sheetH, setSheetH]           = useState(SHEET_HEADER_H)
  const [sheetDragging, setSheetDragging] = useState(false)
  const sheetHRef  = useRef(SHEET_HEADER_H)
  const dragRef    = useRef({ startY: 0, startH: 0 })

  const getSheetMaxH = () => Math.round(window.innerHeight * SHEET_MAX_FRAC)

  const applySheetH = useCallback((h: number) => {
    sheetHRef.current = h
    setSheetH(h)
  }, [])

  // Reset to collapsed header whenever a new incident is set
  useEffect(() => {
    applySheetH(SHEET_HEADER_H)
  }, [incident, applySheetH])

  const handleSheetDragStart = useCallback((clientY: number) => {
    dragRef.current = { startY: clientY, startH: sheetHRef.current }
    setSheetDragging(true)
  }, [])

  const handleSheetDragMove = useCallback((clientY: number) => {
    const delta = dragRef.current.startY - clientY
    const maxH  = getSheetMaxH()
    const newH  = Math.max(SHEET_HEADER_H, Math.min(maxH, dragRef.current.startH + delta))
    sheetHRef.current = newH
    setSheetH(newH)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSheetDragEnd = useCallback(() => {
    setSheetDragging(false)
    // Snap to collapsed if released near the bottom
    if (sheetHRef.current < SHEET_HEADER_H + 50) {
      applySheetH(SHEET_HEADER_H)
    }
  }, [applySheetH])

  const handleSheetHeaderClick = useCallback(() => {
    const cur = sheetHRef.current
    applySheetH(cur <= SHEET_HEADER_H + 10 ? SHEET_DEFAULT_H : SHEET_HEADER_H)
  }, [applySheetH])
  // ────────────────────────────────────────────────────────────────────────

  const allLocations = useAllLocations(activeCategories, activeSections)
  const nearby = useNearbyLocations(incident, radiusM, activeCategories, activeSections)

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setIncident({ lat, lng })
    setIncidentAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`)
    setSelectedId(null)
    setRadiusM(500)
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
          TOP BAR — search + filter toggle
          Mobile: full-width inset-x-3
          Desktop: centered 520px floating
      ══════════════════════════════════════════ */}
      <div
        className="absolute top-3 inset-x-3 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[520px] z-[2000] flex flex-col gap-2"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex gap-2 items-center">
          <div className="flex-1">
            <AddressSearch onSelect={handleAddressSelect} />
          </div>
          <MobileFilterButton
            open={filtersOpen}
            isFiltered={activeCategories.size < 9 || activeSections.size < 3}
            onToggle={() => setFiltersOpen(o => !o)}
          />
        </div>

        <div
          className="grid transition-grid duration-300 ease-ios"
          style={{ gridTemplateRows: filtersOpen ? '1fr' : '0fr' }}
        >
          <div className="overflow-hidden">
            <MobileFilterPanel
              activeSections={activeSections}
              onSectionsChange={setActiveSections}
              activeCategories={activeCategories}
              onCategoriesChange={setActiveCategories}
            />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          MOBILE: bottom sheet — free-drag height
      ══════════════════════════════════════════ */}
      <div
        className="md:hidden absolute bottom-0 inset-x-0 z-[2000] overflow-hidden"
        style={{
          height: incident ? sheetH : 0,
          transition: sheetDragging ? 'none' : 'height 400ms cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: incident ? 'auto' : 'none',
        }}
        onClick={e => e.stopPropagation()}
      >
        <NearbyList
          locations={nearby}
          selectedId={selectedId}
          onSelect={handleLocationSelect}
          radiusM={radiusM}
          onRadiusChange={setRadiusM}
          incidentAddress={incidentAddress}
          onClear={clearIncident}
          fillHeight
          mobileSheet
          isExpanded={sheetH > SHEET_HEADER_H + 20}
          onDragStart={handleSheetDragStart}
          onDragMove={handleSheetDragMove}
          onDragEnd={handleSheetDragEnd}
          onHeaderClick={handleSheetHeaderClick}
        />
      </div>

      {/* ══════════════════════════════════════════
          DESKTOP: floating nearby panel — centered bottom
      ══════════════════════════════════════════ */}
      <div
        className="hidden md:block absolute bottom-4 start-4 w-[360px] z-[2000] transition-opacity duration-500"
        style={{ opacity: incident ? 1 : 0, pointerEvents: incident ? 'auto' : 'none' }}
        onClick={e => e.stopPropagation()}
      >
        <NearbyList
          locations={nearby}
          selectedId={selectedId}
          onSelect={handleLocationSelect}
          radiusM={radiusM}
          onRadiusChange={setRadiusM}
          incidentAddress={incidentAddress}
          onClear={clearIncident}
          defaultExpanded
          listMaxHeight={400}
        />
      </div>
    </div>
  )
}
