import { Menu, X } from 'lucide-react'
import {
  SECTION_COLORS, CATEGORY_COLORS, CATEGORY_ICONS,
  type Category, type Section,
} from '../data/locations'

const ALL_SECTIONS: Section[] = ['west_haifa', 'ramat_carmel', 'tirat_carmel', 'carmel']
const ALL_CATEGORIES: Category[] = [
  'hospital', 'emergency', 'nursing_home',
  'shelter', 'evacuation', 'school',
  'community', 'food', 'gas',
]

const SECTION_SHORT: Record<Section, string> = {
  west_haifa:   'מערב חיפה',
  ramat_carmel: 'רמות כרמל',
  tirat_carmel: 'טירת הכרמל',
  carmel:       'חבל כרמל',
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

  return (
    <div
      className="bg-white/95 backdrop-blur-xl rounded-xl shadow-lg border border-gray-100 px-3 py-2.5 flex flex-col gap-2"
      style={{ direction: 'rtl' }}
    >
      {/* Sections */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 font-medium shrink-0">אזורים:</span>
        <div className="flex gap-1.5">
          {ALL_SECTIONS.map(sec => {
            const on = activeSections.has(sec)
            const color = SECTION_COLORS[sec]
            return (
              <button
                key={sec}
                onClick={() => toggleSection(sec)}
                className="shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all active:scale-90"
                style={{
                  backgroundColor: on ? `${color}15` : '#F8FAFC',
                  color: on ? color : '#94A3B8',
                  border: `1px solid ${on ? `${color}40` : '#E2E8F0'}`,
                }}
              >
                {SECTION_SHORT[sec]}
              </button>
            )
          })}
        </div>
      </div>

      <div className="border-t border-gray-100" />

      {/* Categories — icon chips, horizontal scroll */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 font-medium shrink-0">קטגוריות:</span>
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
          {ALL_CATEGORIES.map(cat => {
            const on = activeCategories.has(cat)
            const color = CATEGORY_COLORS[cat]
            const Icon = CATEGORY_ICONS[cat]
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className="shrink-0 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all active:scale-90"
                style={{
                  backgroundColor: on ? `${color}15` : '#F8FAFC',
                  color: on ? color : '#94A3B8',
                  border: `1px solid ${on ? `${color}40` : '#E2E8F0'}`,
                }}
              >
                <Icon className="h-3 w-3" />
                {CATEGORY_SHORT[cat]}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
