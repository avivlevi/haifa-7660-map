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
  'evacuation', 'school', 'community', 'food', 'gas', 'welfare',
])

const ALL_SECTIONS = new Set<Section>([
  'west_haifa', 'ramat_carmel', 'tirat_carmel', 'carmel',
  'hadar', 'neve_shanan', 'krayot',
  'daliat_carmel', 'nesher', 'isfiya',
])

const SHEET_HEADER_H  = 76   // collapsed: drag handle + header row
const SHEET_DEFAULT_H = 290  // tap-to-expand: comfortable list height
const SHEET_MAX_FRAC  = 0.78 // max height via drag

// iOS spring easing approximation
const SNAP_EASING = 'cubic-bezier(0.32, 0.72, 0, 1)'

export const MapPage = () => {
  const [activeCategories, setActiveCategories] = useState<Set<Category>>(ALL_CATEGORIES)
  const [activeSections, setActiveSections]     = useState<Set<Section>>(ALL_SECTIONS)
  const [incident, setIncident]                 = useState<{ lat: number; lng: number } | null>(null)
  const [incidentAddress, setIncidentAddress]   = useState('')
  const [radiusM, setRadiusM]                   = useState(500)
  const [selectedId, setSelectedId]             = useState<string | null>(null)
  const [flyTarget, setFlyTarget]               = useState<{ lat: number; lng: number; trigger: number } | null>(null)
  const [filtersOpen, setFiltersOpen]           = useState(false)

  // ── Mobile bottom-sheet ──────────────────────────────────────────────────
  //
  // The sheet is a fixed-height div anchored at bottom:0.
  // We slide it with translateY so only `sheetMaxH - translateY` pixels are
  // visible above the viewport edge.
  //
  //   translateY = sheetMaxH          → fully hidden (below viewport)
  //   translateY = collapsedY         → header only visible
  //   translateY = defaultExpandedY   → comfortable list visible
  //   translateY = 0                  → fully open
  //
  // During a drag we write directly to the DOM (zero React re-renders).
  // React state is only synced on snap / tap-toggle for the chevron direction.

  const sheetRef    = useRef<HTMLDivElement>(null)
  const sheetMaxH   = useRef(Math.round(window.innerHeight * SHEET_MAX_FRAC))
  const currentY    = useRef(sheetMaxH.current)          // actual position (always up-to-date)
  const dragOrigin  = useRef({ clientY: 0, translateY: 0 })

  // React state used only to re-render the chevron direction
  const [isExpanded, setIsExpanded] = useState(false)

  const collapsedY       = sheetMaxH.current - SHEET_HEADER_H
  const defaultExpandedY = sheetMaxH.current - SHEET_DEFAULT_H

  /** Write transform directly to DOM — no React re-render */
  const setTransform = useCallback((y: number, animated: boolean) => {
    const el = sheetRef.current
    if (!el) return
    el.style.transition = animated ? `transform 420ms ${SNAP_EASING}` : 'none'
    el.style.transform  = `translateY(${y}px)`
    currentY.current    = y
  }, [])

  const snapTo = useCallback((y: number) => {
    setTransform(y, true)
    setIsExpanded(y < collapsedY - 20)
  }, [setTransform, collapsedY])

  // Slide in/out when incident appears or clears
  useEffect(() => {
    snapTo(incident ? collapsedY : sheetMaxH.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incident])

  // ── Drag handlers (called from NearbyList drag handle / header) ──────────

  const handleSheetDragStart = useCallback((clientY: number) => {
    dragOrigin.current = { clientY, translateY: currentY.current }
    // Kill any in-progress CSS transition so motion follows finger instantly
    if (sheetRef.current) sheetRef.current.style.transition = 'none'
  }, [])

  const handleSheetDragMove = useCallback((clientY: number) => {
    const delta = clientY - dragOrigin.current.clientY
    const newY  = Math.max(0, Math.min(collapsedY, dragOrigin.current.translateY + delta))
    // Direct DOM write — bypasses React entirely, no layout recalc (transform-only)
    if (sheetRef.current) sheetRef.current.style.transform = `translateY(${newY}px)`
    currentY.current = newY
  }, [collapsedY])

  const handleSheetDragEnd = useCallback(() => {
    const y = currentY.current
    // Snap closed if released within 50px of the collapsed position
    snapTo(y > collapsedY - 50 ? collapsedY : y)
  }, [snapTo, collapsedY])

  const handleSheetHeaderClick = useCallback(() => {
    const y = currentY.current
    snapTo(y > collapsedY - 20 ? defaultExpandedY : collapsedY)
  }, [snapTo, collapsedY, defaultExpandedY])

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
            isFiltered={activeCategories.size < ALL_CATEGORIES.size || activeSections.size < ALL_SECTIONS.size}
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
          MOBILE: bottom sheet
          Fixed height, slid with translateY so the
          browser composites it on the GPU — no layout.
      ══════════════════════════════════════════ */}
      <div
        ref={sheetRef}
        className="md:hidden absolute bottom-0 inset-x-0 z-[2000]"
        style={{
          height: sheetMaxH.current,
          transform: `translateY(${sheetMaxH.current}px)`, // starts hidden; set by effect
          willChange: 'transform',
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
          isExpanded={isExpanded}
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
