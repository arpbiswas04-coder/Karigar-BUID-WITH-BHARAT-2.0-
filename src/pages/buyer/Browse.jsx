import { CRAFT_CATEGORIES, normalizeCraftCategory } from '../../constants/craftCategories.js';
import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { artisanPortrait } from '../../data/demoImages';
import { craftCategoryMap } from '../../constants/craftImageMap.js';
import { useArtisanDirectory } from '../../hooks/useArtisanDirectory';
import CraftCard from '../../components/CraftCard';
import {
  translateState,
  translateCategory,
  translateCraftType,
  translateDistrict,
  translatePersonName,
  translateCollectionTitle,
  formatLocalizedNumber
} from '../../utils/localizedDisplay.js';

export default function Browse({ makers = false }) {
  const { t, i18n } = useTranslation();
  const { artisans, products: PRODUCTS, status, refresh } = useArtisanDirectory();
  const [params] = useSearchParams();
  const [query, setQuery] = useState('');
  const [state, setState] = useState('');
  const [craft, setCraft] = useState('');
  const [limit,setLimit]=useState(48);

  const normalize = (value = "") => String(value || "").trim().toLowerCase();

  const collectionItems = makers ? artisans : PRODUCTS;

  const items = collectionItems;
  const stateName = item => makers ? item.state : item.stateName;

  const getParentCategory = item => {
    const rawCraft = makers ? item.craftType : (item.craftType || item.craftCategory || item.craftLineage);
    return item.craftCategory || craftCategoryMap[rawCraft] || normalizeCraftCategory(rawCraft);
  };

  const states = [...new Set(items.map(stateName).filter(Boolean))].sort();
  const crafts = CRAFT_CATEGORIES;

  const results = items.filter(item => {
    if(!makers && params.get("artisan") && item.artisanId!==params.get("artisan"))return false;
    if (state && stateName(item) !== state) return false;
    if (craft && craft !== 'All crafts' && craft !== 'all') {
      const parentCat = getParentCategory(item);
      if (normalize(parentCat) !== normalize(craft)) return false;
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      const sEn = stateName(item) || '';
      const sHi = translateState(sEn, 'hi');
      const sBn = translateState(sEn, 'bn');

      const cEn = item.craftType || item.craftLineage || '';
      const cHi = translateCraftType(cEn, 'hi');
      const cBn = translateCraftType(cEn, 'bn');

      const catEn = getParentCategory(item) || '';
      const catHi = translateCategory(catEn, 'hi');
      const catBn = translateCategory(catEn, 'bn');

      const aEn = item.artisanName || item.name || '';
      const aHi = translatePersonName(aEn, 'hi');
      const aBn = translatePersonName(aEn, 'bn');

      const dEn = item.district || '';
      const dHi = translateDistrict(dEn, 'hi');
      const dBn = translateDistrict(dEn, 'bn');

      const tHi = translateCollectionTitle(item.name || item.title, 'hi');
      const tBn = translateCollectionTitle(item.name || item.title, 'bn');

      const text = `${item.name || ''} ${tHi} ${tBn} ${aEn} ${aHi} ${aBn} ${sEn} ${sHi} ${sBn} ${cEn} ${cHi} ${cBn} ${catEn} ${catHi} ${catBn} ${dEn} ${dHi} ${dBn}`.toLowerCase();
      if (!text.includes(q)) return false;
    }
    return true;
  });

  const reset = () => { setQuery(''); setState(''); setCraft(''); };
  return (
    <section className="premium-section browse-directory">
      <div className="section-heading">
        <div>
          <span className="eyebrow">{t('buyer.premium.behindCraft', 'The hands behind the craft')}</span>
          <h1>{makers ? t('buyer.premium.browseArtisans', 'Browse artisans') : t('buyer.premium.browseCollections', 'Browse collections')}</h1>
          <p>{makers ? t('buyer.premium.artisanIntro', 'Meet the makers, discover their traditions, and find the art that speaks to you.') : t('buyer.premium.collectionIntro', 'Find something to treasure, by the place it comes from or the craft that brings it to life.')}</p>
        </div>
        <Link className="text-action" to={makers ? '/collections' : '/artisans'}>
          {makers ? t('buyer.premium.browseCollections', 'Browse collections') : t('buyer.premium.browseArtisans', 'Browse artisans')} <ArrowRight size={17} />
        </Link>
      </div>
      <div className="directory-filters">
        <label><span>{t('buyer.premium.searchLabel', 'Search')}</span><div className="directory-search"><Search size={18} /><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder={t('buyer.premium.searchCrafts', 'Search crafts, makers, states')} /></div></label>
        <label><span>{t('buyer.premium.stateLabel', 'State')}</span><select value={state} onChange={e => setState(e.target.value)}><option value="">{t('buyer.premium.allStates', 'All states')}</option>{states.map(value => <option key={value} value={value}>{translateState(value, i18n.language)}</option>)}</select></label>
        <label><span>{t('buyer.premium.craftLabel', 'Art & craft')}</span><select value={craft} onChange={e => setCraft(e.target.value)}><option value="">{t('buyer.premium.allCrafts', 'All crafts')}</option>{crafts.map(value => <option key={value} value={value}>{translateCategory(value, i18n.language)}</option>)}</select></label>
        <button className="text-action" onClick={reset} type="button">{t('buyer.premium.resetFilters', 'Reset filters')}</button>
      </div>
      {makers && status === 'loading' && <p role="status">{t('buyer.premium.loadingMakers', 'Updating the artisan directory…')}</p>}
      {status === 'error' && <p role="status">The marketplace is temporarily unavailable. <button type="button" className="text-action" onClick={refresh}>{t('buyer.premium.retry', 'Try again')}</button></p>}
      <p className="directory-count" role="status">{formatLocalizedNumber(results.length, i18n.language)} {makers ? t('buyer.premium.artisans', 'Artisans') : t('buyer.premium.availableCrafts', 'available pieces')}</p>
      <div className={makers ? 'maker-grid directory-makers' : 'craft-grid'}>
        {results.slice(0,limit).map(item => makers ? (
          <article className="maker-card" key={item.id}>
            <img
              className="maker-demo-portrait"
              src={encodeURI(artisanPortrait(item))}
              alt={item.craftType || "Artisan craft"}
              loading="lazy"
              onError={(e) => {
                e.currentTarget.onerror = null; e.currentTarget.src = "/images/demo/male.jpeg";
              }}
            />
            <div><small>{[translateDistrict(item.district, i18n.language), translateState(item.state, i18n.language)].filter(Boolean).join(', ')}</small><h3>{translatePersonName(item.name || item.fullName, i18n.language)}</h3><p>{translateCraftType(item.craftType, i18n.language)}</p>
              <p>{item.productCount} products</p>{item.products && item.products.length ? <div className="maker-work-links"><Link to={`/collections?artisan=${encodeURIComponent(item.id)}`}>Browse all products</Link>{item.products.slice(0, 3).map(product => <Link key={product.id} to={`/product/${product.id}`}>{translateCollectionTitle(product.name, i18n.language)} <ArrowRight size={14} /></Link>)}</div> : <span className="maker-coming-soon">No products listed yet</span>}
            </div>
          </article>
        ) : <CraftCard key={item.id} product={item} />)}
      </div>
      {results.length>limit&&<button type="button" className="heritage-button" onClick={()=>setLimit(n=>n+48)}>Show more</button>}
      {!results.length && <div className="premium-empty"><h3>{t('buyer.premium.noMatches', 'No matches just yet')}</h3><p>{t('buyer.premium.tryFilters', 'Try another state, craft, or search term.')}</p><button type="button" className="text-action" onClick={reset}>{t('buyer.premium.resetFilters', 'Reset filters')}</button></div>}
    </section>
  );
}
