import { useEffect, useRef, createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Navigation2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { Location } from '../data/locations'
import { CATEGORY_COLORS, CATEGORY_LABELS, CATEGORY_ICONS } from '../data/locations'
import type { LocationWithDistance } from '../hooks/useNearbyLocations'

// Fix Leaflet default icon paths broken by Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow })

/** Create a colored circle marker with a category icon inside */
function makeIcon(color: string, Icon: LucideIcon, size = 30) {
  const iconPx = Math.round(size * 0.46)
  const iconHtml = renderToStaticMarkup(
    createElement(Icon, { size: iconPx, color: 'white', strokeWidth: 2.5 })
  )
  const html = `<div style="
    width:${size}px;height:${size}px;
    background:${color};
    border-radius:50%;
    border:2.5px solid white;
    box-shadow:0 2px 10px rgba(0,0,0,0.30);
    display:flex;align-items:center;justify-content:center;
  ">${iconHtml}</div>`
  return L.divIcon({
    html,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
  })
}

/** Red explosion pin for the incident */
const incidentIcon = L.divIcon({
  html: `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
      <circle class="incident-pulse-ring" cx="18" cy="18" r="16" fill="#EF4444" fill-opacity="0.15" stroke="#EF4444" stroke-width="2"/>
      <circle cx="18" cy="18" r="8" fill="#EF4444"/>
      <circle cx="18" cy="18" r="3" fill="white"/>
    </svg>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
})

interface MapClickHandlerProps {
  active: boolean
  onMapClick: (lat: number, lng: number) => void
}

const MapClickHandler = ({ active, onMapClick }: MapClickHandlerProps) => {
  useMapEvents({
    click(e) {
      if (active) onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

interface FlyToProps {
  lat: number
  lng: number
  trigger: number // increment to fly
}

const FlyTo = ({ lat, lng, trigger }: FlyToProps) => {
  const map = useMap()
  const prevTrigger = useRef(trigger)
  useEffect(() => {
    if (trigger !== prevTrigger.current) {
      map.flyTo([lat, lng], 16, { duration: 0.8 })
      prevTrigger.current = trigger
    }
  }, [map, lat, lng, trigger])
  return null
}

interface FitToRadiusProps {
  incident: { lat: number; lng: number } | null
  radiusM: number
}

const FitToRadius = ({ incident, radiusM }: FitToRadiusProps) => {
  const map = useMap()
  useEffect(() => {
    if (!incident) return
    const latDelta = radiusM / 111320
    const lngDelta = radiusM / (111320 * Math.cos(incident.lat * Math.PI / 180))
    const bounds = L.latLngBounds(
      [incident.lat - latDelta, incident.lng - lngDelta],
      [incident.lat + latDelta, incident.lng + lngDelta],
    )
    map.fitBounds(bounds, { padding: [50, 50], animate: true, duration: 0.8 })
  }, [map, incident, radiusM])
  return null
}

interface Props {
  allLocations: Location[]
  nearby: LocationWithDistance[]
  incident: { lat: number; lng: number } | null
  radiusM: number
  selectedId: string | null
  flyTarget: { lat: number; lng: number; trigger: number } | null
  onMapClick: (lat: number, lng: number) => void
  onMarkerClick: (id: string) => void
}

export const MapView = ({
  allLocations,
  nearby,
  incident,
  radiusM,
  selectedId,
  flyTarget,
  onMapClick,
  onMarkerClick,
}: Props) => {
  const nearbyIds = new Set(nearby.map(l => l.id))

  return (
    <MapContainer
      center={[32.815, 34.980]}
      zoom={14}
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapClickHandler active={true} onMapClick={onMapClick} />

      {flyTarget && (
        <FlyTo lat={flyTarget.lat} lng={flyTarget.lng} trigger={flyTarget.trigger} />
      )}

      <FitToRadius incident={incident} radiusM={radiusM} />

      {/* Incident marker + radius */}
      {incident && (
        <>
          <Circle
            center={[incident.lat, incident.lng]}
            radius={radiusM}
            pathOptions={{ color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.08, weight: 2, dashArray: '6 4' }}
          />
          <Circle
            center={[incident.lat, incident.lng]}
            radius={radiusM * 0.4}
            pathOptions={{ color: 'transparent', fillColor: '#EF4444', fillOpacity: 0.2, weight: 0 }}
          />
          <Marker position={[incident.lat, incident.lng]} icon={incidentIcon} zIndexOffset={1000}>
            <Popup>
              <div style={{ direction: 'rtl', textAlign: 'right', minWidth: 120 }}>
                <strong>נקודת פגיעה</strong>
              </div>
            </Popup>
          </Marker>
        </>
      )}

      {/* Location markers */}
      {allLocations.map(loc => {
        const inRadius = nearbyIds.has(loc.id)
        const isSelected = selectedId === loc.id
        const color = CATEGORY_COLORS[loc.category]
        const size = isSelected ? 38 : inRadius ? 32 : 26

        const LocIcon = CATEGORY_ICONS[loc.category]
        return (
          <Marker
            key={loc.id}
            position={[loc.lat, loc.lng]}
            icon={makeIcon(color, LocIcon, size)}
            zIndexOffset={isSelected ? 900 : inRadius ? 500 : 0}
            opacity={incident && !inRadius ? 0.4 : 1}
            eventHandlers={{ click: () => onMarkerClick(loc.id) }}
          >
            <Popup minWidth={200}>
              <div style={{ direction: 'rtl', textAlign: 'right', minWidth: 200, fontFamily: 'inherit' }}>
                {/* Category badge */}
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  backgroundColor: `${color}20`,
                  color,
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: 99,
                  marginBottom: 5,
                  border: `1px solid ${color}40`,
                }}>
                  <LocIcon size={10} />
                  {CATEGORY_LABELS[loc.category]}
                </span>

                {/* Name */}
                <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: '#111' }}>{loc.name}</p>

                {/* Divider */}
                <div style={{ borderTop: '1px solid #e2e8f0', marginBottom: 6 }} />

                {/* Address */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5, marginBottom: 4 }}>
                  <span style={{ fontSize: 12 }}>📍</span>
                  <span style={{ fontSize: 12, color: '#475569' }}>{loc.address}</span>
                </div>

                {/* Phone */}
                {loc.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                    <span style={{ fontSize: 12 }}>📞</span>
                    <a
                      href={`tel:${loc.phone.replace(/-/g, '')}`}
                      style={{ fontSize: 12, color, fontWeight: 600, textDecoration: 'none' }}
                    >
                      {loc.phone}
                    </a>
                  </div>
                )}

                {/* Capacity */}
                {loc.capacity && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                    <span style={{ fontSize: 12 }}>👥</span>
                    <span style={{ fontSize: 12, color: '#475569' }}>קיבולת: <strong>{loc.capacity}</strong> אנשים</span>
                  </div>
                )}

                {/* Coordinates */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: loc.notes ? 4 : 8 }}>
                  <span style={{ fontSize: 12 }}>🗺️</span>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>{loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}</span>
                </div>

                {/* Notes */}
                {loc.notes && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5, marginBottom: 8 }}>
                    <span style={{ fontSize: 12 }}>📝</span>
                    <span style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic' }}>{loc.notes}</span>
                  </div>
                )}

                {/* Navigate button */}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    backgroundColor: color,
                    color: 'white',
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '7px 12px',
                    borderRadius: 8,
                    textDecoration: 'none',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                >
                  <Navigation2 size={13} />
                  נווט בגוגל מפות
                </a>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}
