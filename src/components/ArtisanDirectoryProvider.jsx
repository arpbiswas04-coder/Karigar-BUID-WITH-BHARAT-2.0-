import { API_BASE_URL } from '../utils/api';
import { useEffect, useMemo, useState, useCallback } from 'react';
import {productMediaUrl} from '../utils/productApi.js';
import { catalogView } from '../utils/catalog.js';
import { normalizeState } from '../data/heritage.js';
import { ArtisanDirectoryContext } from '../hooks/useArtisanDirectory';
export function ArtisanDirectoryProvider({children}) {
 const [data,setData]=useState({products:[],artisans:[]});const [status,setStatus]=useState('loading');const [revision,setRevision]=useState(0);
 const refresh=useCallback(()=>setRevision(n=>n+1),[]);
 useEffect(()=>{
  const controller=new AbortController();let busy=false;
  async function load(){if(busy)return;busy=true;try{
   const results=await Promise.all(['/api/catalog/products','/api/artisans'].map(async url=>{const r=await fetch(`${API_BASE_URL}${url}`,{signal:controller.signal});if(!r.ok)throw Error('Catalog unavailable');return r.json();}));
   setData({products:results[0].products.map(catalogView),artisans:results[1].artisans.map(a=>({...a,avatarUrl:productMediaUrl(a.avatarUrl)}))});setStatus('ready');
  }catch(e){if(e.name!=='AbortError')setStatus('error');}finally{busy=false;}}
  load();window.addEventListener('focus',load);window.addEventListener('karigar-products-changed',load);
  const timer=setInterval(()=>{if(document.visibilityState==='visible')load();},60000);
  return()=>{controller.abort();clearInterval(timer);window.removeEventListener('focus',load);window.removeEventListener('karigar-products-changed',load);};
 },[revision]);
 const artisans=useMemo(()=>data.artisans.map(a=>({...a,stateSlug:normalizeState(a.state),products:data.products.filter(p=>p.artisanId===a.id)})),[data]);
 return <ArtisanDirectoryContext.Provider value={{artisans,products:data.products,status,refresh}}>{children}</ArtisanDirectoryContext.Provider>;
}
