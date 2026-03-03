import { Menu, X } from 'lucide-react'
import { SECTION_COLORS, CATEGORY_COLORS, type Category, type Section } from '../data/locations'

const ALL_SECTIONS: Section[] = ['west_haifa', 'ramat_carmel', 'tirat_carmel']
const ALL_CATEGORIES: Category[] = [
  'hospital', 'emergency', 'nursing_home',
  'shelter', 'evacuation', 'school',
  'community', 'food', 'gas',
]

const SECTION_SHORT: Record<Section, string> = {
  west_haifa:   'מערב',
  ramat_carmel: 'כרמל',
  tirat_carmel: 'טירת',
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

  const allSections   = activeSections.size   === ALL_SECTIONS.length
  const allCategories = activeCategories.size === ALL_CATEGORIES.length

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 flex flex-col gap-4" style={{ direction: 'rtl' }}>

      {/* Sections */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">אזורים</p>
          <button
            onClick={() => onSectionsChange(allSections ? new Set() : new Set(ALL_SECTIONS))}
            className="text-[10px] text-blue-500 font-semibold"
          >
            {allSections ? 'נקה' : 'הכל'}
          </button>
        </div>
        <div className="flex gap-2">
          {ALL_SECTIONS.map(sec => {
            const on = activeSections.has(sec)
            return (
              <button
                key={sec}
                onClick={() => toggleSection(sec)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all active:scale-95"
                style={{ backgroundColor: on ? `${SECTION_COLORS[sec]}18` : '#F8FAFC' }}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: on ? SECTION_COLORS[sec] : '#CBD5E1' }} />
                <span className="text-xs font-semibold" style={{ color: on ? SECTION_COLORS[sec] : '#94A3B8' }}>
                  {SECTION_SHORT[sec]}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="border-t border-gray-100" />

      {/* Categories */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">קטגוריות</p>
          <button
            onClick={() => onCategoriesChange(allCategories ? new Set() : new Set(ALL_CATEGORIES))}
            className="text-[10px] text-blue-500 font-semibold"
          >
            {allCategories ? 'נקה' : 'הכל'}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {ALL_CATEGORIES.map(cat => {
            const on = activeCategories.has(cat)
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-all active:scale-95"
                style={{ backgroundColor: on ? `${CATEGORY_COLORS[cat]}15` : '#F8FAFC' }}
              >
                <span className="shrink-0 w-2 h-2 rounded-full" style={{ backgroundColor: on ? CATEGORY_COLORS[cat] : '#CBD5E1' }} />
                <span
                  className="text-[11px] leading-tight truncate"
                  style={{ color: on ? '#1E293B' : '#94A3B8', fontWeight: on ? 600 : 400 }}
                >
                  {CATEGORY_SHORT[cat]}
                </span>
              </button>
            )
          })}
        </div>
      </div>

    </div>
  )
}
