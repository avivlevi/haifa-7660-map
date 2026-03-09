import { Menu, X } from 'lucide-react'
import {
  SECTION_COLORS, CATEGORY_COLORS, CATEGORY_ICONS,
  type Category, type Section,
} from '../data/locations'

const ALL_SECTIONS: Section[] = [
  'west_haifa', 'ramat_carmel', 'tirat_carmel', 'carmel',
  'hadar', 'neve_shanan', 'krayot',
]
const ALL_CATEGORIES: Category[] = [
  'hospital', 'emergency', 'nursing_home',
  'shelter', 'evacuation', 'school',
  'community', 'food', 'gas', 'welfare',
]

const SECTION_SHORT: Record<Section, string> = {
  west_haifa:    'מערב חיפה',
  ramat_carmel:  'רמות כרמל',
  tirat_carmel:  'טירת הכרמל',
  carmel:        'חבל כרמל',
  hadar:         'הדר',
  neve_shanan:   'נווה שאנן',
  krayot:        'קריות',
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

interface ButtonProps {
  open: boolean
  isFiltered: boolean
  onToggle: () => void
}

export const MobileFilterButton = ({ open, isFiltered, onToggle }: ButtonProps) => (
  <button
    onClick={onToggle}
    className="relative shrink-0 w-11 h-11 rounded-xl bg-white shadow-md border flex items-center justify-center transition-all active:scale-90"
    style={{ borderColor: open ? '#64748B' : '#E2E8F0' }}
  >
    {open
      ? <X    className="h-4 w-4 text-gray-600" />
      : <Menu className="h-4 w-4 text-gray-600" />
    }
    {isFiltered && !open && (
      <span className="absolute -top-1 -end-1 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white" />
    )}
  </button>
)

interface PanelProps {
  activeSections: Set<Section>
  onSectionsChange: (s: Set<Section>) => void
  activeCategories: Set<Category>
  onCategoriesChange: (c: Set<Category>) => void
}

export const MobileFilterPanel = ({
  activeSections, onSectionsChange,
  activeCategories, onCategoriesChange,
}: PanelProps) => {
  const allSectionsOn   = activeSections.size   === ALL_SECTIONS.length
  const allCategoriesOn = activeCategories.size === ALL_CATEGORIES.length

  const toggleSection = (sec: Section) => {
    const next = new Set(activeSections)
    next.has(sec) ? next.delete(sec) : next.add(sec)
    onSectionsChange(next)
  }

  const toggleCategory = (cat: Category) => {
    const next = new Set(activeCategories)
    next.has(cat) ? next.delete(cat) : next.add(cat)
    onCategoriesChange(next)
  }

  return (
    <div
      className="bg-white/95 backdrop-blur-xl rounded-xl shadow-lg border border-gray-100 px-3 pt-2.5 pb-3 flex flex-col gap-2.5"
      style={{ direction: 'rtl' }}
    >
      {/* ── Sections ─────────────────────────────── */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-gray-400 font-semibold tracking-wide">אזורים</span>
          <button
            onClick={() => onSectionsChange(allSectionsOn ? new Set() : new Set(ALL_SECTIONS))}
            className="text-[11px] font-medium text-blue-500 active:opacity-60"
          >
            {allSectionsOn ? 'נקה הכל' : 'בחר הכל'}
          </button>
        </div>
        {/* Wrap: all chips visible, no horizontal scroll */}
        <div className="flex flex-wrap gap-1.5">
          {ALL_SECTIONS.map(sec => {
            const on    = activeSections.has(sec)
            const color = SECTION_COLORS[sec]
            return (
              <button
                key={sec}
                onClick={() => toggleSection(sec)}
                className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-all active:scale-90"
                style={{
                  backgroundColor: on ? color : '#F1F5F9',
                  color:           on ? 'white' : '#64748B',
                  border:          `1px solid ${on ? color : '#E2E8F0'}`,
                }}
              >
                {SECTION_SHORT[sec]}
              </button>
            )
          })}
        </div>
      </div>

      <div className="border-t border-gray-100" />

      {/* ── Categories ───────────────────────────── */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-gray-400 font-semibold tracking-wide">קטגוריות</span>
          <button
            onClick={() => onCategoriesChange(allCategoriesOn ? new Set() : new Set(ALL_CATEGORIES))}
            className="text-[11px] font-medium text-blue-500 active:opacity-60"
          >
            {allCategoriesOn ? 'נקה הכל' : 'בחר הכל'}
          </button>
        </div>
        {/* Horizontal scroll — icons + label */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
          {ALL_CATEGORIES.map(cat => {
            const on    = activeCategories.has(cat)
            const color = CATEGORY_COLORS[cat]
            const Icon  = CATEGORY_ICONS[cat]
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all active:scale-90"
                style={{
                  backgroundColor: on ? color : '#F1F5F9',
                  color:           on ? 'white' : '#64748B',
                  border:          `1px solid ${on ? color : '#E2E8F0'}`,
                }}
              >
                <Icon className="h-3 w-3 shrink-0" />
                {CATEGORY_SHORT[cat]}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
