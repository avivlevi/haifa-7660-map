import { useState, useRef, useEffect } from 'react'
import { Search, Loader2, X } from 'lucide-react'

// HERE Maps legacy credentials (App ID + App Code)
const HERE_APP_ID   = import.meta.env.VITE_HERE_APP_ID   as string | undefined
const HERE_APP_CODE = import.meta.env.VITE_HERE_APP_CODE  as string | undefined
// Also support new-platform single API key (VITE_HERE_API_KEY) as fallback
const HERE_API_KEY  = import.meta.env.VITE_HERE_API_KEY  as string | undefined

// ─── Unified suggestion shape ─────────────────────────────────────────────

interface Suggestion {
  key: string
  main: string   // "אלנבי 2"
  sub: string    // "קריית אליעזר, חיפה"
  lat: number
  lng: number
  label: string  // placed in the input after selection
}

interface Props {
  onSelect: (lat: number, lng: number, label: string) => void
  placeholder?: string
}

// ─── HERE Maps legacy Places API (App ID + App Code) ─────────────────────

interface LegacyHereItem {
  title: string
  href?: string
  position: [number, number]   // [lat, lng]
  address?: {
    street?: string
    houseNumber?: string
    district?: string
    city?: string
    county?: string
  }
}

async function fetchHereLegacy(query: string): Promise<Suggestion[]> {
  if (!HERE_APP_ID || !HERE_APP_CODE) throw new Error('no legacy creds')

  const url = new URL('https://places.ls.hereapi.com/places/v1/autosuggest')
  url.searchParams.set('q', query)
  url.searchParams.set('at', '32.81,34.98')       // Haifa centre
  url.searchParams.set('app_id',   HERE_APP_ID)
  url.searchParams.set('app_code', HERE_APP_CODE)
  url.searchParams.set('size', '5')
  url.searchParams.set('tf', 'plain')
  url.searchParams.set('result_types', 'address')

  const res = await fetch(url.toString(), { headers: { 'Accept-Language': 'he,iw' } })
  if (!res.ok) throw new Error(`HERE legacy ${res.status}`)

  const data = await res.json()
  return ((data.results?.items ?? []) as LegacyHereItem[])
    .filter(item => Array.isArray(item.position))
    .map(item => {
      const addr = item.address ?? {}
      const road = addr.street ?? ''
      const num  = addr.houseNumber ?? ''
      const city = addr.city ?? addr.county ?? ''
      const hood = addr.district ?? ''
      const main = road ? (num ? `${road} ${num}` : road) : item.title
      const sub  = [hood, city].filter(Boolean).join(', ')
      return {
        key:   item.href ?? item.title + Math.random(),
        main,
        sub,
        lat:   item.position[0],
        lng:   item.position[1],
        label: [main, sub].filter(Boolean).join(', '),
      }
    })
}

// ─── HERE Maps v7 API (single API key) ───────────────────────────────────

interface HereV7Item {
  id: string
  title: string
  resultType?: string
  position?: { lat: number; lng: number }
  address?: {
    label?: string       // always present: "רחוב 2, שכונה, חיפה, ישראל"
    street?: string      // present for houseNumber / street results
    houseNumber?: string
    district?: string
    city?: string
    county?: string
  }
}

// Try v7 API key first (App Code doubles as API key on new platform),
// then legacy Places API, in case the account is still on the old platform.
async function fetchHere(query: string): Promise<Suggestion[]> {
  const keyCandidate = HERE_APP_CODE ?? HERE_API_KEY
  if (keyCandidate) {
    try {
      return await fetchHereV7WithKey(query, keyCandidate)
    } catch (e) {
      // If it's a credentials error (401/403) try legacy; otherwise rethrow
      if (!(e instanceof Error) || !e.message.includes('401') && !e.message.includes('403')) {
        throw e
      }
    }
  }
  if (HERE_APP_ID && HERE_APP_CODE) return fetchHereLegacy(query)
  throw new Error('no HERE credentials configured')
}

