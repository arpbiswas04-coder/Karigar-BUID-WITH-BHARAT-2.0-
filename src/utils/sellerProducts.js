import {normalizeCraftCategory} from '../constants/craftCategories.js';
import {productMediaUrl} from './productApi.js';
export function normalizeSellerProduct(product) {
  // These columns are required by Prisma. Surface a broken API contract, not a blank title/zero price.
  if (typeof product.id !== 'string' || typeof product.title !== 'string' || !product.title.trim() ||
      typeof product.category !== 'string' || !product.category.trim() ||
      !Number.isFinite(product.price) || !Number.isInteger(product.stock) || product.stock < 0) {
    throw new Error('Product data is incomplete. Please refresh or contact support.');
  }
  const media=product.media ?? {};
  return {...product,name:product.title,category:normalizeCraftCategory(product.category),
    description:String(product.description ?? ''),materials:product.materials ?? [],origin:String(product.region ?? ''),
    persisted:true,status:product.stock>0?'Active':'Out of Stock',
    image:productMediaUrl(media.images?.[media.primaryImageIndex ?? 0]),evidence:product.evidence ?? {score:null}};
}
export function matchesSellerProduct(product, query, category, status, translatedCategory) {
  const search=query.toLowerCase();
  return (product.name.toLowerCase().includes(search) || product.category.toLowerCase().includes(search) ||
    String(translatedCategory ?? '').toLowerCase().includes(search)) &&
    (category==='All'||product.category===category) && (status==='All'||product.status===status);
}
