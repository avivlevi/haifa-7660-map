import { useMemo } from 'react'
import type { Location, Category, Section } from '../data/locations'
import { LOCATIONS } from '../data/locations'

/** Haversine distance in meters */
function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export interface LocationWithDistance extends Location {
  distanceM: number
}

export function useNearbyLocations(
  incident: { lat: number; lng: number } | null,
  radiusM: number,
  activeCategories: Set<Category>,
  activeSections: Set<Section>,
): LocationWithDistance[] {
  return useMemo(() => {
    if (!incident) return []

    return LOCATIONS
      .filter(loc => activeCategories.has(loc.category) && activeSections.has(loc.section))
      .map(loc => ({
        ...loc,
        distanceM: distanceMeters(incident.lat, incident.lng, loc.lat, loc.lng),
      }))
      .filter(loc => loc.distanceM <= radiusM)
      .sort((a, b) => a.distanceM - b.distanceM)
  }, [incident, radiusM, activeCategories, activeSections])
}

export function useAllLocations(
  activeCategories: Set<Category>,
  activeSections: Set<Section>,
): Location[] {
  return useMemo(
    () => LOCATIONS.filter(loc =>
      activeCategories.has(loc.category) && activeSections.has(loc.section)
    ),
    [activeCategories, activeSections]
  )
}
