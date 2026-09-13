import { normalizeCraftCategory } from '../src/constants/craftCategories.js';

export const artisanSelect = {id:true,fullName:true,businessName:true,state:true,district:true,craftType:true,avatarUrl:true,isVerified:true,yearsOfExperience:true,giTagNumber:true};
const patronSelect = {id:true,fullName:true,avatarUrl:true,state:true,district:true};
export function parseJson(text, fallback={}) { try { return JSON.parse(text)||fallback; } catch { return fallback; } }
export function publicArtisan(user) {
  const { _count, ...fields }=user;
  return {...fields,name:user.fullName,productCount:_count?.products||0};
}
export function catalogProduct(row) {
  const d=parseJson(row.detailsJson), m=parseJson(row.mediaJson), e=parseJson(row.evidenceJson);
  const reviews=row.reviews||[];
  return {id:row.id,title:row.title,category:normalizeCraftCategory(row.category),price:row.price,stock:row.stock,
    description:d.description||'',materials:d.materials||[],region:d.region||'',dimensions:d.dimensions||'',craftTechnique:d.craft_technique||'',giTag:d.giTag||'',
    media:{images:Array.isArray(m.images)?m.images:[],primaryImageIndex:m.primaryImageIndex||0,productVideo:m.productVideo||null,processVideo:m.processVideo||null},
    evidence:{score:e.score??null,level:e.level||null,categories:e.categories||{},live_capture:e.live_capture===true,source:e.source||null},
    artisan:publicArtisan(row.artisan),rating:reviews.length?reviews.reduce((sum,r)=>sum+r.rating,0)/reviews.length:null,reviewsCount:reviews.length,createdAt:row.createdAt};
}
const productInclude={artisan:{select:artisanSelect},reviews:{select:{rating:true}}};
const reviewInclude={patron:{select:patronSelect}};
function publicReview(r) { return {id:r.id,rating:r.rating,text:r.text,createdAt:r.createdAt,updatedAt:r.updatedAt,patron:{id:r.patron.id,name:r.patron.fullName,avatarUrl:r.patron.avatarUrl}}; }
export function validateReview(body) {
  if(!Number.isInteger(body.rating)||body.rating<1||body.rating>5||typeof body.text!=='string'||!body.text.trim()||body.text.length>3000) throw Object.assign(new Error('Choose 1-5 stars and write a review of up to 3000 characters.'),{status:422});
  return {rating:body.rating,text:body.text.trim()};
}
async function readBody(req) {
  let text=''; for await(const chunk of req) {text+=chunk;if(text.length>16000)throw Object.assign(new Error('Review is too large.'),{status:413});}
  try{return JSON.parse(text||'{}');}catch{throw Object.assign(new Error('Invalid JSON.'),{status:400});}
}
export async function sellerActivity(prisma, artisanId) {
  const rows=await prisma.order.findMany({where:{items:{some:{product:{artisanId}}}},orderBy:{createdAt:'desc'},include:{buyer:{select:patronSelect},escrow:true,items:{where:{product:{artisanId}},include:{product:true}}}});
  const reviews=await prisma.review.findMany({where:{product:{artisanId}},orderBy:{updatedAt:'desc'},include:{product:{select:{title:true}}}});
  const statusName={ESCROW_HELD:'Processing',PAYMENT_PENDING:'Payment Pending',PROCESSING:'Processing',SHIPPED:'Shipped',DELIVERED:'Delivered',RELEASED:'Delivered',CANCELLED:'Cancelled',REFUNDED:'Refunded',DISPUTED:'Disputed'};
  const customers=new Map();
  const orders=rows.map(o=>{
    const address=parseJson(o.shippingAddressJson); const units=o.items.reduce((s,i)=>s+i.quantity,0);const amount=o.items.reduce((s,i)=>s+i.quantity*i.unitPrice,0);
    if(!['PAYMENT_PENDING','CANCELLED','REFUNDED'].includes(o.status)) {
      const c=customers.get(o.buyerId)||{id:o.buyerId,name:o.buyer.fullName,avatar:o.buyer.avatarUrl,location:[address.city||o.buyer.district,address.state||o.buyer.state].filter(Boolean).join(', '),orders:0,units:0,lastProduct:o.items[0]?.product.title};
      c.orders++;c.units+=units;customers.set(o.buyerId,c);
    }
    const media=parseJson(o.items[0]?.product.mediaJson);
    return {id:o.orderNumber,orderId:o.id,product:o.items.map(i=>`${i.product.title} ? ${i.quantity}`).join(', '),productImage:media.images?.[media.primaryImageIndex||0],amount,quantity:units,timeline:[{status:statusName[o.status]||o.status,time:o.updatedAt,completed:true}],customer:o.buyer.fullName,customerAvatar:o.buyer.avatarUrl,customerLocation:[address.city,address.state].filter(Boolean).join(', '),status:statusName[o.status]||o.status,date:o.createdAt,escrowStage:o.escrow?.status==='HELD'?'Payment Secured':o.escrow?.status,items:o.items.map(i=>({productId:i.productId,title:i.product.title,quantity:i.quantity,unitPrice:i.unitPrice}))};
  });
  return {rating:reviews.length?reviews.reduce((sum,r)=>sum+r.rating,0)/reviews.length:null,reviewCount:reviews.length,orders,customers:[...customers.values()].map(c=>({...c,review:reviews.find(r=>r.patronId===c.id)?{rating:reviews.find(r=>r.patronId===c.id).rating,text:reviews.find(r=>r.patronId===c.id).text}:null}))};
}
export async function handleMarketplace(req,res,{prisma,user}) {
  const path=new URL(req.url,'http://localhost').pathname;
  const send=(status,data)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(data));};
  try {
    if(path==='/api/seller/activity') {
      if(!user)return send(401,{error:'Please sign in.'});if(user.role!=='ARTISAN')return send(403,{error:'Artisan account required.'});
      if(req.method!=='GET')return send(405,{error:'Method not allowed.'});
      return send(200,await sellerActivity(prisma,user.id));
    }
    const reviewMatch=path.match(/^\/api\/catalog\/products\/([^/]+)\/reviews(?:\/([^/]+))?$/);
    if(reviewMatch){
      const product=await prisma.product.findFirst({where:{id:reviewMatch[1],isActive:true,artisan:{isActive:true}}});if(!product)return send(404,{error:'Product not found.'});
      if(req.method==='GET')return send(200,{reviews:(await prisma.review.findMany({where:{productId:product.id},include:reviewInclude,orderBy:{updatedAt:'desc'}})).map(publicReview)});
      if(!['POST','PATCH'].includes(req.method))return send(405,{error:'Method not allowed.'});
      if(!user)return send(401,{error:'Please sign in.'});if(user.role!=='PATRON'||user.id===product.artisanId)return send(403,{error:'Only patrons can review products.'});
      if(reviewMatch[2]&&!await prisma.review.findFirst({where:{id:reviewMatch[2],productId:product.id,patronId:user.id}}))return send(404,{error:'Review not found.'});
      const data=validateReview(await readBody(req));
      const review=await prisma.review.upsert({where:{productId_patronId:{productId:product.id,patronId:user.id}},create:{...data,productId:product.id,patronId:user.id},update:data,include:reviewInclude});
      return send(200,{review:publicReview(review)});
    }
    if(req.method!=='GET')return send(405,{error:'Method not allowed.'});
    const artisanMatch=path.match(/^\/api\/artisans(?:\/([^/]+)(\/products)?)?$/);
    if(artisanMatch) {
      const id=artisanMatch[1];
      if(artisanMatch[2])return send(200,{products:(await prisma.product.findMany({where:{artisanId:id,isActive:true,artisan:{isActive:true,role:'ARTISAN'}},include:productInclude,orderBy:{createdAt:'desc'}})).map(catalogProduct)});
      const artisans=await prisma.user.findMany({where:{role:'ARTISAN',isActive:true,...(id?{id}:{})},select:{...artisanSelect,_count:{select:{products:{where:{isActive:true}}}}},orderBy:{createdAt:'asc'}});
      if(id)return artisans.length?send(200,{artisan:publicArtisan(artisans[0])}):send(404,{error:'Artisan not found.'});
      return send(200,{artisans:artisans.map(publicArtisan)});
    }
    const match=path.match(/^\/api\/catalog\/products(?:\/([^/]+))?$/);
    if(match){const products=await prisma.product.findMany({where:{isActive:true,artisan:{isActive:true,role:'ARTISAN'},...(match[1]?{id:match[1]}:{})},include:productInclude,orderBy:{createdAt:'desc'}});
      if(match[1])return products.length?send(200,{product:catalogProduct(products[0])}):send(404,{error:'Product not found.'});return send(200,{products:products.map(catalogProduct)});}
    return send(404,{error:'Not found.'});
  } catch(error){console.error('[marketplace]',error.name,error.code||error.message);return send(error.status||500,{error:error.status?error.message:'Marketplace request could not be completed.'});}
}
