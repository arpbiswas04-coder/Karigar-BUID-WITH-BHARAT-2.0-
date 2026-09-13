import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {MemoryRouter} from 'react-router-dom';
import {createServer} from 'vite';
test('My Products renders nullable seeded and published metadata, totals and session-error UX',async()=>{
 const storage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};globalThis.localStorage=storage;globalThis.sessionStorage=storage;globalThis.document={documentElement:{lang:'en'}};
 const server=await createServer({configFile:false,optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true},appType:'custom'});
 try{
  const {AuthProvider}=await server.ssrLoadModule('/src/context/AuthContext.jsx');const {SellerProvider}=await server.ssrLoadModule('/src/context/SellerContext.jsx');const {ProductsView}=await server.ssrLoadModule('/src/pages/seller/Products.jsx');const {normalizeSellerProduct}=await server.ssrLoadModule('/src/utils/sellerProducts.js');
  const products=[{id:'seed',title:'Seed bowl',category:'Pottery & Clay',price:450,stock:3,description:null,materials:null,region:null,media:{images:[],primaryImageIndex:0},evidence:{score:40}}, {id:'published',title:'Published basket',category:'Basketry & Natural Fibres',price:700,stock:0,media:{images:['/uploads/products/basket.jpg']},evidence:{score:75}}].map(normalizeSellerProduct);
  const render=props=>renderToStaticMarkup(React.createElement(AuthProvider,null,React.createElement(SellerProvider,null,React.createElement(MemoryRouter,null,React.createElement(ProductsView,props)))));
  const html=render({products});for(const text of ['Seed bowl','Published basket','450','700','40','75','Out of Stock','(2)'])assert.ok(html.includes(text),text);assert.ok(!html.includes('NaN'));assert.ok(html.includes('disabled=""'));
  const actions=render({products,onAction:()=>{}});for(const label of ['View product: Seed bowl','Edit product: Seed bowl','Delete product: Seed bowl'])assert.ok(actions.includes(label));assert.ok(!actions.includes('disabled=""'));
  const expired=render({products:[],productsAuthRequired:true,productsError:'Your session has expired.'});assert.ok(expired.includes('Sign in again'));assert.ok(expired.includes('role="alert"'));
 }finally{await server.close();delete globalThis.localStorage;delete globalThis.sessionStorage;delete globalThis.document;}
});
