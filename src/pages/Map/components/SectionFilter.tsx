import { SECTION_LABELS, SECTION_COLORS, type Section } from '../data/locations'

interface Props {
  active: Set<Section>
  onChange: (next: Set<Section>) => void
  wrap?: boolean
  variant?: 'chips' | 'segmented'
}

const ALL_SECTIONS = Object.keys(SECTION_LABELS) as Section[]

const SECTION_SHORT: Record<Section, string> = {
  west_haifa:   'מערב חיפה',
  ramat_carmel: 'רמות כרמל',
  tirat_carmel: 'טירת הכרמל',
}

export const SectionFilter = ({ active, onChange, wrap = false, variant = 'chips' }: Props) => {
  const toggle = (sec: Section) => {
    const next = new Set(active)
    if (next.has(sec)) {
      next.delete(sec)
    } else {
      next.add(sec)
    }
    onChange(next)
  }

  const allOn = active.size === ALL_SECTIONS.length
  const toggleAll = () => {
    onChange(allOn ? new Set() : new Set(ALL_SECTIONS))
  }

  if (variant === 'segmented') {
    return (
      <div className="flex bg-black/[0.06] rounded-xl p-1 gap-0.5" style={{ direction: 'rtl' }}>
        <button
          onClick={toggleAll}
          className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all active:scale-95 leading-tight ${
            allOn ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'
          }`}
        >
          הכל
        </button>
        {ALL_SECTIONS.map(sec => {
          const on = active.has(sec)
          return (
            <button
              key={sec}
              onClick={() => toggle(sec)}
              className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all active:scale-95 leading-tight"
              style={{
                backgroundColor: on && !allOn ? SECTION_COLORS[sec] : 'transparent',
                color: on && !allOn ? 'white' : '#6B7280',
              }}
            >
              {SECTION_SHORT[sec]}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div
      className={wrap
        ? 'flex flex-wrap gap-1.5'
        : 'flex gap-2 overflow-x-auto pb-1 scrollbar-none'
      }
      style={{ direction: 'rtl' }}
    >
      <button
        onClick={toggleAll}
        className={`${wrap ? '' : 'shrink-0'} px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors`}
        style={{
          backgroundColor: allOn ? '#1e293b' : 'white',
          color: allOn ? 'white' : '#64748b',
          borderColor: allOn ? '#1e293b' : '#e2e8f0',
        }}
      >
        הכל
      </button>
      {ALL_SECTIONS.map(sec => {
        const on = active.has(sec)
        return (
          <button
            key={sec}
            onClick={() => toggle(sec)}
            className={`${wrap ? '' : 'shrink-0'} px-3 py-1.5 rounded-full text-xs font-semibold border transition-all`}
            style={{
              backgroundColor: on ? SECTION_COLORS[sec] : 'white',
              color: on ? 'white' : '#64748b',
              borderColor: on ? SECTION_COLORS[sec] : '#e2e8f0',
            }}
          >
            {SECTION_LABELS[sec]}
          </button>
        )
      })}
    </div>
  )
}