function hereItemToSuggestion(item: HereV7Item): Suggestion {
  const addr       = item.address ?? {}
  const labelParts = (addr.label ?? item.title).split(',').map(s => s.trim())
  const road = addr.street      ?? labelParts[0] ?? ''
  const num  = addr.houseNumber ?? ''
  const city = addr.city ?? addr.county ?? labelParts[1] ?? ''
  const hood = addr.district ?? ''
  const main = road ? (num ? `${road} ${num}` : road) : item.title
  const sub  = [hood, city].filter(Boolean).join(', ')
  return {
    key:   item.id,
    main,
    sub,
    lat:   item.position!.lat,
    lng:   item.position!.lng,
    label: [main, sub].filter(Boolean).join(', '),
  }
}

async function fetchHereV7WithKey(query: string, apiKey: string): Promise<Suggestion[]> {
  const hasNumber = /\d/.test(query)

  // When the query contains a number use geocode (resolves exact house numbers).
  // For plain street names use autosuggest (fast partial-match suggestions).
  const base = hasNumber
    ? 'https://geocode.search.hereapi.com/v1/geocode'
    : 'https://autosuggest.search.hereapi.com/v1/autosuggest'

  const url = new URL(base)
  url.searchParams.set('q', query)
  url.searchParams.set('in', 'countryCode:ISR')
  url.searchParams.set('lang', 'he')
  url.searchParams.set('limit', '5')
  url.searchParams.set('apiKey', apiKey)
  if (!hasNumber) url.searchParams.set('at', '32.81,34.98') // autosuggest needs a bias point

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`HERE v7 ${res.status}`)

  const data = await res.json()
  return ((data.items ?? []) as HereV7Item[])
    .filter(item => item.position)
    .slice(0, 5)
    .map(hereItemToSuggestion)
}

// ─── Nominatim fallback ───────────────────────────────────────────────────

interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
  address: {
    house_number?: string
    road?: string
    suburb?: string
    city?: string
    town?: string
    village?: string
  }
}

function nominatimUrl(value: string, numRef: React.MutableRefObject<string>): string {
  const base   = 'https://nominatim.openstreetmap.org/search'
  const common = '&limit=5&countrycodes=il&accept-language=he&addressdetails=1' +
                 '&viewbox=34.95,32.78,35.07,32.85&bounded=0'
  const clean  = value.replace(/,?\s*חיפה\s*$/u, '').trim()

  const trailing = clean.match(/^(.+?)\s+(\d+[א-ת]?)$/)
  const leading  = clean.match(/^(\d+[א-ת]?)\s+(.+)$/)

  if (trailing) {
    numRef.current = trailing[2]
    return `${base}?format=json&street=${encodeURIComponent(trailing[2] + ' ' + trailing[1])}&city=%D7%97%D7%99%D7%A4%D7%94${common}`
  }
  if (leading) {
    numRef.current = leading[1]
    return `${base}?format=json&street=${encodeURIComponent(clean)}&city=%D7%97%D7%99%D7%A4%D7%94${common}`
  }
  numRef.current = ''
  return `${base}?format=json&q=${encodeURIComponent(clean + ', חיפה')}${common}`
}

function toSuggestion(r: NominatimResult, fallbackNum: string): Suggestion {
  const num = r.address.house_number
    ?? (/^\d+[א-ת]?$/.test(r.display_name.split(',')[0].trim())
        ? r.display_name.split(',')[0].trim()
        : fallbackNum)
  const road = r.address.road ?? r.display_name.split(',')[0].trim()
  const city = r.address.city ?? r.address.town ?? r.address.village ?? ''
  const hood = r.address.suburb ?? ''
  const main = num ? `${road} ${num}` : road
  const sub  = [hood, city].filter(Boolean).join(', ')
             || r.display_name.split(',').slice(1, 3).join(', ').trim()
  return {
    key:   String(r.place_id),
    main,
    sub,
    lat:   parseFloat(r.lat),
    lng:   parseFloat(r.lon),
    label: [main, city].filter(Boolean).join(', '),
  }
}

