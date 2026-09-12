import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {MemoryRouter,Routes,Route} from 'react-router-dom';
import {createServer} from 'vite';
test('database-shaped catalog renders buyer pages, gallery and review form shell',async()=>{
 const server=await createServer({configFile:false,optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true},appType:'custom'});
 const storage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};globalThis.document={documentElement:{lang:"en"}};globalThis.localStorage=storage;globalThis.sessionStorage=storage;
 try{
  const {AuthProvider}=await server.ssrLoadModule('/src/context/AuthContext.jsx');const {BuyerProvider}=await server.ssrLoadModule('/src/context/BuyerContext.jsx');const {ArtisanDirectoryContext}=await server.ssrLoadModule('/src/hooks/useArtisanDirectory.jsx');
  const {catalogView}=await server.ssrLoadModule('/src/utils/catalog.js');
  const product=catalogView({id:'db-product',title:'Database clay pot',category:'Pottery & Clay',description:'Made by this artisan',price:500,stock:3,materials:['Clay'],dimensions:'20 cm',craftTechnique:'Wheel throwing',region:'West Bengal',giTag:'',media:{images:['/uploads/products/first.png','/uploads/products/second.png'],primaryImageIndex:1,productVideo:'/uploads/products/showcase.webm'},evidence:{score:40,source:'demo_seed'},rating:null,reviewsCount:0,artisan:{id:'artisan',fullName:'Demo Artisan',state:'West Bengal',avatarUrl:'/images/demo/female.jpeg'}});
  const directory={products:[product],artisans:[{...product.artisan,name:'Demo Artisan',stateSlug:'west-bengal',products:[product],productCount:1}],status:'ready',refresh:()=>{}};
  function render(Page,url,route,props={}){return renderToStaticMarkup(React.createElement(AuthProvider,null,React.createElement(BuyerProvider,null,React.createElement(ArtisanDirectoryContext.Provider,{value:directory},React.createElement(MemoryRouter,{initialEntries:[url]},React.createElement(Routes,null,React.createElement(Route,{path:route,element:React.createElement(Page,props)})))))));}
  for(const [name,url,route] of [['Home','/patron','/patron'],['Browse','/collections','/collections'],['StateExplore','/explore/west-bengal','/explore/:stateSlug'],['ProductDetail','/product/db-product','/product/:productId'],['Orders','/buyer/orders','/buyer/orders']]){
   const {default:Page}=await server.ssrLoadModule(`/src/pages/buyer/${name}.jsx`);const html=render(Page,url,route);assert.ok(html.length>200);assert.ok(!html.includes('NaN'),name);
   if(name==='ProductDetail'){assert.ok(html.includes('/uploads/products/second.png'));assert.ok(html.includes('Showcase Video'));assert.ok(!html.includes('Macro View'));assert.ok(!html.includes('99.4'));}
  }
  const {default:Browse}=await server.ssrLoadModule('/src/pages/buyer/Browse.jsx');const makers=render(Browse,'/artisans','/artisans',{makers:true});assert.ok(makers.includes('/images/demo/female.jpeg'));assert.ok(makers.includes('Browse all products'));
 }finally{await server.close();delete globalThis.document;delete globalThis.localStorage;delete globalThis.sessionStorage;}
});
