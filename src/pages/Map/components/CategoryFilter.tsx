import { CATEGORY_LABELS, CATEGORY_COLORS, type Category } from '../data/locations'

interface Props {
  active: Set<Category>
  onChange: (next: Set<Category>) => void
  wrap?: boolean
  variant?: 'chips' | 'icons'
}

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[]

const CATEGORY_ICONS: Record<Category, string> = {
  hospital:     '🏥',
  emergency:    '🚨',
  nursing_home: '🧓',
  shelter:      '🛡️',
  evacuation:   '🚌',
  school:       '🏫',
  community:    '👥',
  food:         '🛒',
  gas:          '⛽',
  welfare:      '🤝',
}

const CATEGORY_SHORT: Record<Category, string> = {
  hospital:     'בתי חולים',
  emergency:    'חירום',
  nursing_home: 'בתי אבות',
  shelter:      'מקלטים',
  evacuation:   'פינוי',
  school:       'בתי ספר',
  community:    'קהילה',
  food:         'מזון',
  gas:          'דלק',
  welfare:      'רווחה',
}

export const CategoryFilter = ({ active, onChange, wrap = false, variant = 'chips' }: Props) => {
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

  if (variant === 'icons') {
    return (
      <div className="flex gap-3 overflow-x-auto scrollbar-none" style={{ direction: 'rtl' }}>
        {/* All button */}
        <button onClick={toggleAll} className="shrink-0 flex flex-col items-center gap-1 active:scale-90 transition-transform">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center transition-colors"
            style={{ backgroundColor: allOn ? '#1e293b' : '#F1F5F9' }}
          >
            <span className="text-lg">{allOn ? '✦' : '⊙'}</span>
          </div>
          <span className="text-[9px] font-semibold text-gray-400">הכל</span>
        </button>

        {ALL_CATEGORIES.map(cat => {
          const on = active.has(cat)
          return (
            <button
              key={cat}
              onClick={() => toggle(cat)}
              className="shrink-0 flex flex-col items-center gap-1 active:scale-90 transition-transform"
            >
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center transition-colors"
                style={{ backgroundColor: on ? CATEGORY_COLORS[cat] : '#F1F5F9' }}
              >
                <span className="text-xl">{CATEGORY_ICONS[cat]}</span>
              </div>
              <span
                className="text-[9px] font-semibold"
                style={{ color: on ? CATEGORY_COLORS[cat] : '#94A3B8' }}
              >
                {CATEGORY_SHORT[cat]}
              </span>
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
        className={`${wrap ? '' : 'shrink-0'} px-3 py-1.5 rounded-full text-xs font-semibold border transition-all active:scale-90`}
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
            className={`${wrap ? '' : 'shrink-0'} px-3 py-1.5 rounded-full text-xs font-semibold border transition-all active:scale-90`}
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
