import { useRef, useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react';
import { useI18n } from './i18n';
import { categories, categoryLabels, subtypeLabel } from './dashboardModel';
import type { Category, Product } from './dashboardModel';

export default function DashboardCategoryPicker({ products, selection, onSelect }: {
  products: Record<Category, Product[]>;
  selection?: { category: Category; subtype: string };
  onSelect: (category: Category, subtype: string) => void;
}) {
  const { language, t } = useI18n();
  const l = (en: string, zh: string) => language === 'zh' ? zh : en;
  const [parent, setParent] = useState<Category>();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const subtypes = useRef<HTMLDivElement>(null);
  const types = new Map<string, number>();
  if (parent) for (const product of products[parent]) {
    const type = product.subtype ?? 'unknown';
    types.set(type, (types.get(type) ?? 0) + 1);
  }
  const ids = [...types.keys()].sort((a, b) => (Number(a === 'unknown') - Number(b === 'unknown')) ||
    subtypeLabel(a, language).localeCompare(subtypeLabel(b, language), language));
  const selectedLabel = selection?.subtype ? subtypeLabel(selection.subtype === 'unknown' ? null : selection.subtype, language) :
    l('All food types', '全部细分类');

  function close() {
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
  }

  function goBack() {
    setParent(undefined);
    requestAnimationFrame(() => document.querySelector<HTMLButtonElement>('.dash-cascader-parents button')?.focus({ preventScroll: true }));
  }

  return <section className="dash-category-picker" aria-labelledby="dash-category-heading"
    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}
    onKeyDown={event => {
      if (event.key === 'Escape' && open) { event.preventDefault(); close(); }
      if (event.key === 'ArrowLeft' && parent && subtypes.current?.contains(event.target as Node)) {
        event.preventDefault(); goBack();
      }
    }}>
    <div className="dash-category-head"><h2 id="dash-category-heading">{l('Food category', '食品类别')}</h2></div>
    <button className="dash-category-trigger" type="button" ref={trigger} aria-expanded={open} aria-controls="dash-category-options"
      aria-label={l('Select food category', '选择食品类别') + (selection ? ' · ' + t(categoryLabels[selection.category]) + ' / ' + selectedLabel : '')}
      onClick={() => { if (!open) setParent(selection?.category); setOpen(!open); }}>
      {selection ? <span>{t(categoryLabels[selection.category])}<ChevronRight size={14}/><strong>{selectedLabel}</strong></span> :
        <span>{l('Select category and food type', '选择大类和细分类')}</span>}
      <ChevronDown size={16}/>
    </button>
    {open && <div className="dash-cascader" id="dash-category-options" data-has-parent={Boolean(parent)}>
      <div className="dash-cascader-parents" role="group" aria-label={l('Food categories', '食品大类')}>
        <p>{l('Food category', '食品大类')}</p>
        {categories.map(category => <button key={category} type="button" aria-pressed={parent === category} onClick={() => {
          setParent(category);
          requestAnimationFrame(() => subtypes.current?.querySelector<HTMLButtonElement>('button[data-food-type]')?.focus({ preventScroll: true }));
        }}>
          <strong>{t(categoryLabels[category])}</strong><span>{products[category].length}</span><ChevronRight size={15}/>
        </button>)}
      </div>
      <div className="dash-cascader-children" ref={subtypes} role="group" aria-label={l('Food types', '食品细分类')}>
        {parent ? <>
          <button type="button" className="dash-cascader-back" onClick={goBack}><ArrowLeft size={15}/>{t(categoryLabels[parent])}</button>
          <p>{l('Food type', '食品细分类')}</p>
          {['', ...ids].map(type => <button key={type} data-food-type="true" type="button"
            aria-pressed={selection?.category === parent && selection.subtype === type}
            onClick={() => { onSelect(parent, type); close(); }}>
            <span>{type ? subtypeLabel(type === 'unknown' ? null : type, language) : l('All food types', '全部细分类')}</span>
            <span>{type ? types.get(type) : products[parent].length}</span>
          </button>)}
        </> : <p>{l('Choose a category to see its food types.', '请先选择食品大类。')}</p>}
      </div>
    </div>}
  </section>;
}
