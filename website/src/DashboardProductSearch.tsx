import { useId, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useI18n } from './i18n';
import { productName, unitPrice } from './dashboardModel';
import type { Product } from './dashboardModel';

export default function DashboardProductSearch({ query, suggestions, total, onChange, onSelect }: {
  query: string; suggestions: Product[]; total: number;
  onChange: (query: string) => void; onSelect: (product: Product) => void;
}) {
  const { language } = useI18n();
  const l = (en: string, zh: string) => language === 'zh' ? zh : en;
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const show = open && query.trim() !== '';
  const name = l('Find a product', '查找商品');

  function choose(product: Product) {
    setOpen(false);
    setActive(-1);
    if (window.matchMedia('(max-width: 860px)').matches) input.current?.blur();
    onSelect(product);
  }

  return <div className="dash-field dash-search" onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget)) { setOpen(false); setActive(-1); }
  }}>
    <label htmlFor={id}>{name}</label>
    <div className="dash-searchbox">
      <Search size={17} aria-hidden="true"/>
      <input id={id} ref={input} type="search" role="combobox" aria-autocomplete="list" aria-expanded={show}
        aria-controls={id + '-results'} aria-activedescendant={show && suggestions[active] ? id + '-option-' + active : undefined}
        autoComplete="off" enterKeyHint="search" value={query}
        placeholder={l('Name, brand or barcode', '商品名、品牌或条码')}
        onFocus={() => setOpen(true)}
        onChange={event => { onChange(event.target.value); setOpen(true); setActive(-1); }}
        onKeyDown={event => {
          if (event.nativeEvent.isComposing) return;
          if (event.key === 'Escape' && show) {
            event.preventDefault(); setOpen(false); setActive(-1); return;
          }
          if (event.key === 'Enter' && show && suggestions.length) {
            event.preventDefault(); choose(suggestions[active] ?? suggestions[0]); return;
          }
          if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && query.trim() && suggestions.length) {
            event.preventDefault();
            setOpen(true);
            const next = active < 0 ? event.key === 'ArrowDown' ? 0 : suggestions.length - 1 :
              Math.max(0, Math.min(suggestions.length - 1, active + (event.key === 'ArrowDown' ? 1 : -1)));
            setActive(next);
            requestAnimationFrame(() => {
              const container = list.current;
              const option = container?.children[next];
              if (!container || !option) return;
              const bounds = container.getBoundingClientRect();
              const item = option.getBoundingClientRect();
              if (item.bottom > bounds.bottom) container.scrollTop += item.bottom - bounds.bottom;
              else if (item.top < bounds.top) container.scrollTop -= bounds.top - item.top;
            });
          }
        }}/>
      {query && <button className="dash-search-clear" type="button" aria-label={l('Clear search', '清除搜索')}
        onClick={() => { onChange(''); setActive(-1); setOpen(false); input.current?.focus(); }}><X size={15}/></button>}
    </div>
    <div className="dash-search-popup" hidden={!show}>
      <p>{total ? l(total + ' matching products', total + ' 款匹配商品') :
        l('No products match in the current filters.', '当前筛选中没有匹配商品。')}</p>
      <ul ref={list} id={id + '-results'} role="listbox" aria-label={l('Product suggestions', '商品建议')}>
        {suggestions.map((product, index) => <li key={product.code} id={id + '-option-' + index}
          role="option" aria-selected={index === active} tabIndex={-1}
          onMouseDown={event => event.preventDefault()} onClick={() => choose(product)}>
          <span><strong>{productName(product)}</strong><small>{[product.brands, product.quantity_text, product.code].filter(Boolean).join(' · ')}</small></span>
          <span>{unitPrice(product.representative_price, product.target_unit)}</span>
        </li>)}
      </ul>
    </div>
  </div>;
}
