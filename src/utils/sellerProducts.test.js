import test from 'node:test';
import assert from 'node:assert/strict';
import {publicProduct} from '../../server/productHandler.js';
import {normalizeSellerProduct,matchesSellerProduct} from './sellerProducts.js';
import {safeFetch} from './api.js';
const row={id:'db-product',title:'Clay bowl',category:'Pottery & Clay',price:450,stock:3,detailsJson:JSON.stringify({description:null,materials:null,region:null}),mediaJson:'{"images":["/uploads/products/bowl.png"],"primaryImageIndex":0}',evidenceJson:'{"score":40}'};
test('seller serialization includes authoritative columns for seeded and published rows',()=>{
 for(const details of [row.detailsJson,JSON.stringify({title:'Old title',category:'Old category',price:1,stock:0,description:''})]){
  const api=publicProduct({...row,detailsJson:details});assert.equal(api.title,'Clay bowl');assert.equal(api.price,450);assert.equal(api.stock,3);assert.equal(api.category,'Pottery & Clay');
  const p=normalizeSellerProduct(api);assert.equal(p.name,'Clay bowl');assert.equal(p.status,'Active');assert.equal(p.evidence.score,40);
 }
});
test('nullable metadata and translations are safe; search and filters remain accurate',()=>{
 const p=normalizeSellerProduct(publicProduct(row));assert.equal(p.description,'');assert.deepEqual(p.materials,[]);assert.equal(p.origin,'');
 assert.equal(matchesSellerProduct(p,'BOWL','Pottery & Clay','Active',null),true);
 assert.equal(matchesSellerProduct(p,'','Embroidery','All',''),false);
 assert.equal(matchesSellerProduct(p,'','All','Out of Stock',''),false);
 assert.equal(matchesSellerProduct(p,'other','All','All',''),false);
 const zero=normalizeSellerProduct(publicProduct({...row,stock:0}));assert.equal(matchesSellerProduct(zero,'','All','Out of Stock',''),true);
 assert.throws(()=>normalizeSellerProduct({...publicProduct(row),title:undefined}),/incomplete/);
});
test('401 retains status and never triggers a login or retry',async()=>{
 const original=globalThis.fetch,calls=[];
 globalThis.fetch=async url=>{calls.push(url);return new Response(JSON.stringify({error:'Expired session'}),{status:401,headers:{'Content-Type':'application/json'}});};
 try{await assert.rejects(safeFetch('/api/products'),error=>error.status===401&&error.message==='Expired session');assert.equal(calls.length,1);assert.ok(calls[0].endsWith('/api/products'));}finally{globalThis.fetch=original;}
});
