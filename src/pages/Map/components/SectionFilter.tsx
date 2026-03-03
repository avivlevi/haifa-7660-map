import { SECTION_LABELS, SECTION_COLORS, type Section } from '../data/locations'

interface Props {
  active: Set<Section>
  onChange: (next: Set<Section>) => void
  wrap?: boolean
}

const ALL_SECTIONS = Object.keys(SECTION_LABELS) as Section[]

export const SectionFilter = ({ active, onChange, wrap = false }: Props) => {
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
