import { getRevenueAllocation, formatAllocationMoney } from '../../utils/platformCommission.js';
import { formatEvidenceScore } from '../../utils/evidenceFormat.js';
import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Leaf,
  Hand,
  Droplet,
  Image as ImageIcon,
  ArrowRight,
  PackageCheck,
  Truck,
  ShoppingBag,
  Award,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useArtisanDirectory } from '../../hooks/useArtisanDirectory';
import ProductGallery from '../../components/ProductGallery';
import ProductReviews from '../../components/ProductReviews';
import { artisanPortrait } from '../../data/demoImages';
import { useBuyer } from '../../context/BuyerContext';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import Button from '../../components/Button';
import {
  translateState,
  translateCraftType,
  translateDistrict,
  translatePersonName,
  formatLocalizedNumber,
  toLocaleDigits,
  translateCollectionTitle,
  translateProductSpec
} from '../../utils/localizedDisplay.js';

export default function ProductDetail() {
  const { productId } = useParams();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { addToCart } = useBuyer();

  const {products,status,refresh}=useArtisanDirectory();
  const product = products.find(p=>p.id===productId);

  const [activeTab, setActiveTab] = useState('story');
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);

  const handleAcquire = () => {
    if(!product || product.stock < 1)return;
    addToCart(product, 1);
    navigate('/cart');
  };

  if(status!=="ready"&&!product)return <div className="premium-section"><p>{status==="error"?"Unable to load product.":"Loading product..."}</p><button onClick={refresh}>Retry</button></div>;
  if (!product) return <div className="premium-section premium-empty"><h1>Craft not found</h1><Link to="/patron">Browse collections</Link></div>;
  const allocation = getRevenueAllocation(product.price);
  return (
    <div className="flex flex-col w-full bg-surface text-on-surface">
      {/* BREADCRUMB STRIP */}
      <section className="w-full bg-surface-container-low px-space-md sm:px-space-xl py-space-sm border-b border-outline-variant/30">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">
          <nav className="flex flex-wrap items-center gap-space-xs font-label-sm text-label-sm uppercase tracking-[0.14em] text-on-surface-variant">
            <Link className="hover:text-secondary transition-colors" to="/patron">{t('buyer.product.homeNav', 'Home')}</Link>
            <span className="text-outline-variant">/</span>
            <Link className="hover:text-secondary transition-colors" to={`/explore/${product.stateSlug}`}>
              {translateState(product.stateName || product.state, i18n.language)}
            </Link>
            <span className="text-outline-variant">/</span>
            <span className="text-outline">{translateCraftType(product.craftLineage || product.craftType, i18n.language)}</span>
            <span className="text-outline-variant">/</span>
            <span className="text-primary font-semibold">{toLocaleDigits(product.id.toUpperCase(), i18n.language)}</span>
          </nav>

          <div className="hidden md:flex items-center gap-space-xs font-label-sm text-[11px] text-outline uppercase tracking-[0.16em]">
            <span className="w-2 h-2 rounded-full bg-secondary" />
            <span>Artisan marketplace listing</span>
          </div>
        </div>
      </section>

      {/* TOP PRODUCT SECTION: TWO-COLUMN EDITORIAL GRID */}
      <section className="w-full bg-surface py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* LEFT COLUMN: CRAFT GALLERY & VISUAL INSPECTION */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <ProductGallery key={product.id} product={product}/>

            {/* Quiet Provenance Strip Below Gallery */}
            <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-stone-600 dark:text-stone-400 font-label-sm text-xs tracking-wider border border-stone-200/80 dark:border-stone-800 shadow-xs">
              <div className="flex items-center gap-1.5">
                <Leaf className="w-4 h-4 text-[#14532D] dark:text-emerald-400" />
                <span className="text-xs font-medium">{product.specs?.material || 'Not provided'}</span>
              </div>
              <span className="text-stone-300 dark:text-stone-700">•</span>
              <div className="flex items-center gap-1.5">
                <Hand className="w-4 h-4 text-[#14532D] dark:text-emerald-400" />
                <span className="text-xs font-medium">{product.craftTechnique || 'Technique not provided'}</span>
              </div>
              <span className="text-stone-300 dark:text-stone-700">•</span>
              <div className="flex items-center gap-1.5">
                <Droplet className="w-4 h-4 text-[#14532D] dark:text-emerald-400" />
                <span className="text-xs font-medium">{product.specs?.dyeType || 'Not provided'}</span>
              </div>
              <span className="text-stone-300 dark:text-stone-700">•</span>
              <div className="flex items-center gap-1.5 text-[#14532D] dark:text-emerald-400 font-bold">
                <ImageIcon className="w-4 h-4" />
                <span className="text-xs">Seller-provided listing details</span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: CRAFT DETAILS, PRICING & ESCROW */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {/* Origin Pill & Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-label-sm text-xs uppercase tracking-wider px-3 py-1 rounded-full font-bold">
                {translateDistrict(product.district, i18n.language)}
              </span>
              <span className="bg-emerald-50 dark:bg-emerald-950/40 text-[#14532D] dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 font-label-sm text-xs uppercase tracking-wider px-3 py-1 rounded-full font-bold">
                {t('buyer.product.archivalBatch', 'Archival Batch 2026')}
              </span>
            </div>

            {/* Master Title */}
            <div className="flex flex-col gap-1">
              <h1 className="font-garamond text-3xl sm:text-4xl text-stone-900 dark:text-stone-100 leading-tight font-bold">
                {translateCollectionTitle(product.name, i18n.language)}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-title-md text-base text-[#C2410C] italic font-semibold">
                  {t('buyer.product.by', 'By')} {translatePersonName(product.artisanName, i18n.language)}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-stone-300 dark:bg-stone-700" />
                <span className="font-label-sm text-xs uppercase tracking-wider text-[#14532D] dark:text-emerald-400 font-bold">
                  {product.artisanTitle?.includes('•') ? `${product.artisanTitle.split('•')[0]}• ${translateState(product.artisanTitle.split('•')[1].trim(), i18n.language)}` : product.artisanTitle}
                </span>
              </div>
            </div>

            <section aria-label="Listing evidence" className="bg-emerald-50 dark:bg-emerald-950/40 text-[#14532D] dark:text-emerald-100 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-800 space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider">KARIGAR Trust Evidence Score</h2>
              <p className="text-3xl font-bold">{Number.isFinite(product.evidence?.score) ? `${formatEvidenceScore(product.evidence.score)} / 100` : 'Not analyzed'}</p>
              <p className="text-xs">This score reflects supporting and transparency evidence for the listing. It is not an authenticity guarantee.</p>
            </section>

            {/* Pricing Block */}
            <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-xs flex flex-col gap-4 border border-stone-200/80 dark:border-stone-800">
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="font-garamond text-3xl sm:text-4xl text-[#14532D] dark:text-emerald-400 font-bold">
                    {formatCurrency(product.price, i18n.language)}
                  </span>
                  <span className="font-body-sm text-xs text-stone-500 dark:text-stone-400 font-medium">INR</span>
                </div>
                <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 font-label-sm text-[11px] uppercase tracking-wider px-3 py-1 rounded-full font-bold">
                  {product.stock} available
                </span>
              </div>

              {/* Transparent Revenue Allocation */}
              <div className="bg-[#FCFAF6] dark:bg-stone-800 p-4 rounded-xl flex flex-col gap-2 border border-stone-200/60 dark:border-stone-800">
                <div className="flex items-center justify-between font-label-sm text-[11px] uppercase tracking-wider text-stone-600 dark:text-stone-400">
                  <span className="font-semibold">{t('buyer.product.fairTradeAllocation', 'Fair-Trade Revenue Allocation')}</span>
                  <span className="text-[#14532D] dark:text-emerald-400 font-bold">{t('buyer.product.transparentLedger', '100% Transparent')}</span>
                </div>
                <div className="w-full h-2 bg-stone-200 dark:bg-stone-700 flex overflow-hidden rounded-full" aria-hidden="true">
                  <div className="bg-[#14532D] dark:bg-emerald-500 h-full" style={{ width: `${allocation.artisanPercent}%` }} />
                  <div className="bg-stone-400 dark:bg-stone-500 h-full" style={{ width: `${allocation.commissionPercent}%` }} />
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <span className="font-bold text-[#14532D] dark:text-emerald-400">{formatAllocationMoney(allocation.artisanAmount, i18n.language)} ({allocation.artisanPercent}%)</span>
                    <span className="block text-stone-600 dark:text-stone-300 text-[10px] mt-0.5">Artisan payout</span>
                  </div>
                  <div>
                    <span className="font-bold text-stone-700 dark:text-stone-200">{formatAllocationMoney(allocation.commissionAmount, i18n.language)} ({allocation.commissionPercent}%)</span>
                    <span className="block text-stone-600 dark:text-stone-300 text-[10px] mt-0.5">KARIGAR platform commission</span>
                  </div>
                </div>
              </div>

              {/* Shipping & Packaging info */}
              <div className="flex items-center gap-2 text-stone-600 dark:text-stone-400 font-body-sm text-xs pt-1">
                <PackageCheck className="w-4 h-4 text-[#14532D] dark:text-emerald-400 flex-shrink-0" />
                <span>{t('buyer.product.keepsakePackaging', 'Includes Hand-Carved Teak Keepsake Chest & Climate Seal Bag')}</span>
              </div>
              <div className="flex items-center gap-2 text-stone-600 dark:text-stone-400 font-body-sm text-xs">
                <Truck className="w-4 h-4 text-[#14532D] dark:text-emerald-400 flex-shrink-0" />
                <span>{t('buyer.product.freeLogistics', 'Free Insured Air Courier via National Handloom Logistics (5-7 Days)')}</span>
              </div>
            </div>

            {/* Action CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <Button
                type="button"
                disabled={product.stock<1}
                onClick={handleAcquire}
                variant="primary"
                size="lg"
                icon={ShoppingBag}
                className="flex-1"
              >
                {t('buyer.product.acquireBtn', 'Acquire Masterwork')}
              </Button>
              <Button
                type="button"
                onClick={() => setIsCertModalOpen(true)}
                variant="ghost"
                size="lg"
                icon={Award}
                className="flex-1"
              >
                {t('buyer.product.inspectBtn', 'Inspect Provenance')}
              </Button>
            </div>

            {/* Sovereign Escrow Vault Card */}
            <div className="bg-[#FCFAF6] dark:bg-stone-800 rounded-2xl p-5 flex items-start gap-4 border border-stone-200/80 dark:border-stone-800">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#14532D] dark:text-emerald-400 flex-shrink-0 flex items-center justify-center border border-emerald-200/60 dark:border-emerald-800/40">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-label-sm text-xs uppercase tracking-wider font-bold text-stone-900 dark:text-stone-100">
                  {t('buyer.product.escrowVaultProtected', 'Protected by Sovereign Escrow Vault')}
                </span>
                <p className="font-body-sm text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  {t('buyer.product.escrowSafelyImpounded', 'Your payment of {{amount}} remains safely impounded in the GI Artisan Escrow. Funds are released directly to {{artisan}} only after you physically receive, inspect, and verify the craft and embedded cryptotag.', { amount: formatCurrency(product.price, i18n.language), artisan: product.artisanName })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* IN-DEPTH TABBED DOSSIER SECTION */}
      <section className="w-full bg-[#F8F4EC] dark:bg-stone-900/60 py-12 px-4 sm:px-6 lg:px-8 border-t border-[#E7DECB]/80 dark:border-stone-800">
        <div className="max-w-[1440px] mx-auto">
          {/* Tabs Bar */}
          <div className="flex flex-wrap border-b border-stone-200 dark:border-stone-800 gap-6 mb-8">
            <button
              type="button"
              onClick={() => setActiveTab('story')}
              className={`font-label-md text-xs uppercase tracking-wider pb-3 font-bold transition-colors cursor-pointer ${
                activeTab === 'story' ? 'text-[#14532D] dark:text-emerald-400 border-b-2 border-[#14532D] dark:border-emerald-400' : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              {t('buyer.product.tabCraftNarrative', '01. Craft Narrative & Story')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('artisan')}
              className={`font-label-md text-xs uppercase tracking-wider pb-3 font-bold transition-colors cursor-pointer ${
                activeTab === 'artisan' ? 'text-[#14532D] dark:text-emerald-400 border-b-2 border-[#14532D] dark:border-emerald-400' : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              {t('buyer.product.tabArtisanDossier', '02. Artisan Dossier & Documentary')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('certificate')}
              className={`font-label-md text-xs uppercase tracking-wider pb-3 font-bold transition-colors cursor-pointer ${
                activeTab === 'certificate' ? 'text-[#14532D] dark:text-emerald-400 border-b-2 border-[#14532D] dark:border-emerald-400' : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              {t('buyer.product.tabGiCertificate', '03. Sovereign GI Certificate & Ledger')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              className={`font-label-md text-xs uppercase tracking-wider pb-3 font-bold transition-colors cursor-pointer ${
                activeTab === 'reviews' ? 'text-[#14532D] dark:text-emerald-400 border-b-2 border-[#14532D] dark:border-emerald-400' : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              {t('buyer.product.tabPatronAppraisals', '04. Patron Appraisals')} ({formatNumber(product.reviewsCount || 0, i18n.language)})
            </button>
          </div>

          {/* TAB 1: STORY */}
          {activeTab === 'story' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8 flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-8 shadow-xs border border-stone-200/80 dark:border-stone-800">
                  {/* English Story */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-label-sm text-[11px] uppercase tracking-wider text-stone-400 font-bold">{t('buyer.product.englishEditorial', 'English Editorial')}</span>
                      <span className="h-[1px] flex-1 bg-stone-200 dark:bg-stone-800" />
                    </div>
                    <h3 className="font-garamond text-xl text-stone-900 dark:text-stone-100 font-bold">
                      {product.longStory?.englishTitle || product.name}
                    </h3>
                    <p className="font-body-md text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                      {product.longStory?.englishText || product.description}
                    </p>
                  </div>


                </div>

                {/* Technical Specifications */}
                <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col gap-4 border border-stone-200/80 dark:border-stone-800">
                  <h4 className="font-garamond text-xl text-stone-900 dark:text-stone-100 font-bold">{t('buyer.product.curatorialSpecs', 'Curatorial Specifications')}</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="flex flex-col bg-[#FCFAF6] dark:bg-stone-800 p-4 rounded-xl border border-stone-200/60 dark:border-stone-800">
                      <span className="font-label-sm text-[10px] uppercase tracking-wider text-stone-500 dark:text-stone-400 font-medium">{t('buyer.product.dimensions', 'Dimensions')}</span>
                      <span className="font-title-md text-sm text-stone-900 dark:text-stone-100 mt-1 font-bold">{translateProductSpec(product.specs?.dimensions, i18n.language) || '60" × 40" Inches'}</span>
                    </div>
                    <div className="flex flex-col bg-[#FCFAF6] dark:bg-stone-800 p-4 rounded-xl border border-stone-200/60 dark:border-stone-800">
                      <span className="font-label-sm text-[10px] uppercase tracking-wider text-stone-500 dark:text-stone-400 font-medium">{t('buyer.product.baseMaterial', 'Base Material')}</span>
                      <span className="font-title-md text-sm text-stone-900 dark:text-stone-100 mt-1 font-bold">{translateProductSpec(product.specs?.material, i18n.language) || 'Not provided'}</span>
                    </div>
                    <div className="flex flex-col bg-[#FCFAF6] dark:bg-stone-800 p-4 rounded-xl border border-stone-200/60 dark:border-stone-800">
                      <span className="font-label-sm text-[10px] uppercase tracking-wider text-stone-500 dark:text-stone-400 font-medium">{t('buyer.product.density', 'Density')}</span>
                      <span className="font-title-md text-sm text-stone-900 dark:text-stone-100 mt-1 font-bold">{translateProductSpec(product.specs?.stitchDensity, i18n.language) || '180 Stitches/In²'}</span>
                    </div>
                    <div className="flex flex-col bg-[#FCFAF6] dark:bg-stone-800 p-4 rounded-xl border border-stone-200/60 dark:border-stone-800">
                      <span className="font-label-sm text-[10px] uppercase tracking-wider text-stone-500 dark:text-stone-400 font-medium">{t('buyer.product.craftTime', 'Crafting Time')}</span>
                      <span className="font-title-md text-sm text-stone-900 dark:text-stone-100 mt-1 font-bold">{translateProductSpec(product.specs?.embroideryTime, i18n.language) || 'Not provided'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Care */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-8 flex flex-col gap-3 border border-stone-200/80 dark:border-stone-800 shadow-xs">
                  <span className="font-label-sm text-[11px] uppercase tracking-wider text-[#14532D] dark:text-emerald-400 font-bold">{t('buyer.product.archivalPreservation', 'Archival Preservation')}</span>
                  <h4 className="font-garamond text-xl text-stone-900 dark:text-stone-100 font-bold">{t('buyer.product.museumCare', 'Museum-Grade Care & Longevity')}</h4>
                  <ul className="flex flex-col gap-2.5 font-body-sm text-xs text-stone-600 dark:text-stone-400 pt-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#14532D] dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>{t('buyer.product.sunExposure', 'Avoid direct unfiltered southern sun exposure.')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#14532D] dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>{t('buyer.product.dryClean', 'Dry clean exclusively by heritage textile conservators.')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#14532D] dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>{t('buyer.product.neemPacking', 'Supplied with pure neem-leaf parchment for seasonal packing.')}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ARTISAN */}
          {activeTab === 'artisan' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-8 shadow-xs border border-stone-200/80 dark:border-stone-800 items-center">
              <div className="lg:col-span-5">
                <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 border border-stone-200/60 dark:border-stone-700">
                  <img
                    src={artisanPortrait(product.artisan)}
                    alt={product.artisanName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-stone-900/90 to-transparent p-5 text-white">
                    <span className="font-label-sm text-[10px] uppercase tracking-wider text-emerald-300 font-bold">{t('buyer.product.masterArtisan', 'Master Artisan')}</span>
                    <div className="font-garamond text-2xl font-bold">{translatePersonName(product.artisanName, i18n.language)}</div>
                    <div className="text-xs opacity-90">{translateDistrict(product.district, i18n.language)}</div>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-7 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <span className="bg-[#14532D] text-white font-label-sm text-xs uppercase tracking-wider px-3 py-1 rounded-full font-bold">
                    {product.artisanTitle}
                  </span>
                </div>
                <p>{product.artisanBio}</p><p>{product.artisan.yearsOfExperience ?? 'Not provided'} years of experience</p><Link to={`/collections?artisan=${product.artisanId}`}>Browse this artisan's products</Link>
              </div>
            </div>
          )}

          {activeTab === 'certificate' && <div className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant space-y-3"><h3 className="text-2xl font-garamond">Listing evidence & GI information</h3><p>Seller-provided GI information: {product.giTag || 'Not provided'}</p><p>KARIGAR Trust Evidence Score: {product.evidence.score===null?'Not analyzed':`${product.evidence.score.toFixed(1)} / 100`}</p>{product.evidence.source==='demo_seed'&&<p>Demo evidence snapshot; this seeded listing has not been analyzed.</p>}<p>This score reflects supporting and transparency evidence for the listing. It is not an authenticity guarantee.</p></div>}

          {activeTab === 'reviews' && <ProductReviews key={product.id} productId={product.id} onChanged={refresh}/>}

        </div>
      </section>

      {isCertModalOpen && <div role="dialog" aria-modal="true" aria-label="Listing provenance" className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"><div className="bg-surface-container-lowest text-on-surface p-8 rounded-xl max-w-xl"><h3>Listing provenance</h3><p>{product.name} by {product.artisanName}</p><p>GI information supplied by seller: {product.giTag||'Not provided'}</p><p>Listing evidence is not an authenticity guarantee.</p><button onClick={()=>setIsCertModalOpen(false)}>Close</button></div></div>}
    </div>
  );
}
