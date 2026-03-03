import { CATEGORY_LABELS, CATEGORY_COLORS, type Category } from '../data/locations'

interface Props {
  active: Set<Category>
  onChange: (next: Set<Category>) => void
  wrap?: boolean
}

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[]

export const CategoryFilter = ({ active, onChange, wrap = false }: Props) => {
  const toggle = (cat: Category) => {
    const next = new Set(active)
    if (next.has(cat)) {
      next.delete(cat)
    } else {
      next.add(cat)
    }
    onChange(next)
  }

  const allOn = active.size === ALL_CATEGORIES.length
  const toggleAll = () => {
    onChange(allOn ? new Set() : new Set(ALL_CATEGORIES))
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
      {ALL_CATEGORIES.map(cat => {
        const on = active.has(cat)
        return (
          <button
            key={cat}
            onClick={() => toggle(cat)}
            className={`${wrap ? '' : 'shrink-0'} px-3 py-1.5 rounded-full text-xs font-semibold border transition-all`}
            style={{
              backgroundColor: on ? CATEGORY_COLORS[cat] : 'white',
              color: on ? 'white' : '#64748b',
              borderColor: on ? CATEGORY_COLORS[cat] : '#e2e8f0',
            }}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        )
      })}
    </div>
  )
}
