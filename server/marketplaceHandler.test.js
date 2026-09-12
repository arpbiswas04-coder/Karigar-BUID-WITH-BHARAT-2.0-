import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {mkdtemp,readFile,readdir,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import jwt from 'jsonwebtoken';
import {PrismaClient} from '@prisma/client';
import {handleMarketplace} from './marketplaceHandler.js';
import {createOrder,confirmTestPayment,getBuyerOrders} from './orderHandler.js';

test('catalog, checkout, stock, reviews and seller isolation share SQLite records',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'karigar-market-test-'));const prisma=new PrismaClient({datasources:{db:{url:`file:${path.join(root,'test.db').replaceAll('\\','/')}`}}});let server;
 try{
  for(const dir of (await readdir(new URL('../prisma/migrations/',import.meta.url))).filter(n=>/^\d/.test(n)).sort()){
   const sql=await readFile(new URL(`../prisma/migrations/${dir}/migration.sql`,import.meta.url),'utf8');
   for(const statement of sql.split(';').filter(s=>s.trim()))await prisma.$executeRawUnsafe(statement);
  }
  for(const [id,role] of [['a','ARTISAN'],['b','ARTISAN'],['p','PATRON'],['q','PATRON']])await prisma.user.create({data:{id,role,email:id+'@test.invalid',fullName:id,password:'private',mobile:id}});
  await prisma.product.create({data:{id:'product',artisanId:'a',publishKey:'test',title:'Clay pot',category:'Pottery & Clay',price:500,stock:2,detailsJson:JSON.stringify({materials:['Clay']}),mediaJson:JSON.stringify({images:['/uploads/products/test.png'],primaryImageIndex:0,capture_receipt_token:'private'}),evidenceJson:'{}'}});
  server=http.createServer(async(req,res)=>{
   if(req.url.startsWith('/api/orders')){
    if(req.method==='GET')return getBuyerOrders({req,res,prisma});
    if(req.url.endsWith('/confirm'))return confirmTestPayment({req,res,prisma,orderId:req.url.split('/')[3]});
    let body='';for await(const chunk of req)body+=chunk;return createOrder({req,res,prisma,body:JSON.parse(body)});
   }
   const user=req.headers['x-test-user']?await prisma.user.findUnique({where:{id:req.headers['x-test-user']}}):null;
   return handleMarketplace(req,res,{prisma,user});
  });await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
  async function request(url,user,body,method){const token=user?jwt.sign({id:user},process.env.JWT_SECRET||'karigar_secret_jwt_artisan_2026_key'):null;const r=await fetch(base+url,{method:method||(body?'POST':'GET'),headers:{...(user?{'x-test-user':user,Authorization:`Bearer ${token}`} :{}),'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,data:await r.json()};}
  const catalog=await request('/api/catalog/products');assert.equal(catalog.data.products[0].id,'product');assert.equal(JSON.stringify(catalog).includes('private'),false);assert.equal(catalog.data.products[0].reviewsCount,0);
  const listing=await request('/api/artisans/a/products');assert.equal(listing.data.products.length,1);assert.equal((await request('/api/artisans/b/products')).data.products.length,0);
  assert.equal((await request('/api/seller/activity')).status,401);
  const body={items:[{productId:'product',quantity:1,price:1}],paymentMethod:'escrow_upi',shippingAddress:Object.fromEntries(['fullName','email','mobile','address','city','state','pincode'].map(k=>[k,'test']))};
  assert.equal((await request('/api/orders','a',body)).status,403);
  const order=await request('/api/orders','p',body);assert.equal(order.status,201);assert.equal(order.data.order.totalAmount,500);
  const orderId=order.data.order.id;assert.equal((await request(`/api/orders/${orderId}/payment/confirm`,'q',{})).status,404);
  assert.equal((await request(`/api/orders/${orderId}/payment/confirm`,'p',{})).status,200);
  assert.equal((await request(`/api/orders/${orderId}/payment/confirm`,'p',{})).status,200);assert.equal((await prisma.product.findUnique({where:{id:'product'}})).stock,1);
  const own=await request('/api/seller/activity','a');assert.equal(own.data.orders.length,1);assert.equal(own.data.customers[0].id,'p');assert.equal((await request('/api/seller/activity','b')).data.orders.length,0);
  assert.equal((await request('/api/orders','p')).data.orders.length,1);assert.equal((await request('/api/orders','q')).data.orders.length,0);
  assert.equal((await request('/api/orders','p',{...body,items:[{productId:'product',quantity:3}]})).status,400);
  const endpoint='/api/catalog/products/product/reviews';assert.equal((await request(endpoint,null,{rating:5,text:'Good'})).status,401);assert.equal((await request(endpoint,'a',{rating:5,text:'Good'})).status,403);assert.equal((await request(endpoint,'p',{rating:6,text:'Good'})).status,422);
  const review=await request(endpoint,'p',{rating:4,text:'Carefully made'});assert.equal(review.status,200);
  assert.equal((await request(endpoint+'/'+review.data.review.id,'q',{rating:1,text:'Changed'},'PATCH')).status,404);
  assert.equal((await request(endpoint+'/'+review.data.review.id,'p',{rating:5,text:'Updated review'},'PATCH')).status,200);
  assert.equal(await prisma.review.count(),1);const detail=await request('/api/catalog/products/product');assert.equal(detail.data.product.rating,5);assert.equal(detail.data.product.reviewsCount,1);
  const customers=(await request('/api/seller/activity','a')).data.customers;assert.equal(customers[0].review.text,'Updated review');assert.equal((await request('/api/seller/activity','b')).data.customers.length,0);
  const publicReviews=await request(endpoint);assert.equal(JSON.stringify(publicReviews).includes('@test.invalid'),false);assert.equal(JSON.stringify(publicReviews).includes('private'),false);
 }finally{if(server){server.closeAllConnections();await new Promise(r=>server.close(r));}await prisma.$disconnect();await rm(root,{recursive:true,force:true});}
});
