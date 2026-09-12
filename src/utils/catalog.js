import {productMediaUrl} from './productApi.js';
import { normalizeState } from '../data/heritage.js';
export function catalogView(p) {
 const a={...p.artisan,avatarUrl:productMediaUrl(p.artisan.avatarUrl)},images=(p.media.images||[]).map(productMediaUrl),primary=p.media.primaryImageIndex||0;
 return {...p,artisan:a,media:{...p.media,productVideo:productMediaUrl(p.media.productVideo),processVideo:productMediaUrl(p.media.processVideo)},name:p.title,artisanId:a.id,artisanName:a.fullName,artisanImage:a.avatarUrl,artisanTitle:a.businessName||a.craftType,
  artisanBio:[a.businessName,a.district,a.state].filter(Boolean).join(', '),stateName:a.state||p.region,stateSlug:normalizeState(a.state||p.region),district:a.district,
  craftCategory:p.category,craftType:p.craftTechnique||p.category,craftLineage:p.craftTechnique||p.category,
  images:images.length?[images[primary]||images[0],...images.filter((_,i)=>i!==primary)]:[],
  giTagStatus:p.giTag?'Seller-provided GI information':'GI information not provided',giTagNumber:p.giTag||'',
  specs:{material:p.materials.join(', ')||'Not provided',dimensions:p.dimensions||'Not provided'},
  authenticityScore:p.evidence.score,artisanShareAmount:p.price*0.9,artisanSharePercent:90,platformFeeAmount:p.price*0.1,platformFeePercent:10};
}