async function fetchNominatim(
  value: string,
  numRef: React.MutableRefObject<string>,
): Promise<Suggestion[]> {
  const res = await fetch(nominatimUrl(value, numRef), {
    headers: { 'User-Agent': 'miluim-haifa-map/1.0' },
  })
  if (!res.ok) throw new Error('nominatim')
  const data: NominatimResult[] = await res.json()
  return data.map(r => toSuggestion(r, numRef.current))
}

// ─── Component ────────────────────────────────────────────────────────────

export const AddressSearch = ({ onSelect, placeholder = 'חפש כתובת בחיפה...' }: Props) => {
  const [inputQuery, setInputQuery]       = useState('')
  const [suggestions, setSuggestions]     = useState<Suggestion[]>([])
  const [loading, setLoading]             = useState(false)
  const [open, setOpen]                   = useState(false)
  const [usingFallback, setUsingFallback] = useState(false)
  const timerRef     = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const numRef       = useRef('')

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node))
        setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const search = (value: string) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!value.trim()) {
      setSuggestions([])
      setOpen(false)
      numRef.current = ''
      return
    }
    timerRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const q = /חיפה/.test(value) ? value : `${value} חיפה`
        const results = await fetchHere(q)
        setSuggestions(results)
        setOpen(results.length > 0)
        setUsingFallback(false)
      } catch {
        // HERE failed → fall back to Nominatim
        try {
          const results = await fetchNominatim(value, numRef)
          setSuggestions(results)
          setOpen(results.length > 0)
          setUsingFallback(true)
        } catch {
          // silence
        }
      } finally {
        setLoading(false)
      }
    }, 400)
  }

  const handleSelect = (s: Suggestion) => {
    setInputQuery(s.label)
    setOpen(false)
    onSelect(s.lat, s.lng, s.label)
  }

  const clear = () => {
    setInputQuery('')
    setSuggestions([])
    setOpen(false)
    numRef.current = ''
  }

  return (
    <div ref={containerRef} className="relative w-full" style={{ direction: 'rtl' }}>
      <div className="flex items-center bg-white rounded-xl shadow-md border border-gray-200 px-3 h-11 gap-2">
        {loading ? (
          <Loader2 className="h-4 w-4 text-gray-400 shrink-0 animate-spin" />
        ) : (
          <Search className="h-4 w-4 text-gray-400 shrink-0" />
        )}
        <input
          type="text"
          value={inputQuery}
          onChange={e => { setInputQuery(e.target.value); search(e.target.value) }}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="flex-1 text-sm bg-transparent outline-none text-gray-900 placeholder:text-gray-400"
          style={{ direction: 'rtl', minWidth: 0 }}
          dir="rtl"
        />
        {inputQuery && (
          <button onClick={clear} className="p-0.5 rounded text-gray-400 hover:text-gray-600">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul
          className="absolute top-full mt-1 w-full bg-white rounded-xl shadow-lg border border-gray-200 z-[3000] overflow-hidden"
          style={{ direction: 'rtl' }}
        >
          {usingFallback && (
            <li className="px-4 py-1.5 text-xs text-amber-600 bg-amber-50 border-b border-amber-100">
              HERE Maps לא זמין — תוצאות חלופיות (ללא מספרי בית מדויקים)
            </li>
          )}
          {suggestions.map(s => (
            <li key={s.key}>
              <button
                className="w-full text-right px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                onClick={() => handleSelect(s)}
              >
                <span className="block text-gray-900 truncate font-medium">{s.main}</span>
                {s.sub && <span className="block text-xs text-gray-400 truncate">{s.sub}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
