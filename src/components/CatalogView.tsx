import { useMemo, useState } from 'react';
import { ArrowDownToLine, ArrowUpRight, Blocks, CircleHelp, Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import type { Catalog, CatalogItem, ServiceId } from '../types';
import { SERVICE_LIST } from '../services';

interface CatalogViewProps {
  catalog: Catalog;
  errors: Partial<Record<ServiceId, string>>;
  loading: boolean;
  updatedAt?: string;
  onRefresh: () => void;
  onOpenService: (service: ServiceId) => void;
}

function relativeTime(value?: string) {
  if (!value) return 'Not synced yet';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Synced recently';
  return `Updated ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
}

function CatalogCard({ item, type, conversions }: { item: CatalogItem; type: 'model' | 'engine'; conversions?: boolean }) {
  const tags = item.supported_conversions;
  return (
    <article className="catalog-item-card">
      <div className="catalog-item-top">
        <span className={`catalog-type-mark ${type}`}><Sparkles size={15} /></span>
        <span className="catalog-provider">{item.provider || (type === 'engine' ? 'LDX hub engine' : 'AI model')}</span>
        <span className="catalog-live-dot" />
      </div>
      <h4>{item.display_name || item.id}</h4>
      <code className="catalog-model-id">{item.id}</code>
      <p>{item.description || 'Available through the LDX hub API.'}</p>
      {conversions && tags && tags.length > 0 && (
        <div className="conversion-tags"><span>SUPPORTS</span>{tags.slice(0, 6).map(({ from, to }) => <i key={`${from}-${to}`}>{from.toUpperCase()} → {to.toUpperCase()}</i>)}{tags.length > 6 && <i>+{tags.length - 6}</i>}</div>
      )}
    </article>
  );
}

export default function CatalogView({ catalog, errors, loading, updatedAt, onRefresh, onOpenService }: CatalogViewProps) {
  const [active, setActive] = useState<'all' | ServiceId>('all');
  const [query, setQuery] = useState('');
  const total = Object.values(catalog).reduce((count, group) => count + group.length, 0);
  const displayGroups = useMemo(() => SERVICE_LIST
    .filter((service) => active === 'all' || active === service.id)
    .map((service) => ({
      service,
      items: (catalog[service.id] || []).filter((item) => {
        const text = `${item.id} ${item.display_name || ''} ${item.description || ''} ${item.provider || ''}`.toLowerCase();
        return text.includes(query.toLowerCase());
      }),
    })), [active, catalog, query]);

  return (
    <div className="catalog-page">
      <div className="catalog-intro-row">
        <div className="catalog-intro"><span className="eyebrow"><Blocks size={14} /> DISCOVER WHAT YOUR KEY CAN RUN</span><h2>Everything available,<br /><span>in one catalog.</span></h2><p>Live model and engine listings from LDX hub. The catalog refreshes directly from the API—no static model list to maintain.</p></div>
        <div className="catalog-stat-card"><span className="catalog-stat-icon"><ArrowDownToLine size={17} /></span><span className="catalog-stat-number">{loading ? '—' : total}</span><span className="catalog-stat-label">catalog options</span><span className="catalog-stat-note">Across 6 LDX services</span></div>
      </div>

      <div className="catalog-toolbar">
        <div className="catalog-tabs" role="tablist" aria-label="Filter catalogs">
          <button type="button" className={active === 'all' ? 'active' : ''} onClick={() => setActive('all')}>All <span>{total}</span></button>
          {SERVICE_LIST.map((service) => <button type="button" key={service.id} className={active === service.id ? 'active' : ''} onClick={() => setActive(service.id)}>{service.title} <span>{catalog[service.id]?.length || 0}</span></button>)}
        </div>
        <div className="catalog-toolbar-right">
          <label className="catalog-search"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search options…" /><kbd>/</kbd></label>
          <button type="button" className="catalog-refresh-button" disabled={loading} onClick={onRefresh}>{loading ? <span className="spinner spinner-small" /> : <SlidersHorizontal size={14} />} {loading ? 'Syncing' : 'Refresh'}</button>
        </div>
      </div>
      <div className="catalog-sync-note"><span className="catalog-live-dot" /> {relativeTime(updatedAt)} <span className="sync-separator">·</span> Public metadata is combined with your authenticated workspace connection.</div>

      {Object.keys(errors).length > 0 && (
        <div className="catalog-error-banner"><CircleHelp size={15} /><span>Some catalogs could not be loaded: {Object.entries(errors).map(([service]) => service).join(', ')}.</span><button type="button" onClick={onRefresh}>Try again</button></div>
      )}

      <div className="catalog-groups">
        {displayGroups.map(({ service, items }) => {
          const Icon = service.icon;
          return (
            <section className="catalog-group" key={service.id}>
              <div className="catalog-group-heading">
                <span className={`catalog-group-icon ${service.accent}`}><Icon size={16} /></span>
                <span className="catalog-group-title"><b>{service.title}</b><small>{service.catalogType === 'model' ? 'Models' : 'Engines'} <i>·</i> {items.length} available</small></span>
                <button type="button" className="text-link catalog-open-workflow" onClick={() => onOpenService(service.id)}>Open workflow <ArrowUpRight size={13} /></button>
              </div>
              {loading && items.length === 0 ? (
                <div className="catalog-loading-row"><span className="catalog-skeleton" /><span className="catalog-skeleton" /><span className="catalog-skeleton" /></div>
              ) : items.length > 0 ? (
                <div className="catalog-card-grid">{items.map((item) => <CatalogCard key={item.id} item={item} type={service.catalogType} conversions={service.id === 'analyzedoc' || service.id === 'extractdoc'} />)}</div>
              ) : (
                <div className="catalog-empty"><span>{query ? 'No options match your search.' : errors[service.id] || 'No catalog options returned.'}</span><button type="button" onClick={() => onOpenService(service.id)}>Open workflow <ArrowUpRight size={13} /></button></div>
              )}
            </section>
          );
        })}
      </div>
      <div className="catalog-disclaimer"><CircleHelp size={14} /><span>Catalog entries are published by LDX hub. Actual access can depend on your subscription and is checked when you submit a job.</span></div>
    </div>
  );
}
